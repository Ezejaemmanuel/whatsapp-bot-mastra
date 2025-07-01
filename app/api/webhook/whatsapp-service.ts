import { WhatsAppCloudApiClient } from '@/whatsapp/whatsapp-client';
import { WebhookMessage, WebhookMessageStatus, WebhookPayload } from './types';
import { logWebhookEvent, logSuccess, logError, logWarning, logInfo, extractMessageInfo, extractStatusInfo } from './utils';
import { DatabaseService } from '@/lib/database-service';
import { MediaUploadService } from '@/lib/media-upload-service';
import { Id } from '@/convex/_generated/dataModel';
import { mastra } from '@/mastra';
import { RuntimeContext } from '@mastra/core/runtime-context';
import { TEST_MODE } from '@/constant';
import { HANDLE_IMAGE_AGENT_TEMPRETURE, HANDLE_TEXT_AGENT_TEMPRETURE } from '@/mastra/agents/agent-instructions';

/**
 * Format error details for test mode
 */
function formatErrorForTestMode(error: unknown, context: Record<string, any> = {}): string {
    if (!TEST_MODE) {
        return 'I apologize, but I encountered an issue. Please try again in a moment.';
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorName = error instanceof Error ? error.name : 'Unknown Error';
    const errorStack = error instanceof Error ? error.stack : 'No stack trace available';

    return `🔧 TEST MODE - ERROR DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❌ ERROR: ${errorName}
📝 MESSAGE: ${errorMessage}

📍 CONTEXT:
${Object.entries(context).map(([key, value]) => `• ${key}: ${JSON.stringify(value)}`).join('\n')}

🔍 STACK TRACE:
${errorStack}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ This detailed error is only shown in TEST_MODE`;
}

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
     * Process incoming webhook message with comprehensive error handling
     */
    async processIncomingMessage(message: WebhookMessage, contactName?: string): Promise<void> {
        let messageInfo: ReturnType<typeof extractMessageInfo>;
        let user: any;
        let conversation: any;
        let storedMessage: any;

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
                await this.sendErrorResponse(message.from, 'Sorry, I couldn\'t process your message format. Please try again.', extractError);
                return;
            }

            // Step 2: Get or create user and conversation with retry logic
            try {
                user = await this.databaseService.getOrCreateUser(
                    messageInfo.from,
                    contactName
                );
                conversation = await this.databaseService.getOrCreateConversation(user._id);
            } catch (userError) {
                logError('Failed to get/create user or conversation', userError as Error, {
                    messageId: messageInfo.id,
                    from: messageInfo.from,
                    operation: 'processIncomingMessage:user_conversation'
                });
                // Send error response and return early
                await this.sendErrorResponse(messageInfo.from, 'I\'m having trouble accessing your account. Please try again in a moment.', userError);
                return;
            }

            // Step 3: Store incoming message with fallback
            try {
                storedMessage = await this.databaseService.storeIncomingMessage(
                    message,
                    conversation._id,
                    contactName
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
                    whatsappMessageId: messageInfo.id,
                    messageType: messageInfo.type,
                    content: messageInfo.text
                };
            }

            // Step 4: Handle media processing separately (non-blocking)
            if (this.isMediaMessage(message) && storedMessage._id && !storedMessage._id.toString().startsWith('fallback_')) {
                // Process media in background - don't let it block message processing
                this.processAndStoreMediaSafely(message, storedMessage._id, messageInfo.from).catch(mediaError => {
                    logError('Media processing failed (non-blocking)', mediaError as Error, {
                        messageId: messageInfo.id,
                        from: messageInfo.from,
                        messageType: messageInfo.type,
                        operation: 'processIncomingMessage:media_processing'
                    });
                });
            }

            // Step 5: Mark message as read (non-blocking)
            this.markMessageAsRead(messageInfo.id).catch(readError => {
                logWarning('Failed to mark message as read (non-critical)', {
                    messageId: messageInfo.id,
                    error: readError instanceof Error ? readError.message : String(readError),
                    operation: 'processIncomingMessage:mark_read'
                });
            });

            // Step 6: Process message based on type
            try {
                logInfo('Processing message type', {
                    messageType: messageInfo.type,
                    messageId: messageInfo.id,
                    from: messageInfo.from,
                    text: messageInfo.text,
                    timestamp: messageInfo.timestamp
                });

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
                        await this.sendErrorResponse(
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
                await this.sendErrorResponse(
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
                await this.sendErrorResponse(
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

            logError('Failed to mark message as read', error as Error, {
                messageId,
                operation: 'markMessageAsRead',
                error: errorMessage,
                errorDetails,
                critical: false,
                // Add more context for debugging
                phoneNumberId: this.phoneNumberId,
                clientConfigured: !!this.whatsappClient
            });



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

            // Get message text for processing
            const messageText = messageInfo.text?.trim() || '';

            let response: string;

            try {
                // Get user and conversation for proper memory context
                const user = await this.databaseService.getOrCreateUser(messageInfo.from);
                const conversation = await this.databaseService.getOrCreateConversation(user._id);

                // Import RuntimeContext for passing memory context to tools

                // Create runtime context with memory context for tools
                const runtimeContext = new RuntimeContext<{
                    userId: string;
                    conversationId: string;
                    phoneNumber: string;
                }>();
                runtimeContext.set('userId', user._id); // ✅ Pass userId as userId (clear and consistent)
                runtimeContext.set('conversationId', conversation._id); // ✅ Pass conversationId as conversationId (clear and consistent)
                runtimeContext.set('phoneNumber', messageInfo.from); // ✅ Pass phone number for debug messages


                const agent = mastra.getAgent('whatsappAgent');
                // Use the enhanced WhatsApp Exchange Agent to generate a response
                const agentResponse = await agent.generate([
                    {
                        role: 'user' as const,
                        content: messageText || 'Hello',
                    }
                ], {
                    temperature: HANDLE_TEXT_AGENT_TEMPRETURE,
                    memory: {
                        thread: `whatsapp-${messageInfo.from}`, // Use phone number as thread ID for conversation continuity
                        resource: messageInfo.from, // Use phone number as resource ID
                    },
                    runtimeContext, // ✅ Pass userId and conversationId to tools via runtime context
                });

                response = agentResponse.text || 'I apologize, but I couldn\'t process your message at the moment. Please try again.';



                logInfo('Generated exchange agent response', {
                    messageId: messageInfo.id,
                    from: messageInfo.from,
                    responseLength: response.length,
                    threadId: `whatsapp-${messageInfo.from}`,
                    hasToolCalls: agentResponse.toolCalls && agentResponse.toolCalls.length > 0,
                    toolCallsCount: agentResponse.toolCalls?.length || 0,
                    messageTextLength: messageText.length,
                    operation: 'handleTextMessage'
                });

            } catch (agentError) {
                const agentErrorMessage = agentError instanceof Error ? agentError.message : 'Unknown agent error';

                logError('Exchange agent failed to process text message', agentError as Error, {
                    messageId: messageInfo.id,
                    from: messageInfo.from,
                    text: messageText,
                    threadId: `whatsapp-${messageInfo.from}`,
                    agentErrorMessage,
                    operation: 'handleTextMessage',
                    fallbackUsed: true,
                    errorDetails: {
                        name: agentError instanceof Error ? agentError.name : 'Unknown',
                        message: agentErrorMessage,
                        isGeminiContentError: agentErrorMessage.includes('contents.parts must not be empty')
                    }
                });

                // Fallback response when agent fails - use test mode formatting if enabled
                response = formatErrorForTestMode(agentError, {
                    operation: 'handleTextMessage',
                    messageId: messageInfo.id,
                    from: messageInfo.from,
                    messageText: messageText.substring(0, 100),
                    threadId: `whatsapp-${messageInfo.from}`,
                    errorType: 'agent_error'
                });

                // If not in test mode, use friendly fallback
                if (!TEST_MODE) {
                    response = 'I apologize, but I encountered an issue processing your message. Please try again in a moment, or contact support if the problem persists.';
                }
            }

            // Send response to user
            await this.sendTextReply(
                messageInfo.from,
                response,
                messageInfo.id
            );

            // Store outgoing message in database
            await this.storeValidatedOutgoingMessage(
                messageInfo.from,
                'text',
                response,
                conversationId,
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
            let systemErrorResponse = formatErrorForTestMode(error, {
                operation: 'handleTextMessage',
                messageId: messageInfo.id,
                from: messageInfo.from,
                messageText: messageInfo.text?.substring(0, 100),
                conversationId,
                errorType: 'system_error'
            });

            // If not in test mode, use friendly fallback
            if (!TEST_MODE) {
                systemErrorResponse = 'I apologize, but I encountered a system issue. Please try again in a moment.';
            }

            try {
                await this.sendTextReply(
                    messageInfo.from,
                    systemErrorResponse,
                    messageInfo.id
                );

                await this.storeValidatedOutgoingMessage(
                    messageInfo.from,
                    'text',
                    systemErrorResponse,
                    conversationId,
                    messageInfo.id
                );
            } catch (fallbackError) {
                logError('Failed to send system error response', fallbackError as Error, {
                    messageId: messageInfo.id,
                    from: messageInfo.from,
                    operation: 'handleTextMessage'
                });
                // Use the new error response system as final fallback
                await this.sendErrorResponse(
                    messageInfo.from,
                    'I apologize, but I\'m experiencing technical difficulties. Please try again later.',
                    fallbackError
                );
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

                    // Use enhanced error response system
                    await this.sendErrorResponse(
                        messageInfo.from,
                        'I received your image but couldn\'t process it at the moment. Please try again.',
                        new Error('Stored message not found for image processing')
                    );
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
                    // Get user and conversation for proper memory context
                    const user = await this.databaseService.getOrCreateUser(messageInfo.from);
                    const conversation = await this.databaseService.getOrCreateConversation(user._id);

                    // Create runtime context with memory context for tools
                    const runtimeContext = new RuntimeContext<{
                        userId: string;
                        conversationId: string;
                        phoneNumber: string;
                    }>();
                    runtimeContext.set('userId', user._id); // ✅ Pass userId as userId (clear and consistent)
                    runtimeContext.set('conversationId', conversation._id); // ✅ Pass conversationId as conversationId (clear and consistent)
                    runtimeContext.set('phoneNumber', messageInfo.from); // ✅ Pass phone number for debug messages

                    // Process image with exchange agent for receipt analysis
                    const agent = mastra.getAgent('whatsappAgent');
                    const agentResponse = await agent.generate([
                        {
                            role: 'user',
                            content: agentContent,
                        }

                    ], {
                        memory: {
                            thread: `whatsapp-${messageInfo.from}`,
                            resource: messageInfo.from,
                        },
                        runtimeContext, // ✅ Pass userId and conversationId to tools via runtime context
                        temperature: HANDLE_IMAGE_AGENT_TEMPRETURE,
                    });

                    response = agentResponse.text || 'Got your receipt! 📸 Let me analyze the details...';



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

                    // Fallback response when agent fails for images - use test mode formatting if enabled
                    response = formatErrorForTestMode(agentError, {
                        operation: 'handleMediaMessage',
                        messageId: messageInfo.id,
                        from: messageInfo.from,
                        hasImageUrl: !!imageUrl,
                        imageUrl: imageUrl ? 'provided' : 'missing',
                        threadId: `whatsapp-${messageInfo.from}`,
                        errorType: 'agent_error_media'
                    });

                    // If not in test mode, use friendly fallback
                    if (!TEST_MODE) {
                        response = imageUrl ?
                            'I received your receipt image but had trouble analyzing it. Could you try sending it again or provide the transaction details as text?' :
                            'I had trouble processing your image. Could you try sending it again or send me the transaction details as text?';
                    }
                }

                await this.sendTextReply(
                    messageInfo.from,
                    response,
                    messageInfo.id
                );

                // Store outgoing message in database
                await this.storeValidatedOutgoingMessage(
                    messageInfo.from,
                    'text',
                    response,
                    conversationId,
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
                await this.storeValidatedOutgoingMessage(
                    messageInfo.from,
                    'text',
                    response,
                    conversationId,
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
            let systemErrorResponse = formatErrorForTestMode(error, {
                operation: 'handleMediaMessage',
                messageType: messageInfo.type,
                messageId: messageInfo.id,
                from: messageInfo.from,
                errorType: 'system_error_media'
            });

            // If not in test mode, use friendly fallback
            if (!TEST_MODE) {
                systemErrorResponse = 'I had trouble processing your image due to a system issue. Could you try sending it again in a moment?';
            }

            try {
                await this.sendTextReply(
                    messageInfo.from,
                    systemErrorResponse,
                    messageInfo.id
                );

                await this.storeValidatedOutgoingMessage(
                    messageInfo.from,
                    'text',
                    systemErrorResponse,
                    conversationId,
                    messageInfo.id
                );
            } catch (fallbackError) {
                logError('Failed to send media system error response', fallbackError as Error, {
                    messageId: messageInfo.id,
                    from: messageInfo.from,
                    operation: 'handleMediaMessage'
                });
                // Use the new error response system as final fallback
                await this.sendErrorResponse(
                    messageInfo.from,
                    'I\'m experiencing technical difficulties with media processing. Please try again later.',
                    fallbackError
                );
            }
        }
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
        await this.storeValidatedOutgoingMessage(
            messageInfo.from,
            'text',
            response,
            conversationId,
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
        await this.storeValidatedOutgoingMessage(
            messageInfo.from,
            'text',
            response,
            conversationId,
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
     * Legacy media processing method - now redirects to safe version
     * @deprecated Use processAndStoreMediaSafely instead
     */
    private async processAndStoreMedia(message: WebhookMessage, messageId: Id<"messages">): Promise<void> {
        // Extract user phone number from message for error reporting
        const userPhoneNumber = message.from;

        // Redirect to the safe version with error handling
        await this.processAndStoreMediaSafely(message, messageId, userPhoneNumber);
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
     * Store outgoing message
     */
    private async storeValidatedOutgoingMessage(
        to: string,
        messageType: string,
        content: string,
        conversationId: Id<"conversations">,
        whatsappMessageId?: string,
        replyToMessageId?: string
    ): Promise<void> {
        try {
            await this.databaseService.storeOutgoingMessage(
                to,
                messageType,
                content,
                conversationId,
                whatsappMessageId,
                replyToMessageId
            );

            logInfo('Outgoing message stored successfully', {
                to,
                messageType,
                contentLength: content.length,
                conversationId,
                operation: 'storeValidatedOutgoingMessage'
            });
        } catch (error) {
            logError('Failed to store outgoing message', error as Error, {
                to,
                messageType,
                contentLength: content.length,
                conversationId,
                operation: 'storeValidatedOutgoingMessage'
            });
            throw error;
        }
    }

    /**
     * Send error response to user with comprehensive error details in test mode
     */
    private async sendErrorResponse(to: string, friendlyMessage: string, error?: unknown): Promise<void> {
        try {
            let messageToSend = friendlyMessage;

            // In test mode, include detailed error information
            if (TEST_MODE && error) {
                const errorDetails = formatErrorForTestMode(error, {
                    operation: 'sendErrorResponse',
                    to,
                    friendlyMessage
                });
                messageToSend = errorDetails;
            }

            await this.whatsappClient.messages.sendText({
                to,
                text: messageToSend
            });

            logInfo('Error response sent successfully', {
                to,
                messageLength: messageToSend.length,
                isTestMode: TEST_MODE,
                hasErrorDetails: TEST_MODE && !!error,
                operation: 'sendErrorResponse'
            });
        } catch (sendError) {
            logError('Failed to send error response', sendError as Error, {
                to,
                messageLength: friendlyMessage.length,
                originalError: error instanceof Error ? error.message : String(error),
                operation: 'sendErrorResponse'
            });
        }
    }

    /**
     * Safe media processing that doesn't crash the main flow
     */
    private async processAndStoreMediaSafely(message: WebhookMessage, messageId: Id<"messages">, userPhoneNumber: string): Promise<void> {
        try {
            logInfo('Starting safe media processing', {
                messageType: message.type,
                messageId,
                userPhoneNumber,
                operation: 'processAndStoreMediaSafely'
            });

            // Validate media message structure
            const mediaInfo = this.getMediaInfo(message);
            if (!mediaInfo || !mediaInfo.id) {
                const validationError = new Error('Invalid media message structure: missing media info or ID');
                logError('Media validation failed', validationError, {
                    messageId,
                    messageType: message.type,
                    hasMediaInfo: !!mediaInfo,
                    mediaInfo: mediaInfo ? Object.keys(mediaInfo) : 'null',
                    operation: 'processAndStoreMediaSafely'
                });

                // Send error message to user
                await this.sendErrorResponse(
                    userPhoneNumber,
                    'I had trouble processing your media file. The file format might not be supported. Please try again or send a different file.',
                    validationError
                );
                return;
            }

            logInfo('Media info extracted successfully', {
                messageId,
                mediaId: mediaInfo.id,
                mimeType: mediaInfo.mime_type,
                fileName: mediaInfo.filename,
                sha256: mediaInfo.sha256,
                operation: 'processAndStoreMediaSafely'
            });

            // Process media with timeout and comprehensive error handling
            const uploadResult = await Promise.race([
                this.mediaUploadService.processMediaMessage(
                    mediaInfo.id,
                    mediaInfo.filename,
                    mediaInfo.mime_type,
                    mediaInfo.sha256,
                    messageId
                ),
                // Timeout after 45 seconds
                new Promise<any>((_, reject) =>
                    setTimeout(() => reject(new Error('Media processing timeout after 45 seconds')), 45000)
                )
            ]);

            if (uploadResult.success && uploadResult.storedUrl) {
                logSuccess('Media processed and stored successfully', {
                    messageId,
                    mediaId: mediaInfo.id,
                    fileName: uploadResult.fileName,
                    fileSize: uploadResult.fileSize,
                    storedUrl: uploadResult.storedUrl,
                    storageId: uploadResult.storageId,
                    mimeType: mediaInfo.mime_type,
                    operation: 'processAndStoreMediaSafely'
                });

                // Send success confirmation to user
                await this.sendErrorResponse(
                    userPhoneNumber,
                    '✅ Your media file has been processed successfully! You can now continue with your request.'
                );
            } else {
                const errorMessage = uploadResult.error || 'Unknown upload error';
                const uploadError = new Error(`Media upload failed: ${errorMessage}`);

                logError('Media processing failed', uploadError, {
                    messageId,
                    mediaId: mediaInfo.id,
                    mimeType: mediaInfo.mime_type,
                    fileName: mediaInfo.filename,
                    uploadResult: uploadResult,
                    operation: 'processAndStoreMediaSafely'
                });

                // Send detailed error to user
                await this.sendErrorResponse(
                    userPhoneNumber,
                    'I had trouble processing your media file. This could be due to file size, format, or network issues. Please try again with a smaller file or different format.',
                    uploadError
                );
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';

            logError('Error in safe media processing', error as Error, {
                messageId,
                operation: 'processAndStoreMediaSafely',
                mediaType: message.type,
                errorMessage,
                isTimeout: errorMessage.includes('timeout'),
                isNetworkError: errorMessage.includes('network') || errorMessage.includes('fetch'),
                isStorageError: errorMessage.includes('storage') || errorMessage.includes('upload'),
                isValidationError: errorMessage.includes('validation') || errorMessage.includes('Invalid')
            });

            // Send comprehensive error message to user
            let userErrorMessage = 'I encountered an issue processing your media file. ';

            if (errorMessage.includes('timeout')) {
                userErrorMessage += 'The processing took too long - this might be due to file size or network issues. Please try with a smaller file.';
            } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
                userErrorMessage += 'There was a network issue. Please check your connection and try again.';
            } else if (errorMessage.includes('storage') || errorMessage.includes('upload')) {
                userErrorMessage += 'There was a storage issue on our end. Please try again in a moment.';
            } else if (errorMessage.includes('validation') || errorMessage.includes('Invalid')) {
                userErrorMessage += 'The file format or structure is not supported. Please try with a different file.';
            } else {
                userErrorMessage += 'Please try again or contact support if the problem persists.';
            }

            await this.sendErrorResponse(userPhoneNumber, userErrorMessage, error);
        }
    }
} 