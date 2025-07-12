import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";
import { MessageDirectionUnion, MessageDirection, SenderRoleUnion, SenderRole, MessageTypeUnion, MessageType, MessageStatusUnion, MessageStatus } from "./schemaUnions";

/**
 * Store an incoming message
 */
export const storeIncomingMessage = mutation({
    args: {
        conversationId: v.id("conversations"),
        whatsappMessageId: v.optional(v.string()),
        senderRole: SenderRoleUnion,
        senderName: v.string(),
        messageType: MessageTypeUnion,
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
            senderRole: args.senderRole,
            senderName: args.senderName,
            messageType: args.messageType,
            content: args.content,
            caption: args.caption,
            location: args.location,
            contacts: args.contacts,
            context: args.context,
            status: "sent",
            timestamp: args.timestamp,
            metadata: args.metadata,
            mediaType: args.mediaType,
            fileName: args.fileName,
        });

        // Update conversation last message time and summary
        await ctx.db.patch(args.conversationId, {
            lastMessageAt: args.timestamp,
            lastMessageSummary: args.content?.substring(0, 100) ?? args.caption ?? args.messageType,
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
        senderRole: SenderRoleUnion,
        senderName: v.string(),
        messageType: MessageTypeUnion,
        content: v.optional(v.string()),
        mediaUrl: v.optional(v.string()),
        caption: v.optional(v.string()),
        context: v.optional(v.any()),
        metadata: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        const timestamp = Date.now();
        const messageId = await ctx.db.insert("messages", {
            conversationId: args.conversationId,
            whatsappMessageId: args.whatsappMessageId,
            direction: "outbound",
            senderRole: args.senderRole,
            senderName: args.senderName,
            messageType: args.messageType,
            content: args.content,
            mediaUrl: args.mediaUrl,
            caption: args.caption,
            context: args.context,
            status: "sent",
            timestamp,
            metadata: args.metadata,
        });

        // Update conversation last message time and summary
        await ctx.db.patch(args.conversationId, {
            lastMessageAt: timestamp,
            lastMessageSummary: args.content?.substring(0, 100) ?? args.caption ?? args.messageType,
        });

        return await ctx.db.get(messageId);
    },
});

export const sendAdminMessage = action({
    args: {
        conversationId: v.id("conversations"),
        senderRole: v.union(v.literal("admin"), v.literal("bot")),
        senderName: v.string(),
        messageType: v.union(v.literal("text"), v.literal("image")),
        content: v.optional(v.string()),
        mediaUrl: v.optional(v.string()),
        caption: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // 1. Store the outgoing message
        const messageId = await ctx.runMutation(api.messages.storeOutgoingMessage, {
            conversationId: args.conversationId,
            senderRole: args.senderRole,
            senderName: args.senderName,
            messageType: args.messageType,
            content: args.content,
            mediaUrl: args.mediaUrl,
            caption: args.caption,
        });

        if (!messageId) {
            console.error("Failed to store admin message");
            return;
        }

        // 2. Get user's WhatsApp ID
        const conversation = await ctx.runQuery(api.conversations.getConversationById, { conversationId: args.conversationId });
        if (!conversation) {
            console.error("Conversation not found", { conversationId: args.conversationId });
            return;
        }

        const user = await ctx.runQuery(api.users.getUserById, { userId: conversation.userId });
        if (!user) {
            console.error("User not found for conversation", { userId: conversation.userId });
            return;
        }
        const to = user.whatsappId;

        // 3. Send the message via WhatsApp API
        const whatsappApiUrl = `https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
        const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

        if (!accessToken || !process.env.WHATSAPP_PHONE_NUMBER_ID) {
            console.error("WhatsApp environment variables not set.");
            return;
        }

        const messageBody = {
            messaging_product: "whatsapp",
            to: to,
            type: args.messageType,
            [args.messageType]: {
                ...(args.messageType === 'text' && { body: args.content }),
                ...(args.messageType === 'image' && { link: args.mediaUrl, caption: args.caption }),
            },
        };

        try {
            const response = await fetch(whatsappApiUrl, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(messageBody),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Failed to send WhatsApp message:", errorData);
            }
        } catch (error) {
            console.error("Error sending WhatsApp message:", error);
        }
    }
});

/**
 * Get conversation history
 */
export const getConversationHistory = query({
    args: {
        conversationId: v.id("conversations"),
        paginationOpts: v.any(),
    },
    handler: async (ctx, args) => {
        const messages = await ctx.db
            .query("messages")
            .withIndex("by_conversation_id", (q) => q.eq("conversationId", args.conversationId))
            .order("desc")
            .paginate(args.paginationOpts);

        return {
            ...messages,
            page: messages.page.reverse(),
        };
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
        status: MessageStatusUnion,
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
 * Update message with media URL
 */
export const updateMessageMediaUrl = mutation({
    args: {
        messageId: v.id("messages"),
        mediaUrl: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.messageId, {
            mediaUrl: args.mediaUrl,
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

/**
 * Create a new message
 */
export const createMessage = mutation({
    args: {
        conversationId: v.id("conversations"),
        whatsappMessageId: v.optional(v.string()),
        senderRole: SenderRoleUnion,
        senderName: v.string(),
        messageType: MessageTypeUnion,
        content: v.optional(v.string()),
        mediaUrl: v.optional(v.string()),
        mediaType: v.optional(v.string()),
        fileName: v.optional(v.string()),
        caption: v.optional(v.string()),
        location: v.optional(v.any()),
        contacts: v.optional(v.any()),
        context: v.optional(v.any()),
        metadata: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        const direction: MessageDirection = "inbound";
        const status: MessageStatus = "sent";

        return await ctx.db.insert("messages", {
            ...args,
            direction,
            status,
            timestamp: Date.now(),
        });
    },
});

/**
 * Create outbound message
 */
export const createOutboundMessage = mutation({
    args: {
        conversationId: v.id("conversations"),
        whatsappMessageId: v.optional(v.string()),
        senderRole: SenderRoleUnion,
        senderName: v.string(),
        messageType: MessageTypeUnion,
        content: v.optional(v.string()),
        mediaUrl: v.optional(v.string()),
        mediaType: v.optional(v.string()),
        fileName: v.optional(v.string()),
        caption: v.optional(v.string()),
        location: v.optional(v.any()),
        contacts: v.optional(v.any()),
        context: v.optional(v.any()),
        metadata: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        const direction: MessageDirection = "outbound";
        const status: MessageStatus = "sent";

        return await ctx.db.insert("messages", {
            ...args,
            direction,
            status,
            timestamp: Date.now(),
        });
    },
}); 