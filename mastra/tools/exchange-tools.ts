import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { fetchQuery, fetchMutation } from "convex/nextjs";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

import { logToolCall, logInfo, logSuccess, logToolResult, logError, logToolError, isValidConvexId } from './utils';


/**
 * Tool to get current exchange rates - NO PARAMETERS ACCEPTED
 * Always returns all active rates from the database
 */
export const getCurrentRatesTool = createTool({
    id: 'get_current_rates',
    description: 'Get ALL current exchange rates from the database. This tool does not accept any parameters and always returns all active currency pair rates.',
    inputSchema: z.object({}), // No parameters accepted
    execute: async ({ context, runtimeContext }) => {
        const startTime = Date.now();
        const toolId = 'get_current_rates';

        // Extract context data using new consistent naming
        const phoneNumber = runtimeContext?.get('phoneNumber') as string;
        const userId = runtimeContext?.get('userId') as string;
        const conversationId = runtimeContext?.get('conversationId') as string;

        // Send debug message about tool start
        if (phoneNumber) {
            // await sendDebugMessage(phoneNumber, 'GET CURRENT RATES TOOL STARTED', {
            //     toolId,
            //     startTime: new Date(startTime).toISOString(),
            //     operation: 'Fetching all exchange rates from database',
            //     userId,
            //     conversationId
            // });
        }

        logToolCall(toolId, {});

        try {
            logInfo('Getting ALL current exchange rates from database', {
                operation: toolId,
                note: 'No currency pair filter applied - fetching all rates'
            });

            // Send debug message about database query
            if (phoneNumber) {
                // await sendDebugMessage(phoneNumber, 'DATABASE QUERY STARTED', {
                //     operation: 'api.exchangeRates.getCurrentRates',
                //     parameters: 'No filters - fetching all rates'
                // });
            }

            // Always call without currencyPair to get all rates
            const rates = await fetchQuery(api.exchangeRates.getCurrentRates, {});

            const executionTime = Date.now() - startTime;

            const result = rates;

            // Send debug message with results
            if (phoneNumber) {
                // await sendDebugMessage(phoneNumber, 'EXCHANGE RATES RETRIEVED', {
                //     success: true,
                //     totalRates: result.totalRates,
                //     executionTimeMs: executionTime,
                //     ratesPreview: Array.isArray(rates) ? rates.map(r => `${r.currencyPair}: ${r.currentMarketRate}`).slice(0, 5) : 'Single rate object'
                // });

                // // Send complete rates data
                // await sendDebugMessage(phoneNumber, 'COMPLETE RATES DATA', rates);
            }

            logToolResult(toolId, result, executionTime);
            return result;

        } catch (error) {
            const executionTime = Date.now() - startTime;
            const errorMessage = `Failed to get exchange rates: ${error instanceof Error ? error.message : 'Unknown error'}`;

            // Send debug message about error
            if (phoneNumber) {
                // await sendDebugMessage(phoneNumber, 'GET RATES ERROR', {
                //     error: errorMessage,
                //     errorType: error instanceof Error ? error.constructor.name : typeof error,
                //     executionTimeMs: executionTime,
                //     stack: error instanceof Error ? error.stack : undefined
                // });
            }

            logError('Failed to get exchange rates', error as Error, {
                executionTimeMs: executionTime,
                operation: toolId
            });

            logToolError(toolId, error as Error, executionTime, {});

            // Throw error instead of returning error object
            throw new Error(errorMessage);
        }
    },
});

/**
 * Unified tool to handle both transaction creation and updates
 */
