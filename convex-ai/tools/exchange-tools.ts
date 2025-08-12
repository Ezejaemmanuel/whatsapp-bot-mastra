// import { createTool } from '@mastra/core/tools';
// import { z } from 'zod';
// import { fetchQuery, fetchMutation } from "convex/nextjs";
// import { api } from "../../convex/_generated/api";
// import { Id } from "../../convex/_generated/dataModel";

// import { logToolCall, logInfo, logSuccess, logToolResult, logError, logToolError, isValidConvexId } from './utils';


// /**
//  * Tool to get current exchange rates - NO PARAMETERS ACCEPTED
//  * Always returns all active rates from the database
//  */
// export const getCurrentRatesTool = createTool({
//     id: 'get_current_rates',
//     description: 'Get ALL current exchange rates from the database. This tool does not accept any parameters and always returns all active currency pair rates.',
//     inputSchema: z.object({}), // No parameters accepted
//     execute: async ({ context, runtimeContext }) => {
//         const startTime = Date.now();
//         const toolId = 'get_current_rates';

//         // Extract context data using new consistent naming
//         const phoneNumber = runtimeContext?.get('phoneNumber') as string;
//         const userId = runtimeContext?.get('userId') as string;
//         const conversationId = runtimeContext?.get('conversationId') as string;

//         logToolCall(toolId, {});

//         try {
//             logInfo('Getting ALL current exchange rates from database', {
//                 operation: toolId,
//                 note: 'No currency pair filter applied - fetching all rates'
//             });

//             // Always call without currencyPair to get all rates
//             const rates = await fetchQuery(api.exchangeRates.getCurrentRates, {});

//             const executionTime = Date.now() - startTime;

//             const result = rates;

//             logToolResult(toolId, result, executionTime);
//             return result;

//         } catch (error) {
//             const executionTime = Date.now() - startTime;
//             const errorMessage = `Failed to get exchange rates: ${error instanceof Error ? error.message : 'Unknown error'}`;

//             logError('Failed to get exchange rates', error as Error, {
//                 executionTimeMs: executionTime,
//                 operation: toolId
//             });

//             logToolError(toolId, error as Error, executionTime, {});

//             // Throw error instead of returning error object
//             throw new Error(errorMessage);
//         }
//     },
// });

// /**
//  * Tool to create a new transaction
//  */
// export const createTransactionTool = createTool({
//     id: 'create_transaction',
//     description: 'Create a new exchange transaction when user agrees to terms. The userId and conversationId are automatically extracted from the agent memory context.',
//     inputSchema: z.object({
//         currencyFrom: z.string().describe('Source currency (USD, GBP, EUR, etc.)'),
//         currencyTo: z.string().describe('Target currency (NGN, etc.)'),
//         amountFrom: z.number().describe('Amount to exchange from'),
//         amountTo: z.number().describe('Amount to receive'),
//         negotiatedRate: z.number().describe('Final negotiated rate'),
//         estimatedRate: z.number().optional().describe('Initial estimated rate before negotiation'),
//         imageUrl: z.string().optional().describe('URL to any transaction-related image'),
//         notes: z.string().optional().describe('Additional transaction notes'),
//         customerBankName: z.string().optional().describe('Customer bank name'),
//         customerAccountNumber: z.string().optional().describe('Customer account number'),
//         customerAccountName: z.string().optional().describe('Customer account name'),
//         transactionBankName: z.string().optional().describe('Admin bank name for this transaction'),
//         transactionAccountNumber: z.string().optional().describe('Admin account number for this transaction'),
//         transactionAccountName: z.string().optional().describe('Admin account name for this transaction'),
//     }),
//     execute: async ({ context, runtimeContext }) => {
//         const startTime = Date.now();
//         const toolId = 'create_transaction';

//         // Extract context data using new consistent naming
//         const phoneNumber = runtimeContext?.get('phoneNumber') as string;
//         const userId = runtimeContext?.get('userId') as string;
//         const conversationId = runtimeContext?.get('conversationId') as string;

