import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { fetchQuery, fetchMutation } from "convex/nextjs";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import crypto from 'crypto';
import { imageAnalysisTool } from './image-analysis-tool';

/**
 * Enhanced logging utility for exchange tools
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
 * Tool to get current exchange rates
 */
export const getCurrentRatesTool = createTool({
    id: 'get_current_rates',
    description: 'Get current exchange rates for currency pairs. If no currency pair is specified, returns all active rates.',
    inputSchema: z.object({
        currencyPair: z.string().optional().describe('Currency pair like USD_NGN, GBP_NGN, EUR_NGN'),
    }),
    execute: async ({ context }) => {
        const startTime = Date.now();

        logInfo('Getting current exchange rates', {
            currencyPair: context.currencyPair,
            operation: 'get_current_rates'
        });

        try {
            const rates = await fetchQuery(api.exchangeRates.getCurrentRates, { currencyPair: context.currencyPair });

            const executionTime = Date.now() - startTime;
            logSuccess('Exchange rates retrieved successfully', {
                currencyPair: context.currencyPair,
                ratesCount: Array.isArray(rates) ? rates.length : 1,
                executionTimeMs: executionTime,
                operation: 'get_current_rates'
            });

            return {
                success: true,
                data: rates,
            };
        } catch (error) {
            const executionTime = Date.now() - startTime;
            logError('Failed to get exchange rates', error as Error, {
                currencyPair: context.currencyPair,
                executionTimeMs: executionTime,
                operation: 'get_current_rates'
            });

            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get exchange rates',
            };
        }
    },
});

/**
 * Tool to validate if a negotiated rate is acceptable
 */
export const validateRateTool = createTool({
    id: 'validate_negotiated_rate',
    description: 'Check if a proposed/negotiated rate is within acceptable business boundaries',
    inputSchema: z.object({
        currencyPair: z.string().describe('Currency pair like USD_NGN'),
        proposedRate: z.number().describe('The rate proposed by customer or to offer'),
    }),
    execute: async ({ context }) => {
        const startTime = Date.now();

        logInfo('Validating negotiated rate', {
            currencyPair: context.currencyPair,
            proposedRate: context.proposedRate,
            operation: 'validate_negotiated_rate'
        });

        try {
            const validation = await fetchQuery(api.exchangeRates.validateNegotiatedRate, {
                currencyPair: context.currencyPair,
                proposedRate: context.proposedRate,
            });

            const executionTime = Date.now() - startTime;
            logSuccess('Rate validation completed', {
                currencyPair: context.currencyPair,
                proposedRate: context.proposedRate,
                isValid: validation.valid,
                withinBounds: validation.reason,
                executionTimeMs: executionTime,
                operation: 'validate_negotiated_rate'
            });

            return {
                success: true,
                data: validation,
            };
        } catch (error) {
            const executionTime = Date.now() - startTime;
            logError('Failed to validate rate', error as Error, {
                currencyPair: context.currencyPair,
                proposedRate: context.proposedRate,
                executionTimeMs: executionTime,
                operation: 'validate_negotiated_rate'
            });

            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to validate rate',
            };
        }
    },
});

/**
 * Tool to get conversation state
 */
export const getConversationStateTool = createTool({
    id: 'get_conversation_state',
    description: 'Get the current conversation state to understand where the user is in the exchange flow',
    inputSchema: z.object({
        conversationId: z.string().describe('The conversation ID'),
    }),
    execute: async ({ context }) => {
        const startTime = Date.now();

        logInfo('Getting conversation state', {
            conversationId: context.conversationId,
            operation: 'get_conversation_state'
        });

        try {
            const state = await fetchQuery(api.conversationStates.getConversationState, {
                conversationId: context.conversationId as Id<"conversations">,
            });

            const executionTime = Date.now() - startTime;
            logSuccess('Conversation state retrieved successfully', {
                conversationId: context.conversationId,
                currentFlow: state?.currentFlow,
                lastInteraction: state?.lastInteraction,
                awaitingResponse: state?.awaitingResponse,
                executionTimeMs: executionTime,
                operation: 'get_conversation_state'
            });

            return {
                success: true,
                data: state,
            };
        } catch (error) {
            const executionTime = Date.now() - startTime;
            logError('Failed to get conversation state', error as Error, {
                conversationId: context.conversationId,
                executionTimeMs: executionTime,
                operation: 'get_conversation_state'
            });

            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get conversation state',
            };
        }
    },
});

/**
 * Tool to update conversation state
 */
