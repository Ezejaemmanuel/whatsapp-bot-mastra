import { WhatsAppCloudApiClient } from '@/whatsapp/whatsapp-client';
import { DatabaseService } from '@/lib/database-service';
import { MediaUploadService } from '@/lib/media-upload-service';
import { WhatsAppClientService } from '@/whatsapp/whatsapp-client-service';
import { User, Conversation, Message } from '@/lib/schema';
import { WebhookPayload, WebhookMessage } from './types';
import {
    logWebhookEvent,
    logError,
    logWarning,
    logInfo,
    extractMessageInfo
} from './utils';
import {
    handleTextMessage,
    handleMediaMessage,
    handleLocationMessage,
    handleContactMessage
} from './message-handlers';
import { processStatusUpdate } from './status-handlers';
import { markMessageAsRead } from './response-sender';
import { sendErrorResponse } from './error-handler';
import { isMediaMessage } from './media-processor';
import { sendDebugMessage } from '@/mastra/tools/utils';

/**
 * Service configuration for webhook processing
 */
export interface WebhookServiceConfig {
    accessToken?: string;
    phoneNumberId?: string;
}

/**
 * Initialize webhook service dependencies
 */
export interface WebhookServiceInstance {
    whatsappClient: WhatsAppCloudApiClient;
    databaseService: DatabaseService;
    mediaUploadService: MediaUploadService;
    phoneNumberId: string;
    clientService: WhatsAppClientService;
}

