import { database } from './database';
import {
    users, conversations, messages, mediaFiles, messageStatuses, webhookLogs,
    User, NewUser, Conversation, NewConversation, Message, NewMessage,
    MediaFile, NewMediaFile, MessageStatus, NewMessageStatus, WebhookLog, NewWebhookLog
} from './schema';
import { eq, desc, and } from 'drizzle-orm';
import { WebhookMessage, WebhookMessageStatus } from '@/app/api/webhook/types';

/**
 * Database Service for WhatsApp Bot
 * 
 * Provides high-level methods for storing and retrieving WhatsApp conversations,
 * messages, and related data using Drizzle ORM.
 */
export class DatabaseService {

    /**
     * Get or create a user by WhatsApp ID
     */
    async getOrCreateUser(whatsappId: string, profileName?: string, phoneNumber?: string): Promise<User> {
        try {
            // Try to find existing user
            const existingUser = await database
                .select()
                .from(users)
                .where(eq(users.whatsappId, whatsappId))
                .limit(1);

            if (existingUser.length > 0) {
                // Update profile name and phone number if provided
                if (profileName && existingUser[0].profileName !== profileName) {
                    await database
                        .update(users)
                        .set({
                            profileName,
                            phoneNumber: phoneNumber || null, // Convert undefined to null
                            updatedAt: new Date()
                        })
                        .where(eq(users.id, existingUser[0].id));

                    return {
                        ...existingUser[0],
                        profileName,
                        phoneNumber: phoneNumber || null // Convert undefined to null
                    };
                }
                return existingUser[0];
            }

            // Create new user
            const newUser: NewUser = {
                whatsappId,
                profileName,
                phoneNumber: phoneNumber || null, // Convert undefined to null
            };

            const createdUsers = await database
                .insert(users)
                .values(newUser)
                .returning();

            return createdUsers[0];
        } catch (error) {
            console.error('Error in getOrCreateUser:', error);
            throw error;
        }
    }

    /**
     * Get or create a conversation for a user
     */
    async getOrCreateConversation(userId: number, whatsappConversationId?: string): Promise<Conversation> {
        try {
            // Try to find active conversation for the user
            const existingConversation = await database
                .select()
                .from(conversations)
                .where(and(
                    eq(conversations.userId, userId),
                    eq(conversations.status, 'active')
                ))
                .orderBy(desc(conversations.lastMessageAt))
                .limit(1);

            if (existingConversation.length > 0) {
                return existingConversation[0];
            }

            // Create new conversation
            const newConversation: NewConversation = {
                userId,
                whatsappConversationId,
                status: 'active',
                lastMessageAt: new Date(),
            };

            const createdConversations = await database
                .insert(conversations)
                .values(newConversation)
                .returning();

            return createdConversations[0];
        } catch (error) {
            console.error('Error in getOrCreateConversation:', error);
            throw error;
        }
    }

    /**
     * Store an incoming message
     */
    async storeIncomingMessage(
        webhookMessage: WebhookMessage,
        conversationId: string,
        contactName?: string
    ): Promise<Message> {
        try {
            const messageData: NewMessage = {
                conversationId,
                whatsappMessageId: webhookMessage.id,
                direction: 'inbound',
                messageType: webhookMessage.type,
                content: webhookMessage.text?.body || null,
                caption: this.getMediaCaption(webhookMessage),
                location: webhookMessage.location ? {
                    latitude: webhookMessage.location.latitude,
                    longitude: webhookMessage.location.longitude,
                    name: webhookMessage.location.name,
                    address: webhookMessage.location.address
                } : null,
                contacts: webhookMessage.contacts || null,
                interactive: webhookMessage.interactive || null,
                context: webhookMessage.context ? {
                    forwarded: webhookMessage.context.forwarded,
                    frequently_forwarded: webhookMessage.context.frequently_forwarded,
                    from: webhookMessage.context.from,
                    id: webhookMessage.context.id
                } : null,
                timestamp: new Date(parseInt(webhookMessage.timestamp) * 1000),
                metadata: {
                    contactName,
                    originalPayload: webhookMessage
                }
            };

            // Handle media messages
            if (this.isMediaMessage(webhookMessage)) {
                const mediaInfo = this.getMediaInfo(webhookMessage);
                messageData.mediaType = mediaInfo.mime_type;
                messageData.fileName = mediaInfo.filename;
                messageData.metadata = {
                    ...(messageData.metadata || {}),
                    whatsappMediaId: mediaInfo.id,
                    sha256: mediaInfo.sha256
                };
            }

            const createdMessages = await database
                .insert(messages)
                .values(messageData)
                .returning();

            // Update conversation last message time
            await database
                .update(conversations)
                .set({
                    lastMessageAt: messageData.timestamp,
                    updatedAt: new Date()
                })
                .where(eq(conversations.id, conversationId));

            return createdMessages[0];
        } catch (error) {
            console.error('Error in storeIncomingMessage:', error);
            throw error;
        }
    }

    /**
     * Store an outgoing message
     */
    async storeOutgoingMessage(
        to: string,
        messageType: string,
        content: string,
        conversationId: string,
        whatsappMessageId?: string,
        replyToMessageId?: string
    ): Promise<Message> {
        try {
            const messageData: NewMessage = {
                conversationId,
                whatsappMessageId,
                direction: 'outbound',
                messageType,
                content,
                timestamp: new Date(),
                context: replyToMessageId ? { id: replyToMessageId } : null,
                metadata: {
                    recipient: to
                }
            };

            const createdMessages = await database
                .insert(messages)
                .values(messageData)
                .returning();

            // Update conversation last message time
            await database
                .update(conversations)
                .set({
                    lastMessageAt: new Date(),
                    updatedAt: new Date()
                })
                .where(eq(conversations.id, conversationId));

            return createdMessages[0];
        } catch (error) {
            console.error('Error in storeOutgoingMessage:', error);
            throw error;
        }
    }

