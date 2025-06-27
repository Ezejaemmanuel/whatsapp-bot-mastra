import { WhatsAppCloudApiClient } from '@/whatsapp/whatsapp-client';
import { WebhookMessage, WebhookMessageStatus, WebhookPayload } from './types';
import { logWebhookEvent, logSuccess, logError, logWarning, logInfo, extractMessageInfo, extractStatusInfo } from './utils';
import { DatabaseService } from '@/lib/database-service';
import { MediaUploadService } from '@/lib/media-upload-service';
import { Id } from '@/convex/_generated/dataModel';
import { whatsappAgent } from '@/mastra/agents/whatsapp-agent';

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
        try {
            // Use provided parameters or fall back to environment configuration
            const envAccessToken = process.env.WHATSAPP_ACCESS_TOKEN;
            const envPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

            if (!accessToken && !envAccessToken) {
                throw new Error('Missing required environment variable: WHATSAPP_ACCESS_TOKEN (WhatsApp Business API access token from Meta Business)');
            }

            if (!phoneNumberId && !envPhoneNumberId) {
                throw new Error('Missing required environment variable: WHATSAPP_PHONE_NUMBER_ID (WhatsApp Business phone number ID from Meta Business)');
            }

            const finalAccessToken = accessToken || envAccessToken || '';
            const finalPhoneNumberId = phoneNumberId || envPhoneNumberId || '';

            this.whatsappClient = new WhatsAppCloudApiClient({
                accessToken: finalAccessToken,
                phoneNumberId: finalPhoneNumberId
            });

            this.phoneNumberId = finalPhoneNumberId;
            this.databaseService = new DatabaseService();

            // Initialize MediaUploadService with UploadThing integration
            this.mediaUploadService = new MediaUploadService(finalAccessToken);

            logInfo('WhatsApp Webhook Service initialized successfully', {
                phoneNumberIdConfigured: !!this.phoneNumberId,
                accessTokenConfigured: !!finalAccessToken,
                serviceInitialized: true
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error';
            logError('Failed to initialize WhatsApp Webhook Service', error as Error, {
                operation: 'constructor',
                providedAccessToken: !!accessToken,
                providedPhoneNumberId: !!phoneNumberId
            });
            throw new Error(`WhatsApp Webhook Service initialization failed: ${errorMessage}`);
        }
    }

    /**
     * Process incoming webhook message
     */
    async processIncomingMessage(message: WebhookMessage, contactName?: string): Promise<void> {
        try {
            const messageInfo = extractMessageInfo(message);

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

            // Get or create user and conversation
            const user = await this.databaseService.getOrCreateUser(
                messageInfo.from,
                contactName
            );

            const conversation = await this.databaseService.getOrCreateConversation(user._id);

            // Store the incoming message in database
            const storedMessage = await this.databaseService.storeIncomingMessage(
                message,
                conversation._id,
                contactName
            );

            // Handle media messages - download and store files
            if (this.isMediaMessage(message)) {
                await this.processAndStoreMedia(message, storedMessage._id);
            }

            // Mark message as read
            await this.markMessageAsRead(messageInfo.id);

            logInfo('Processing message type', {
                messageType: messageInfo.type,
                messageId: messageInfo.id,
                from: messageInfo.from,
                text: messageInfo.text,
                timestamp: messageInfo.timestamp
            });

            // Process different message types
            switch (messageInfo.type) {

                case 'text':
                    await this.handleTextMessage(messageInfo, conversation._id);
                    break;
                case 'image':
                case 'audio':
                case 'video':
                case 'document':
                    await this.handleMediaMessage(messageInfo, conversation._id);
                    break;
                case 'interactive':
                    await this.handleInteractiveMessage(messageInfo, conversation._id);
                    break;
                case 'location':
                    await this.handleLocationMessage(messageInfo, conversation._id);
                    break;
                case 'contacts':
                    await this.handleContactMessage(messageInfo, conversation._id);
                    break;
                default:
                    logWarning('Unhandled message type received', {
                        messageType: messageInfo.type,
                        messageId: messageInfo.id,
                        from: messageInfo.from,
                        needsImplementation: true
                    });
            }
        } catch (error) {
            logError('Error processing incoming message', error as Error, {
                messageId: message.id,
                messageType: message.type,
                from: message.from,
                timestamp: message.timestamp,
                contactName,
                operation: 'processIncomingMessage'
            });

            // Log error to database
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
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

            logInfo('Processing status update', {
                messageId: statusInfo.messageId,
                status: statusInfo.status,
                recipientId: statusInfo.recipientId,
                timestamp: statusInfo.timestamp,
                conversationInfo: statusInfo.conversationInfo,
                pricingInfo: statusInfo.pricingInfo
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
            logError('Error processing status update', error as Error, {
                statusId: status.id,
                recipientId: status.recipient_id,
                operation: 'processStatusUpdate'
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

            logSuccess('Text message sent successfully', {
                to,
                textPreview: text.substring(0, 50),
                isReply: !!replyToMessageId,
                messageLength: text.length,
                operation: 'sendTextReply'
            });
        } catch (error) {
            logError('Failed to send text message', error as Error, {
                to,
                textPreview: text.substring(0, 50),
                messageLength: text.length,
                isReply: !!replyToMessageId,
                operation: 'sendTextReply'
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

            logSuccess('Button message sent successfully', {
                to,
                bodyText: bodyText.substring(0, 50),
                buttonCount: buttons.length,
                hasHeader: !!headerText,
                hasFooter: !!footerText,
                operation: 'sendButtonMessage'
            });
        } catch (error) {
            logError('Failed to send button message', error as Error, {
                to,
                buttonCount: buttons.length,
                operation: 'sendButtonMessage'
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

            logSuccess('Template message sent successfully', {
                to,
                templateName,
                languageCode,
                hasComponents: !!components && components.length > 0,
                componentCount: components?.length || 0,
                operation: 'sendTemplateMessage'
            });
        } catch (error) {
            logError('Failed to send template message', error as Error, {
                to,
                templateName,
                languageCode,
                operation: 'sendTemplateMessage'
            });
            throw error;
        }
    }

    /**
     * Mark message as read with proper error handling
     */
    async markMessageAsRead(messageId: string): Promise<void> {
        try {
            // Add phone number ID parameter to the request
            await this.whatsappClient.messages.markAsRead({
                messageId
            });

            logSuccess('Message marked as read successfully', {
                messageId,
                operation: 'markMessageAsRead'
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const errorDetails = error instanceof Error ? error.stack : undefined;

            logWarning('Failed to mark message as read', {
                messageId,
                operation: 'markMessageAsRead',
                error: errorMessage,
                errorDetails,
                critical: false,
                // Add more context for debugging
                phoneNumberId: this.phoneNumberId,
                clientConfigured: !!this.whatsappClient
            });

            // Log to database for tracking
            await this.databaseService.logWebhookEvent(
                'WARN',
                'Failed to mark message as read',
                { messageId, error: errorMessage },
                'WhatsAppWebhookService',
                undefined,
                errorMessage
            );

            // Don't throw error for read receipts as it's not critical
        }
    }

    /**
     * Handle text messages with enhanced exchange bot logic
     */
    private async handleTextMessage(messageInfo: ReturnType<typeof extractMessageInfo>, conversationId: Id<"conversations">): Promise<void> {
        try {
            logInfo('Processing text message with KhalidWid Exchange Agent', {
                messageId: messageInfo.id,
                from: messageInfo.from,
                text: messageInfo.text,
                conversationId,
                operation: 'handleTextMessage'
            });

            // ✅ VALIDATE MESSAGE CONTENT - Prevent empty content from reaching Gemini API
            const messageText = messageInfo.text?.trim();
            if (!messageText) {
                logWarning('Empty message text received, sending default response', {
                    messageId: messageInfo.id,
                    from: messageInfo.from,
                    operation: 'handleTextMessage'
                });

                const fallbackResponse = 'Hello! How can I help you with currency exchange today? Please send me a message to get started.';

                // Send fallback response to user
                await this.sendTextReply(messageInfo.from, fallbackResponse, messageInfo.id);

                // Store the fallback response in database
                await this.databaseService.storeOutgoingMessage(
                    messageInfo.from,
                    'text',
                    fallbackResponse,
                    conversationId,
                    undefined,
                    messageInfo.id
                );

                logInfo('Sent fallback response for empty message', {
                    messageId: messageInfo.id,
                    from: messageInfo.from,
                    operation: 'handleTextMessage'
                });
                return;
            }

            let response: string;

            try {
                // Use the enhanced WhatsApp Exchange Agent to generate a response
                const agentResponse = await whatsappAgent.generate([
                    {
                        role: 'user',
                        content: messageText, // ✅ Use validated text instead of potentially empty messageInfo.text
                    }
                ], {
                    memory: {
                        thread: `whatsapp-${messageInfo.from}`, // Use phone number as thread ID for conversation continuity
                        resource: messageInfo.from, // Use phone number as resource ID
                    }
                });

                response = agentResponse.text || 'I apologize, but I couldn\'t process your message at the moment. Please try again.';

                // Check if agent wants to send interactive messages
                if (agentResponse.toolCalls && agentResponse.toolCalls.length > 0) {
                    await this.handleAgentToolCalls(agentResponse.toolCalls, messageInfo.from, messageInfo.id);
                }

                logInfo('Generated exchange agent response', {
                    messageId: messageInfo.id,
                    from: messageInfo.from,
                    responseLength: response.length,
                    threadId: `whatsapp-${messageInfo.from}`,
                    hasToolCalls: agentResponse.toolCalls && agentResponse.toolCalls.length > 0,
                    toolCallsCount: agentResponse.toolCalls?.length || 0,
                    operation: 'handleTextMessage'
                });

            } catch (agentError) {
                const agentErrorMessage = agentError instanceof Error ? agentError.message : 'Unknown agent error';

                logError('Exchange agent failed to process text message', agentError as Error, {
                    messageId: messageInfo.id,
                    from: messageInfo.from,
                    text: messageText, // ✅ Use validated text for logging
                    threadId: `whatsapp-${messageInfo.from}`,
                    agentErrorMessage,
                    operation: 'handleTextMessage',
                    fallbackUsed: true
                });

                // Log to database for tracking agent failures
                await this.databaseService.logWebhookEvent(
                    'ERROR',
                    'Exchange agent failed to process text message',
                    {
                        messageId: messageInfo.id,
                        from: messageInfo.from,
                        text: messageText, // ✅ Use validated text
                        agentErrorMessage,
                        error: agentError instanceof Error ? agentError.message : 'Unknown error',
                        stack: agentError instanceof Error ? agentError.stack : undefined,
                        threadId: `whatsapp-${messageInfo.from}`
                    },
                    'WhatsAppWebhookService',
                    undefined,
                    agentErrorMessage
                );

                // Fallback response when agent fails
                response = 'I apologize, but I encountered an issue processing your message. Please try again in a moment, or contact support if the problem persists.';
            }

            // Send response to user
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

            // Log successful processing
            logSuccess('Text message processed successfully with exchange agent', {
                messageId: messageInfo.id,
                from: messageInfo.from,
                responseLength: response.length,
                operation: 'handleTextMessage'
            });

        } catch (error) {
            logError('Error in text message handling (non-agent error)', error as Error, {
                messageId: messageInfo.id,
                from: messageInfo.from,
                text: messageInfo.text,
                conversationId,
                operation: 'handleTextMessage',
                errorType: 'non_agent_error'
            });

            // This catch block handles non-agent errors (database, network, etc.)
            const systemErrorResponse = 'I apologize, but I encountered a system issue. Please try again in a moment.';

            try {
                await this.sendTextReply(
                    messageInfo.from,
                    systemErrorResponse,
                    messageInfo.id
                );

                await this.databaseService.storeOutgoingMessage(
                    messageInfo.from,
                    'text',
                    systemErrorResponse,
                    conversationId,
                    undefined,
                    messageInfo.id
                );
            } catch (fallbackError) {
                logError('Failed to send system error response', fallbackError as Error, {
                    messageId: messageInfo.id,
                    from: messageInfo.from,
                    operation: 'handleTextMessage'
                });
            }
        }
    }

    /**
     * Handle media messages (images for receipt processing)
     */
    private async handleMediaMessage(messageInfo: ReturnType<typeof extractMessageInfo>, conversationId: Id<"conversations">): Promise<void> {
        try {
            logInfo('Media message received for processing', {
                messageType: messageInfo.type,
                messageId: messageInfo.id,
                from: messageInfo.from,
                mediaInfo: messageInfo.mediaInfo,
                hasCaption: !!messageInfo.mediaInfo?.caption,
                operation: 'handleMediaMessage'
            });

            // Handle different media types
            if (messageInfo.type === 'image') {
                // First, get the stored message to find its ID
                const storedMessage = await this.databaseService.getMessageByWhatsAppId(messageInfo.id);

                if (!storedMessage) {
                    logWarning('Stored message not found for image processing', {
                        messageId: messageInfo.id,
                        from: messageInfo.from,
                        operation: 'handleMediaMessage'
                    });

                    // Fallback to basic text response
                    const fallbackResponse = 'I received your image but couldn\'t process it at the moment. Please try again.';
                    await this.sendTextReply(messageInfo.from, fallbackResponse, messageInfo.id);
                    return;
                }

                // Get the stored media files for this message
                const mediaFiles = await this.databaseService.getMediaFilesByMessageId(storedMessage._id);

                logInfo('Retrieved stored media files', {
                    messageId: messageInfo.id,
                    storedMessageId: storedMessage._id,
                    mediaFilesCount: mediaFiles.length,
                    mediaFiles: mediaFiles.map(f => ({ id: f._id, storedUrl: f.storedUrl, fileName: f.fileName })),
                    operation: 'handleMediaMessage'
                });

                let imageUrl = null;
                const imageFile = mediaFiles.find(file => file.mimeType?.startsWith('image/'));

                if (imageFile?.storedUrl) {
                    imageUrl = imageFile.storedUrl;
                    logInfo('Found stored image URL for AI analysis', {
                        messageId: messageInfo.id,
                        imageUrl,
                        fileName: imageFile.fileName,
                        mimeType: imageFile.mimeType,
                        operation: 'handleMediaMessage'
                    });
                } else {
                    logWarning('No stored image URL found for AI analysis', {
                        messageId: messageInfo.id,
                        mediaFilesFound: mediaFiles.length,
                        hasImageFile: !!imageFile,
                        imageFileStoredUrl: imageFile?.storedUrl,
                        operation: 'handleMediaMessage'
                    });
                }

                // Prepare text content for agent - the agent will use the image analysis tool
                const agentContent = imageUrl ?
                    `I'm sending you a receipt image for payment verification. Please use the image analysis tool to analyze this image: ${imageUrl}
                    
${messageInfo.mediaInfo?.caption ? `Caption provided by customer: ${messageInfo.mediaInfo.caption}` : ''}

Please extract relevant payment information including transaction amount, currency, ID, date, bank details, and verify if it matches any pending exchange transactions.`
                    : `I received a receipt image but couldn't access it for analysis. ${messageInfo.mediaInfo?.caption ? `Caption: ${messageInfo.mediaInfo.caption}` : ''} Please try sending the image again or provide the transaction details manually.`;

                let response: string;

                try {
                    // Process image with exchange agent for receipt analysis
                    const agentResponse = await whatsappAgent.generate([
                        {
                            role: 'user',
                            content: agentContent,
                        }
                    ], {
                        memory: {
                            thread: `whatsapp-${messageInfo.from}`,
                            resource: messageInfo.from,
                        }
                    });

                    response = agentResponse.text || 'Got your receipt! 📸 Let me analyze the details...';

                    // Check if agent wants to send interactive messages
                    if (agentResponse.toolCalls && agentResponse.toolCalls.length > 0) {
                        await this.handleAgentToolCalls(agentResponse.toolCalls, messageInfo.from, messageInfo.id);
                    }

                    logInfo('Generated exchange agent response for image', {
                        messageId: messageInfo.id,
                        from: messageInfo.from,
                        responseLength: response.length,
                        threadId: `whatsapp-${messageInfo.from}`,
                        hasImageUrl: !!imageUrl,
                        hasToolCalls: agentResponse.toolCalls && agentResponse.toolCalls.length > 0,
                        toolCallsCount: agentResponse.toolCalls?.length || 0,
                        operation: 'handleMediaMessage'
                    });

                } catch (agentError) {
                    const agentErrorMessage = agentError instanceof Error ? agentError.message : 'Unknown agent error';

                    logError('Exchange agent failed to process image message', agentError as Error, {
                        messageId: messageInfo.id,
                        from: messageInfo.from,
                        hasImageUrl: !!imageUrl,
                        imageUrl: imageUrl ? 'provided' : 'missing',
                        threadId: `whatsapp-${messageInfo.from}`,
                        agentErrorMessage,
                        operation: 'handleMediaMessage',
                        fallbackUsed: true
                    });

                    // Log to database for tracking agent failures
                    await this.databaseService.logWebhookEvent(
                        'ERROR',
                        'Exchange agent failed to process image message',
                        {
                            messageId: messageInfo.id,
                            from: messageInfo.from,
                            hasImageUrl: !!imageUrl,
                            agentError: agentErrorMessage,
                            threadId: `whatsapp-${messageInfo.from}`
                        },
                        'WhatsAppWebhookService',
                        undefined,
                        agentErrorMessage
                    );

                    // Fallback response when agent fails for images
                    response = imageUrl ?
                        'I received your receipt image but had trouble analyzing it. Could you try sending it again or provide the transaction details as text?' :
                        'I had trouble processing your image. Could you try sending it again or send me the transaction details as text?';
                }

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

                logSuccess('Image receipt processed successfully with vision analysis', {
                    messageId: messageInfo.id,
                    from: messageInfo.from,
                    hasImageUrl: !!imageUrl,
                    imageUrl: imageUrl ? 'provided' : 'missing',
                    operation: 'handleMediaMessage'
                });

            } else {
                // Handle unsupported media types
                const response = `Hey! I can only work with text messages and images right now 📱
Send me a text or share your payment receipt as an image, and I'll help you out! 😊`;

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

                logInfo('Unsupported media type handled', {
                    messageType: messageInfo.type,
                    messageId: messageInfo.id,
                    from: messageInfo.from,
                    operation: 'handleMediaMessage'
                });
            }

        } catch (error) {
            logError('Error in media message handling (non-agent error)', error as Error, {
                messageType: messageInfo.type,
                messageId: messageInfo.id,
                from: messageInfo.from,
                operation: 'handleMediaMessage',
                errorType: 'non_agent_error'
            });

            // This catch block handles non-agent errors (database, storage, network, etc.)
            const systemErrorResponse = 'I had trouble processing your image due to a system issue. Could you try sending it again in a moment?';

            try {
                await this.sendTextReply(
                    messageInfo.from,
                    systemErrorResponse,
                    messageInfo.id
                );

                await this.databaseService.storeOutgoingMessage(
                    messageInfo.from,
                    'text',
                    systemErrorResponse,
                    conversationId,
                    undefined,
                    messageInfo.id
                );
            } catch (fallbackError) {
                logError('Failed to send media system error response', fallbackError as Error, {
                    messageId: messageInfo.id,
                    from: messageInfo.from,
                    operation: 'handleMediaMessage'
                });
            }
        }
    }

    /**
 * Handle interactive messages (button/list replies) - treat them as regular text messages
 */
    private async handleInteractiveMessage(messageInfo: ReturnType<typeof extractMessageInfo>, conversationId: Id<"conversations">): Promise<void> {
        // Interactive messages are just user selections - treat them as text messages
        // The agent will understand the context naturally
        await this.handleTextMessage(messageInfo, conversationId);
    }

    /**
     * Handle location messages
     */
    private async handleLocationMessage(messageInfo: ReturnType<typeof extractMessageInfo>, conversationId: Id<"conversations">): Promise<void> {
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
    private async handleContactMessage(messageInfo: ReturnType<typeof extractMessageInfo>, conversationId: Id<"conversations">): Promise<void> {
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
        logSuccess('Message sent successfully', {
            messageId: statusInfo.messageId,
            recipientId: statusInfo.recipientId,
            timestamp: statusInfo.timestamp,
            operation: 'handleMessageSent'
        });
    }

    /**
     * Handle message delivered status
     */
    private async handleMessageDelivered(statusInfo: ReturnType<typeof extractStatusInfo>): Promise<void> {
        logSuccess('Message delivered', {
            messageId: statusInfo.messageId,
            recipientId: statusInfo.recipientId,
            timestamp: statusInfo.timestamp,
            operation: 'handleMessageDelivered'
        });
    }

    /**
     * Handle message read status
     */
    private async handleMessageRead(statusInfo: ReturnType<typeof extractStatusInfo>): Promise<void> {
        logSuccess('Message read by recipient', {
            messageId: statusInfo.messageId,
            recipientId: statusInfo.recipientId,
            timestamp: statusInfo.timestamp,
            operation: 'handleMessageRead'
        });
    }

    /**
     * Handle message failed status
     */
    private async handleMessageFailed(statusInfo: ReturnType<typeof extractStatusInfo>): Promise<void> {
        logError('Message delivery failed', 'Message failed to deliver', {
            messageId: statusInfo.messageId,
            recipientId: statusInfo.recipientId,
            timestamp: statusInfo.timestamp,
            operation: 'handleMessageFailed',
            requiresAttention: true
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
     * Process and store media files using Convex file storage with enhanced error handling
     * Downloads media from WhatsApp and uploads to Convex storage
     */
    private async processAndStoreMedia(message: WebhookMessage, messageId: Id<"messages">): Promise<void> {
        try {
            console.log('Raw webhook message for media processing:', {
                messageType: message.type,
                messageId,
                messageContent: message
            });

            const mediaInfo = this.getMediaInfo(message);
            if (!mediaInfo || !mediaInfo.id) {
                logWarning('No media ID found in message', {
                    messageId,
                    operation: 'processAndStoreMedia',
                    issue: 'missing_media_id',
                    messageType: message.type,
                    hasMediaInfo: !!mediaInfo
                });
                return;
            }

            logInfo('Starting media processing', {
                messageId,
                mediaId: mediaInfo.id,
                mimeType: mediaInfo.mime_type,
                fileName: mediaInfo.filename,
                sha256: mediaInfo.sha256,
                operation: 'processAndStoreMedia'
            });

            console.log('Media info from getMediaInfo:', {
                mediaInfo,
                hasSha256: !!mediaInfo.sha256,
                sha256Value: mediaInfo.sha256
            });

            // Download from WhatsApp and upload to Convex storage
            // The processMediaMessage already handles both file storage AND database record creation
            const uploadResult = await this.mediaUploadService.processMediaMessage(
                mediaInfo.id,
                mediaInfo.filename,
                mediaInfo.mime_type,
                mediaInfo.sha256,
                messageId  // Pass messageId to avoid duplicate storage
            );

            if (uploadResult.success && uploadResult.storedUrl) {
                // No need for additional database operations - everything is handled by processMediaMessage

                logSuccess('Media file processed and uploaded to Convex storage', {
                    messageId,
                    mediaId: mediaInfo.id,
                    fileName: uploadResult.fileName,
                    fileSize: uploadResult.fileSize,
                    storedUrl: uploadResult.storedUrl,
                    storageId: uploadResult.storageId,
                    mimeType: mediaInfo.mime_type,
                    operation: 'processAndStoreMedia'
                });
            } else {
                const errorMessage = uploadResult.error || 'Unknown upload error';
                logError('Failed to process media file', errorMessage, {
                    messageId,
                    mediaId: mediaInfo.id,
                    mimeType: mediaInfo.mime_type,
                    fileName: mediaInfo.filename,
                    uploadResult: uploadResult,
                    operation: 'processAndStoreMedia'
                });

                // Log to database for tracking
                await this.databaseService.logWebhookEvent(
                    'ERROR',
                    'Failed to process media file',
                    {
                        messageId,
                        mediaId: mediaInfo.id,
                        error: errorMessage,
                        uploadResult: uploadResult
                    },
                    'WhatsAppWebhookService',
                    undefined,
                    errorMessage
                );
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const errorStack = error instanceof Error ? error.stack : undefined;

            logError('Error processing media file', error as Error, {
                messageId,
                operation: 'processAndStoreMedia',
                mediaType: message.type,
                errorMessage,
                errorStack
            });

            // Log to database for tracking
            await this.databaseService.logWebhookEvent(
                'ERROR',
                'Error processing media file',
                {
                    messageId,
                    mediaType: message.type,
                    error: errorMessage
                },
                'WhatsAppWebhookService',
                undefined,
                errorMessage
            );
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

    /**
     * Handle agent tool calls for interactive messages
     */
    private async handleAgentToolCalls(toolCalls: any[], to: string, replyToMessageId?: string): Promise<void> {
        try {
            for (const toolCall of toolCalls) {
                const { name, result } = toolCall;

                // Handle interactive button messages
                if (name === 'send_interactive_buttons' && result?.success && result?.action === 'SEND_INTERACTIVE_BUTTONS') {
                    const { data } = result;
                    await this.sendButtonMessage(
                        to,
                        data.bodyText,
                        data.buttons,
                        data.headerText,
                        data.footerText
                    );

                    logInfo('Sent interactive button message', {
                        to,
                        buttonCount: data.buttons?.length || 0,
                        operation: 'handleAgentToolCalls'
                    });
                }

                // Handle interactive list messages
                else if (name === 'send_interactive_list' && result?.success && result?.action === 'SEND_INTERACTIVE_LIST') {
                    const { data } = result;
                    await this.sendListMessage(
                        to,
                        data.bodyText,
                        data.buttonText,
                        data.sections,
                        data.headerText,
                        data.footerText
                    );

                    logInfo('Sent interactive list message', {
                        to,
                        sectionsCount: data.sections?.length || 0,
                        operation: 'handleAgentToolCalls'
                    });
                }
            }
        } catch (error) {
            logError('Error handling agent tool calls', error as Error, {
                to,
                toolCallsCount: toolCalls.length,
                operation: 'handleAgentToolCalls'
            });
        }
    }

    /**
     * Send an interactive list message
     */
    async sendListMessage(
        to: string,
        bodyText: string,
        buttonText: string,
        sections: Array<{
            title: string;
            rows: Array<{ id: string; title: string; description?: string }>;
        }>,
        headerText?: string,
        footerText?: string
    ): Promise<void> {
        try {
            await this.whatsappClient.messages.sendInteractiveList({
                to,
                bodyText,
                buttonText,
                sections,
                headerText,
                footerText
            });

            logSuccess('List message sent successfully', {
                to,
                bodyText: bodyText.substring(0, 50),
                buttonText,
                sectionsCount: sections.length,
                hasHeader: !!headerText,
                hasFooter: !!footerText,
                operation: 'sendListMessage'
            });
        } catch (error) {
            logError('Failed to send list message', error as Error, {
                to,
                sectionsCount: sections.length,
                operation: 'sendListMessage'
            });
            throw error;
        }
    }
} 