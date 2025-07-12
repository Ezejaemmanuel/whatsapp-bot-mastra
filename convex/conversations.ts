import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";
import { ConversationStatusUnion, ConversationStatus, InChargeUnion, InCharge, MessageStatusUnion, MessageStatus } from "./schemaUnions";

/**
 * Get or create a conversation for a user
 */
export const getOrCreateConversation = mutation({
    args: {
        userId: v.id("users"),
        userName: v.string(),
    },
    handler: async (ctx, args) => {
        // Try to find active conversation for the user
        const existingConversation = await ctx.db
            .query("conversations")
            .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
            .filter((q) => q.eq(q.field("status"), "active" as ConversationStatus))
            .order("desc")
            .first();

        if (existingConversation) {
            return existingConversation;
        }

        // Create new conversation
        const conversationId = await ctx.db.insert("conversations", {
            userId: args.userId,
            userName: args.userName,
            status: "active" as ConversationStatus,
            inCharge: "bot" as InCharge, // Default to bot
            lastMessageAt: Date.now(),
            unreadCount: 0,
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
 * Get conversation by User ID
 */
export const getConversationByUserId = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("conversations")
            .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
            .first();
    },
});

/**
 * Update conversation last message time
 */
export const updateConversationLastMessage = mutation({
    args: {
        conversationId: v.id("conversations"),
        lastMessageAt: v.number(),
        lastMessageSummary: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.conversationId, {
            lastMessageAt: args.lastMessageAt,
            lastMessageSummary: args.lastMessageSummary,
        });
        return await ctx.db.get(args.conversationId);
    },
});

/**
 * Archive a conversation
 */
export const archiveConversation = mutation({
    args: {
        conversationId: v.id("conversations"),
    },
    handler: async (ctx, args) => {
        const status: ConversationStatus = "archived";
        return await ctx.db.patch(args.conversationId, { status });
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

/**
 * Set who is in charge of a conversation
 */
export const setInCharge = mutation({
    args: {
        conversationId: v.id("conversations"),
        inCharge: InChargeUnion,
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.conversationId, {
            inCharge: args.inCharge,
        });
        return await ctx.db.get(args.conversationId);
    },
});

/**
 * Get all conversations with their user details
 */
export const getAllConversationsWithUsers = query({
    args: {
        paginationOpts: v.any(),
    },
    handler: async (ctx, args) => {
        const conversations = await ctx.db
            .query("conversations")
            .order("desc")
            .paginate(args.paginationOpts);

        const page = await Promise.all(
            conversations.page.map(async (conversation) => {
                const user = await ctx.db.get(conversation.userId);
                return {
                    ...conversation,
                    user,
                };
            })
        );

        return {
            ...conversations,
            page,
        };
    },
});

/**
 * Update conversation
 */
export const updateConversation = mutation({
    args: {
        conversationId: v.id("conversations"),
        inCharge: v.optional(InChargeUnion),
        status: v.optional(ConversationStatusUnion),
        lastMessageAt: v.optional(v.number()),
        lastMessageSummary: v.optional(v.string()),
        metadata: v.optional(v.any()),
        unreadCount: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        return await ctx.db.patch(args.conversationId, {
            ...(args.inCharge && { inCharge: args.inCharge }),
            ...(args.status && { status: args.status }),
            ...(args.lastMessageAt && { lastMessageAt: args.lastMessageAt }),
            ...(args.lastMessageSummary && { lastMessageSummary: args.lastMessageSummary }),
            ...(args.metadata && { metadata: args.metadata }),
            ...(typeof args.unreadCount === 'number' && { unreadCount: args.unreadCount }),
        });
    },
});

export const markConversationAsRead = mutation({
    args: {
        conversationId: v.id("conversations"),
    },
    handler: async (ctx, args) => {
        // Reset unread count on the conversation
        await ctx.db.patch(args.conversationId, {
            unreadCount: 0,
        });

        // Find all unread inbound messages for this conversation
        const unreadMessages = await ctx.db
            .query("messages")
            .withIndex("by_conversation_id", (q) =>
                q.eq("conversationId", args.conversationId)
            )
            .filter((q) =>
                q.and(
                    q.eq(q.field("direction"), "inbound"),
                    q.neq(q.field("status"), "read" as MessageStatus)
                )
            )
            .collect();

        // Mark all of them as read
        await Promise.all(
            unreadMessages.map((message) =>
                ctx.db.patch(message._id, {
                    status: "read" as MessageStatus,
                })
            )
        );
    },
});

/**
 * Get active conversations
 */
export const getActiveConversations = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db
            .query("conversations")
            .filter((q) => q.eq(q.field("status"), "active" as ConversationStatus))
            .collect();
    },
});

/**
 * Create a new conversation
 */
export const createConversation = mutation({
    args: {
        userId: v.id("users"),
        userName: v.string(),
    },
    handler: async (ctx, args) => {
        const status: ConversationStatus = "active";
        const inCharge: InCharge = "bot"; // Default to bot

        return await ctx.db.insert("conversations", {
            userId: args.userId,
            userName: args.userName,
            status,
            inCharge,
            lastMessageAt: Date.now(),
            unreadCount: 0,
        });
    },
}); 