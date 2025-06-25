import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Create duplicate detection record
 */
export const createDuplicateRecord = mutation({
    args: {
        hash: v.string(),
        userId: v.id("users"),
        detectionData: v.any(),
        transactionId: v.optional(v.id("transactions")),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("duplicateDetection", {
            hash: args.hash,
            userId: args.userId,
            detectionData: args.detectionData,
            transactionId: args.transactionId,
            detectedAt: Date.now(),
            status: "active",
        });
    },
});

/**
 * Check if hash exists (duplicate detection)
 */
export const checkDuplicateHash = query({
    args: { hash: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("duplicateDetection")
            .withIndex("by_hash", (q) => q.eq("hash", args.hash))
            .filter((q) => q.eq(q.field("status"), "active"))
            .first();
    },
});

/**
 * Update duplicate record status
 */
export const updateDuplicateStatus = mutation({
    args: {
        hash: v.string(),
        status: v.string(),
        transactionId: v.optional(v.id("transactions")),
    },
    handler: async (ctx, args) => {
        const record = await ctx.db
            .query("duplicateDetection")
            .withIndex("by_hash", (q) => q.eq("hash", args.hash))
            .first();

        if (!record) {
            throw new Error("Duplicate detection record not found");
        }

        return await ctx.db.patch(record._id, {
            status: args.status,
            transactionId: args.transactionId ?? record.transactionId,
        });
    },
});

/**
 * Get user's duplicate records
 */
export const getUserDuplicateRecords = query({
    args: {
        userId: v.id("users"),
        limit: v.optional(v.number()),
        status: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        let query = ctx.db
            .query("duplicateDetection")
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
 * Clean up old duplicate records
 */
export const cleanupOldDuplicateRecords = mutation({
    args: { olderThanMs: v.number() },
    handler: async (ctx, args) => {
        const cutoffTime = Date.now() - args.olderThanMs;

        const oldRecords = await ctx.db
            .query("duplicateDetection")
            .withIndex("by_detected_at", (q) => q.lt("detectedAt", cutoffTime))
            .collect();

        const deletePromises = oldRecords.map(record => ctx.db.delete(record._id));
        await Promise.all(deletePromises);

        return { deletedCount: oldRecords.length };
    },
});

/**
 * Get duplicate detection statistics
 */
export const getDuplicateStats = query({
    args: { timeRange: v.optional(v.number()) },
    handler: async (ctx, args) => {
        const now = Date.now();
        const startTime = args.timeRange ? now - args.timeRange : 0;

        const records = await ctx.db
            .query("duplicateDetection")
            .filter((q) => q.gte(q.field("detectedAt"), startTime))
            .collect();

        return {
            total: records.length,
            active: records.filter(r => r.status === "active").length,
            resolved: records.filter(r => r.status === "resolved").length,
            falsePositive: records.filter(r => r.status === "false_positive").length,
        };
    },
}); 