//         logToolCall(toolId, context);

//         try {
//             // Validate that we have the required context
//             if (!userId || !conversationId) {
//                 throw new Error('Unable to extract userId and conversationId from runtime context. Make sure the agent is called with proper context configuration.');
//             }

//             logInfo('Creating new transaction with extracted context', {
//                 userId,
//                 conversationId,
//                 currencyFrom: context.currencyFrom,
//                 currencyTo: context.currencyTo,
//                 amountFrom: context.amountFrom,
//                 amountTo: context.amountTo,
//                 negotiatedRate: context.negotiatedRate,
//                 operation: toolId
//             });

//             // Build creation data
//             const createData: any = {
//                 userId: userId as Id<"users">,
//                 conversationId: conversationId as Id<"conversations">,
//                 currencyFrom: context.currencyFrom,
//                 currencyTo: context.currencyTo,
//                 amountFrom: context.amountFrom,
//                 amountTo: context.amountTo,
//                 negotiatedRate: context.negotiatedRate,
//             };

//             // Add optional fields only if provided
//             if (context.estimatedRate) createData.estimatedRate = context.estimatedRate;
//             if (context.imageUrl) createData.imageUrl = context.imageUrl;
//             if (context.notes) createData.notes = context.notes;
//             if (context.customerBankName) createData.customerBankName = context.customerBankName;
//             if (context.customerAccountNumber) createData.customerAccountNumber = context.customerAccountNumber;
//             if (context.customerAccountName) createData.customerAccountName = context.customerAccountName;
//             if (context.transactionBankName) createData.transactionBankName = context.transactionBankName;
//             if (context.transactionAccountNumber) createData.transactionAccountNumber = context.transactionAccountNumber;
//             if (context.transactionAccountName) createData.transactionAccountName = context.transactionAccountName;

//             const transaction = await fetchMutation(api.transactions.createTransaction, createData);

//             const executionTime = Date.now() - startTime;

//             const result = {
//                 success: true,
//                 data: transaction,
//                 transactionId: transaction,
//                 message: `Transaction created successfully with ID: ${transaction}`,
//                 workingMemoryUpdate: `IMPORTANT: Store this transaction ID in your working memory: ${transaction}. You will need this ID for all future updates to this transaction. Use this exact ID when calling updateTransactionTool or other transaction-related tools.`
//             };

//             logSuccess('Transaction created successfully', {
//                 transactionId: transaction,
//                 userId,
//                 conversationId,
//                 currencyPair: `${context.currencyFrom}_${context.currencyTo}`,
//                 amountFrom: context.amountFrom,
//                 amountTo: context.amountTo,
//                 negotiatedRate: context.negotiatedRate,
//                 executionTimeMs: executionTime,
//                 operation: toolId
//             });

//             logToolResult(toolId, result, executionTime);
//             return result;

//         } catch (error) {
//             const executionTime = Date.now() - startTime;
//             const errorMessage = `Failed to create transaction for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`;

//             logError('Failed to create transaction', error as Error, {
//                 userId,
//                 conversationId,
//                 currencyPair: `${context.currencyFrom}_${context.currencyTo}`,
//                 amountFrom: context.amountFrom,
//                 negotiatedRate: context.negotiatedRate,
//                 executionTimeMs: executionTime,
//                 operation: toolId
//             });

//             logToolError(toolId, error as Error, executionTime, context);

//             // Throw error instead of returning error object
//             throw new Error(errorMessage);
//         }
//     },
// });