export function initializeWebhookService(config: WebhookServiceConfig = {}): WebhookServiceInstance {
    try {
        // Use provided parameters or fall back to environment configuration
        const envAccessToken = process.env.WHATSAPP_ACCESS_TOKEN;
        const envPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

        if (!config.accessToken && !envAccessToken) {
            throw new Error('Missing required environment variable: WHATSAPP_ACCESS_TOKEN (WhatsApp Business API access token from Meta Business)');
        }

        if (!config.phoneNumberId && !envPhoneNumberId) {
            throw new Error('Missing required environment variable: WHATSAPP_PHONE_NUMBER_ID (WhatsApp Business phone number ID from Meta Business)');
        }

        const finalAccessToken = config.accessToken || envAccessToken || '';
        const finalPhoneNumberId = config.phoneNumberId || envPhoneNumberId || '';

        // Get singleton instance and initialize client
        const clientService = WhatsAppClientService.getInstance();
        const whatsappClient = clientService.getClient(finalAccessToken, finalPhoneNumberId);

        const databaseService = new DatabaseService();
        const mediaUploadService = new MediaUploadService(finalAccessToken);

        logInfo('WhatsApp Webhook Service initialized successfully', {
            phoneNumberIdConfigured: !!finalPhoneNumberId,
            accessTokenConfigured: !!finalAccessToken,
            serviceInitialized: true
        });

        return {
            whatsappClient,
            databaseService,
            mediaUploadService,
            phoneNumberId: finalPhoneNumberId,
            clientService
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error';
        logError('Failed to initialize WhatsApp Webhook Service', error as Error, {
            operation: 'initializeWebhookService',
            providedAccessToken: !!config.accessToken,
            providedPhoneNumberId: !!config.phoneNumberId
        });
        throw new Error(`WhatsApp Webhook Service initialization failed: ${errorMessage}`);
    }
}

/**
 * Process incoming webhook message with comprehensive error handling
 */
export async function processIncomingMessage(
    whatsappClient: WhatsAppCloudApiClient,
    databaseService: DatabaseService,
    mediaUploadService: MediaUploadService,
    message: WebhookMessage,
    contactName?: string
): Promise<void> {
    const botPhoneNumber = process.env.WHATSAPP_PHONE_NUMBER;
    await sendDebugMessage(message.from, 'DEBUG: processIncomingMessage', {
        messageId: message.id,
        from: message.from,
        type: message.type,
        botPhoneNumber,
        fullMessage: message
    });

    if (message.from === botPhoneNumber) {
        logInfo('Ignoring outgoing message received by webhook', {
            messageId: message.id,
            from: message.from,
            type: message.type,
            botPhoneNumber: botPhoneNumber
        });
        return;
    }

    // Check for duplicate messages before processing
    try {
        const existingMessage = await databaseService.getMessageByWhatsAppId(message.id);
        if (existingMessage) {
            logInfo('Ignoring duplicate message', {
                messageId: message.id,
                from: message.from,
                type: message.type,
                existingMessageId: existingMessage._id,
                existingTimestamp: existingMessage.timestamp,
                operation: 'processIncomingMessage:duplicate_check'
            });
            return; // Exit early for duplicate messages
        }
    } catch (duplicateCheckError) {
        logWarning('Failed to check for duplicate messages, continuing with processing', {
            messageId: message.id,
            from: message.from,
            error: duplicateCheckError instanceof Error ? duplicateCheckError.message : String(duplicateCheckError),
            operation: 'processIncomingMessage:duplicate_check'
        });
        // Continue processing even if duplicate check fails
    }

    let messageInfo: ReturnType<typeof extractMessageInfo>;
    let user: User;
    let conversation: Conversation;
    let storedMessage: Message;

    try {
        // Step 1: Extract and validate message info
        try {
            messageInfo = extractMessageInfo(message);

            // Validate essential message data
            if (!messageInfo.id || !messageInfo.from || !messageInfo.type) {
                throw new Error('Invalid message structure: missing required fields');
            }

            logInfo('Processing incoming message', {
                messageId: messageInfo.id,
                from: messageInfo.from,
                messageType: messageInfo.type,
                text: messageInfo.text,
                timestamp: messageInfo.timestamp,
                contactName,
                hasMediaInfo: !!messageInfo.mediaInfo,
                isReply: messageInfo.isReply,
                isForwarded: messageInfo.isForwarded
            });
        } catch (extractError) {
            logError('Failed to extract message info', extractError as Error, {
                messageId: message.id,
                messageType: message.type,
                from: message.from,
                operation: 'processIncomingMessage:extract'
            });
            // Send error response and return early
            await sendErrorResponse(whatsappClient, message.from, 'Sorry, I couldn\'t process your message format. Please try again.', extractError);
            return;
        }

        // Step 2: Get or create user and conversation with retry logic
        try {
            user = await databaseService.getOrCreateUser(
                messageInfo.from,
                contactName
            );
            const userName = user.profileName || user.phoneNumber || messageInfo.from;
            conversation = await databaseService.getOrCreateConversation(user._id, userName);

            // Check who is in charge of the conversation
            if (conversation && conversation.inCharge === 'admin') {
                logInfo('Conversation handled by admin, bot will not respond', {
                    conversationId: conversation._id,
                    userId: user._id,
                    messageId: messageInfo.id,
                });
                // Store the message but do not proceed to agent processing
                await databaseService.storeIncomingMessage(
                    message,
                    conversation._id,
                    userName,
                );
                return; // Exit processing
            }

        } catch (userError) {
            logError('Failed to get/create user or conversation', userError as Error, {
                messageId: messageInfo.id,
                from: messageInfo.from,
                operation: 'processIncomingMessage:user_conversation'
            });
            // Send error response and return early
            await sendErrorResponse(whatsappClient, messageInfo.from, 'I\'m having trouble accessing your account. Please try again in a moment.', userError);
            return;
        }

        // Step 3: Store incoming message with fallback
        try {
            const userName = user.profileName || user.phoneNumber || messageInfo.from;
            storedMessage = await databaseService.storeIncomingMessage(
                message,
                conversation._id,
                userName,
            );
        } catch (storeError) {
            logError('Failed to store incoming message', storeError as Error, {
                messageId: messageInfo.id,
                from: messageInfo.from,
                messageType: messageInfo.type,
                conversationId: conversation._id,
                operation: 'processIncomingMessage:store_message'
            });

            // Continue processing even if storage fails - we can still respond to user
            logWarning('Continuing message processing without database storage', {
                messageId: messageInfo.id,
                from: messageInfo.from,
                operation: 'processIncomingMessage:fallback_mode'
            });

            // Create a minimal stored message object for processing
            storedMessage = {
                _id: `fallback_${messageInfo.id}` as any,
                _creationTime: Date.now(),
                conversationId: conversation._id,
                whatsappMessageId: messageInfo.id,
                direction: 'inbound' as const,
                senderRole: 'user' as const,
                senderName: user.profileName || user.phoneNumber || messageInfo.from,
                messageType: messageInfo.type,
                content: messageInfo.text || undefined,
                timestamp: parseInt(messageInfo.timestamp) * 1000
            };
        }

    //     // Step 4: Mark message as read (non-blocking)
    //   await  markMessageAsRead(whatsappClient, messageInfo.id, '').catch(readError => {
    //         logWarning('Failed to mark message as read (non-critical)', {
    //             messageId: messageInfo.id,
    //             error: readError instanceof Error ? readError.message : String(readError),
    //             operation: 'processIncomingMessage:mark_read'
    //         });
    //     });

        // Step 5: Process message based on type
        try {
            logInfo('Processing message type', {
                messageType: messageInfo.type,
                messageId: messageInfo.id,
                from: messageInfo.from,
                text: messageInfo.text,
                timestamp: messageInfo.timestamp
            });

            if (!conversation) {
                throw new Error("Conversation could not be retrieved, cannot process message.");
            }

            switch (messageInfo.type) {
                case 'text':
                    await handleTextMessage(whatsappClient, databaseService, messageInfo, conversation._id);
                    break;
                case 'image':
                case 'audio':
                case 'video':
                case 'document':
                    await handleMediaMessage(whatsappClient, databaseService, mediaUploadService, message, messageInfo, conversation._id, storedMessage?._id);
                    break;
                case 'location':
                    await handleLocationMessage(whatsappClient, databaseService, messageInfo, conversation._id);
                    break;
                case 'contacts':
                    await handleContactMessage(whatsappClient, databaseService, messageInfo, conversation._id);
                    break;
                default:
                    logWarning('Unhandled message type received', {
                        messageType: messageInfo.type,
                        messageId: messageInfo.id,
                        from: messageInfo.from,
                        needsImplementation: true
                    });
                    await sendErrorResponse(
                        whatsappClient,
                        messageInfo.from,
                        'I can only handle text messages and images right now. Please send me a text or image! 😊'
                    );
            }
        } catch (processingError) {
            logError('Failed to process message type', processingError as Error, {
                messageId: messageInfo.id,
                from: messageInfo.from,
                messageType: messageInfo.type,
                operation: 'processIncomingMessage:type_processing'
            });

            // Send user-friendly error response
            await sendErrorResponse(
                whatsappClient,
                messageInfo.from,
                'I encountered an issue processing your message. Please try again or contact support if the problem persists.',
                processingError
            );
        }

    } catch (error) {
        // This is the final catch-all for any unexpected errors
        logError('Unexpected error in processIncomingMessage', error as Error, {
            messageId: message.id,
            messageType: message.type,
            from: message.from,
            timestamp: message.timestamp,
            contactName,
            operation: 'processIncomingMessage:unexpected'
        });

        // Try to send an error response if we have enough info
        try {
            await sendErrorResponse(
                whatsappClient,
                message.from,
                'I\'m experiencing technical difficulties. Please try again in a few moments.',
                error
            );
        } catch (responseError) {
            logError('Failed to send error response', responseError as Error, {
                messageId: message.id,
                from: message.from,
                operation: 'processIncomingMessage:error_response'
            });
        }
    }
}

/**
 * Process complete webhook payload
 */
export async function processWebhookPayload(
    whatsappClient: WhatsAppCloudApiClient,
    databaseService: DatabaseService,
    mediaUploadService: MediaUploadService,
    payload: WebhookPayload
): Promise<void> {
    try {
        for (const entry of payload.entry) {
            for (const change of entry.changes) {
                // Process messages
                if (change.value.messages) {
                    for (const message of change.value.messages) {
                        await processIncomingMessage(whatsappClient, databaseService, mediaUploadService, message);
                    }
                }

                // Process status updates
                if (change.value.statuses) {
                    for (const status of change.value.statuses) {
                        await processStatusUpdate(status);
                    }
                }

                // Log errors
                if (change.value.errors) {
                    for (const error of change.value.errors) {
                        logError('WhatsApp API error', error.message || 'API Error', {
                            errorCode: error.code,
                            errorTitle: error.title,
                            errorMessage: error.message,
                            errorDetails: error.error_data?.details,
                            operation: 'processWebhookPayload',
                            source: 'WhatsApp API'
                        });
                    }
                }
            }
        }
    } catch (error) {
        logError('Error processing webhook payload', error as Error, {
            operation: 'processWebhookPayload',
            payloadObject: payload.object,
            entryCount: payload.entry?.length || 0
        });
        throw error;
    }
} 