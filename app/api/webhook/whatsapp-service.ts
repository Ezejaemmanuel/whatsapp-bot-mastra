import { WhatsAppCloudApiClient } from '@/whatsapp/whatsapp-client';
import { WebhookMessage, WebhookMessageStatus, WebhookPayload } from './types';
import { logWebhookEvent, extractMessageInfo, extractStatusInfo } from './utils';
import { DatabaseService } from '@/lib/database-service';
import { MediaUploadService } from '@/lib/media-upload-service';

/**
 * WhatsApp Webhook Service
 * 
 * Service class that integrates webhook processing with the existing WhatsApp API client
 * for sending responses and managing conversations.
 */
export class WhatsAppWebhookService {
    private whatsappClient: WhatsAppCloudApiClient;
    private phoneNumberId: string;
    private databaseService: DatabaseService;
    private mediaUploadService: MediaUploadService;

    constructor(accessToken?: string, phoneNumberId?: string) {
        this.whatsappClient = new WhatsAppCloudApiClient({
            accessToken: accessToken || process.env.WHATSAPP_ACCESS_TOKEN
        });

        this.phoneNumberId = phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID || '';
        this.databaseService = new DatabaseService();

        // Initialize MediaUploadService with UploadThing integration
        this.mediaUploadService = new MediaUploadService(
            accessToken || process.env.WHATSAPP_ACCESS_TOKEN
        );

        if (!this.phoneNumberId) {
            logWebhookEvent('WARN', 'Phone number ID not configured');
        }
    }

