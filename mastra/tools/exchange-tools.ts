import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { fetchQuery, fetchMutation } from "convex/nextjs";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import crypto from 'crypto';

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
        try {
            const rates = await fetchQuery(api.exchangeRates.getCurrentRates, { currencyPair: context.currencyPair });
            return {
                success: true,
                data: rates,
            };
        } catch (error) {
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
        try {
            const validation = await fetchQuery(api.exchangeRates.validateNegotiatedRate, {
                currencyPair: context.currencyPair,
                proposedRate: context.proposedRate,
            });
            return {
                success: true,
                data: validation,
            };
        } catch (error) {
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
        try {
            const state = await fetchQuery(api.conversationStates.getConversationState, {
                conversationId: context.conversationId as Id<"conversations">,
            });
            return {
                success: true,
                data: state,
            };
        } catch (error) {
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
        contextData: z.any().optional().describe('Additional context data'),
    }),
    execute: async ({ context }) => {
        try {
            await fetchMutation(api.conversationStates.updateConversationFlow, {
                conversationId: context.conversationId as Id<"conversations">,
                currentFlow: context.currentFlow,
                lastInteraction: context.lastInteraction,
                awaitingResponse: context.awaitingResponse,
                contextData: context.contextData,
            });
            return {
                success: true,
                message: 'Conversation state updated successfully',
            };
        } catch (error) {
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
        negotiationHistory: z.array(z.any()).optional().describe('History of rate negotiations'),
    }),
    execute: async ({ context }) => {
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

            return {
                success: true,
                data: transaction,
                transactionId: transaction,
            };
        } catch (error) {
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
        extractedDetails: z.any().optional().describe('OCR extracted details from receipt'),
    }),
    execute: async ({ context }) => {
        try {
            await fetchMutation(api.transactions.updateTransactionStatus, {
                transactionId: context.transactionId as Id<"transactions">,
                status: context.status,
                paymentReference: context.paymentReference,
                receiptImageUrl: context.receiptImageUrl,
                extractedDetails: context.extractedDetails,
            });
            return {
                success: true,
                message: `Transaction status updated to ${context.status}`,
            };
        } catch (error) {
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
        try {
            const duplicate = await fetchQuery(api.transactions.checkDuplicateTransaction, {
                duplicateCheckHash: context.duplicateCheckHash,
            });
            return {
                success: true,
                isDuplicate: !!duplicate,
                data: duplicate,
            };
        } catch (error) {
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
        try {
            const transactions = await fetchQuery(api.transactions.getUserTransactions, {
                userId: context.userId as Id<"users">,
                limit: context.limit,
                status: context.status,
            });
            return {
                success: true,
                data: transactions,
            };
        } catch (error) {
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
        try {
            const hashInput = `${context.userId}-${context.amount}-${context.reference || ''}-${context.timestamp || Date.now()}`;
            const hash = crypto.createHash('sha256').update(hashInput).digest('hex');

            return {
                success: true,
                hash,
                hashInput,
            };
        } catch (error) {
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

            return {
                success: true,
                data: formatted,
            };
        } catch (error) {
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
        userHistory: z.any().optional().describe('User transaction history for loyalty consideration'),
    }),
    execute: async ({ context }) => {
        try {
            // Get current rate boundaries
            const rateInfo = await fetchQuery(api.exchangeRates.getCurrentRates, { currencyPair: context.currencyPair });

            if (!rateInfo || Array.isArray(rateInfo)) {
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

            return {
                success: true,
                data: {
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
                },
            };
        } catch (error) {
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
]; 