export const updateConversationStateTool = createTool({
    id: 'update_conversation_state',
    description: 'Update the conversation flow state to track user progress',
    inputSchema: z.object({
        conversationId: z.string().describe('The conversation ID'),
        currentFlow: z.string().describe('Current flow: welcome, currency_selection, rate_inquiry, negotiation, account_details, payment, verification, completed'),
        lastInteraction: z.string().describe('Last interaction type: text, button, list, image'),
        awaitingResponse: z.string().optional().describe('What type of response we are awaiting'),
        contextData: z.record(z.unknown()).optional().describe('Additional context data as key-value pairs'),
    }),
    execute: async ({ context }) => {
        const startTime = Date.now();

        logInfo('Updating conversation state', {
            conversationId: context.conversationId,
            currentFlow: context.currentFlow,
            lastInteraction: context.lastInteraction,
            awaitingResponse: context.awaitingResponse,
            hasContextData: !!context.contextData && Object.keys(context.contextData).length > 0,
            operation: 'update_conversation_state'
        });

        try {
            await fetchMutation(api.conversationStates.updateConversationFlow, {
                conversationId: context.conversationId as Id<"conversations">,
                currentFlow: context.currentFlow,
                lastInteraction: context.lastInteraction,
                awaitingResponse: context.awaitingResponse,
                contextData: context.contextData,
            });

            const executionTime = Date.now() - startTime;
            logSuccess('Conversation state updated successfully', {
                conversationId: context.conversationId,
                currentFlow: context.currentFlow,
                lastInteraction: context.lastInteraction,
                executionTimeMs: executionTime,
                operation: 'update_conversation_state'
            });

            return {
                success: true,
                message: 'Conversation state updated successfully',
            };
        } catch (error) {
            const executionTime = Date.now() - startTime;
            logError('Failed to update conversation state', error as Error, {
                conversationId: context.conversationId,
                currentFlow: context.currentFlow,
                executionTimeMs: executionTime,
                operation: 'update_conversation_state'
            });

            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to update conversation state',
            };
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
            operation: 'create_transaction'
        });

        try {
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
            logSuccess('Transaction created successfully', {
                transactionId: transaction,
                userId: context.userId,
                currencyPair: `${context.currencyFrom}_${context.currencyTo}`,
                amountFrom: context.amountFrom,
                amountTo: context.amountTo,
                negotiatedRate: context.negotiatedRate,
                duplicateCheckHash,
                executionTimeMs: executionTime,
                operation: 'create_transaction'
            });

            return {
                success: true,
                data: transaction,
                transactionId: transaction,
            };
        } catch (error) {
            const executionTime = Date.now() - startTime;
            logError('Failed to create transaction', error as Error, {
                userId: context.userId,
                conversationId: context.conversationId,
                currencyPair: `${context.currencyFrom}_${context.currencyTo}`,
                amountFrom: context.amountFrom,
                negotiatedRate: context.negotiatedRate,
                executionTimeMs: executionTime,
                operation: 'create_transaction'
            });

            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create transaction',
            };
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

        logInfo('Updating transaction status', {
            transactionId: context.transactionId,
            newStatus: context.status,
            hasPaymentReference: !!context.paymentReference,
            hasReceiptImage: !!context.receiptImageUrl,
            hasExtractedDetails: !!context.extractedDetails && Object.keys(context.extractedDetails).length > 0,
            operation: 'update_transaction_status'
        });

        try {
            await fetchMutation(api.transactions.updateTransactionStatus, {
                transactionId: context.transactionId as Id<"transactions">,
                status: context.status,
                paymentReference: context.paymentReference,
                receiptImageUrl: context.receiptImageUrl,
                extractedDetails: context.extractedDetails,
            });

            const executionTime = Date.now() - startTime;
            logSuccess('Transaction status updated successfully', {
                transactionId: context.transactionId,
                newStatus: context.status,
                paymentReference: context.paymentReference,
                executionTimeMs: executionTime,
                operation: 'update_transaction_status'
            });

            return {
                success: true,
                message: `Transaction status updated to ${context.status}`,
            };
        } catch (error) {
            const executionTime = Date.now() - startTime;
            logError('Failed to update transaction status', error as Error, {
                transactionId: context.transactionId,
                newStatus: context.status,
                executionTimeMs: executionTime,
                operation: 'update_transaction_status'
            });

            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to update transaction status',
            };
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

        logInfo('Checking for duplicate transaction', {
            duplicateCheckHash: context.duplicateCheckHash,
            operation: 'check_duplicate_transaction'
        });

        try {
            const duplicate = await fetchQuery(api.transactions.checkDuplicateTransaction, {
                duplicateCheckHash: context.duplicateCheckHash,
            });

            const executionTime = Date.now() - startTime;
            logSuccess('Duplicate check completed', {
                duplicateCheckHash: context.duplicateCheckHash,
                isDuplicate: !!duplicate,
                duplicateTransactionId: duplicate?._id,
                executionTimeMs: executionTime,
                operation: 'check_duplicate_transaction'
            });

            return {
                success: true,
                isDuplicate: !!duplicate,
                data: duplicate,
            };
        } catch (error) {
            const executionTime = Date.now() - startTime;
            logError('Failed to check for duplicates', error as Error, {
                duplicateCheckHash: context.duplicateCheckHash,
                executionTimeMs: executionTime,
                operation: 'check_duplicate_transaction'
            });

            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to check for duplicates',
            };
        }
    },
});

