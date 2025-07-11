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

            const result = {
                success: true,
                data: rates,
                totalRates: Array.isArray(rates) ? rates.length : 1,
                message: 'All exchange rates retrieved successfully'
            };

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

            logSuccess('All exchange rates retrieved successfully', {
                totalRates: result.totalRates,
                executionTimeMs: executionTime,
                operation: toolId,
                ratesData: rates
            });

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
 * Tool to create a new transaction
 */
export const createTransactionTool = createTool({
    id: 'create_transaction',
    description: 'Create a new exchange transaction when user agrees to terms. The userId and conversationId are automatically extracted from the agent memory context.',
    inputSchema: z.object({
        currencyFrom: z.string().describe('Source currency (USD, GBP, EUR, etc.)'),
        currencyTo: z.string().describe('Target currency (NGN, etc.)'),
        amountFrom: z.number().describe('Amount to exchange from'),
        amountTo: z.number().describe('Amount to receive'),
        negotiatedRate: z.number().describe('Final negotiated rate'),
        negotiationHistory: z.array(z.object({
            timestamp: z.number().optional(),
            customerRate: z.number().optional(),
            counterOffer: z.number().optional(),
            message: z.string().optional(),
            strategy: z.string().optional()
        })).optional().describe('History of rate negotiations'),
    }),
    execute: async ({ context, runtimeContext }) => {
        const startTime = Date.now();
        const toolId = 'create_transaction';

        // Extract context data using new consistent naming
        const phoneNumber = runtimeContext?.get('phoneNumber') as string;
        const userId = runtimeContext?.get('userId') as string;
        const conversationId = runtimeContext?.get('conversationId') as string;

        // Send debug message about tool start
        if (phoneNumber) {
            // await sendDebugMessage(phoneNumber, 'CREATE TRANSACTION TOOL STARTED', {
            //     toolId,
            //     startTime: new Date(startTime).toISOString(),
            //     currencyFrom: context.currencyFrom,
            //     currencyTo: context.currencyTo,
            //     amountFrom: context.amountFrom,
            //     amountTo: context.amountTo,
            //     negotiatedRate: context.negotiatedRate,
            //     hasNegotiationHistory: !!context.negotiationHistory && context.negotiationHistory.length > 0,
            //     userId,
            //     conversationId
            // });
        }

        logToolCall(toolId, context);

        try {
            // Validate that we have the required context
            if (!userId || !conversationId) {
                const errorMsg = 'Unable to extract userId and conversationId from runtime context. Make sure the agent is called with proper context configuration.';

                if (phoneNumber) {
                    // await sendDebugMessage(phoneNumber, 'CONTEXT EXTRACTION ERROR', {
                    //     error: errorMsg,
                    //     userId: userId || 'missing',
                    //     conversationId: conversationId || 'missing',
                    //     phoneNumber: phoneNumber || 'missing',
                    //     runtimeContextKeys: runtimeContext ? Object.keys(runtimeContext) : 'No runtime context'
                    // });
                }

                throw new Error(errorMsg);
            }

            // Send debug message about extracted context
            if (phoneNumber) {
                // await sendDebugMessage(phoneNumber, 'CONTEXT EXTRACTED SUCCESSFULLY', {
                //     userId,
                //     conversationId,
                //     phoneNumber,
                //     userIdType: typeof userId,
                //     conversationIdType: typeof conversationId
                // });
            }

            logInfo('Creating new transaction with extracted context', {
                userId,
                conversationId,
                currencyFrom: context.currencyFrom,
                currencyTo: context.currencyTo,
                amountFrom: context.amountFrom,
                amountTo: context.amountTo,
                negotiatedRate: context.negotiatedRate,
                hasNegotiationHistory: !!context.negotiationHistory && context.negotiationHistory.length > 0,
                operation: toolId
            });

            // Send debug message about database mutation
            if (phoneNumber) {
                // await sendDebugMessage(phoneNumber, 'DATABASE MUTATION STARTED', {
                //     operation: 'api.transactions.createTransaction',
                //     parameters: {
                //         userId,
                //         conversationId,
                //         currencyFrom: context.currencyFrom,
                //         currencyTo: context.currencyTo,
                //         amountFrom: context.amountFrom,
                //         amountTo: context.amountTo,
                //         negotiatedRate: context.negotiatedRate,
                //         negotiationHistoryLength: context.negotiationHistory?.length || 0
                //     }
                // });
            }

            const transaction = await fetchMutation(api.transactions.createTransaction, {
                userId: userId as Id<"users">,
                conversationId: conversationId as Id<"conversations">,
                currencyFrom: context.currencyFrom,
                currencyTo: context.currencyTo,
                amountFrom: context.amountFrom,
                amountTo: context.amountTo,
                negotiatedRate: context.negotiatedRate,
                negotiationHistory: context.negotiationHistory,
            });

            const executionTime = Date.now() - startTime;

            const result = {
                success: true,
                data: transaction,
                transactionId: transaction,
                message: `Transaction created successfully with ID: ${transaction}`,
                workingMemoryUpdate: `IMPORTANT: Store this transaction ID in your working memory: ${transaction}. You will need this ID for all future updates to this transaction. Use this exact ID when calling updateTransactionStatusTool or other transaction-related tools.`
            };

            // Send debug message with successful result
            if (phoneNumber) {
                // await sendDebugMessage(phoneNumber, 'TRANSACTION CREATED SUCCESSFULLY', {
                //     success: true,
                //     transactionId: transaction,
                //     executionTimeMs: executionTime,
                //     currencyPair: `${context.currencyFrom}_${context.currencyTo}`,
                //     amountFrom: context.amountFrom,
                //     amountTo: context.amountTo,
                //     negotiatedRate: context.negotiatedRate,
                //     workingMemoryUpdate: result.workingMemoryUpdate
                // });

                // // Send complete transaction result
                // await sendDebugMessage(phoneNumber, 'COMPLETE TRANSACTION RESULT', result);
            }

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

        } catch (error) {
            const executionTime = Date.now() - startTime;
            const errorMessage = `Failed to create transaction for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`;

            // Send debug message about error
            if (phoneNumber) {
                // await sendDebugMessage(phoneNumber, 'CREATE TRANSACTION ERROR', {
                //     error: errorMessage,
                //     errorType: error instanceof Error ? error.constructor.name : typeof error,
                //     executionTimeMs: executionTime,
                //     userId,
                //     conversationId,
                //     transactionData: {
                //         currencyFrom: context.currencyFrom,
                //         currencyTo: context.currencyTo,
                //         amountFrom: context.amountFrom,
                //         negotiatedRate: context.negotiatedRate
                //     },
                //     stack: error instanceof Error ? error.stack : undefined
                // });
            }

            logError('Failed to create transaction', error as Error, {
                userId,
                conversationId,
                currencyPair: `${context.currencyFrom}_${context.currencyTo}`,
                amountFrom: context.amountFrom,
                negotiatedRate: context.negotiatedRate,
                executionTimeMs: executionTime,
                operation: toolId
            });

            logToolError(toolId, error as Error, executionTime, context);

            // Throw error instead of returning error object
            throw new Error(errorMessage);
        }
    },
});

