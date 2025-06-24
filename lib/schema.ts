import { pgTable, serial, text, timestamp, boolean, jsonb, varchar, integer, uuid, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

/**
 * Users table - stores WhatsApp user information
 */
export const users = pgTable('users', {
    id: serial('id').primaryKey(),
    whatsappId: varchar('whatsapp_id', { length: 50 }).unique().notNull(),
    phoneNumber: varchar('phone_number', { length: 20 }),
    profileName: text('profile_name'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    isBlocked: boolean('is_blocked').default(false),
    metadata: jsonb('metadata'), // Additional user metadata
}, (table) => {
    return {
        whatsappIdIdx: index('users_whatsapp_id_idx').on(table.whatsappId),
        phoneNumberIdx: index('users_phone_number_idx').on(table.phoneNumber),
    };
});

/**
 * Conversations table - stores conversation sessions
 */
export const conversations = pgTable('conversations', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: integer('user_id').references(() => users.id).notNull(),
    whatsappConversationId: varchar('whatsapp_conversation_id', { length: 100 }),
    status: varchar('status', { length: 20 }).default('active'), // active, archived, closed
    lastMessageAt: timestamp('last_message_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    metadata: jsonb('metadata'), // Conversation-specific metadata
}, (table) => {
    return {
        userIdIdx: index('conversations_user_id_idx').on(table.userId),
        statusIdx: index('conversations_status_idx').on(table.status),
        lastMessageAtIdx: index('conversations_last_message_at_idx').on(table.lastMessageAt),
    };
});

/**
 * Messages table - stores all messages (incoming and outgoing)
 */
export const messages = pgTable('messages', {
    id: uuid('id').defaultRandom().primaryKey(),
    conversationId: uuid('conversation_id').references(() => conversations.id).notNull(),
    whatsappMessageId: varchar('whatsapp_message_id', { length: 100 }).unique(),
    direction: varchar('direction', { length: 10 }).notNull(), // 'inbound', 'outbound'
    messageType: varchar('message_type', { length: 20 }).notNull(), // 'text', 'image', 'audio', 'video', 'document', 'location', 'contact', 'interactive', 'button', 'system'
    content: text('content'), // Text content for text messages
    mediaUrl: text('media_url'), // URL for media files
    mediaType: varchar('media_type', { length: 50 }), // MIME type for media
    fileName: text('file_name'), // Original filename for documents
    caption: text('caption'), // Caption for media messages
    location: jsonb('location'), // Location data {latitude, longitude, name, address}
    contacts: jsonb('contacts'), // Contact information
    interactive: jsonb('interactive'), // Interactive message data (buttons, lists)
    context: jsonb('context'), // Message context (reply, forward info)
    status: varchar('status', { length: 20 }).default('sent'), // 'sent', 'delivered', 'read', 'failed'
    timestamp: timestamp('timestamp').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    metadata: jsonb('metadata'), // Additional message metadata
    error: text('error'), // Error message if status is 'failed'
}, (table) => {
    return {
        conversationIdIdx: index('messages_conversation_id_idx').on(table.conversationId),
        whatsappMessageIdIdx: index('messages_whatsapp_message_id_idx').on(table.whatsappMessageId),
        directionIdx: index('messages_direction_idx').on(table.direction),
        messageTypeIdx: index('messages_message_type_idx').on(table.messageType),
        statusIdx: index('messages_status_idx').on(table.status),
        timestampIdx: index('messages_timestamp_idx').on(table.timestamp),
    };
});

/**
 * Media files table - stores information about uploaded media files
 */
export const mediaFiles = pgTable('media_files', {
    id: uuid('id').defaultRandom().primaryKey(),
    messageId: uuid('message_id').references(() => messages.id),
    whatsappMediaId: varchar('whatsapp_media_id', { length: 100 }),
    originalUrl: text('original_url'), // Original WhatsApp media URL
    storedUrl: text('stored_url'), // Our server's stored URL
    fileName: text('file_name'),
    mimeType: varchar('mime_type', { length: 100 }),
    fileSize: integer('file_size'), // Size in bytes
    sha256: varchar('sha256', { length: 64 }), // WhatsApp provided hash
    uploadStatus: varchar('upload_status', { length: 20 }).default('pending'), // 'pending', 'uploaded', 'failed'
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    metadata: jsonb('metadata'), // Additional file metadata
}, (table) => {
    return {
        messageIdIdx: index('media_files_message_id_idx').on(table.messageId),
        whatsappMediaIdIdx: index('media_files_whatsapp_media_id_idx').on(table.whatsappMediaId),
        uploadStatusIdx: index('media_files_upload_status_idx').on(table.uploadStatus),
    };
});

/**
 * Message status updates table - tracks delivery status changes
 */
export const messageStatuses = pgTable('message_statuses', {
    id: uuid('id').defaultRandom().primaryKey(),
    messageId: uuid('message_id').references(() => messages.id).notNull(),
    status: varchar('status', { length: 20 }).notNull(), // 'sent', 'delivered', 'read', 'failed'
    timestamp: timestamp('timestamp').notNull(),
    recipientId: varchar('recipient_id', { length: 50 }),
    conversationInfo: jsonb('conversation_info'), // WhatsApp conversation metadata
    pricingInfo: jsonb('pricing_info'), // WhatsApp pricing information
    error: jsonb('error'), // Error details if status is 'failed'
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
    return {
        messageIdIdx: index('message_statuses_message_id_idx').on(table.messageId),
        statusIdx: index('message_statuses_status_idx').on(table.status),
        timestampIdx: index('message_statuses_timestamp_idx').on(table.timestamp),
    };
});

/**
 * Webhook logs table - stores webhook processing logs for debugging
 */
export const webhookLogs = pgTable('webhook_logs', {
    id: uuid('id').defaultRandom().primaryKey(),
    level: varchar('level', { length: 10 }).notNull(), // 'INFO', 'WARN', 'ERROR'
    source: varchar('source', { length: 50 }),
    message: text('message'),
    data: jsonb('data'), // Log data
    timestamp: timestamp('timestamp').defaultNow().notNull(),
    processingTimeMs: integer('processing_time_ms'),
    error: text('error'),
    stack: text('stack'),
}, (table) => {
    return {
        levelIdx: index('webhook_logs_level_idx').on(table.level),
        timestampIdx: index('webhook_logs_timestamp_idx').on(table.timestamp),
        sourceIdx: index('webhook_logs_source_idx').on(table.source),
    };
});

// Define relationships
export const usersRelations = relations(users, ({ many }) => ({
    conversations: many(conversations),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
    user: one(users, {
        fields: [conversations.userId],
        references: [users.id],
    }),
    messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one, many }) => ({
    conversation: one(conversations, {
        fields: [messages.conversationId],
        references: [conversations.id],
    }),
    mediaFiles: many(mediaFiles),
    statuses: many(messageStatuses),
}));

export const mediaFilesRelations = relations(mediaFiles, ({ one }) => ({
    message: one(messages, {
        fields: [mediaFiles.messageId],
        references: [messages.id],
    }),
}));

export const messageStatusesRelations = relations(messageStatuses, ({ one }) => ({
    message: one(messages, {
        fields: [messageStatuses.messageId],
        references: [messages.id],
    }),
}));

// Export types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type MediaFile = typeof mediaFiles.$inferSelect;
export type NewMediaFile = typeof mediaFiles.$inferInsert;
export type MessageStatus = typeof messageStatuses.$inferSelect;
export type NewMessageStatus = typeof messageStatuses.$inferInsert;
export type WebhookLog = typeof webhookLogs.$inferSelect;
export type NewWebhookLog = typeof webhookLogs.$inferInsert; 