/**
 * Tool to get user's transaction history
 */
export const getUserTransactionsTool = createTool({
    id: 'get_user_transactions',
    description: 'Get transaction history for a user',
    inputSchema: z.object({
        userId: z.string().describe('User ID'),
        limit: z.number().optional().describe('Number of transactions to retrieve'),
        status: z.string().optional().describe('Filter by status'),
    }),
    execute: async ({ context }) => {
        const startTime = Date.now();

        logInfo('Getting user transaction history', {
            userId: context.userId,
            limit: context.limit,
            statusFilter: context.status,
            operation: 'get_user_transactions'
        });

        try {
            const transactions = await fetchQuery(api.transactions.getUserTransactions, {
                userId: context.userId as Id<"users">,
                limit: context.limit,
                status: context.status,
            });

            const executionTime = Date.now() - startTime;
            logSuccess('User transactions retrieved successfully', {
                userId: context.userId,
                transactionsCount: transactions.length,
                limit: context.limit,
                statusFilter: context.status,
                executionTimeMs: executionTime,
                operation: 'get_user_transactions'
            });

            return {
                success: true,
                data: transactions,
            };
        } catch (error) {
            const executionTime = Date.now() - startTime;
            logError('Failed to get user transactions', error as Error, {
                userId: context.userId,
                limit: context.limit,
                statusFilter: context.status,
                executionTimeMs: executionTime,
                operation: 'get_user_transactions'
            });

            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get user transactions',
            };
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

        logInfo('Generating duplicate detection hash', {
            userId: context.userId,
            amount: context.amount,
            hasReference: !!context.reference,
            hasTimestamp: !!context.timestamp,
            operation: 'generate_duplicate_hash'
        });

        try {
            const hashInput = `${context.userId}-${context.amount}-${context.reference || ''}-${context.timestamp || Date.now()}`;
            const hash = crypto.createHash('sha256').update(hashInput).digest('hex');

            const executionTime = Date.now() - startTime;
            logSuccess('Duplicate detection hash generated', {
                userId: context.userId,
                amount: context.amount,
                hash: hash.substring(0, 16) + '...', // Log partial hash for security
                hashLength: hash.length,
                executionTimeMs: executionTime,
                operation: 'generate_duplicate_hash'
            });

            return {
                success: true,
                hash,
                hashInput,
            };
        } catch (error) {
            const executionTime = Date.now() - startTime;
            logError('Failed to generate hash', error as Error, {
                userId: context.userId,
                amount: context.amount,
                executionTimeMs: executionTime,
                operation: 'generate_duplicate_hash'
            });

            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to generate hash',
            };
        }
    },
});

/**
 * Tool to calculate exchange amount
 */
export const calculateExchangeAmountTool = createTool({
    id: 'calculate_exchange_amount',
    description: 'Calculate the amount to receive based on exchange rate',
    inputSchema: z.object({
        amountFrom: z.number().describe('Amount to exchange from'),
        rate: z.number().describe('Exchange rate'),
        currencyFrom: z.string().describe('Source currency'),
        currencyTo: z.string().describe('Target currency'),
    }),
    execute: async ({ context }) => {
        const startTime = Date.now();

        logInfo('Calculating exchange amount', {
            amountFrom: context.amountFrom,
            rate: context.rate,
            currencyFrom: context.currencyFrom,
            currencyTo: context.currencyTo,
            operation: 'calculate_exchange_amount'
        });

        try {
            const amountTo = context.amountFrom * context.rate;
            const formatted = {
                amountFrom: context.amountFrom,
                amountTo: Math.round(amountTo * 100) / 100, // Round to 2 decimal places
                rate: context.rate,
                currencyFrom: context.currencyFrom,
                currencyTo: context.currencyTo,
                calculation: `${context.amountFrom} ${context.currencyFrom} × ${context.rate} = ${amountTo.toLocaleString()} ${context.currencyTo}`,
            };

            const executionTime = Date.now() - startTime;
            logSuccess('Exchange amount calculated successfully', {
                ...formatted,
                executionTimeMs: executionTime,
                operation: 'calculate_exchange_amount'
            });

            return {
                success: true,
                data: formatted,
            };
        } catch (error) {
            const executionTime = Date.now() - startTime;
            logError('Failed to calculate exchange amount', error as Error, {
                amountFrom: context.amountFrom,
                rate: context.rate,
                currencyPair: `${context.currencyFrom}_${context.currencyTo}`,
                executionTimeMs: executionTime,
                operation: 'calculate_exchange_amount'
            });

            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to calculate exchange amount',
            };
        }
    },
});

