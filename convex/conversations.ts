import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Get or create a conversation for a user
 */
export const getOrCreateConversation = mutation({
    args: {
        userId: v.id("users"),
        whatsappConversationId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Try to find active conversation for the user
        const existingConversation = await ctx.db
            .query("conversations")
            .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
            .filter((q) => q.eq(q.field("status"), "active"))
            .order("desc")
            .first();

        if (existingConversation) {
            return existingConversation;
        }

        // Create new conversation
        const conversationId = await ctx.db.insert("conversations", {
            userId: args.userId,
            whatsappConversationId: args.whatsappConversationId,
            status: "active",
            lastMessageAt: Date.now(),
        });

        return await ctx.db.get(conversationId);
    },
});

/**
 * Get user conversations
 */
export const getUserConversations = query({
    args: {
        userId: v.id("users"),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit || 20;
        return await ctx.db
            .query("conversations")
            .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
            .order("desc")
            .take(limit);
    },
});

/**
 * Get conversation by ID
 */
export const getConversationById = query({
    args: { conversationId: v.id("conversations") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.conversationId);
    },
});

/**
 * Update conversation last message time
 */
export const updateConversationLastMessage = mutation({
    args: {
        conversationId: v.id("conversations"),
        lastMessageAt: v.number(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.conversationId, {
            lastMessageAt: args.lastMessageAt,
        });
        return await ctx.db.get(args.conversationId);
    },
});

/**
 * Archive a conversation
 */
export const archiveConversation = mutation({
    args: { conversationId: v.id("conversations") },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.conversationId, {
            status: "archived",
        });
        return await ctx.db.get(args.conversationId);
    },
});

/**
 * Update conversation metadata
 */
export const updateConversationMetadata = mutation({
    args: {
        conversationId: v.id("conversations"),
        metadata: v.any(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.conversationId, {
            metadata: args.metadata,
        });
        return await ctx.db.get(args.conversationId);
    },
}); 