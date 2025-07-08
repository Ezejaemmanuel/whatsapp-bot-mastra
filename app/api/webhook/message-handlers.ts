import { WebhookMessage } from './types';
import { DatabaseService } from '@/lib/database-service';
import { MediaUploadService } from '@/lib/media-upload-service';
import { WhatsAppCloudApiClient } from '@/whatsapp/whatsapp-client';
import { Id } from '@/convex/_generated/dataModel';
import { mastra } from '@/mastra';
import { RuntimeContext } from '@mastra/core/runtime-context';
import { TEST_MODE } from '@/constant';
import { HANDLE_IMAGE_AGENT_TEMPRETURE, HANDLE_TEXT_AGENT_TEMPRETURE } from '@/mastra/agents/agent-instructions';
import {
    logInfo,
    logError,
    logSuccess,
    logWarning,
    extractMessageInfo
} from './utils';
import {
    sendAndStoreTextReply,
    markMessageAsRead
} from './response-sender';
import {
    formatErrorForTestMode,
    sendErrorResponse
} from './error-handler';
import {
    processAndStoreMediaSafely,
    processImageAnalysis,
    generateImageAgentContent
} from './media-processor';

/**
 * Handle text messages with enhanced exchange bot logic
 */
export async function handleTextMessage(
    whatsappClient: WhatsAppCloudApiClient,
    databaseService: DatabaseService,
    messageInfo: ReturnType<typeof extractMessageInfo>,
    conversationId: Id<"conversations">
): Promise<void> {
    try {
        logInfo('Processing text message with KhalidWid Exchange Agent', {
            messageId: messageInfo.id,
            from: messageInfo.from,
            text: messageInfo.text,
            conversationId,
            operation: 'handleTextMessage'
        });

        // Increment unread count
        await databaseService.incrementUnreadCount(conversationId);

        // Get message text for processing
        const messageText = messageInfo.text?.trim() || '';

        let response: string;

        try {
            // Get user and conversation for proper memory context
            const user = await databaseService.getOrCreateUser(messageInfo.from);
            const userName = user.profileName || user.phoneNumber || messageInfo.from;
            const conversation = await databaseService.getOrCreateConversation(user._id, userName);

            // Create runtime context with memory context for tools
            const runtimeContext = new RuntimeContext<{
                userId: string;
                conversationId: string;
                phoneNumber: string;
            }>();
            runtimeContext.set('userId', user._id);
            runtimeContext.set('conversationId', conversation._id);
            runtimeContext.set('phoneNumber', messageInfo.from);

            const agent = mastra.getAgent('whatsappAgent');
            // Use the enhanced WhatsApp Exchange Agent to generate a response
            let agentResponse;
            const maxRetries = 3;
            for (let i = 0; i < maxRetries; i++) {
                agentResponse = await agent.generate(
                    [
                        {
                            role: 'user' as const,
                            content: messageText || 'Hello',
                        },
                    ],
                    {
                        temperature: HANDLE_TEXT_AGENT_TEMPRETURE,
                        memory: {
                            thread: `whatsapp-${messageInfo.from}`,
                            resource: messageInfo.from,
                        },
                        runtimeContext,
                    }
                );

                if (agentResponse?.text) {
                    break; // Exit loop if response is not empty
                }

                logWarning(`Agent generated an empty response on attempt ${i + 1}`, {
                    messageId: messageInfo.id,
                    from: messageInfo.from,
                    threadId: `whatsapp-${messageInfo.from}`,
                    operation: 'handleTextMessage',
                });

                if (i < maxRetries - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000)); // wait 1s before retrying
                }
            }

            if (agentResponse?.text) {
                response = agentResponse.text;
            } else {
                const emptyResponseError = new Error(`Agent returned an empty response after ${maxRetries} attempts.`);
                logWarning('Agent generated an empty response after multiple retries', {
                    messageId: messageInfo.id,
                    from: messageInfo.from,
                    threadId: `whatsapp-${messageInfo.from}`,
                    operation: 'handleTextMessage',
                });
                response = formatErrorForTestMode(emptyResponseError, {
                    operation: 'handleTextMessage',
                    messageId: messageInfo.id,
                    from: messageInfo.from,
                    errorType: 'agent_empty_response',
                });
                if (!TEST_MODE) {
                    response = "I apologize, but I couldn't process your message at the moment. Please try again.";
                }
            }

            logInfo('Generated exchange agent response', {
                messageId: messageInfo.id,
                from: messageInfo.from,
                responseLength: response.length,
                threadId: `whatsapp-${messageInfo.from}`,
                hasToolCalls: agentResponse?.toolCalls && agentResponse?.toolCalls.length > 0,
                toolCallsCount: agentResponse?.toolCalls?.length || 0,
                messageTextLength: messageText.length,
                operation: 'handleTextMessage',
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

        // Send response to user and store in database
        await sendAndStoreTextReply(
            whatsappClient,
            databaseService,
            messageInfo.from,
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
            await sendAndStoreTextReply(
                whatsappClient,
                databaseService,
                messageInfo.from,
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
            // Use the error response system as final fallback
            await sendErrorResponse(
                whatsappClient,
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
export async function handleMediaMessage(
    whatsappClient: WhatsAppCloudApiClient,
    databaseService: DatabaseService,
    mediaUploadService: MediaUploadService,
    message: WebhookMessage,
    messageInfo: ReturnType<typeof extractMessageInfo>,
    conversationId: Id<"conversations">,
    storedMessageId?: Id<"messages">
): Promise<void> {
    try {
        logInfo('Media message received for processing', {
            messageType: messageInfo.type,
            messageId: messageInfo.id,
            from: messageInfo.from,
            mediaInfo: messageInfo.mediaInfo,
            hasCaption: !!messageInfo.mediaInfo?.caption,
            operation: 'handleMediaMessage'
        });

        // Increment unread count
        await databaseService.incrementUnreadCount(conversationId);

        // Handle different media types
        if (messageInfo.type === 'image') {
            if (!storedMessageId) {
                logWarning('Stored message not found, cannot process image', {
                    messageId: messageInfo.id,
                    from: messageInfo.from,
                    operation: 'handleMediaMessage'
                });
                await sendErrorResponse(
                    whatsappClient,
                    messageInfo.from,
                    'I received your image but couldn\'t process it right now. Please try sending it again.',
                    new Error('Stored message ID not available for image processing')
                );
                return;
            }

            // Process the image and wait for the URL
            const mediaResult = await processAndStoreMediaSafely(mediaUploadService, message, storedMessageId, messageInfo.from);
            const imageUrl = mediaResult.success ? mediaResult.storedUrl : null;

            // Analyze the image directly if URL is available
            let imageAnalysisResults = null;
            if (imageUrl) {
                const analysisResult = await processImageAnalysis(
                    imageUrl,
                    messageInfo.from,
                    messageInfo.id,
                    messageInfo.mediaInfo?.caption
                );
                imageAnalysisResults = analysisResult.success ? analysisResult.analysisResults : null;
            }

            // Prepare text content for agent - include extracted text if available
            const caption = messageInfo.mediaInfo?.caption ?? null;
            const agentContent = generateImageAgentContent(imageUrl ?? null, imageAnalysisResults, caption as string | null);

            let response: string;

            try {
                // Get user and conversation for proper memory context
                const user = await databaseService.getOrCreateUser(messageInfo.from);
                const userName = user.profileName || user.phoneNumber || messageInfo.from;
                const conversation = await databaseService.getOrCreateConversation(user._id, userName);

                // Create runtime context with memory context for tools
                const runtimeContext = new RuntimeContext<{
                    userId: string;
                    conversationId: string;
                    phoneNumber: string;
                }>();
                runtimeContext.set('userId', user._id);
                runtimeContext.set('conversationId', conversation._id);
                runtimeContext.set('phoneNumber', messageInfo.from);

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
                    runtimeContext,
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

            await sendAndStoreTextReply(
                whatsappClient,
                databaseService,
                messageInfo.from,
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
            // For other media types, do not process, just inform user.
            logWarning('Unsupported media type received', {
                messageType: messageInfo.type,
                messageId: messageInfo.id,
                from: messageInfo.from,
            });

            // Handle unsupported media types
            const response = `Hey! I can only work with text messages and images right now 📱
Send me a text or share your payment receipt as an image, and I'll help you out! 😊`;

            await sendAndStoreTextReply(
                whatsappClient,
                databaseService,
                messageInfo.from,
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
            await sendAndStoreTextReply(
                whatsappClient,
                databaseService,
                messageInfo.from,
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

            // Use the error response system as final fallback
            await sendErrorResponse(
                whatsappClient,
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
export async function handleLocationMessage(
    whatsappClient: WhatsAppCloudApiClient,
    databaseService: DatabaseService,
    messageInfo: ReturnType<typeof extractMessageInfo>,
    conversationId: Id<"conversations">
): Promise<void> {
    try {
        logInfo('Processing location message', {
            messageId: messageInfo.id,
            from: messageInfo.from,
            conversationId,
            operation: 'handleLocationMessage'
        });

        // Increment unread count
        await databaseService.incrementUnreadCount(conversationId);

        // Prepare a simple text reply for location messages
        const responseText = 'Thank you for sharing your location. How can I assist you with it?';

        await sendAndStoreTextReply(
            whatsappClient,
            databaseService,
            messageInfo.from,
            responseText,
            conversationId,
            messageInfo.id
        );
    } catch (error) {
        logError('Error in location message handling (non-agent error)', error as Error, {
            messageId: messageInfo.id,
            from: messageInfo.from,
            operation: 'handleLocationMessage',
            errorType: 'non_agent_error'
        });

        // This catch block handles non-agent errors (database, network, etc.)
        let systemErrorResponse = formatErrorForTestMode(error, {
            operation: 'handleLocationMessage',
            messageId: messageInfo.id,
            from: messageInfo.from,
            errorType: 'system_error'
        });

        // If not in test mode, use friendly fallback
        if (!TEST_MODE) {
            systemErrorResponse = 'I had trouble processing your location due to a system issue. Please try again in a moment.';
        }

        try {
            await sendAndStoreTextReply(
                whatsappClient,
                databaseService,
                messageInfo.from,
                systemErrorResponse,
                conversationId,
                messageInfo.id
            );
        } catch (fallbackError) {
            logError('Failed to send system error response', fallbackError as Error, {
                messageId: messageInfo.id,
                from: messageInfo.from,
                operation: 'handleLocationMessage'
            });
            // Use the error response system as final fallback
            await sendErrorResponse(
                whatsappClient,
                messageInfo.from,
                'I\'m experiencing technical difficulties with location processing. Please try again later.',
                fallbackError
            );
        }
    }
}

/**
 * Handle contact messages
 */
export async function handleContactMessage(
    whatsappClient: WhatsAppCloudApiClient,
    databaseService: DatabaseService,
    messageInfo: ReturnType<typeof extractMessageInfo>,
    conversationId: Id<"conversations">
): Promise<void> {
    try {
        logInfo('Processing contact message', {
            messageId: messageInfo.id,
            from: messageInfo.from,
            conversationId,
            operation: 'handleContactMessage'
        });

        // Increment unread count
        await databaseService.incrementUnreadCount(conversationId);

        // Prepare a simple text reply for contact messages
        const responseText = 'Thank you for sharing the contact. I will review it shortly.';

        await sendAndStoreTextReply(
            whatsappClient,
            databaseService,
            messageInfo.from,
            responseText,
            conversationId,
            messageInfo.id
        );
    } catch (error) {
        logError('Error in contact message handling (non-agent error)', error as Error, {
            messageId: messageInfo.id,
            from: messageInfo.from,
            operation: 'handleContactMessage',
            errorType: 'non_agent_error'
        });

        // This catch block handles non-agent errors (database, network, etc.)
        let systemErrorResponse = formatErrorForTestMode(error, {
            operation: 'handleContactMessage',
            messageId: messageInfo.id,
            from: messageInfo.from,
            errorType: 'system_error'
        });

        // If not in test mode, use friendly fallback
        if (!TEST_MODE) {
            systemErrorResponse = 'I had trouble processing your contact due to a system issue. Please try again in a moment.';
        }

        try {
            await sendAndStoreTextReply(
                whatsappClient,
                databaseService,
                messageInfo.from,
                systemErrorResponse,
                conversationId,
                messageInfo.id
            );
        } catch (fallbackError) {
            logError('Failed to send system error response', fallbackError as Error, {
                messageId: messageInfo.id,
                from: messageInfo.from,
                operation: 'handleContactMessage'
            });
            // Use the error response system as final fallback
            await sendErrorResponse(
                whatsappClient,
                messageInfo.from,
                'I\'m experiencing technical difficulties with contact processing. Please try again later.',
                fallbackError
            );
        }
    }
} 