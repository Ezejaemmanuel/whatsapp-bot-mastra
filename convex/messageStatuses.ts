import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Store message status update
 */
export const storeMessageStatus = mutation({
    args: {
        messageId: v.id("messages"),
        status: v.string(),
        timestamp: v.number(),
        recipientId: v.optional(v.string()),
        conversationInfo: v.optional(v.any()),
        pricingInfo: v.optional(v.any()),
        error: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        const statusId = await ctx.db.insert("messageStatuses", {
            messageId: args.messageId,
            status: args.status,
            timestamp: args.timestamp,
            recipientId: args.recipientId,
            conversationInfo: args.conversationInfo,
            pricingInfo: args.pricingInfo,
            error: args.error,
        });

        // Update the message status as well
        await ctx.db.patch(args.messageId, {
            status: args.status,
        });

        return await ctx.db.get(statusId);
    },
});

/**
 * Get message statuses by message ID
 */
export const getMessageStatusesByMessageId = query({
    args: { messageId: v.id("messages") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("messageStatuses")
            .withIndex("by_message_id", (q) => q.eq("messageId", args.messageId))
            .order("desc")
            .collect();
    },
});

/**
 * Get recent message statuses
 */
export const getRecentMessageStatuses = query({
    args: {
        status: v.optional(v.string()),
        limit: v.optional(v.number()),
        hours: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit || 50;
        const hours = args.hours || 24;
        const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);

        let query = ctx.db
            .query("messageStatuses")
            .withIndex("by_timestamp", (q) => q.gte("timestamp", cutoffTime));

        if (args.status) {
            query = query.filter((q) => q.eq(q.field("status"), args.status));
        }

        return await query.order("desc").take(limit);
    },
}); 