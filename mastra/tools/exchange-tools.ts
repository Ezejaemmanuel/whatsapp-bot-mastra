import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { fetchQuery, fetchMutation } from "convex/nextjs";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { imageAnalysisTool } from './image-analysis-tool';

/**
 * Enhanced logging utility for exchange tools with detailed tool call tracking
 */
function logExchangeEvent(
    level: 'INFO' | 'ERROR' | 'WARN' | 'SUCCESS',
    message: string,
    data?: Record<string, any>
): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        level,
        source: 'Exchange Tools',
        message,
        ...data
    };

    const levelEmoji = {
        'INFO': '📋',
        'ERROR': '❌',
        'WARN': '⚠️',
        'SUCCESS': '✅'
    };

    console.log(`[${timestamp}] ${levelEmoji[level] || '📋'} [${level}] Exchange Tools: ${message}`);

    if (data && Object.keys(data).length > 0) {
        console.log('📊 Tool Data:', JSON.stringify(data, null, 2));
    }
}

function logToolCall(toolId: string, parameters: any): void {
    logExchangeEvent('INFO', `🚀 TOOL CALL STARTED: ${toolId}`, {
        toolId,
        parameters: JSON.stringify(parameters, null, 2),
        callStartTime: new Date().toISOString()
    });
}

function logToolResult(toolId: string, result: any, executionTimeMs: number): void {
    logExchangeEvent('SUCCESS', `✅ TOOL CALL COMPLETED: ${toolId}`, {
        toolId,
        result: JSON.stringify(result, null, 2),
        executionTimeMs,
        callEndTime: new Date().toISOString()
    });
}

function logToolError(toolId: string, error: Error, executionTimeMs: number, parameters?: any): void {
    logExchangeEvent('ERROR', `❌ TOOL CALL FAILED: ${toolId}`, {
        toolId,
        error: error.message,
        stack: error.stack,
        parameters: parameters ? JSON.stringify(parameters, null, 2) : undefined,
        executionTimeMs,
        callEndTime: new Date().toISOString()
    });
}

function logSuccess(message: string, data?: Record<string, any>): void {
    logExchangeEvent('SUCCESS', message, data);
}

function logError(message: string, error?: Error | string, data?: Record<string, any>): void {
    const errorData = {
        ...data,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
    };
    logExchangeEvent('ERROR', message, errorData);
}

function logInfo(message: string, data?: Record<string, any>): void {
    logExchangeEvent('INFO', message, data);
}

/**
 * Tool to get current exchange rates - NO PARAMETERS ACCEPTED
 * Always returns all active rates from the database
 */
