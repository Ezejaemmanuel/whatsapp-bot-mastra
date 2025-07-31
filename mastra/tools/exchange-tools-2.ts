import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { createTool } from "@mastra/core";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import z from "zod";
import { logToolCall, logInfo, logSuccess, logToolResult, logError, logToolError } from "./utils";









// Note: updateUserBankDetailsTool has been removed. 
// User bank details are now automatically updated when transaction bank details are saved
// via updateTransactionBankDetailsTool to maintain the latest account details.

/**
 * Tool to update transaction bank details after receipt confirmation
 */
export const updateTransactionBankDetailsTool = createTool({
    id: 'update_transaction_bank_details',
    description: 'Update transaction-specific bank details after receipt confirmation. This stores the bank details that the user wants to use for this specific transaction.',
    inputSchema: z.object({
        transactionId: z.string().describe('Transaction ID - must be a valid Convex document ID'),
        transactionBankName: z.string().describe('Bank name for this specific transaction'),
        transactionAccountNumber: z.string().describe('Account number for this specific transaction'),
        transactionAccountName: z.string().describe('Account name for this specific transaction'),
    }),
    execute: async ({ context, runtimeContext }) => {
        const startTime = Date.now();
        const toolId = 'update_transaction_bank_details';

        // Extract context data using new consistent naming
        const phoneNumber = runtimeContext?.get('phoneNumber') as string;
        const userId = runtimeContext?.get('userId') as string;
        const conversationId = runtimeContext?.get('conversationId') as string;

        logToolCall(toolId, context);

        try {
            // Validate that we have the required context
            if (!userId) {
                const errorMsg = 'Unable to extract userId from runtime context. Make sure the agent is called with proper context configuration.';
                throw new Error(errorMsg);
            }

            logInfo('Updating transaction bank details', {
                transactionId: context.transactionId,
                userId,
                operation: toolId
            });

            // Update the transaction with bank details
            const updatedTransaction = await fetchMutation(api.transactions.updateTransactionBankDetails, {
                transactionId: context.transactionId as Id<"transactions">,
                transactionBankName: context.transactionBankName,
                transactionAccountNumber: context.transactionAccountNumber,
                transactionAccountName: context.transactionAccountName,
            });

            // Also update the user's bank details to keep them as the latest account details
            // This ensures the user table always has the most recent bank details for future reference
            await fetchMutation(api.users.updateUserBankDetails, {
                userId: userId as Id<"users">,
                bankName: context.transactionBankName,
                accountNumber: context.transactionAccountNumber,
                accountName: context.transactionAccountName,
            });

            const executionTime = Date.now() - startTime;

            const result = {
                transactionId: context.transactionId,
                updated: true
            };

            logSuccess('Transaction bank details updated successfully', {
                transactionId: context.transactionId,
                userId,
                bankName: context.transactionBankName,
                accountName: context.transactionAccountName,
                executionTimeMs: executionTime,
                operation: toolId
            });

            logToolResult(toolId, result, executionTime);
            return result;

        } catch (error) {
            const executionTime = Date.now() - startTime;
            const errorMessage = `Failed to update transaction bank details for ${context.transactionId}: ${error instanceof Error ? error.message : 'Unknown error'}`;

            logError('Failed to update transaction bank details', error as Error, {
                transactionId: context.transactionId,
                userId,
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
 * Tool to get all transactions for the current user
 */
export const getUserTransactionsTool = createTool({
    id: 'get_user_transactions',
    description: 'Get all transactions for the current user. Useful for finding valid transaction IDs and transaction history. The userId is automatically extracted from agent memory context.',
    inputSchema: z.object({
        limit: z.number().optional().describe('Maximum number of transactions to return (default: 10)'),
        status: z.enum(["pending", "image_received_and_being_reviewed", "confirmed_and_money_sent_to_user", "cancelled", "failed"]).optional().describe('Filter by transaction status'),
    }),
    execute: async ({ context, runtimeContext }) => {
        const startTime = Date.now();
        const toolId = 'get_user_transactions';

        // Extract context data using new consistent naming
        const phoneNumber = runtimeContext?.get('phoneNumber') as string;
        const userId = runtimeContext?.get('userId') as string;
        const conversationId = runtimeContext?.get('conversationId') as string;

        logToolCall(toolId, context);

        try {
            // Validate that we have the required context
            if (!userId) {
                const errorMsg = 'Unable to extract userId from runtime context. Make sure the agent is called with proper context configuration.';
                throw new Error(errorMsg);
            }

            logInfo('Getting user transactions', {
                userId,
                limit: context.limit || 10,
                statusFilter: context.status || 'all',
                operation: toolId
            });

            const transactions = await fetchQuery(api.transactions.getUserTransactions, {
                userId: userId as Id<"users">,
                limit: context.limit || 10,
                status: context.status,
            });

            const executionTime = Date.now() - startTime;

            const result = transactions.map(tx => ({
                id: tx._id,
                status: tx.status,
                currencyFrom: tx.currencyFrom,
                currencyTo: tx.currencyTo,
                amountFrom: tx.amountFrom,
                amountTo: tx.amountTo,
                negotiatedRate: tx.negotiatedRate,
                createdAt: tx.createdAt
            }));

            logSuccess('User transactions retrieved successfully', {
                userId,
                totalTransactions: transactions.length,
                statusFilter: context.status || 'all',
                executionTimeMs: executionTime,
                operation: toolId
            });

            logToolResult(toolId, result, executionTime);
            return result;

        } catch (error) {
            const executionTime = Date.now() - startTime;
            const errorMessage = `Failed to get user transactions for ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`;

            logError('Failed to get user transactions', error as Error, {
                userId,
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
 * Tool to get the latest transaction for the current user
 */
export const getLatestUserTransactionTool = createTool({
    id: 'get_latest_user_transaction',
    description: 'Get the most recent transaction for the current user. Useful for continuing with the latest transaction. The userId is automatically extracted from agent memory context.',
    inputSchema: z.object({}), // No parameters needed
    execute: async ({ context, runtimeContext }) => {
        const startTime = Date.now();
        const toolId = 'get_latest_user_transaction';

        // Extract context data using new consistent naming
        const phoneNumber = runtimeContext?.get('phoneNumber') as string;
        const userId = runtimeContext?.get('userId') as string;
        const conversationId = runtimeContext?.get('conversationId') as string;

        logToolCall(toolId, context);

        try {
            // Validate that we have the required context
            if (!userId) {
                const errorMsg = 'Unable to extract userId from runtime context. Make sure the agent is called with proper context configuration.';
                throw new Error(errorMsg);
            }

            logInfo('Getting latest user transaction', {
                userId,
                operation: toolId
            });

            const transactions = await fetchQuery(api.transactions.getUserTransactions, {
                userId: userId as Id<"users">,
                limit: 1, // Get only the latest transaction
            });

            const executionTime = Date.now() - startTime;

            if (transactions.length === 0) {
                const result = null;

                logInfo('No transactions found for user', {
                    userId,
                    executionTimeMs: executionTime,
                    operation: toolId
                });

                logToolResult(toolId, result, executionTime);
                return result;
            }

            const latestTransaction = transactions[0];

            const result = {
                id: latestTransaction._id,
                status: latestTransaction.status,
                currencyFrom: latestTransaction.currencyFrom,
                currencyTo: latestTransaction.currencyTo,
                amountFrom: latestTransaction.amountFrom,
                amountTo: latestTransaction.amountTo,
                negotiatedRate: latestTransaction.negotiatedRate,
                createdAt: latestTransaction.createdAt
            };

            logSuccess('Latest user transaction retrieved successfully', {
                userId,
                transactionId: latestTransaction._id,
                transactionStatus: latestTransaction.status,
                executionTimeMs: executionTime,
                operation: toolId
            });

            logToolResult(toolId, result, executionTime);
            return result;

        } catch (error) {
            const executionTime = Date.now() - startTime;
            const errorMessage = `Failed to get latest user transaction for ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`;



            logError('Failed to get latest user transaction', error as Error, {
                userId,
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
 * Tool to get admin bank details for customer payments
 */
export const getAdminBankDetailsTool = createTool({
    id: 'get_admin_bank_details',
    description: 'Get all admin bank account details where customers should send payments. Returns all active admin bank accounts.',
    inputSchema: z.object({}), // No parameters needed
    execute: async ({ context, runtimeContext }) => {
        const startTime = Date.now();
        const toolId = 'get_admin_bank_details';

        // Extract context data using new consistent naming
        const phoneNumber = runtimeContext?.get('phoneNumber') as string;
        const userId = runtimeContext?.get('userId') as string;
        const conversationId = runtimeContext?.get('conversationId') as string;

        logToolCall(toolId, context);

        try {
            logInfo('Getting admin bank details for customer payment', {
                operation: toolId
            });

            const allAdminBankDetails = await fetchQuery(api.adminBankDetails.getAllAdminBankDetails, {});

            if (!allAdminBankDetails || allAdminBankDetails.length === 0) {
                const errorMsg = 'No active admin bank details found. Please contact support.';
                throw new Error(errorMsg);
            }

            const executionTime = Date.now() - startTime;

            const result = allAdminBankDetails;

            logSuccess('Admin bank details retrieved successfully', {
                count: allAdminBankDetails.length,
                // Don't log full account number for security
                executionTimeMs: executionTime,
                operation: toolId
            });

            logToolResult(toolId, result, executionTime);
            return result;

        } catch (error) {
            const executionTime = Date.now() - startTime;
            const errorMessage = `Failed to get admin bank details: ${error instanceof Error ? error.message : 'Unknown error'}`;

            logError('Failed to get admin bank details', error as Error, {
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
 * Tool to get user information by userId from memory context
 */
export const getUserTool = createTool({
    id: 'get_user',
    description: 'Get user information including bank details. The userId is automatically extracted from the agent memory context.',
    inputSchema: z.object({}), // No parameters needed
    execute: async ({ context, runtimeContext }) => {
        const startTime = Date.now();
        const toolId = 'get_user';

        // Extract context data using new consistent naming
        const phoneNumber = runtimeContext?.get('phoneNumber') as string;
        const userId = runtimeContext?.get('userId') as string;
        const conversationId = runtimeContext?.get('conversationId') as string;

        logToolCall(toolId, context);

        try {
            // Validate that we have the required context
            if (!userId) {
                const errorMsg = 'Unable to extract userId from runtime context. Make sure the agent is called with proper context configuration.';
                throw new Error(errorMsg);
            }

            logInfo('Getting user information', {
                userId,
                operation: toolId
            });

            const user = await fetchQuery(api.users.getUserById, {
                userId: userId as Id<"users">
            });

            if (!user) {
                throw new Error(`User not found with ID: ${userId}`);
            }

            const executionTime = Date.now() - startTime;

            const result = {
                userId: user._id,
                whatsappId: user.whatsappId,
                profileName: user.profileName,
                phoneNumber: user.phoneNumber,
                bankName: user.bankName,
                accountNumber: user.accountNumber,
                accountName: user.accountName
            };

            logSuccess('User information retrieved successfully', {
                userId: user._id,
                whatsappId: user.whatsappId,
                profileName: user.profileName,
                hasBankDetails: !!(user.bankName && user.accountNumber && user.accountName),
                executionTimeMs: executionTime,
                operation: toolId
            });

            logToolResult(toolId, result, executionTime);
            return result;

        } catch (error) {
            const executionTime = Date.now() - startTime;
            const errorMessage = `Failed to get user information for ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`;

            logError('Failed to get user information', error as Error, {
                userId,
                executionTimeMs: executionTime,
                operation: toolId
            });

            logToolError(toolId, error as Error, executionTime, context);

            // Throw error instead of returning error object
            throw new Error(errorMessage);
        }
    },
});

