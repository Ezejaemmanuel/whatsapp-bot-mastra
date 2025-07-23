import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { TransactionStatusUnion, TransactionStatus } from "./schemaUnions";

/**
 * Create a new exchange transaction
 */
export const createTransaction = mutation({
    args: {
        userId: v.id("users"),
        conversationId: v.id("conversations"),
        currencyFrom: v.string(),
        currencyTo: v.string(),
        amountFrom: v.number(),
        amountTo: v.number(),
        negotiatedRate: v.number(),
        metadata: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        const status: TransactionStatus = "pending";
        return await ctx.db.insert("transactions", {
            userId: args.userId,
            conversationId: args.conversationId,
            currencyFrom: args.currencyFrom,
            currencyTo: args.currencyTo,
            amountFrom: args.amountFrom,
            amountTo: args.amountTo,
            negotiatedRate: args.negotiatedRate,
            status,
            createdAt: now,
            updatedAt: now,
            metadata: args.metadata,
        });
    },
});

/**
 * Update transaction status
 */
export const updateTransactionStatus = mutation({
    args: {
        transactionId: v.id("transactions"),
        status: TransactionStatusUnion,
        paymentReference: v.optional(v.string()),
        receiptImageUrl: v.optional(v.string()),
        extractedDetails: v.optional(v.any()),
        metadata: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        const transaction = await ctx.db.get(args.transactionId);
        if (!transaction) {
            throw new Error("Transaction not found");
        }

        return await ctx.db.patch(args.transactionId, {
            status: args.status,
            paymentReference: args.paymentReference ?? transaction.paymentReference,
            receiptImageUrl: args.receiptImageUrl ?? transaction.receiptImageUrl,
            extractedDetails: args.extractedDetails ?? transaction.extractedDetails,
            updatedAt: Date.now(),
            metadata: args.metadata ? { ...transaction.metadata, ...args.metadata } : transaction.metadata,
        });
    },
});

/**
 * Update transaction bank details
 */
export const updateTransactionBankDetails = mutation({
    args: {
        transactionId: v.id("transactions"),
        transactionBankName: v.string(),
        transactionAccountNumber: v.string(),
        transactionAccountName: v.string(),
    },
    handler: async (ctx, args) => {
        const transaction = await ctx.db.get(args.transactionId);
        if (!transaction) {
            throw new Error("Transaction not found");
        }

        return await ctx.db.patch(args.transactionId, {
            transactionBankName: args.transactionBankName,
            transactionAccountNumber: args.transactionAccountNumber,
            transactionAccountName: args.transactionAccountName,
            updatedAt: Date.now(),
        });
    },
});

/**
 * Get transaction by ID
 */
export const getTransaction = query({
    args: { transactionId: v.id("transactions") },
    handler: async (ctx, args) => {
        const transaction = await ctx.db.get(args.transactionId);
        if (!transaction) {
            return null;
        }

        const user = await ctx.db.get(transaction.userId);
        const conversation = await ctx.db.get(transaction.conversationId);

        // Find the last 4 image messages in the conversation to use as receipts
        const receiptImageMessages = await ctx.db
            .query("messages")
            .withIndex("by_conversation_id", (q) =>
                q.eq("conversationId", transaction.conversationId)
            )
            .filter((q) => q.eq(q.field("messageType"), "image"))
            .order("desc")
            .take(4);

        const receiptImageUrls = receiptImageMessages
            .map((msg) => msg.mediaUrl)
            .filter((url): url is string => !!url)
            .reverse(); // Newest is last, so reverse to show oldest of the 4 first


        return {
            ...transaction,
            user,
            conversation,
            receiptImageUrl: transaction.receiptImageUrl ?? receiptImageUrls[0],
            receiptImageUrls: receiptImageUrls,
        };
    },
});

/**
 * Get transactions for a user
 */
export const getUserTransactions = query({
    args: {
        userId: v.id("users"),
        limit: v.optional(v.number()),
        status: v.optional(TransactionStatusUnion),
    },
    handler: async (ctx, args) => {
        let query = ctx.db
            .query("transactions")
            .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
            .order("desc");

        if (args.status) {
            query = query.filter((q) => q.eq(q.field("status"), args.status));
        }

        if (args.limit) {
            return await query.take(args.limit);
        }

        return await query.collect();
    },
});

/**
 * Get transactions for a conversation
 */