    /**
     * Process incoming webhook message
     */
    async processIncomingMessage(message: WebhookMessage, contactName?: string): Promise<void> {
        try {
            const messageInfo = extractMessageInfo(message);

            logWebhookEvent('INFO', 'Processing incoming message', {
                messageId: messageInfo.id,
                from: messageInfo.from,
                type: messageInfo.type,
                text: messageInfo.text
            });

            // Get or create user and conversation
            const user = await this.databaseService.getOrCreateUser(
                messageInfo.from,
                contactName
            );

            const conversation = await this.databaseService.getOrCreateConversation(user.id);

            // Store the incoming message in database
            const storedMessage = await this.databaseService.storeIncomingMessage(
                message,
                conversation.id,
                contactName
            );

            // Handle media messages - download and store files
            if (this.isMediaMessage(message)) {
                await this.processAndStoreMedia(message, storedMessage.id);
            }

            // Mark message as read
            await this.markMessageAsRead(messageInfo.id);

            // Process different message types
            switch (messageInfo.type) {
                case 'text':
                    await this.handleTextMessage(messageInfo, conversation.id);
                    break;
                case 'image':
                case 'audio':
                case 'video':
                case 'document':
                    await this.handleMediaMessage(messageInfo, conversation.id);
                    break;
                case 'interactive':
                    await this.handleInteractiveMessage(messageInfo, conversation.id);
                    break;
                case 'location':
                    await this.handleLocationMessage(messageInfo, conversation.id);
                    break;
                case 'contacts':
                    await this.handleContactMessage(messageInfo, conversation.id);
                    break;
                default:
                    logWebhookEvent('INFO', `Unhandled message type: ${messageInfo.type}`);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logWebhookEvent('ERROR', 'Error processing incoming message', {
                error: errorMessage,
                messageId: message.id
            });

            // Log error to database
            await this.databaseService.logWebhookEvent(
                'ERROR',
                'Error processing incoming message',
                { messageId: message.id },
                'WhatsAppWebhookService',
                undefined,
                errorMessage
            );
        }
    }

    /**
     * Process message status update
     */
    async processStatusUpdate(status: WebhookMessageStatus): Promise<void> {
        try {
            const statusInfo = extractStatusInfo(status);

            logWebhookEvent('INFO', 'Processing status update', {
                messageId: statusInfo.messageId,
                status: statusInfo.status,
                recipientId: statusInfo.recipientId
            });

            // Handle different status types
            switch (statusInfo.status) {
                case 'sent':
                    await this.handleMessageSent(statusInfo);
                    break;
                case 'delivered':
                    await this.handleMessageDelivered(statusInfo);
                    break;
                case 'read':
                    await this.handleMessageRead(statusInfo);
                    break;
                case 'failed':
                    await this.handleMessageFailed(statusInfo);
                    break;
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logWebhookEvent('ERROR', 'Error processing status update', {
                error: errorMessage,
                statusId: status.id
            });
        }
    }

    /**
     * Send a text reply to a message
     */
    async sendTextReply(to: string, text: string, replyToMessageId?: string): Promise<void> {
        try {
            if (replyToMessageId) {
                await this.whatsappClient.messages.sendReply({
                    to,
                    text,
                    replyToMessageId
                });
            } else {
                await this.whatsappClient.messages.sendText({

                    to,
                    text
                });
            }

            logWebhookEvent('INFO', 'Text message sent successfully', {
                to,
                textPreview: text.substring(0, 50),
                isReply: !!replyToMessageId
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logWebhookEvent('ERROR', 'Failed to send text message', {
                error: errorMessage,
                to,
                textPreview: text.substring(0, 50)
            });
            throw error;
        }
    }

    /**
     * Send an interactive button message
     */
    async sendButtonMessage(
        to: string,
        bodyText: string,
        buttons: Array<{ id: string; title: string }>,
        headerText?: string,
        footerText?: string
    ): Promise<void> {
        try {
            await this.whatsappClient.messages.sendInteractiveButtons({
                to,
                bodyText,
                buttons,
                headerText,
                footerText
            });

            logWebhookEvent('INFO', 'Button message sent successfully', {
                to,
                bodyText: bodyText.substring(0, 50),
                buttonCount: buttons.length
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logWebhookEvent('ERROR', 'Failed to send button message', {
                error: errorMessage,
                to
            });
            throw error;
        }
    }

    /**
     * Send a template message
     */
    async sendTemplateMessage(
        to: string,
        templateName: string,
        languageCode: string,
        components?: any[]
    ): Promise<void> {
        try {
            await this.whatsappClient.messages.sendTemplate({
                to,
                templateName,
                languageCode,
                components
            });

            logWebhookEvent('INFO', 'Template message sent successfully', {
                to,
                templateName,
                languageCode
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logWebhookEvent('ERROR', 'Failed to send template message', {
                error: errorMessage,
                to,
                templateName
            });
            throw error;
        }
    }

    /**
     * Mark a message as read
     */
    async markMessageAsRead(messageId: string): Promise<void> {
        try {
            await this.whatsappClient.messages.markAsRead({
                messageId
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logWebhookEvent('WARN', 'Failed to mark message as read', {
                error: errorMessage,
                messageId
            });
            // Don't throw error for read receipts as it's not critical
        }
    }

    /**
     * Handle text messages
     */
    private async handleTextMessage(messageInfo: ReturnType<typeof extractMessageInfo>, conversationId: string): Promise<void> {
        // Generic auto-response for all text messages
        const response = 'Thank you for your message! This is an automated response. We have received your message and will get back to you soon.';

        await this.sendTextReply(
            messageInfo.from,
            response,
            messageInfo.id
        );

        // Store outgoing message in database
        await this.databaseService.storeOutgoingMessage(
            messageInfo.from,
            'text',
            response,
            conversationId,
            undefined,
            messageInfo.id
        );
    }

    /**
     * Handle media messages
     */
    private async handleMediaMessage(messageInfo: ReturnType<typeof extractMessageInfo>, conversationId: string): Promise<void> {
        logWebhookEvent('INFO', 'Media message received', {
            type: messageInfo.type,
            mediaInfo: messageInfo.mediaInfo
        });

        // Example response to media
        const response = `Thank you for sharing the ${messageInfo.type}!`;

        await this.sendTextReply(
            messageInfo.from,
            response,
            messageInfo.id
        );

        // Store outgoing message in database
        await this.databaseService.storeOutgoingMessage(
            messageInfo.from,
            'text',
            response,
            conversationId,
            undefined,
            messageInfo.id
        );
    }

    /**
     * Handle interactive messages (button/list replies)
     */
    private async handleInteractiveMessage(messageInfo: ReturnType<typeof extractMessageInfo>, conversationId: string): Promise<void> {
        logWebhookEvent('INFO', 'Interactive message received', {
            text: messageInfo.text
        });

        // Handle button/list responses
        const response = `You selected: ${messageInfo.text}`;

        await this.sendTextReply(
            messageInfo.from,
            response,
            messageInfo.id
        );

        // Store outgoing message in database
        await this.databaseService.storeOutgoingMessage(
            messageInfo.from,
            'text',
            response,
            conversationId,
            undefined,
            messageInfo.id
        );
    }

    /**
     * Handle location messages
     */
    private async handleLocationMessage(messageInfo: ReturnType<typeof extractMessageInfo>, conversationId: string): Promise<void> {
        const response = 'Thank you for sharing your location!';

        await this.sendTextReply(
            messageInfo.from,
            response,
            messageInfo.id
        );

        // Store outgoing message in database
        await this.databaseService.storeOutgoingMessage(
            messageInfo.from,
            'text',
            response,
            conversationId,
            undefined,
            messageInfo.id
        );
    }

    /**
     * Handle contact messages
     */
    private async handleContactMessage(messageInfo: ReturnType<typeof extractMessageInfo>, conversationId: string): Promise<void> {
        const response = 'Thank you for sharing the contact!';

        await this.sendTextReply(
            messageInfo.from,
            response,
            messageInfo.id
        );

        // Store outgoing message in database
        await this.databaseService.storeOutgoingMessage(
            messageInfo.from,
            'text',
            response,
            conversationId,
            undefined,
            messageInfo.id
        );
    }

    /**
     * Handle message sent status
     */
    private async handleMessageSent(statusInfo: ReturnType<typeof extractStatusInfo>): Promise<void> {
        logWebhookEvent('INFO', 'Message sent successfully', {
            messageId: statusInfo.messageId
        });
    }

    /**
     * Handle message delivered status
     */
    private async handleMessageDelivered(statusInfo: ReturnType<typeof extractStatusInfo>): Promise<void> {
        logWebhookEvent('INFO', 'Message delivered', {
            messageId: statusInfo.messageId
        });
    }

    /**
     * Handle message read status
     */
    private async handleMessageRead(statusInfo: ReturnType<typeof extractStatusInfo>): Promise<void> {
        logWebhookEvent('INFO', 'Message read by recipient', {
            messageId: statusInfo.messageId
        });
    }

    /**
     * Handle message failed status
     */
    private async handleMessageFailed(statusInfo: ReturnType<typeof extractStatusInfo>): Promise<void> {
        logWebhookEvent('ERROR', 'Message delivery failed', {
            messageId: statusInfo.messageId,
            recipientId: statusInfo.recipientId
        });
    }

    /**
     * Process complete webhook payload
     */
    async processWebhookPayload(payload: WebhookPayload): Promise<void> {
        try {
            for (const entry of payload.entry) {
                for (const change of entry.changes) {
                    // Process messages
                    if (change.value.messages) {
                        for (const message of change.value.messages) {
                            await this.processIncomingMessage(message);
                        }
                    }

                    // Process status updates
                    if (change.value.statuses) {
                        for (const status of change.value.statuses) {
                            await this.processStatusUpdate(status);
                        }
                    }

                    // Log errors
                    if (change.value.errors) {
                        for (const error of change.value.errors) {
                            logWebhookEvent('ERROR', 'WhatsApp API error', {
                                errorCode: error.code,
                                errorTitle: error.title,
                                errorMessage: error.message
                            });
                        }
                    }
                }
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logWebhookEvent('ERROR', 'Error processing webhook payload', {
                error: errorMessage
            });
            throw error;
        }
    }

    /**
     * Get the underlying WhatsApp client for advanced operations
     */
    getClient(): WhatsAppCloudApiClient {
        return this.whatsappClient;
    }

    /**
     * Update configuration
     */
    updateConfig(accessToken?: string, phoneNumberId?: string): void {
        if (accessToken) {
            this.whatsappClient.updateAccessToken(accessToken);
        }
        if (phoneNumberId) {
            this.phoneNumberId = phoneNumberId;
        }
    }

    /**
     * Check if message is a media message
     */
    private isMediaMessage(message: WebhookMessage): boolean {
        return ['image', 'audio', 'video', 'document', 'sticker'].includes(message.type);
    }

    /**
     * Process and store media files using UploadThing
     * Downloads media from WhatsApp and uploads to UploadThing CDN
     */
    private async processAndStoreMedia(message: WebhookMessage, messageId: string): Promise<void> {
        try {
            const mediaInfo = this.getMediaInfo(message);
            if (!mediaInfo || !mediaInfo.id) {
                logWebhookEvent('WARN', 'No media ID found in message', { messageId });
                return;
            }

            // Download from WhatsApp and upload to UploadThing CDN
            const uploadResult = await this.mediaUploadService.processMediaMessage(
                mediaInfo.id,
                mediaInfo.filename,
                mediaInfo.mime_type,
                mediaInfo.sha256
            );

            if (uploadResult.success && uploadResult.storedUrl) {
                // Store media file information in database with UploadThing CDN URL
                await this.databaseService.storeMediaFile(
                    messageId,
                    mediaInfo.id,
                    '', // originalUrl - we don't store the temporary WhatsApp URL
                    uploadResult.storedUrl, // This is now a permanent UploadThing CDN URL
                    uploadResult.fileName || mediaInfo.filename || 'unknown',
                    mediaInfo.mime_type,
                    uploadResult.fileSize,
                    mediaInfo.sha256
                );

                logWebhookEvent('INFO', 'Media file processed and uploaded to UploadThing CDN', {
                    messageId
                });
            } else {
                logWebhookEvent('ERROR', 'Failed to process media file', {
                    messageId,
                    error: uploadResult.error
                });
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logWebhookEvent('ERROR', 'Error processing media file', {
                messageId,
                error: errorMessage
            });
        }
    }

    /**
     * Get media information from message
     */
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
} 