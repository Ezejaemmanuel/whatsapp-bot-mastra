import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { createTool } from "@mastra/core";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import z from "zod";
import { logToolCall, logInfo, logSuccess, logToolResult, logError, logToolError } from "./utils";









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

        // Extract context data using new consistent naming
        const phoneNumber = runtimeContext?.get('phoneNumber') as string;
        const userId = runtimeContext?.get('userId') as string;
        const conversationId = runtimeContext?.get('conversationId') as string;

        // Send debug message about tool start
        if (phoneNumber) {
            // await sendDebugMessage(phoneNumber, 'UPDATE USER BANK DETAILS TOOL STARTED', {
            //     toolId,
            //     startTime: new Date(startTime).toISOString(),
            //     bankName: context.bankName,
            //     accountName: context.accountName,
            //     accountNumberMasked: context.accountNumber.slice(0, 4) + '****',
            //     operation: 'Updating customer bank account details',
            //     userId,
            //     conversationId
            // });
        }

        logToolCall(toolId, context);

        try {
            // Validate that we have the required context
            if (!userId) {
                const errorMsg = 'Unable to extract userId from runtime context. Make sure the agent is called with proper context configuration.';

                if (phoneNumber) {
                    // await sendDebugMessage(phoneNumber, 'USER ID EXTRACTION FAILED', {
                    //     error: errorMsg,
                    //     runtimeContextAvailable: !!runtimeContext,
                    //     userId: userId || 'missing',
                    //     conversationId: conversationId || 'missing',
                    //     phoneNumber: phoneNumber || 'missing'
                    // });
                }

                throw new Error(errorMsg);
            }

            // Send debug message about extracted context
            if (phoneNumber) {
                // await sendDebugMessage(phoneNumber, 'USER CONTEXT EXTRACTED', {
                //     userId,
                //     conversationId,
                //     phoneNumber,
                //     userIdType: typeof userId,
                //     operation: 'Ready to update bank details'
                // });
            }



            // Send debug message about database mutation
            if (phoneNumber) {
                // await sendDebugMessage(phoneNumber, 'DATABASE MUTATION STARTED', {
                //     operation: 'api.users.updateUserBankDetails',
                //     userId,
                //     bankName: context.bankName,
                //     accountName: context.accountName,
                //     accountNumberMasked: context.accountNumber.slice(0, 4) + '****'
                // });
            }

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

            // Send debug message with successful result
            if (phoneNumber) {
                //  await sendDebugMessage(phoneNumber, 'BANK DETAILS UPDATED SUCCESSFULLY', {
                //     success: true,
                //     userId,
                //     bankName: context.bankName,
                //     accountName: context.accountName,
                //     executionTimeMs: executionTime,
                //     message: result.message
                // });

                // Send complete result
                // await sendDebugMessage(phoneNumber, 'COMPLETE UPDATE RESULT', result);
            }

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
            const errorMessage = `Failed to update user bank details for ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`;

            // Send debug message about error
            // if (phoneNumber) {
            //     await sendDebugMessage(phoneNumber, 'UPDATE BANK DETAILS ERROR', {
            //         error: errorMessage,
            //         errorType: error instanceof Error ? error.constructor.name : typeof error,
            //         userId,
            //         bankName: context.bankName,
            //         executionTimeMs: executionTime,
            //         stack: error instanceof Error ? error.stack : undefined
            //     });
            // }

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

        // Send debug message about tool start
        // if (phoneNumber) {
        //     await sendDebugMessage(phoneNumber, 'GET USER TRANSACTIONS TOOL STARTED', {
        //         toolId,
        //         startTime: new Date(startTime).toISOString(),
        //         limit: context.limit || 10,
        //         statusFilter: context.status || 'all',
        //         operation: 'Fetching user transaction history',
        //         userId,
        //         conversationId
        //     });
        // }

        logToolCall(toolId, context);

        try {
            // Validate that we have the required context
            if (!userId) {
                const errorMsg = 'Unable to extract userId from runtime context. Make sure the agent is called with proper context configuration.';

                if (phoneNumber) {
                    // await sendDebugMessage(phoneNumber, 'USER ID EXTRACTION FAILED', {
                    //     error: errorMsg,
                    //     runtimeContextAvailable: !!runtimeContext,
                    //     userId: userId || 'missing',
                    //     conversationId: conversationId || 'missing',
                    //     phoneNumber: phoneNumber || 'missing'
                    // });
                }

                throw new Error(errorMsg);
            }

            // Send debug message about query parameters
            if (phoneNumber) {
                // await sendDebugMessage(phoneNumber, 'TRANSACTION QUERY PARAMETERS', {
                //     userId,
                //     limit: context.limit || 10,
                //     statusFilter: context.status || 'all',
                //     hasStatusFilter: !!context.status
                // });
            }

            logInfo('Getting user transactions', {
                userId,
                limit: context.limit || 10,
                statusFilter: context.status || 'all',
                operation: toolId
            });

            // Send debug message about database query
            // if (phoneNumber) {
            //     await sendDebugMessage(phoneNumber, 'DATABASE QUERY STARTED', {
            //         operation: 'api.transactions.getUserTransactions',
            //         userId,
            //         limit: context.limit || 10,
            //         status: context.status || 'all transactions'
            //     });
            // }

            const transactions = await fetchQuery(api.transactions.getUserTransactions, {
                userId: userId as Id<"users">,
                limit: context.limit || 10,
                status: context.status,
            });

            const executionTime = Date.now() - startTime;

            const result = {
                success: true,
                data: transactions,
                totalTransactions: transactions.length,
                transactions: transactions.map(tx => ({
                    id: tx._id,
                    status: tx.status,
                    currencyFrom: tx.currencyFrom,
                    currencyTo: tx.currencyTo,
                    amountFrom: tx.amountFrom,
                    amountTo: tx.amountTo,
                    negotiatedRate: tx.negotiatedRate,
                    createdAt: tx.createdAt,
                    updatedAt: tx.updatedAt,
                    paymentReference: tx.paymentReference
                })),
                message: `Found ${transactions.length} transaction(s) for the user`,
                workingMemoryUpdate: transactions.length > 0 ? `Available transaction IDs: ${transactions.map(tx => tx._id).join(', ')}` : 'No transactions found for this user'
            };

            // Send debug message with results
            if (phoneNumber) {
                // await sendDebugMessage(phoneNumber, 'USER TRANSACTIONS RETRIEVED', {
                //     success: true,
                //     totalTransactions: transactions.length,
                //     statusFilter: context.status || 'all',
                //     executionTimeMs: executionTime,
                //     transactionIds: transactions.map(tx => tx._id).slice(0, 5), // First 5 IDs
                //     transactionStatuses: transactions.map(tx => `${tx._id}: ${tx.status}`).slice(0, 5)
                // }); */

                // // Send complete transaction data
                // await sendDebugMessage(phoneNumber, 'COMPLETE TRANSACTIONS DATA', result);
            }

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

            // Send debug message about error
            if (phoneNumber) {
                // await sendDebugMessage(phoneNumber, 'GET USER TRANSACTIONS ERROR', {
                //     error: errorMessage,
                //     errorType: error instanceof Error ? error.constructor.name : typeof error,
                //     userId,
                //     limit: context.limit || 10,
                //     statusFilter: context.status || 'all',
                //     executionTimeMs: executionTime,
                //     stack: error instanceof Error ? error.stack : undefined
                // });
            }

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

        // Send debug message about tool start
        if (phoneNumber) {
            // await sendDebugMessage(phoneNumber, 'GET LATEST USER TRANSACTION TOOL STARTED', {
            //     toolId,
            //     startTime: new Date(startTime).toISOString(),
            //     operation: 'Fetching most recent user transaction',
            //     userId,
            //     // conversationId
            // });
        }

        logToolCall(toolId, context);

        try {
            // Validate that we have the required context
            if (!userId) {
                const errorMsg = 'Unable to extract userId from runtime context. Make sure the agent is called with proper context configuration.';

                if (phoneNumber) {
                    // await sendDebugMessage(phoneNumber, 'USER ID EXTRACTION FAILED', {
                    // error: errorMsg,
                    //     runtimeContextAvailable: !!runtimeContext,
                    //     userId: userId || 'missing',
                    //     conversationId: conversationId || 'missing',
                    //     phoneNumber: phoneNumber || 'missing'
                    // });
                }

                throw new Error(errorMsg);
            }

            // Send debug message about query parameters
            if (phoneNumber) {
                // await sendDebugMessage(phoneNumber, 'LATEST TRANSACTION QUERY SETUP', {
                //     userId,
                //     limit: 1,
                //     operation: 'Getting only the most recent transaction'
                // });
            }

            logInfo('Getting latest user transaction', {
                userId,
                operation: toolId
            });

            // Send debug message about database query
            if (phoneNumber) {
                // await sendDebugMessage(phoneNumber, 'DATABASE QUERY STARTED', {
                //     operation: 'api.transactions.getUserTransactions',
                //     userId,
                //     limit: 1,
                //     purpose: 'Get latest transaction only'
                // });
            }

            const transactions = await fetchQuery(api.transactions.getUserTransactions, {
                userId: userId as Id<"users">,
                limit: 1, // Get only the latest transaction
            });

            const executionTime = Date.now() - startTime;

            if (transactions.length === 0) {
                const result = {
                    success: true,
                    hasTransaction: false,
                    message: 'No transactions found for this user',
                    workingMemoryUpdate: 'No transaction ID to store - user has no transactions yet'
                };

                // Send debug message for no transactions found
                if (phoneNumber) {
                    // await sendDebugMessage(phoneNumber, 'NO TRANSACTIONS FOUND', {
                    //     success: true,
                    //     hasTransaction: false,
                    //     userId,
                    //     executionTimeMs: executionTime,
                    //     message: result.message
                    // });

                    // // Send complete result
                    // await sendDebugMessage(phoneNumber, 'COMPLETE NO TRANSACTION RESULT', result);
                }

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
                success: true,
                hasTransaction: true,
                data: latestTransaction,
                transaction: {
                    id: latestTransaction._id,
                    status: latestTransaction.status,
                    currencyFrom: latestTransaction.currencyFrom,
                    currencyTo: latestTransaction.currencyTo,
                    amountFrom: latestTransaction.amountFrom,
                    amountTo: latestTransaction.amountTo,
                    negotiatedRate: latestTransaction.negotiatedRate,
                    createdAt: latestTransaction.createdAt,
                    updatedAt: latestTransaction.updatedAt,
                    paymentReference: latestTransaction.paymentReference
                },
                message: `Latest transaction found with status: ${latestTransaction.status}`,
                workingMemoryUpdate: `Update your working memory with the latest transaction ID: ${latestTransaction._id}`
            };

            // Send debug message with latest transaction
            if (phoneNumber) {
                // await sendDebugMessage(phoneNumber, 'LATEST TRANSACTION FOUND', {
                //     success: true,
                //     hasTransaction: true,
                //     transactionId: latestTransaction._id,
                //     status: latestTransaction.status,
                //     currencyPair: `${latestTransaction.currencyFrom}_${latestTransaction.currencyTo}`,
                //     amountFrom: latestTransaction.amountFrom,
                //     amountTo: latestTransaction.amountTo,
                //     negotiatedRate: latestTransaction.negotiatedRate,
                //     createdAt: latestTransaction.createdAt,
                //     executionTimeMs: executionTime,
                //     workingMemoryUpdate: result.workingMemoryUpdate
                // });

                // // Send complete transaction data
                // await sendDebugMessage(phoneNumber, 'COMPLETE LATEST TRANSACTION DATA', result);
            }

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

            // Send debug message about error
            if (phoneNumber) {
                // await sendDebugMessage(phoneNumber, 'GET LATEST TRANSACTION ERROR', {
                //     error: errorMessage,
                //     errorType: error instanceof Error ? error.constructor.name : typeof error,
                //     userId,
                //     executionTimeMs: executionTime,
                //     stack: error instanceof Error ? error.stack : undefined
                // });
            }

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

        // Send debug message about tool start
        if (phoneNumber) {
            // await sendDebugMessage(phoneNumber, 'GET ADMIN BANK DETAILS TOOL STARTED', {
            //     toolId,
            //     startTime: new Date(startTime).toISOString(),
            //     operation: 'Fetching admin bank details for customer payment',
            //     userId,
            //     conversationId
            // });
        }

        logToolCall(toolId, context);

        try {
            logInfo('Getting admin bank details for customer payment', {
                operation: toolId
            });

            // Send debug message about database query
            if (phoneNumber) {
                // await sendDebugMessage(phoneNumber, 'DATABASE QUERY STARTED', {
                //     operation: 'api.adminBankDetails.getAllAdminBankDetails',
                //     purpose: 'Getting all admin bank accounts for customer payments'
                // });
            }

            const allAdminBankDetails = await fetchQuery(api.adminBankDetails.getAllAdminBankDetails, {});

            if (!allAdminBankDetails || allAdminBankDetails.length === 0) {
                const errorMsg = 'No active admin bank details found. Please contact support.';

                if (phoneNumber) {
                    // await sendDebugMessage(phoneNumber, 'NO ADMIN BANK DETAILS FOUND', {
                    //     error: errorMsg,
                    //     cause: 'No default admin bank account configured in database'
                    // });
                }

                throw new Error(errorMsg);
            }

            const executionTime = Date.now() - startTime;

            const result = {
                success: true,
                data: allAdminBankDetails,
                message: `All active admin bank details retrieved successfully. The user should be asked to send payment to any of them.`
            };

            // Send debug message with results (masked for security)
            if (phoneNumber) {
                // await sendDebugMessage(phoneNumber, 'ADMIN BANK DETAILS RETRIEVED', {
                //     success: true,
                //     count: allAdminBankDetails.length,
                //     executionTimeMs: executionTime
                // });

                // Send complete bank details (for debugging purposes)
                // await sendDebugMessage(phoneNumber, 'COMPLETE ADMIN BANK DETAILS', result);
            }

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

            // Send debug message about error
            // if (phoneNumber) {
            //     await sendDebugMessage(phoneNumber, 'GET ADMIN BANK DETAILS ERROR', {
            //         error: errorMessage,
            //         errorType: error instanceof Error ? error.constructor.name : typeof error,
            //         executionTimeMs: executionTime,
            //         stack: error instanceof Error ? error.stack : undefined
            //     });
            // }

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

        // Send debug message about tool start
        if (phoneNumber) {
            // await sendDebugMessage(phoneNumber, 'GET USER TOOL STARTED', {
            //     toolId,

            //     // conversationId
            // });
        }

        logToolCall(toolId, context);

        try {
            // Validate that we have the required context
            if (!userId) {
                const errorMsg = 'Unable to extract userId from runtime context. Make sure the agent is called with proper context configuration.';

                if (phoneNumber) {
                    // await sendDebugMessage(phoneNumber, 'USER ID EXTRACTION FAILED', {
                    //     error: errorMsg,
                    //     runtimeContextAvailable: !!runtimeContext,
                    //     userId: userId || 'missing',
                    //     conversationId: conversationId || 'missing',
                    //     phoneNumber: phoneNumber || 'missing'
                    // });
                }

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

            // Send debug message with user info (masked bank details for security)
            if (phoneNumber) {
                // await sendDebugMessage(phoneNumber, 'USER INFORMATION RETRIEVED', {
                //     success: true,
                //     userId: user._id,
                //     whatsappId: user.whatsappId,
                //     profileName: user.profileName,
                //     phoneNumber: user.phoneNumber,
                //     hasBankDetails: !!(user.bankName && user.accountNumber && user.accountName),
                //     bankDetailsMasked: user.accountNumber ? {
                //         bankName: user.bankName,
                //         accountNumberMasked: user.accountNumber.slice(0, 4) + '****',
                //         accountName: user.accountName
                //     } : null,
                // executionTimeMs: executionTime
                // });

                // Send complete user data for debugging
                // await sendDebugMessage(phoneNumber, 'COMPLETE USER DATA', result);
            }

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

            // Send debug message about error
            // if (phoneNumber) {
            //         errorType: error instanceof Error ? error.constructor.name : typeof error,
            //         userId,
            //         executionTimeMs: executionTime,
            //         stack: error instanceof Error ? error.stack : undefined
            //     });
            // }

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