/**
 * Tool to suggest counter offer in negotiation
 */
export const suggestCounterOfferTool = createTool({
    id: 'suggest_counter_offer',
    description: 'Suggest a counter offer during rate negotiation based on business rules',
    inputSchema: z.object({
        currencyPair: z.string().describe('Currency pair'),
        customerProposedRate: z.number().describe('Rate proposed by customer'),
        transactionAmount: z.number().describe('Transaction amount'),
        userHistory: z.object({
            totalTransactions: z.number().optional(),
            totalVolume: z.number().optional(),
            averageTransactionSize: z.number().optional(),
            loyaltyTier: z.string().optional()
        }).optional().describe('User transaction history for loyalty consideration'),
    }),
    execute: async ({ context }) => {
        const startTime = Date.now();

        logInfo('Suggesting counter offer for rate negotiation', {
            currencyPair: context.currencyPair,
            customerProposedRate: context.customerProposedRate,
            transactionAmount: context.transactionAmount,
            hasUserHistory: !!context.userHistory,
            operation: 'suggest_counter_offer'
        });

        try {
            // Get current rate boundaries
            const rateInfo = await fetchQuery(api.exchangeRates.getCurrentRates, { currencyPair: context.currencyPair });

            if (!rateInfo || Array.isArray(rateInfo)) {
                logError('Currency pair not found for counter offer', new Error('Currency pair not found'), {
                    currencyPair: context.currencyPair,
                    operation: 'suggest_counter_offer'
                });

                return {
                    success: false,
                    error: 'Currency pair not found',
                };
            }

            const { minRate, maxRate, currentMarketRate } = rateInfo;

            // Business logic for counter offers
            let counterOffer = context.customerProposedRate;
            let strategy = 'accept';
            let reasoning = '';

            if (context.customerProposedRate < minRate) {
                // Too low - offer minimum or slightly above
                counterOffer = minRate + (maxRate - minRate) * 0.1; // 10% above minimum
                strategy = 'counter_low';
                reasoning = `Your proposed rate is below our minimum. I can offer ${counterOffer}`;
            } else if (context.customerProposedRate > maxRate) {
                // Customer asking for too high rate - they might be confused
                counterOffer = maxRate;
                strategy = 'clarify_high';
                reasoning = `I think there might be confusion. Our best rate is ${counterOffer}`;
            } else if (context.customerProposedRate >= minRate && context.customerProposedRate <= maxRate) {
                // Within bounds - accept or negotiate based on amount and history
                if (context.transactionAmount >= 1000) { // Volume bonus
                    counterOffer = Math.min(context.customerProposedRate, maxRate);
                    strategy = 'accept_volume';
                    reasoning = `For ${context.transactionAmount}, I can do ${counterOffer}`;
                } else {
                    // Small transaction - meet halfway
                    counterOffer = (context.customerProposedRate + currentMarketRate) / 2;
                    strategy = 'meet_halfway';
                    reasoning = `How about we meet in the middle at ${counterOffer}?`;
                }
            }

            const result = {
                counterOffer: Math.round(counterOffer * 10000) / 10000, // Round to 4 decimal places
                strategy,
                reasoning,
                withinBounds: counterOffer >= minRate && counterOffer <= maxRate,
                marketInfo: {
                    minRate,
                    maxRate,
                    currentMarketRate,
                    customerProposedRate: context.customerProposedRate,
                },
            };

            const executionTime = Date.now() - startTime;
            logSuccess('Counter offer suggestion generated', {
                currencyPair: context.currencyPair,
                customerProposedRate: context.customerProposedRate,
                counterOffer: result.counterOffer,
                strategy: result.strategy,
                withinBounds: result.withinBounds,
                executionTimeMs: executionTime,
                operation: 'suggest_counter_offer'
            });

            return {
                success: true,
                data: result,
            };
        } catch (error) {
            const executionTime = Date.now() - startTime;
            logError('Failed to suggest counter offer', error as Error, {
                currencyPair: context.currencyPair,
                customerProposedRate: context.customerProposedRate,
                transactionAmount: context.transactionAmount,
                executionTimeMs: executionTime,
                operation: 'suggest_counter_offer'
            });

            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to suggest counter offer',
            };
        }
    },
});

/**
 * Export all tools as an array for easy import
 */
export const exchangeTools = [
    getCurrentRatesTool,
    validateRateTool,
    getConversationStateTool,
    updateConversationStateTool,
    createTransactionTool,
    updateTransactionStatusTool,
    checkDuplicateTool,
    getUserTransactionsTool,
    generateDuplicateHashTool,
    calculateExchangeAmountTool,
    suggestCounterOfferTool,
    imageAnalysisTool,
]; 