/**
 * Tool to update transaction status with validation
 */
export const updateTransactionStatusTool = createTool({
    id: 'update_transaction_status',
    description: 'Update transaction status (pending, paid, verified, completed, failed, cancelled). This tool automatically validates the transaction ID before updating. If validation fails, it returns helpful guidance instead of throwing an error.',
    inputSchema: z.object({
        transactionId: z.string().describe('Transaction ID - must be a valid Convex document ID that belongs to the current user'),
        status: z.enum(["pending", "image_received_and_being_reviewed", "confirmed_and_money_sent_to_user", "cancelled", "failed"]).describe('New status: pending, image_received_and_being_reviewed, confirmed_and_money_sent_to_user, cancelled, failed'),
        paymentReference: z.string().optional().describe('Payment reference number'),
        receiptImageUrl: z.string().optional().describe('URL to receipt image'),
        extractedDetails: z.record(z.unknown()).optional().describe('OCR extracted details from receipt as key-value pairs'),
    }),
    execute: async ({ context, runtimeContext }) => {
        const startTime = Date.now();
        const toolId = 'update_transaction_status';

        // Extract context data using new consistent naming
        const phoneNumber = runtimeContext?.get('phoneNumber') as string;
        const userId = runtimeContext?.get('userId') as string;
        const conversationId = runtimeContext?.get('conversationId') as string;

        // Send debug message about tool start
        if (phoneNumber) {
            // await sendDebugMessage(phoneNumber, 'UPDATE TRANSACTION STATUS TOOL STARTED', {
            //     toolId,
            //     startTime: new Date(startTime).toISOString(),
            //     transactionId: context.transactionId,
            //     newStatus: context.status,
            //     hasPaymentReference: !!context.paymentReference,
            //     hasReceiptImage: !!context.receiptImageUrl,
            //     hasExtractedDetails: !!context.extractedDetails && Object.keys(context.extractedDetails).length > 0,
            //     userId,
            //     conversationId
            // });
        }

        logToolCall(toolId, context);

        try {
            // Validate that we have the required context
            if (!userId) {
                const result = {
                    success: false,
                    message: 'Unable to extract userId from runtime context. Make sure the agent is called with proper context configuration.',
                    suggestion: 'Check your agent context configuration.'
                };

                if (phoneNumber) {
                    // await sendDebugMessage(phoneNumber, 'USER ID EXTRACTION FAILED', {
                    //     error: result.message,
                    //     suggestion: result.suggestion,
                    //     runtimeContextAvailable: !!runtimeContext,
                    //     userId: userId || 'missing',
                    //     conversationId: conversationId || 'missing',
                    //     phoneNumber: phoneNumber || 'missing'
                    // });
                }

                logToolResult(toolId, result, Date.now() - startTime);
                return result;
            }

            // Send debug message about validation start
            if (phoneNumber) {
                // await sendDebugMessage(phoneNumber, 'TRANSACTION VALIDATION STARTED', {
                //     transactionId: context.transactionId,
                //     userId,
                //     operation: 'Validating transaction ID format and ownership'
                // });
            }

            // First validate the transaction ID format
            if (!isValidConvexId(context.transactionId)) {
                const result = {
                    success: false,
                    transactionId: context.transactionId,
                    message: `Invalid transaction ID format: ${context.transactionId}. Expected a valid Convex document ID (16+ alphanumeric characters).`,
                    suggestion: 'Use validateTransactionTool to check the transaction ID, or use getLatestUserTransactionTool to get the most recent transaction ID, or use getUserTransactionsTool to see all available transaction IDs for this user.'
                };

                if (phoneNumber) {
                    // await sendDebugMessage(phoneNumber, 'INVALID TRANSACTION ID FORMAT', {
                    //     transactionId: context.transactionId,
                    //     expectedFormat: '16+ alphanumeric characters',
                    //     suggestion: result.suggestion
                    // });
                }

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
                    message: `Transaction ID ${context.transactionId} does not exist in the database. Please check your working memory for the correct transaction ID.`,
                    suggestion: 'Use getUserTransactionsTool to get all user transactions, or getLatestUserTransactionTool to get the most recent transaction, or check your working memory for the correct transaction ID.'
                };
                logToolResult(toolId, result, Date.now() - startTime);
                return result;
            }

            // Check if transaction belongs to the current user
            if (transaction.userId !== userId) {
                const result = {
                    success: false,
                    transactionId: context.transactionId,
                    message: `Transaction ID ${context.transactionId} exists but belongs to a different user. This transaction cannot be modified by the current user.`,
                    suggestion: 'Use getUserTransactionsTool to get transactions that belong to the current user.'
                };
                logToolResult(toolId, result, Date.now() - startTime);
                return result;
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

            // Send debug message about status update
            if (phoneNumber) {
                // await sendDebugMessage(phoneNumber, 'TRANSACTION STATUS UPDATE STARTED', {
                //     transactionId: context.transactionId,
                //     currentStatus: transaction.status,
                //     newStatus: context.status,
                //     paymentReference: context.paymentReference,
                //     receiptImageUrl: context.receiptImageUrl,
                //     extractedDetailsKeys: context.extractedDetails ? Object.keys(context.extractedDetails) : []
                // });
            }

            await fetchMutation(api.transactions.updateTransactionStatus, {
                transactionId: context.transactionId as Id<"transactions">,
                status: context.status,
                paymentReference: context.paymentReference,
                receiptImageUrl: context.receiptImageUrl,
                extractedDetails: context.extractedDetails,
            });

            const executionTime = Date.now() - startTime;

            const result = {
                success: true,
                transactionId: context.transactionId,
                previousStatus: transaction.status,
                newStatus: context.status,
                message: `Transaction ${context.transactionId} status updated from ${transaction.status} to ${context.status} successfully`,
                workingMemoryUpdate: `Transaction ${context.transactionId} is now in ${context.status} status. Keep this transaction ID in your working memory for future updates.`
            };

            // Send debug message about successful update
            if (phoneNumber) {
                // await sendDebugMessage(phoneNumber, 'TRANSACTION STATUS UPDATED SUCCESSFULLY', {
                //     success: true,
                //     transactionId: context.transactionId,
                //     previousStatus: transaction.status,
                //     newStatus: context.status,
                //     executionTimeMs: executionTime,
                //     workingMemoryUpdate: result.workingMemoryUpdate
                // });

                // Send complete result
                // await sendDebugMessage(phoneNumber, 'COMPLETE UPDATE RESULT', result);
            }

            logSuccess('Transaction status updated successfully', {
                transactionId: context.transactionId,
                previousStatus: transaction.status,
                newStatus: context.status,
                paymentReference: context.paymentReference,
                executionTimeMs: executionTime,
                operation: toolId
            });

            logToolResult(toolId, result, executionTime);
            return result;

        } catch (error) {
            const executionTime = Date.now() - startTime;
            const errorMessage = `Failed to update transaction status for ${context.transactionId}: ${error instanceof Error ? error.message : 'Unknown error'}`;

            // Send debug message about error
            if (phoneNumber) {
                // await sendDebugMessage(phoneNumber, 'UPDATE TRANSACTION STATUS ERROR', {
                //     error: errorMessage,
                //     errorType: error instanceof Error ? error.constructor.name : typeof error,
                //     transactionId: context.transactionId,
                //     newStatus: context.status,
                //     executionTimeMs: executionTime,
                //     stack: error instanceof Error ? error.stack : undefined
                // });
            }

            logError('Failed to update transaction status', error as Error, {
                transactionId: context.transactionId,
                newStatus: context.status,
                executionTimeMs: executionTime,
                operation: toolId
            });

            logToolError(toolId, error as Error, executionTime, context);

            // Throw error instead of returning error object
            throw new Error(errorMessage);
        }
    },
});