export const getCurrentRatesTool = createTool({
    id: 'get_current_rates',
    description: 'Get ALL current exchange rates from the database. This tool does not accept any parameters and always returns all active currency pair rates.',
    inputSchema: z.object({}), // No parameters accepted
    execute: async ({ context }) => {
        const startTime = Date.now();
        const toolId = 'get_current_rates';

        logToolCall(toolId, {});

        try {
            logInfo('Getting ALL current exchange rates from database', {
                operation: toolId,
                note: 'No currency pair filter applied - fetching all rates'
            });

            // Always call without currencyPair to get all rates
            const rates = await fetchQuery(api.exchangeRates.getCurrentRates, {});

            const executionTime = Date.now() - startTime;

            const result = {
                success: true,
                data: rates,
                totalRates: Array.isArray(rates) ? rates.length : 1,
                message: 'All exchange rates retrieved successfully'
            };

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

        logToolCall(toolId, context);

        try {
            // Extract userId and conversationId from memory context
            // resourceId is the userId, threadId is the conversationId
            const userId = runtimeContext?.get('resourceId'); // This is the userId (from phone number)
            const conversationId = runtimeContext?.get('threadId'); // This is the conversationId

            if (!userId || !conversationId) {
                throw new Error('Unable to extract userId and conversationId from agent memory context. Make sure the agent is called with proper memory configuration.');
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
                message: `Transaction created successfully with ID: ${transaction}`
            };

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
            const userId = runtimeContext?.get('resourceId');
            const conversationId = runtimeContext?.get('threadId');
            const errorMessage = `Failed to create transaction for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`;

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
 * Tool to update transaction status
 */
export const updateTransactionStatusTool = createTool({
    id: 'update_transaction_status',
    description: 'Update transaction status (pending, paid, verified, completed, failed, cancelled)',
    inputSchema: z.object({
        transactionId: z.string().describe('Transaction ID'),
        status: z.string().describe('New status: pending, paid, verified, completed, failed, cancelled'),
        paymentReference: z.string().optional().describe('Payment reference number'),
        receiptImageUrl: z.string().optional().describe('URL to receipt image'),
        extractedDetails: z.record(z.unknown()).optional().describe('OCR extracted details from receipt as key-value pairs'),
    }),
    execute: async ({ context }) => {
        const startTime = Date.now();
        const toolId = 'update_transaction_status';

        logToolCall(toolId, context);

        try {
            logInfo('Updating transaction status', {
                transactionId: context.transactionId,
                newStatus: context.status,
                hasPaymentReference: !!context.paymentReference,
                hasReceiptImage: !!context.receiptImageUrl,
                hasExtractedDetails: !!context.extractedDetails && Object.keys(context.extractedDetails).length > 0,
                operation: toolId
            });

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
                message: `Transaction ${context.transactionId} status updated to ${context.status} successfully`,
            };

            logSuccess('Transaction status updated successfully', {
                transactionId: context.transactionId,
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

/**
 * Tool to get admin bank details for customer payments
 */
export const getAdminBankDetailsTool = createTool({
    id: 'get_admin_bank_details',
    description: 'Get admin bank account details where customers should send payments. Returns the default active admin bank account.',
    inputSchema: z.object({}), // No parameters needed
    execute: async ({ context }) => {
        const startTime = Date.now();
        const toolId = 'get_admin_bank_details';

        logToolCall(toolId, context);

        try {
            logInfo('Getting admin bank details for customer payment', {
                operation: toolId
            });

            const adminBankDetails = await fetchQuery(api.adminBankDetails.getDefaultAdminBankDetails, {});

            if (!adminBankDetails) {
                throw new Error('No active admin bank details found. Please contact support.');
            }

            const executionTime = Date.now() - startTime;

            const result = {
                success: true,
                data: adminBankDetails,
                accountNumber: adminBankDetails.accountNumber,
                accountName: adminBankDetails.accountName,
                bankName: adminBankDetails.bankName,
                message: `Admin bank details retrieved successfully`
            };

            logSuccess('Admin bank details retrieved successfully', {
                bankName: adminBankDetails.bankName,
                accountName: adminBankDetails.accountName,
                // Don't log full account number for security
                accountNumberMasked: adminBankDetails.accountNumber.slice(0, 4) + '****',
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

        logToolCall(toolId, context);

        try {
            // Extract userId from memory context
            const userId = runtimeContext?.get('resourceId'); // This is the userId

            if (!userId) {
                throw new Error('Unable to extract userId from agent memory context. Make sure the agent is called with proper memory configuration.');
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
                success: true,
                data: user,
                userId: user._id,
                whatsappId: user.whatsappId,
                profileName: user.profileName,
                phoneNumber: user.phoneNumber,
                bankDetails: {
                    bankName: user.bankName,
                    accountNumber: user.accountNumber,
                    accountName: user.accountName
                },
                message: `User information retrieved successfully`
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
            const userId = runtimeContext?.get('resourceId');
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

/**
 * Tool to update user bank details
 */
export const updateUserBankDetailsTool = createTool({
    id: 'update_user_bank_details',
    description: 'Update user bank account details. The userId is automatically extracted from the agent memory context.',
    inputSchema: z.object({
        bankName: z.string().describe('Customer bank name'),
        accountNumber: z.string().describe('Customer account number'),
        accountName: z.string().describe('Customer account name'),
    }),
    execute: async ({ context, runtimeContext }) => {
        const startTime = Date.now();
        const toolId = 'update_user_bank_details';

        logToolCall(toolId, context);

        try {
            // Extract userId from memory context
            const userId = runtimeContext?.get('resourceId'); // This is the userId

            if (!userId) {
                throw new Error('Unable to extract userId from agent memory context. Make sure the agent is called with proper memory configuration.');
            }

            logInfo('Updating user bank details', {
                userId,
                bankName: context.bankName,
                accountName: context.accountName,
                // Don't log full account number for security
                accountNumberMasked: context.accountNumber.slice(0, 4) + '****',
                operation: toolId
            });

            const updatedUser = await fetchMutation(api.users.updateUserBankDetails, {
                userId: userId as Id<"users">,
                bankName: context.bankName,
                accountNumber: context.accountNumber,
                accountName: context.accountName,
            });

            const executionTime = Date.now() - startTime;

            const result = {
                success: true,
                data: updatedUser,
                message: `User bank details updated successfully`
            };

            logSuccess('User bank details updated successfully', {
                userId,
                bankName: context.bankName,
                accountName: context.accountName,
                executionTimeMs: executionTime,
                operation: toolId
            });

            logToolResult(toolId, result, executionTime);
            return result;

        } catch (error) {
            const executionTime = Date.now() - startTime;
            const userId = runtimeContext?.get('resourceId');
            const errorMessage = `Failed to update user bank details for ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`;

            logError('Failed to update user bank details', error as Error, {
                userId,
                bankName: context.bankName,
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
 * Export all tools as an array for easy import
 */
export const exchangeTools = [
    getCurrentRatesTool,
    createTransactionTool,
    updateTransactionStatusTool,
    getAdminBankDetailsTool,
    getUserTool,
    updateUserBankDetailsTool,
    imageAnalysisTool,
]; 