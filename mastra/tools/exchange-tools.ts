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

        logToolCall(toolId, {});

        try {
            logInfo('Getting ALL current exchange rates from database', {
                operation: toolId,
                note: 'No currency pair filter applied - fetching all rates'
            });

            // Always call without currencyPair to get all rates
            const rates = await fetchQuery(api.exchangeRates.getCurrentRates, {});

            const executionTime = Date.now() - startTime;

            const result = rates;

            logToolResult(toolId, result, executionTime);
            return result;

        } catch (error) {
            const executionTime = Date.now() - startTime;
            const errorMessage = `Failed to get exchange rates: ${error instanceof Error ? error.message : 'Unknown error'}`;

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
        // Core transaction fields - all optional for flexible AI-driven creation
        currencyFrom: z.string().optional().describe('Source currency (Shillings, Naira, etc.)'),
        currencyTo: z.string().optional().describe('Target currency (Shillings, Naira, etc.)'),
        amountFrom: z.number().optional().describe('Amount to exchange from'),
        amountTo: z.number().optional().describe('Amount to receive'),
        negotiatedRate: z.number().optional().describe('Final negotiated rate'),
        estimatedRate: z.number().optional().describe('Initial estimated rate before negotiation'),
        initialStatus: z.enum(["pending", "image_received_and_being_reviewed"]).optional().describe('Initial status for new transaction (default: pending)'),
        
        // Transaction details
        paymentReference: z.string().optional().describe('Payment reference number'),
        receiptImageUrl: z.string().optional().describe('URL to receipt image'),
        imageUrl: z.string().optional().describe('URL to any transaction-related image'),
        extractedDetails: z.record(z.unknown()).optional().describe('OCR extracted details from receipt as key-value pairs'),
        notes: z.string().optional().describe('Additional transaction notes'),
        
        // Customer bank details
        customerBankName: z.string().optional().describe('Customer bank name'),
        customerAccountNumber: z.string().optional().describe('Customer account number'),
        customerAccountName: z.string().optional().describe('Customer account name'),
        
        // Admin bank details for this transaction
        transactionBankName: z.string().optional().describe('Admin bank name for this transaction'),
        transactionAccountNumber: z.string().optional().describe('Admin account number for this transaction'),
        transactionAccountName: z.string().optional().describe('Admin account name for this transaction'),
        
        // For updates
        transactionId: z.string().optional().describe('Transaction ID to update - required for updates'),
        status: z.enum(["pending", "image_received_and_being_reviewed", "confirmed_and_money_sent_to_user", "cancelled", "failed"]).optional().describe('New status for the transaction'),
        
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
                logInfo('Creating new transaction with available information', {
                    userId,
                    conversationId,
                    hasAmount: !!context.amountFrom,
                    hasCurrencies: !!(context.currencyFrom && context.currencyTo),
                    hasRate: !!context.negotiatedRate,
                    hasCustomerBankDetails: !!(context.customerBankName || context.customerAccountNumber),
                    operation: toolId
                });

                // Build creation data with only provided fields
                const createData: any = {
                    userId: userId as Id<"users">,
                    conversationId: conversationId as Id<"conversations">,
                };

                // Add optional fields only if provided
                if (context.currencyFrom) createData.currencyFrom = context.currencyFrom;
                if (context.currencyTo) createData.currencyTo = context.currencyTo;
                if (context.amountFrom) createData.amountFrom = context.amountFrom;
                if (context.amountTo) createData.amountTo = context.amountTo;
                if (context.negotiatedRate) createData.negotiatedRate = context.negotiatedRate;
                if (context.estimatedRate) createData.estimatedRate = context.estimatedRate;
                if (context.imageUrl) createData.imageUrl = context.imageUrl;
                if (context.notes) createData.notes = context.notes;
                if (context.customerBankName) createData.customerBankName = context.customerBankName;
                if (context.customerAccountNumber) createData.customerAccountNumber = context.customerAccountNumber;
                if (context.customerAccountName) createData.customerAccountName = context.customerAccountName;

                // Create transaction with flexible fields
                const transactionId = await fetchMutation(api.transactions.createTransaction, createData);

                // If initialStatus is provided and not pending, update the status immediately
                if (context.initialStatus && context.initialStatus !== 'pending') {
                    await fetchMutation(api.transactions.updateTransactionStatus, {
                        transactionId: transactionId as Id<"transactions">,
                        status: context.initialStatus,
                    });
                }

                const executionTime = Date.now() - startTime;
                const result = { 
                    operation: 'create', 
                    transactionId: transactionId,
                    initialStatus: context.initialStatus || 'pending',
                    fieldsProvided: Object.keys(createData).filter(key => !['userId', 'conversationId'].includes(key))
                };

                logSuccess('Transaction created successfully with flexible fields', {
                    transactionId: transactionId,
                    userId,
                    conversationId,
                    fieldsProvided: result.fieldsProvided,
                    currencyPair: `${context.currencyFrom}_${context.currencyTo}`,
                    amountFrom: context.amountFrom,
                    amountTo: context.amountTo,
                    negotiatedRate: context.negotiatedRate,
                    initialStatus: context.initialStatus || 'pending',
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

                // Use status directly (no mapping needed since we now use full status names)
                const newStatus = context.status;

                logInfo('Updating transaction with provided fields', {
                    transactionId: context.transactionId,
                    currentStatus: transaction.status,
                    newStatus: newStatus,
                    hasPaymentReference: !!context.paymentReference,
                    hasReceiptImage: !!context.receiptImageUrl,
                    hasExtractedDetails: !!context.extractedDetails && Object.keys(context.extractedDetails).length > 0,
                    hasCustomerBankDetails: !!(context.customerBankName || context.customerAccountNumber),
                    hasTransactionBankDetails: !!(context.transactionBankName || context.transactionAccountNumber),
                    operation: toolId
                });

                // Build update object with only provided fields
                const updateData: any = {
                    transactionId: context.transactionId as Id<"transactions">,
                };

                // Add all possible update fields if provided
                if (newStatus !== undefined) updateData.status = newStatus;
                if (context.currencyFrom !== undefined) updateData.currencyFrom = context.currencyFrom;
                if (context.currencyTo !== undefined) updateData.currencyTo = context.currencyTo;
                if (context.amountFrom !== undefined) updateData.amountFrom = context.amountFrom;
                if (context.amountTo !== undefined) updateData.amountTo = context.amountTo;
                if (context.negotiatedRate !== undefined) updateData.negotiatedRate = context.negotiatedRate;
                if (context.estimatedRate !== undefined) updateData.estimatedRate = context.estimatedRate;
                if (context.paymentReference !== undefined) updateData.paymentReference = context.paymentReference;
                if (context.receiptImageUrl !== undefined) updateData.receiptImageUrl = context.receiptImageUrl;
                if (context.imageUrl !== undefined) updateData.imageUrl = context.imageUrl;
                if (context.extractedDetails !== undefined) updateData.extractedDetails = context.extractedDetails;
                if (context.notes !== undefined) updateData.notes = context.notes;
                if (context.customerBankName !== undefined) updateData.customerBankName = context.customerBankName;
                if (context.customerAccountNumber !== undefined) updateData.customerAccountNumber = context.customerAccountNumber;
                if (context.customerAccountName !== undefined) updateData.customerAccountName = context.customerAccountName;
                if (context.transactionBankName !== undefined) updateData.transactionBankName = context.transactionBankName;
                if (context.transactionAccountNumber !== undefined) updateData.transactionAccountNumber = context.transactionAccountNumber;
                if (context.transactionAccountName !== undefined) updateData.transactionAccountName = context.transactionAccountName;

                await fetchMutation(api.transactions.updateTransactionStatus, updateData);

                const executionTime = Date.now() - startTime;
                const result = {
                    operation: 'update',
                    transactionId: context.transactionId,
                    status: newStatus,
                    fieldsUpdated: Object.keys(updateData).filter(key => key !== 'transactionId')
                };

                logSuccess('Transaction updated successfully with flexible fields', {
                    transactionId: context.transactionId,
                    previousStatus: transaction.status,
                    newStatus: newStatus,
                    fieldsUpdated: result.fieldsUpdated,
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