// /**
//  * Tool to update transaction status with validation
//  * Accepts simplified status values and maps them to proper enum types
//  */
// export const updateTransactionTool = createTool({
//     id: 'update_transaction',
//     description: 'Update transaction status and other fields with validation. Use "pending" for pending transactions and "image_received" when user submits payment proof. This tool automatically validates the transaction ID and maps status values to proper enum types.',
//     inputSchema: z.object({
//         transactionId: z.string().describe('Transaction ID - must be a valid Convex document ID that belongs to the current user'),
//         status: z.enum(["pending", "image_received", "confirmed_and_money_sent_to_user", "cancelled", "failed"]).optional().describe('New status: "pending", "image_received" (maps to image_received_and_being_reviewed), "confirmed_and_money_sent_to_user", "cancelled", or "failed"'),
//         paymentReference: z.string().optional().describe('Payment reference number'),
//         receiptImageUrl: z.string().optional().describe('URL to receipt image'),
//         extractedDetails: z.record(z.unknown()).optional().describe('OCR extracted details from receipt as key-value pairs'),
//         customerBankName: z.string().optional().describe('Customer bank name'),
//         customerAccountNumber: z.string().optional().describe('Customer account number'),
//         customerAccountName: z.string().optional().describe('Customer account name'),
//         transactionBankName: z.string().optional().describe('Admin bank name for this transaction'),
//         transactionAccountNumber: z.string().optional().describe('Admin account number for this transaction'),
//         transactionAccountName: z.string().optional().describe('Admin account name for this transaction'),
//         notes: z.string().optional().describe('Additional transaction notes'),
//     }),
//     execute: async ({ context, runtimeContext }) => {
//         const startTime = Date.now();
//         const toolId = 'update_transaction';

//         // Extract context data using new consistent naming
//         const phoneNumber = runtimeContext?.get('phoneNumber') as string;
//         const userId = runtimeContext?.get('userId') as string;
//         const conversationId = runtimeContext?.get('conversationId') as string;
        
//         // Status mapping for simplified inputs
//         const statusMapping = {
//             'pending': 'pending' as const,
//             'image_received': 'image_received_and_being_reviewed' as const,
//             'confirmed_and_money_sent_to_user': 'confirmed_and_money_sent_to_user' as const,
//             'cancelled': 'cancelled' as const,
//             'failed': 'failed' as const
//         };
        
//         const mappedStatus = context.status ? statusMapping[context.status] : undefined;
//         if (context.status && !mappedStatus) {
//             return {
//                 success: false,
//                 message: `Invalid status: ${context.status}. Use 'pending', 'image_received', 'confirmed_and_money_sent_to_user', 'cancelled', or 'failed'.`,
//                 suggestion: 'Use only the valid status values.'
//             }
//         }

//         logToolCall(toolId, context);

//         try {
//             // Validate that we have the required context
//             if (!userId) {
//                 const result = {
//                     success: false,
//                     message: 'Unable to extract userId from runtime context. Make sure the agent is called with proper context configuration.',
//                     suggestion: 'Check your agent context configuration.'
//                 };
//                 logToolResult(toolId, result, Date.now() - startTime);
//                 return result;
//             }

//             // First validate the transaction ID format
//             if (!isValidConvexId(context.transactionId)) {
//                 const result = {
//                     success: false,
//                     transactionId: context.transactionId,
//                     message: `Invalid transaction ID format: ${context.transactionId}. Expected a valid Convex document ID (16+ alphanumeric characters).`,
//                     suggestion: 'Use validateTransactionTool to check the transaction ID, or use getLatestUserTransactionTool to get the most recent transaction ID, or use getUserTransactionsTool to see all available transaction IDs for this user.'
//                 };
//                 logToolResult(toolId, result, Date.now() - startTime);
//                 return result;
//             }

//             // Validate that the transaction exists and belongs to the user
//             const transaction = await fetchQuery(api.transactions.getTransaction, {
//                 transactionId: context.transactionId as Id<"transactions">
//             });

//             if (!transaction) {
//                 const result = {
//                     success: false,
//                     transactionId: context.transactionId,
//                     message: `Transaction ID ${context.transactionId} does not exist in the database. Please check your working memory for the correct transaction ID.`,
//                     suggestion: 'Use getUserTransactionsTool to get all user transactions, or getLatestUserTransactionTool to get the most recent transaction, or check your working memory for the correct transaction ID.'
//                 };
//                 logToolResult(toolId, result, Date.now() - startTime);
//                 return result;
//             }