export const manageTransactionTool = createTool({
    id: 'manage_transaction',
    description: 'Create a new transaction or update an existing one. For creation, provide transaction details. For updates, provide transactionId and fields to update. The userId and conversationId are automatically extracted from the agent memory context.',
    inputSchema: z.object({
        // For creation (required when creating new transaction)
        currencyFrom: z.string().optional().describe('Source currency (Shillings, Naira, etc.) - required for creation'),
        currencyTo: z.string().optional().describe('Target currency (Shillings, Naira, etc.) - required for creation'),
        amountFrom: z.number().optional().describe('Amount to exchange from - required for creation'),
        amountTo: z.number().optional().describe('Amount to receive - required for creation'),
        negotiatedRate: z.number().optional().describe('Final negotiated rate - required for creation'),
        
        // For updates (required when updating existing transaction)
        transactionId: z.string().optional().describe('Transaction ID to update - required for updates'),
        status: z.enum(["pending", "image_received", "confirmed", "cancelled", "failed"]).optional().describe('New status for the transaction'),
        paymentReference: z.string().optional().describe('Payment reference number'),
        receiptImageUrl: z.string().optional().describe('URL to receipt image'),
        extractedDetails: z.record(z.unknown()).optional().describe('OCR extracted details from receipt as key-value pairs'),
        
        // Operation type
        operation: z.enum(["create", "update"]).describe('Whether to create a new transaction or update an existing one'),
    }),
    execute: async ({ context, runtimeContext }) => {
        const startTime = Date.now();
        const toolId = 'manage_transaction';

        // Extract context data using new consistent naming
        const phoneNumber = runtimeContext?.get('phoneNumber') as string;
        const userId = runtimeContext?.get('userId') as string;
        const conversationId = runtimeContext?.get('conversationId') as string;

        logToolCall(toolId, context);

        try {
            // Validate that we have the required context
            if (!userId || !conversationId) {
                throw new Error('Unable to extract userId and conversationId from runtime context. Make sure the agent is called with proper context configuration.');
            }

            if (context.operation === 'create') {
                // Validate required fields for creation
                if (!context.currencyFrom || !context.currencyTo || !context.amountFrom || !context.amountTo || !context.negotiatedRate) {
                    throw new Error('For transaction creation, currencyFrom, currencyTo, amountFrom, amountTo, and negotiatedRate are required.');
                }

                logInfo('Creating new transaction with extracted context', {
                    userId,
                    conversationId,
                    currencyFrom: context.currencyFrom,
                    currencyTo: context.currencyTo,
                    amountFrom: context.amountFrom,
                    amountTo: context.amountTo,
                    negotiatedRate: context.negotiatedRate,
                    operation: toolId
                });

                const transaction = await fetchMutation(api.transactions.createTransaction, {
                    userId: userId as Id<"users">,
                    conversationId: conversationId as Id<"conversations">,
                    currencyFrom: context.currencyFrom,
                    currencyTo: context.currencyTo,
                    amountFrom: context.amountFrom,
                    amountTo: context.amountTo,
                    negotiatedRate: context.negotiatedRate,
                });

                const executionTime = Date.now() - startTime;
                const result = { operation: 'create', transactionId: transaction };

                logSuccess('Transaction created successfully', {
                    transactionId: transaction,
                    userId,
                    conversationId,
                    currencyPair: `${context.currencyFrom}_${context.currencyTo}`,
                    amountFrom: context.amountFrom,
                    amountTo: context.amountTo,
                    negotiatedRate: context.negotiatedRate,
                    executionTimeMs: executionTime,
                    operation: toolId
                });

                logToolResult(toolId, result, executionTime);
                return result;

            } else if (context.operation === 'update') {
                // Validate required fields for update
                if (!context.transactionId) {
                    throw new Error('For transaction update, transactionId is required.');
                }

                // First validate the transaction ID format
                if (!isValidConvexId(context.transactionId)) {
                    const result = {
                        success: false,
                        transactionId: context.transactionId,
                        message: `Invalid transaction ID format: ${context.transactionId}. Expected a valid Convex document ID (16+ alphanumeric characters).`,
                        suggestion: 'Use getLatestUserTransactionTool to get the most recent transaction ID, or use getUserTransactionsTool to see all available transaction IDs for this user.'
                    };
                    logToolResult(toolId, result, Date.now() - startTime);
                    return result;
                }

                // Validate that the transaction exists and belongs to the user
                const transaction = await fetchQuery(api.transactions.getTransaction, {
                    transactionId: context.transactionId as Id<"transactions">
                });

                if (!transaction) {
                    const result = {
                        success: false,
                        transactionId: context.transactionId,
                        message: `Transaction ID ${context.transactionId} does not exist in the database.`,
                        suggestion: 'Use getUserTransactionsTool to get all user transactions, or getLatestUserTransactionTool to get the most recent transaction.'
                    };
                    logToolResult(toolId, result, Date.now() - startTime);
                    return result;
                }

                // Check if transaction belongs to the current user
                if (transaction.userId !== userId) {
                    const result = {
                        success: false,
                        transactionId: context.transactionId,
                        message: `Transaction ID ${context.transactionId} exists but belongs to a different user.`,
                        suggestion: 'Use getUserTransactionsTool to get transactions that belong to the current user.'
                    };
                    logToolResult(toolId, result, Date.now() - startTime);
                    return result;
                }

                // Map status if provided
                let mappedStatus;
                if (context.status) {
                    const statusMapping = {
                        'pending': 'pending' as const,
                        'image_received': 'image_received_and_being_reviewed' as const,
                        'confirmed': 'confirmed_and_money_sent_to_user' as const,
                        'cancelled': 'cancelled' as const,
                        'failed': 'failed' as const
                    };
                    mappedStatus = statusMapping[context.status];
                    if (!mappedStatus) {
                        throw new Error(`Invalid status: ${context.status}. Use 'pending', 'image_received', 'confirmed', 'cancelled', or 'failed'.`);
                    }
                }

                logInfo('Updating transaction status after validation', {
                    transactionId: context.transactionId,
                    currentStatus: transaction.status,
                    newStatus: context.status,
                    hasPaymentReference: !!context.paymentReference,
                    hasReceiptImage: !!context.receiptImageUrl,
                    hasExtractedDetails: !!context.extractedDetails && Object.keys(context.extractedDetails).length > 0,
                    operation: toolId
                });

                // Build update object with only provided fields
                const updateData: any = {
                    transactionId: context.transactionId as Id<"transactions">,
                };
                
                if (mappedStatus !== undefined) {
                    updateData.status = mappedStatus;
                }
                if (context.paymentReference !== undefined) {
                    updateData.paymentReference = context.paymentReference;
                }
                if (context.receiptImageUrl !== undefined) {
                    updateData.receiptImageUrl = context.receiptImageUrl;
                }
                if (context.extractedDetails !== undefined) {
                    updateData.extractedDetails = context.extractedDetails;
                }

                await fetchMutation(api.transactions.updateTransactionStatus, updateData);

                const executionTime = Date.now() - startTime;
                const result = {
                    operation: 'update',
                    transactionId: context.transactionId,
                    status: mappedStatus
                };

                logSuccess('Transaction status updated successfully', {
                    transactionId: context.transactionId,
                    previousStatus: transaction.status,
                    inputStatus: context.status,
                    newStatus: mappedStatus,
                    paymentReference: context.paymentReference,
                    executionTimeMs: executionTime,
                    operation: toolId
                });

                logToolResult(toolId, result, executionTime);
                return result;
            } else {
                throw new Error('Invalid operation. Use "create" or "update".');
            }

        } catch (error) {
            const executionTime = Date.now() - startTime;
            const errorMessage = `Failed to ${context.operation} transaction: ${error instanceof Error ? error.message : 'Unknown error'}`;

            logError(`Failed to ${context.operation} transaction`, error as Error, {
                operationType: context.operation,
                transactionId: context.transactionId,
                executionTimeMs: executionTime,
                toolId: toolId
            });

            logToolError(toolId, error as Error, executionTime, context);
            throw new Error(errorMessage);
        }
    },
});

// Note: updateTransactionStatusTool has been merged into manageTransactionTool
// Use manageTransactionTool with operation: 'update' instead


