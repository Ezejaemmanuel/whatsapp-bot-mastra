import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Store an incoming message
 */
export const storeIncomingMessage = mutation({
    args: {
        conversationId: v.id("conversations"),
        whatsappMessageId: v.optional(v.string()),
        messageType: v.string(),
        content: v.optional(v.string()),
        caption: v.optional(v.string()),
        location: v.optional(v.any()),
        contacts: v.optional(v.any()),
        interactive: v.optional(v.any()),
        context: v.optional(v.any()),
        timestamp: v.number(),
        metadata: v.optional(v.any()),
        mediaType: v.optional(v.string()),
        fileName: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const messageId = await ctx.db.insert("messages", {
            conversationId: args.conversationId,
            whatsappMessageId: args.whatsappMessageId,
            direction: "inbound",
            messageType: args.messageType,
            content: args.content,
            caption: args.caption,
            location: args.location,
            contacts: args.contacts,
            interactive: args.interactive,
            context: args.context,
            status: "sent",
            timestamp: args.timestamp,
            metadata: args.metadata,
            mediaType: args.mediaType,
            fileName: args.fileName,
        });

        // Update conversation last message time
        await ctx.db.patch(args.conversationId, {
            lastMessageAt: args.timestamp,
        });

        return await ctx.db.get(messageId);
    },
});

/**
 * Store an outgoing message
 */
export const storeOutgoingMessage = mutation({
    args: {
        conversationId: v.id("conversations"),
        whatsappMessageId: v.optional(v.string()),
        messageType: v.string(),
        content: v.optional(v.string()),
        context: v.optional(v.any()),
        metadata: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        const timestamp = Date.now();
        const messageId = await ctx.db.insert("messages", {
            conversationId: args.conversationId,
            whatsappMessageId: args.whatsappMessageId,
            direction: "outbound",
            messageType: args.messageType,
            content: args.content,
            context: args.context,
            status: "sent",
            timestamp,
            metadata: args.metadata,
        });

        // Update conversation last message time
        await ctx.db.patch(args.conversationId, {
            lastMessageAt: timestamp,
        });

        return await ctx.db.get(messageId);
    },
});

/**
 * Get conversation history
 */
export const getConversationHistory = query({
    args: {
        conversationId: v.id("conversations"),
        limit: v.optional(v.number()),
        offset: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit || 50;
        const messages = await ctx.db
            .query("messages")
            .withIndex("by_conversation_id", (q) => q.eq("conversationId", args.conversationId))
            .order("desc")
            .take(limit);

        return messages.reverse(); // Return in chronological order
    },
});

/**
 * Get message by WhatsApp ID
 */
export const getMessageByWhatsAppId = query({
    args: { whatsappMessageId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("messages")
            .withIndex("by_whatsapp_message_id", (q) => q.eq("whatsappMessageId", args.whatsappMessageId))
            .first();
    },
});

/**
 * Get message by ID
 */
export const getMessageById = query({
    args: { messageId: v.id("messages") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.messageId);
    },
});

/**
 * Update message status
 */
export const updateMessageStatus = mutation({
    args: {
        messageId: v.id("messages"),
        status: v.string(),
        error: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.messageId, {
            status: args.status,
            error: args.error,
        });
        return await ctx.db.get(args.messageId);
    },
});

/**
 * Get recent media messages
 */
export const getRecentMediaMessages = query({
    args: {
        hours: v.optional(v.number()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const hours = args.hours || 24;
        const limit = args.limit || 50;
        const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);

        return await ctx.db
            .query("messages")
            .withIndex("by_timestamp", (q) => q.gte("timestamp", cutoffTime))
            .filter((q) =>
                q.or(
                    q.eq(q.field("messageType"), "image"),
                    q.eq(q.field("messageType"), "audio"),
                    q.eq(q.field("messageType"), "video"),
                    q.eq(q.field("messageType"), "document")
                )
            )
            .order("desc")
            .take(limit);
    },
}); 