import { fetchQuery, fetchMutation } from "convex/nextjs";
import { api } from "../convex/_generated/api";
import {
    User, NewUser, Conversation, NewConversation, Message, NewMessage,
    MediaFile, NewMediaFile, NewMessageStatus
} from './schema';
import { WebhookMessage, WebhookMessageStatus } from '@/app/api/webhook/types';
import { Id } from "../convex/_generated/dataModel";
import { Doc } from "../convex/_generated/dataModel";
import { MessageType, UploadStatus } from '@/convex/schemaUnions';

/**
 * Database Service for WhatsApp Bot
 * 
 * Provides high-level methods for storing and retrieving WhatsApp conversations,
 * messages, and related data using Convex.
 */
export class DatabaseService {

    /**
     * Get or create a user by WhatsApp ID
     */
    async getOrCreateUser(whatsappId: string, profileName?: string, phoneNumber?: string): Promise<User> {
        try {
            const user = await fetchMutation(api.users.getOrCreateUser, {
                whatsappId,
                profileName,
                phoneNumber,
            });

            if (!user) {
                throw new Error('Failed to create or retrieve user');
            }

            return user;
        } catch (error) {
            console.error('Error in getOrCreateUser:', error);
            throw error;
        }
    }

    /**
     * Get or create a conversation for a user
     */
    async getOrCreateConversation(userId: Id<"users">, userName: string): Promise<Conversation> {
        try {
            const conversation = await fetchMutation(api.conversations.getOrCreateConversation, {
                userId,
                userName,
            });

            if (!conversation) {
                throw new Error('Failed to create or retrieve conversation');
            }

            return conversation;
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
        conversationId: Id<"conversations">,
        userName: string
    ): Promise<Message> {
        try {
            // ✅ VALIDATE MESSAGE CONTENT - Prevent storing completely empty messages
            const messageContent = webhookMessage.text?.body?.trim();

            // Skip storing completely empty messages (but log them for debugging)
            if (!messageContent && !this.isMediaMessage(webhookMessage) && !webhookMessage.interactive && !webhookMessage.location && !webhookMessage.contacts) {
                console.warn('Attempting to store completely empty message - this should be handled upstream', {
                    messageId: webhookMessage.id,
                    messageType: webhookMessage.type,
                    from: webhookMessage.from,
                    timestamp: webhookMessage.timestamp
                });
                throw new Error('Cannot store message with no content, media, interactive elements, location, or contacts');
            }

            // Determine Convex-compatible messageType
            const messageType: MessageType = webhookMessage.type === 'contacts'
                ? 'contact'
                : (webhookMessage.type as MessageType);
            const commonData = {
                conversationId,
                whatsappMessageId: webhookMessage.id,
                senderRole: 'user' as const,
                senderName: userName,
                messageType,
                content: messageContent,
                caption: this.getMediaCaption(webhookMessage),
                location: webhookMessage.location ? {
                    latitude: webhookMessage.location.latitude,
                    longitude: webhookMessage.location.longitude,
                    name: webhookMessage.location.name,
                    address: webhookMessage.location.address
                } : undefined,
                contacts: webhookMessage.contacts,
                interactive: webhookMessage.interactive,
                context: webhookMessage.context ? {
                    forwarded: webhookMessage.context.forwarded,
                    frequently_forwarded: webhookMessage.context.frequently_forwarded,
                    from: webhookMessage.context.from,
                    id: webhookMessage.context.id
                } : undefined,
                timestamp: parseInt(webhookMessage.timestamp) * 1000,
            };

            if (this.isMediaMessage(webhookMessage)) {
                const mediaInfo = this.getMediaInfo(webhookMessage);
                const messageData = {
                    ...commonData,
                    mediaType: mediaInfo.mime_type,
                    fileName: mediaInfo.filename,
                    metadata: {
                        contactName: userName,
                        originalPayload: webhookMessage,
                        whatsappMediaId: mediaInfo.id,
                        sha256: mediaInfo.sha256,
                    },
                };
                const message = await fetchMutation(api.messages.storeIncomingMessage, messageData);
                if (!message) {
                    throw new Error('Failed to store incoming message');
                }
                return message;
            } else {
                const messageData = {
                    ...commonData,
                    metadata: {
                        contactName: userName,
                        originalPayload: webhookMessage,
                    },
                };
                const message = await fetchMutation(api.messages.storeIncomingMessage, messageData);
                if (!message) {
                    throw new Error('Failed to store incoming message');
                }
                return message;
            }
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
        messageType: MessageType,
        content: string,
        conversationId: Id<"conversations">,
        senderRole: 'bot' | 'admin',
        senderName: string,
        whatsappMessageId?: string,
        replyToMessageId?: string
    ): Promise<Message> {
        try {
            const messageData = {
                conversationId,
                whatsappMessageId,
                senderRole,
                senderName,
                messageType,
                content,
                context: replyToMessageId ? { id: replyToMessageId } : undefined,
                metadata: {
                    to,
                    bot_generated: true
                }
            };

            const message = await fetchMutation(api.messages.storeOutgoingMessage, messageData);

            if (!message) {
                throw new Error('Failed to store outgoing message');
            }

            return message;
        } catch (error) {
            console.error('Error in storeOutgoingMessage:', error);
            throw error;
        }
    }

    /**
     * Store media file information
     */
    async storeMediaFile(
        messageId: Id<"messages">,
        whatsappMediaId: string,
        storedUrl: string,
        fileName: string,
        mimeType: string,
        fileSize?: number,
        sha256?: string,
        storageId?: Id<"_storage">
    ): Promise<MediaFile> {
        try {
            const mediaData = {
                messageId,
                whatsappMediaId,
                fileName,
                mimeType,
                fileSize,
                sha256,
                uploadStatus: "uploaded" as UploadStatus,
                storageId,
                storedUrl  // Include storedUrl parameter
            };

            const mediaFile = await fetchMutation(api.mediaFiles.storeMediaFile, mediaData);

            if (!mediaFile) {
                throw new Error('Failed to store media file');
            }

            return mediaFile;
        } catch (error) {
            console.error('Error in storeMediaFile:', error);
            throw error;
        }
    }

    // /**
    //  * Get conversation history
    //  */
    // async getConversationHistory(conversationId: Id<"conversations">, limit: number = 50, offset: number = 0): Promise<Message[]> {
    //     try {
    //         return await fetchQuery(api.messages.getConversationHistory, {
    //             conversationId,
    //             limit,
    //             offset
    //         });
    //     } catch (error) {
    //         console.error('Error in getConversationHistory:', error);
    //         throw error;
    //     }
    // }

    /**
     * Get user conversations
     */
    async getUserConversations(userId: Id<"users">, limit: number = 20): Promise<Conversation[]> {
        try {
            return await fetchQuery(api.conversations.getUserConversations, {
                userId,
                limit
            });
        } catch (error) {
            console.error('Error in getUserConversations:', error);
            throw error;
        }
    }

    /**
     * Get message by WhatsApp ID
     */
    async getMessageByWhatsAppId(whatsappMessageId: string): Promise<Message | null> {
        try {
            return await fetchQuery(api.messages.getMessageByWhatsAppId, {
                whatsappMessageId
            });
        } catch (error) {
            console.error('Error in getMessageByWhatsAppId:', error);
            return null;
        }
    }

    /**
     * Update message with media URL for UI rendering
     */
    async updateMessageWithMediaUrl(messageId: Id<"messages">, mediaUrl: string): Promise<void> {
        try {
            await fetchMutation(api.messages.updateMessageMediaUrl, {
                messageId,
                mediaUrl
            });
        } catch (error) {
            console.error('Error in updateMessageWithMediaUrl:', error);
            throw error;
        }
    }

    /**
     * Archive conversation
     */
    async archiveConversation(conversationId: Id<"conversations">): Promise<void> {
        try {
            await fetchMutation(api.conversations.archiveConversation, {
                conversationId
            });
        } catch (error) {
            console.error('Error in archiveConversation:', error);
            throw error;
        }
    }

    /**
     * Helper method to check if a message contains media
     */
    private isMediaMessage(message: WebhookMessage): boolean {
        return ['image', 'audio', 'video', 'document'].includes(message.type);
    }

    /**
     * Helper method to extract media information from webhook message
     */
    private getMediaInfo(message: WebhookMessage): any {
        return message.image || message.audio || message.video || message.document || {};
    }

    /**
     * Helper method to extract media caption from webhook message
     */
    private getMediaCaption(message: WebhookMessage): string | undefined {
        if (message.image?.caption) return message.image.caption;
        if (message.video?.caption) return message.video.caption;
        if (message.document?.caption) return message.document.caption;
        return undefined;
    }

    /**
     * Get media files by message ID
     */
    async getMediaFilesByMessageId(messageId: Id<"messages">) {
        try {
            return await fetchQuery(api.mediaFiles.getMediaFilesByMessageId, {
                messageId
            });
        } catch (error) {
            console.error('Error in getMediaFilesByMessageId:', error);
            throw error;
        }
    }

    async incrementUnreadCount(conversationId: Id<"conversations">): Promise<void> {
        const conversation = await this.getConversationById(conversationId);
        if (conversation) {
            await fetchMutation(api.conversations.updateConversation, {
                conversationId,
                unreadCount: (conversation.unreadCount || 0) + 1,
            });
        }
    }

    async getConversationById(conversationId: Id<"conversations">): Promise<Doc<"conversations"> | null> {
        return await fetchQuery(api.conversations.getConversationById, { conversationId });
    }
}