    /**
     * Store message status update
     */
    async storeMessageStatus(statusUpdate: WebhookMessageStatus): Promise<MessageStatus> {
        try {
            const statusData: NewMessageStatus = {
                messageId: statusUpdate.id, // This should be mapped to our message ID
                status: statusUpdate.status,
                timestamp: new Date(parseInt(statusUpdate.timestamp) * 1000),
                recipientId: statusUpdate.recipient_id,
                conversationInfo: statusUpdate.conversation || null,
                pricingInfo: statusUpdate.pricing || null,
                error: statusUpdate.errors || null
            };

            const createdStatuses = await database
                .insert(messageStatuses)
                .values(statusData)
                .returning();

            // Update the message status
            await database
                .update(messages)
                .set({
                    status: statusUpdate.status,
                    updatedAt: new Date()
                })
                .where(eq(messages.whatsappMessageId, statusUpdate.id));

            return createdStatuses[0];
        } catch (error) {
            console.error('Error in storeMessageStatus:', error);
            throw error;
        }
    }

    /**
     * Store media file information
     */
    async storeMediaFile(
        messageId: string,
        whatsappMediaId: string,
        originalUrl: string,
        storedUrl: string,
        fileName: string,
        mimeType: string,
        fileSize?: number,
        sha256?: string
    ): Promise<MediaFile> {
        try {
            const mediaData: NewMediaFile = {
                messageId,
                whatsappMediaId,
                originalUrl,
                storedUrl,
                fileName,
                mimeType,
                fileSize,
                sha256,
                uploadStatus: 'uploaded'
            };

            const createdMediaFiles = await database
                .insert(mediaFiles)
                .values(mediaData)
                .returning();

            // Update message with media URL
            await database
                .update(messages)
                .set({
                    mediaUrl: storedUrl,
                    updatedAt: new Date()
                })
                .where(eq(messages.id, messageId));

            return createdMediaFiles[0];
        } catch (error) {
            console.error('Error in storeMediaFile:', error);
            throw error;
        }
    }

    /**
     * Get conversation history
     */
    async getConversationHistory(conversationId: string, limit: number = 50, offset: number = 0): Promise<Message[]> {
        try {
            return await database
                .select()
                .from(messages)
                .where(eq(messages.conversationId, conversationId))
                .orderBy(desc(messages.timestamp))
                .limit(limit)
                .offset(offset);
        } catch (error) {
            console.error('Error in getConversationHistory:', error);
            throw error;
        }
    }

    /**
     * Get user conversations
     */
    async getUserConversations(userId: number, limit: number = 20): Promise<Conversation[]> {
        try {
            return await database
                .select()
                .from(conversations)
                .where(eq(conversations.userId, userId))
                .orderBy(desc(conversations.lastMessageAt))
                .limit(limit);
        } catch (error) {
            console.error('Error in getUserConversations:', error);
            throw error;
        }
    }

    /**
     * Log webhook events
     */
    async logWebhookEvent(
        level: 'INFO' | 'WARN' | 'ERROR',
        message: string,
        data?: any,
        source?: string,
        processingTimeMs?: number,
        error?: string,
        stack?: string
    ): Promise<WebhookLog> {
        try {
            const logData: NewWebhookLog = {
                level,
                message,
                data,
                source,
                processingTimeMs,
                error,
                stack
            };

            const createdLogs = await database
                .insert(webhookLogs)
                .values(logData)
                .returning();

            return createdLogs[0];
        } catch (error) {
            console.error('Error in logWebhookEvent:', error);
            throw error;
        }
    }

    /**
     * Get message by WhatsApp message ID
     */
    async getMessageByWhatsAppId(whatsappMessageId: string): Promise<Message | null> {
        try {
            const result = await database
                .select()
                .from(messages)
                .where(eq(messages.whatsappMessageId, whatsappMessageId))
                .limit(1);

            return result.length > 0 ? result[0] : null;
        } catch (error) {
            console.error('Error in getMessageByWhatsAppId:', error);
            throw error;
        }
    }

    /**
     * Archive conversation
     */
    async archiveConversation(conversationId: string): Promise<void> {
        try {
            await database
                .update(conversations)
                .set({
                    status: 'archived',
                    updatedAt: new Date()
                })
                .where(eq(conversations.id, conversationId));
        } catch (error) {
            console.error('Error in archiveConversation:', error);
            throw error;
        }
    }

    // Helper methods
    private isMediaMessage(message: WebhookMessage): boolean {
        return ['image', 'audio', 'video', 'document', 'sticker'].includes(message.type);
    }

    private getMediaInfo(message: WebhookMessage): any {
        switch (message.type) {
            case 'image': return message.image;
            case 'audio': return message.audio;
            case 'video': return message.video;
            case 'document': return message.document;
            case 'sticker': return message.sticker;
            default: return null;
        }
    }

    private getMediaCaption(message: WebhookMessage): string | null {
        const mediaInfo = this.getMediaInfo(message);
        return mediaInfo?.caption || null;
    }
}