export const getConversationTransactions = query({
    args: {
        conversationId: v.id("conversations"),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        let query = ctx.db
            .query("transactions")
            .withIndex("by_conversation_id", (q) => q.eq("conversationId", args.conversationId))
            .order("desc");

        if (args.limit) {
            return await query.take(args.limit);
        }

        return await query.collect();
    },
});

/**
 * Get pending transactions (for admin/monitoring)
 */
export const getPendingTransactions = query({
    args: { limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        let query = ctx.db
            .query("transactions")
            .withIndex("by_status", (q) => q.eq("status", "pending" as TransactionStatus))
            .order("desc");

        if (args.limit) {
            return await query.take(args.limit);
        }

        return await query.collect();
    },
});

/**
 * Get all transactions with user details
 */
export const getAllTransactions = query({
    args: {
        paginationOpts: v.any(),
    },
    handler: async (ctx, args) => {
        const transactions = await ctx.db
            .query("transactions")
            .order("desc")
            .paginate(args.paginationOpts);

        const transactionsWithUsers = {
            ...transactions,
            page: await Promise.all(
                transactions.page.map(async (transaction) => {
                    const user = await ctx.db.get(transaction.userId);
                    const conversation = await ctx.db.get(transaction.conversationId);
                    return {
                        ...transaction,
                        user,
                        conversation,
                    };
                })
            )
        };

        return transactionsWithUsers;
    },
});

/**
 * Cancel transaction
 */
export const cancelTransaction = mutation({
    args: {
        transactionId: v.id("transactions"),
        reason: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const transaction = await ctx.db.get(args.transactionId);
        if (!transaction) {
            throw new Error("Transaction not found");
        }

        if (transaction.status === "confirmed_and_money_sent_to_user") {
            throw new Error("Cannot cancel a completed transaction");
        }

        return await ctx.db.patch(args.transactionId, {
            status: "cancelled",
            metadata: {
                ...transaction.metadata,
                cancellationReason: args.reason || "No reason provided",
            },
            updatedAt: Date.now(),
        });
    },
});

/**
 * Fail transaction
 */
export const failTransaction = mutation({
    args: {
        transactionId: v.id("transactions"),
        reason: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const transaction = await ctx.db.get(args.transactionId);
        if (!transaction) {
            throw new Error("Transaction not found");
        }

        if (transaction.status === "confirmed_and_money_sent_to_user") {
            throw new Error("Cannot fail a completed transaction");
        }

        return await ctx.db.patch(args.transactionId, {
            status: "failed",
            metadata: {
                ...transaction.metadata,
                failureReason: args.reason || "No reason provided",
            },
            updatedAt: Date.now(),
        });
    },
});


/**
 * Mark a transaction as read
 */
export const markTransactionAsRead = mutation({
    args: {
        transactionId: v.id("transactions"),
    },
    handler: async (ctx, args) => {
        const transaction = await ctx.db.get(args.transactionId);
        if (!transaction) {
            throw new Error("Transaction not found");
        }

        if (transaction.isRead) {
            // Already read, no need to update
            return;
        }

        return await ctx.db.patch(args.transactionId, {
            isRead: true,
            lastReadAt: Date.now(),
        });
    },
});

/**
 * Get transaction statistics
 */
export const getTransactionStats = query({
    args: {
        userId: v.optional(v.id("users")),
        timeRange: v.optional(v.number()), // in milliseconds
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        const startTime = args.timeRange ? now - args.timeRange : 0;

        const transactions = args.userId
            ? await ctx.db
                .query("transactions")
                .withIndex("by_user_id", (q) => q.eq("userId", args.userId!))
                .filter((q) => q.gte(q.field("createdAt"), startTime))
                .collect()
            : await ctx.db
                .query("transactions")
                .fullTableScan()
                .filter((q) => q.gte(q.field("createdAt"), startTime))
                .collect();

        const stats = {
            total: transactions.length,
            pending: transactions.filter(t => t.status === "pending").length,
            completed: transactions.filter(t => t.status === "confirmed_and_money_sent_to_user").length,
            failed: transactions.filter(t => t.status === "failed").length,
            cancelled: transactions.filter(t => t.status === "cancelled").length,
            totalVolume: transactions.reduce((sum, t) => sum + t.amountFrom, 0),
            averageAmount: transactions.length > 0 ? transactions.reduce((sum, t) => sum + t.amountFrom, 0) / transactions.length : 0,
        };

        return stats;
    },
});