import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Log webhook event
 */
export const logWebhookEvent = mutation({
    args: {
        level: v.string(), // 'INFO', 'WARN', 'ERROR'
        message: v.optional(v.string()),
        data: v.optional(v.any()),
        source: v.optional(v.string()),
        processingTimeMs: v.optional(v.number()),
        error: v.optional(v.string()),
        stack: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const logId = await ctx.db.insert("webhookLogs", {
            level: args.level,
            message: args.message,
            data: args.data,
            source: args.source,
            timestamp: Date.now(),
            processingTimeMs: args.processingTimeMs,
            error: args.error,
            stack: args.stack,
        });

        return await ctx.db.get(logId);
    },
});

/**
 * Get webhook logs
 */
export const getWebhookLogs = query({
    args: {
        level: v.optional(v.string()),
        source: v.optional(v.string()),
        limit: v.optional(v.number()),
        hours: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit || 100;
        const hours = args.hours || 24;
        const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);

        let query = ctx.db
            .query("webhookLogs")
            .withIndex("by_timestamp", (q) => q.gte("timestamp", cutoffTime));

        if (args.level) {
            query = query.filter((q) => q.eq(q.field("level"), args.level));
        }

        if (args.source) {
            query = query.filter((q) => q.eq(q.field("source"), args.source));
        }

        return await query.order("desc").take(limit);
    },
});

/**
 * Get error logs
 */
export const getErrorLogs = query({
    args: {
        limit: v.optional(v.number()),
        hours: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit || 50;
        const hours = args.hours || 24;
        const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);

        return await ctx.db
            .query("webhookLogs")
            .withIndex("by_level", (q) => q.eq("level", "ERROR"))
            .filter((q) => q.gte(q.field("timestamp"), cutoffTime))
            .order("desc")
            .take(limit);
    },
});

/**
 * Clean old logs (older than specified days)
 */
export const cleanOldLogs = mutation({
    args: { daysOld: v.optional(v.number()) },
    handler: async (ctx, args) => {
        const days = args.daysOld || 30;
        const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);

        const oldLogs = await ctx.db
            .query("webhookLogs")
            .withIndex("by_timestamp", (q) => q.lt("timestamp", cutoffTime))
            .take(1000); // Process in batches

        for (const log of oldLogs) {
            await ctx.db.delete(log._id);
        }

        return { deleted: oldLogs.length };
    },
});

/**
 * Get recent webhook logs
 */
export const getRecentLogs = query({
    args: {
        limit: v.optional(v.number()),
        hoursAgo: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit || 50;
        const hoursAgo = args.hoursAgo || 24;
        const cutoffTime = Date.now() - (hoursAgo * 60 * 60 * 1000);

        return await ctx.db
            .query("webhookLogs")
            .withIndex("by_timestamp", (q) => q.gte("timestamp", cutoffTime))
            .order("desc")
            .take(limit);
    },
});

/**
 * Get logs by level (ERROR, WARN, INFO)
 */
export const getLogsByLevel = query({
    args: {
        level: v.string(),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit || 50;

        return await ctx.db
            .query("webhookLogs")
            .withIndex("by_level", (q) => q.eq("level", args.level))
            .order("desc")
            .take(limit);
    },
});

/**
 * Clean up old webhook logs (older than specified days)
 */
export const cleanupOldLogs = mutation({
    args: {
        daysOld: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const daysOld = args.daysOld || 30;
        const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);

        const oldLogs = await ctx.db
            .query("webhookLogs")
            .withIndex("by_timestamp", (q) => q.lt("timestamp", cutoffTime))
            .collect();

        let deletedCount = 0;
        for (const log of oldLogs) {
            await ctx.db.delete(log._id);
            deletedCount++;
        }

        return {
            deletedCount,
            cutoffTime,
            message: `Deleted ${deletedCount} logs older than ${daysOld} days`,
        };
    },
});

/**
 * Get error logs with details
 */
export const getErrorLogsDetails = query({
    args: {
        limit: v.optional(v.number()),
        includeStack: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit || 20;

        const errorLogs = await ctx.db
            .query("webhookLogs")
            .withIndex("by_level", (q) => q.eq("level", "ERROR"))
            .order("desc")
            .take(limit);

        // Optionally exclude stack traces for cleaner output
        if (!args.includeStack) {
            return errorLogs.map(log => ({
                ...log,
                stack: undefined,
            }));
        }

        return errorLogs;
    },
});

/**
 * Get logs by source/component
 */
export const getLogsBySource = query({
    args: {
        source: v.string(),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit || 50;

        return await ctx.db
            .query("webhookLogs")
            .withIndex("by_source", (q) => q.eq("source", args.source))
            .order("desc")
            .take(limit);
    },
}); 