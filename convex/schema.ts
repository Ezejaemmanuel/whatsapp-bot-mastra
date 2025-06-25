import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Convex Schema for WhatsApp Bot
 * 
 * This schema defines the structure of all tables used by the WhatsApp bot,
 * migrated from the previous Drizzle ORM schema.
 */

export default defineSchema({
    /**
     * Users table - stores WhatsApp user information
     */
    users: defineTable({
        whatsappId: v.string(), // Unique WhatsApp ID
        phoneNumber: v.optional(v.string()), // Phone number
        profileName: v.optional(v.string()), // Profile name
        isBlocked: v.optional(v.boolean()), // Whether user is blocked
        metadata: v.optional(v.any()), // Additional user metadata
    })
        .index("by_whatsapp_id", ["whatsappId"])
        .index("by_phone_number", ["phoneNumber"]),

    /**
     * Conversations table - stores conversation sessions
     */
    conversations: defineTable({
        userId: v.id("users"), // Reference to user
        whatsappConversationId: v.optional(v.string()), // WhatsApp conversation ID
        status: v.optional(v.string()), // active, archived, closed
        lastMessageAt: v.optional(v.number()), // Last message timestamp
        metadata: v.optional(v.any()), // Conversation-specific metadata
    })
        .index("by_user_id", ["userId"])
        .index("by_status", ["status"])
        .index("by_last_message_at", ["lastMessageAt"]),

    /**
     * Messages table - stores all messages (incoming and outgoing)
     */
    messages: defineTable({
        conversationId: v.id("conversations"), // Reference to conversation
        whatsappMessageId: v.optional(v.string()), // WhatsApp message ID
        direction: v.string(), // 'inbound', 'outbound'
        messageType: v.string(), // 'text', 'image', 'audio', 'video', 'document', 'location', 'contact', 'interactive', 'button', 'system'
        content: v.optional(v.string()), // Text content for text messages
        mediaUrl: v.optional(v.string()), // URL for media files
        mediaType: v.optional(v.string()), // MIME type for media
        fileName: v.optional(v.string()), // Original filename for documents
        caption: v.optional(v.string()), // Caption for media messages
        location: v.optional(v.any()), // Location data {latitude, longitude, name, address}
        contacts: v.optional(v.any()), // Contact information
        interactive: v.optional(v.any()), // Interactive message data (buttons, lists)
        context: v.optional(v.any()), // Message context (reply, forward info)
        status: v.optional(v.string()), // 'sent', 'delivered', 'read', 'failed'
        timestamp: v.number(), // Message timestamp
        metadata: v.optional(v.any()), // Additional message metadata
        error: v.optional(v.string()), // Error message if status is 'failed'
    })
        .index("by_conversation_id", ["conversationId"])
        .index("by_whatsapp_message_id", ["whatsappMessageId"])
        .index("by_direction", ["direction"])
        .index("by_message_type", ["messageType"])
        .index("by_status", ["status"])
        .index("by_timestamp", ["timestamp"]),

    /**
     * Media files table - stores information about uploaded media files
     */
    mediaFiles: defineTable({
        storageId: v.optional(v.id("_storage")), // Convex storage ID
        messageId: v.optional(v.id("messages")), // Reference to message
        whatsappMediaId: v.optional(v.string()), // WhatsApp media ID
        originalUrl: v.optional(v.string()), // Original WhatsApp media URL
        storedUrl: v.optional(v.string()), // Stored file URL from Convex storage
        fileName: v.optional(v.string()), // File name
        mimeType: v.optional(v.string()), // MIME type
        fileSize: v.optional(v.number()), // Size in bytes
        sha256: v.optional(v.string()), // WhatsApp provided hash
        uploadStatus: v.optional(v.string()), // 'pending', 'uploaded', 'failed'
        metadata: v.optional(v.any()), // Additional file metadata
    })
        .index("by_message_id", ["messageId"])
        .index("by_whatsapp_media_id", ["whatsappMediaId"])
        .index("by_upload_status", ["uploadStatus"])
        .index("by_storage_id", ["storageId"]),

    /**
     * Message status updates table - tracks delivery status changes
     */
    messageStatuses: defineTable({
        messageId: v.id("messages"), // Reference to message
        status: v.string(), // 'sent', 'delivered', 'read', 'failed'
        timestamp: v.number(), // Status update timestamp
        recipientId: v.optional(v.string()), // Recipient ID
        conversationInfo: v.optional(v.any()), // WhatsApp conversation metadata
        pricingInfo: v.optional(v.any()), // WhatsApp pricing information
        error: v.optional(v.any()), // Error details if status is 'failed'
    })
        .index("by_message_id", ["messageId"])
        .index("by_status", ["status"])
        .index("by_timestamp", ["timestamp"]),

    /**
     * Webhook logs table - stores webhook processing logs for debugging
     */
    webhookLogs: defineTable({
        level: v.string(), // 'INFO', 'WARN', 'ERROR'
        source: v.optional(v.string()), // Log source
        message: v.optional(v.string()), // Log message
        data: v.optional(v.any()), // Log data
        timestamp: v.number(), // Log timestamp
        processingTimeMs: v.optional(v.number()), // Processing time in milliseconds
        error: v.optional(v.string()), // Error message
        stack: v.optional(v.string()), // Error stack trace
    })
        .index("by_level", ["level"])
        .index("by_timestamp", ["timestamp"])
        .index("by_source", ["source"]),
}); 