//             // Check if transaction belongs to the current user
//             if (transaction.userId !== userId) {
//                 const result = {
//                     success: false,
//                     transactionId: context.transactionId,
//                     message: `Transaction ID ${context.transactionId} exists but belongs to a different user. This transaction cannot be modified by the current user.`,
//                     suggestion: 'Use getUserTransactionsTool to get transactions that belong to the current user.'
//                 };
//                 logToolResult(toolId, result, Date.now() - startTime);
//                 return result;
//             }

//             logInfo('Updating transaction status after validation', {
//                 transactionId: context.transactionId,
//                 currentStatus: transaction.status,
//                 newStatus: context.status,
//                 hasPaymentReference: !!context.paymentReference,
//                 hasReceiptImage: !!context.receiptImageUrl,
//                 hasExtractedDetails: !!context.extractedDetails && Object.keys(context.extractedDetails).length > 0,
//                 operation: toolId
//             });

//             // Build update object with only provided fields
//             const updateData: any = {
//                 transactionId: context.transactionId as Id<"transactions">,
//             };

//             // Add fields only if provided
//             if (mappedStatus !== undefined) updateData.status = mappedStatus;
//             if (context.paymentReference !== undefined) updateData.paymentReference = context.paymentReference;
//             if (context.receiptImageUrl !== undefined) updateData.receiptImageUrl = context.receiptImageUrl;
//             if (context.extractedDetails !== undefined) updateData.extractedDetails = context.extractedDetails;
//             if (context.customerBankName !== undefined) updateData.customerBankName = context.customerBankName;
//             if (context.customerAccountNumber !== undefined) updateData.customerAccountNumber = context.customerAccountNumber;
//             if (context.customerAccountName !== undefined) updateData.customerAccountName = context.customerAccountName;
//             if (context.transactionBankName !== undefined) updateData.transactionBankName = context.transactionBankName;
//             if (context.transactionAccountNumber !== undefined) updateData.transactionAccountNumber = context.transactionAccountNumber;
//             if (context.transactionAccountName !== undefined) updateData.transactionAccountName = context.transactionAccountName;
//             if (context.notes !== undefined) updateData.notes = context.notes;

//             await fetchMutation(api.transactions.updateTransactionStatus, updateData);

//             const executionTime = Date.now() - startTime;

//             const result = {
//                 success: true,
//                 transactionId: context.transactionId,
//                 previousStatus: transaction.status,
//                 inputStatus: context.status,
//                 newStatus: mappedStatus,
//                 message: `Transaction ${context.transactionId} status updated from ${transaction.status} to ${mappedStatus || transaction.status} successfully${context.status ? ` (input: ${context.status})` : ''}.`,
//                 workingMemoryUpdate: `Transaction ${context.transactionId} is now in ${mappedStatus || transaction.status} status. Keep this transaction ID in your working memory for future updates.`
//             };
            
//             logSuccess('Transaction status updated successfully', {
//                 transactionId: context.transactionId,
//                 previousStatus: transaction.status,
//                 inputStatus: context.status,
//                 newStatus: mappedStatus,
//                 paymentReference: context.paymentReference,
//                 executionTimeMs: executionTime,
//                 operation: toolId
//             });

//             logToolResult(toolId, result, executionTime);
//             return result;

//         } catch (error) {
//             const executionTime = Date.now() - startTime;
//             const errorMessage = `Failed to update transaction status for ${context.transactionId}: ${error instanceof Error ? error.message : 'Unknown error'}`;

//             logError('Failed to update transaction status', error as Error, {
//                 transactionId: context.transactionId,
//                 inputStatus: context.status,
//                 mappedStatus: mappedStatus,
//                 executionTimeMs: executionTime,
//                 operation: toolId
//             });

//             logToolError(toolId, error as Error, executionTime, context);

//             // Throw error instead of returning error object
//             throw new Error(errorMessage);
//         }
//     },
// });


