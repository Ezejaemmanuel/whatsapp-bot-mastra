import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { fetchQuery, fetchMutation } from "convex/nextjs";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import crypto from 'crypto';
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
    description: 'Create a new exchange transaction when user agrees to terms',
    inputSchema: z.object({
        userId: z.string().describe('User ID'),
        conversationId: z.string().describe('Conversation ID'),
        currencyFrom: z.string().describe('Source currency (USD, GBP, EUR, etc.)'),
        currencyTo: z.string().describe('Target currency (NGN, etc.)'),
        amountFrom: z.number().describe('Amount to exchange from'),
        amountTo: z.number().describe('Amount to receive'),
        negotiatedRate: z.number().describe('Final negotiated rate'),
        customerBankName: z.string().optional().describe('Customer bank name'),
        customerAccountNumber: z.string().optional().describe('Customer account number'),
        customerAccountName: z.string().optional().describe('Customer account name'),
        negotiationHistory: z.array(z.object({
            timestamp: z.number().optional(),
            customerRate: z.number().optional(),
            counterOffer: z.number().optional(),
            message: z.string().optional(),
            strategy: z.string().optional()
        })).optional().describe('History of rate negotiations'),
    }),
    execute: async ({ context }) => {
        const startTime = Date.now();
        const toolId = 'create_transaction';

        logToolCall(toolId, context);

        try {
            logInfo('Creating new transaction', {
                userId: context.userId,
                conversationId: context.conversationId,
                currencyFrom: context.currencyFrom,
                currencyTo: context.currencyTo,
                amountFrom: context.amountFrom,
                amountTo: context.amountTo,
                negotiatedRate: context.negotiatedRate,
                hasCustomerBank: !!context.customerBankName,
                hasNegotiationHistory: !!context.negotiationHistory && context.negotiationHistory.length > 0,
                operation: toolId
            });

            // Generate duplicate check hash
            const duplicateCheckHash = crypto
                .createHash('sha256')
                .update(`${context.userId}-${context.amountFrom}-${context.negotiatedRate}-${Date.now()}`)
                .digest('hex');

            const transaction = await fetchMutation(api.transactions.createTransaction, {
                userId: context.userId as Id<"users">,
                conversationId: context.conversationId as Id<"conversations">,
                currencyFrom: context.currencyFrom,
                currencyTo: context.currencyTo,
                amountFrom: context.amountFrom,
                amountTo: context.amountTo,
                negotiatedRate: context.negotiatedRate,
                customerBankName: context.customerBankName,
                customerAccountNumber: context.customerAccountNumber,
                customerAccountName: context.customerAccountName,
                duplicateCheckHash,
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
                userId: context.userId,
                currencyPair: `${context.currencyFrom}_${context.currencyTo}`,
                amountFrom: context.amountFrom,
                amountTo: context.amountTo,
                negotiatedRate: context.negotiatedRate,
                duplicateCheckHash,
                executionTimeMs: executionTime,
                operation: toolId
            });

            logToolResult(toolId, result, executionTime);
            return result;

        } catch (error) {
            const executionTime = Date.now() - startTime;
            const errorMessage = `Failed to create transaction for user ${context.userId}: ${error instanceof Error ? error.message : 'Unknown error'}`;

            logError('Failed to create transaction', error as Error, {
                userId: context.userId,
                conversationId: context.conversationId,
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
 * Tool to check for duplicate transactions
 */
export const checkDuplicateTool = createTool({
    id: 'check_duplicate_transaction',
    description: 'Check if a transaction might be a duplicate based on hash',
    inputSchema: z.object({
        duplicateCheckHash: z.string().describe('Hash to check for duplicates'),
    }),
    execute: async ({ context }) => {
        const startTime = Date.now();
        const toolId = 'check_duplicate_transaction';

        logToolCall(toolId, context);

        try {
            logInfo('Checking for duplicate transaction', {
                duplicateCheckHash: context.duplicateCheckHash,
                operation: toolId
            });

            const duplicate = await fetchQuery(api.transactions.checkDuplicateTransaction, {
                duplicateCheckHash: context.duplicateCheckHash,
            });

            const executionTime = Date.now() - startTime;

            const result = {
                success: true,
                isDuplicate: !!duplicate,
                data: duplicate,
                message: duplicate ?
                    `Duplicate transaction found: ${duplicate._id}` :
                    'No duplicate transaction found'
            };

            logSuccess('Duplicate check completed', {
                duplicateCheckHash: context.duplicateCheckHash,
                isDuplicate: !!duplicate,
                duplicateTransactionId: duplicate?._id,
                executionTimeMs: executionTime,
                operation: toolId
            });

            logToolResult(toolId, result, executionTime);
            return result;

        } catch (error) {
            const executionTime = Date.now() - startTime;
            const errorMessage = `Failed to check for duplicates with hash ${context.duplicateCheckHash}: ${error instanceof Error ? error.message : 'Unknown error'}`;

            logError('Failed to check for duplicates', error as Error, {
                duplicateCheckHash: context.duplicateCheckHash,
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
 * Tool to generate duplicate detection hash
 */
export const generateDuplicateHashTool = createTool({
    id: 'generate_duplicate_hash',
    description: 'Generate a hash for duplicate detection based on transaction details',
    inputSchema: z.object({
        userId: z.string().describe('User ID'),
        amount: z.number().describe('Transaction amount'),
        reference: z.string().optional().describe('Payment reference'),
        timestamp: z.number().optional().describe('Transaction timestamp'),
    }),
    execute: async ({ context }) => {
        const startTime = Date.now();
        const toolId = 'generate_duplicate_hash';

        logToolCall(toolId, context);

        try {
            logInfo('Generating duplicate detection hash', {
                userId: context.userId,
                amount: context.amount,
                hasReference: !!context.reference,
                hasTimestamp: !!context.timestamp,
                operation: toolId
            });

            const hashInput = `${context.userId}-${context.amount}-${context.reference || ''}-${context.timestamp || Date.now()}`;
            const hash = crypto.createHash('sha256').update(hashInput).digest('hex');

            const executionTime = Date.now() - startTime;

            const result = {
                success: true,
                hash,
                hashInput,
                message: `Hash generated successfully for user ${context.userId}`
            };

            logSuccess('Duplicate detection hash generated', {
                userId: context.userId,
                amount: context.amount,
                hash: hash.substring(0, 16) + '...', // Log partial hash for security
                hashLength: hash.length,
                executionTimeMs: executionTime,
                operation: toolId
            });

            logToolResult(toolId, result, executionTime);
            return result;

        } catch (error) {
            const executionTime = Date.now() - startTime;
            const errorMessage = `Failed to generate hash for user ${context.userId}: ${error instanceof Error ? error.message : 'Unknown error'}`;

            logError('Failed to generate hash', error as Error, {
                userId: context.userId,
                amount: context.amount,
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
    checkDuplicateTool,
    generateDuplicateHashTool,
    imageAnalysisTool,
]; 