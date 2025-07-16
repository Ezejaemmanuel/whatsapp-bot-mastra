import { WebhookMessage } from './types';
import { DatabaseService } from '@/lib/database-service';
import { MediaUploadService } from '@/lib/media-upload-service';
import { WhatsAppCloudApiClient } from '@/whatsapp/whatsapp-client';
import { Id, Doc } from '@/convex/_generated/dataModel';
import { mastra } from '@/mastra';
import { RuntimeContext } from '@mastra/core/runtime-context';
import { TEST_MODE } from '@/constant';
import { HANDLE_IMAGE_AGENT_TEMPRETURE, HANDLE_TEXT_AGENT_TEMPRETURE } from '@/mastra/agents/agent-instructions';
import {
    logInfo,
    logError,
    logSuccess,
    logWarning,
    extractMessageInfo,
} from './utils';
import {
    sendAndStoreTextReply,
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
import { checkOcrDuplicateAndStore } from './checkOcrDuplicateAndStore';
import { getWhatsappAgent } from '@/mastra/agents/whatsapp-agent';


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

            // Update the stored message with the image URL for UI rendering
            if (imageUrl && storedMessageId) {
                try {
                    await databaseService.updateMessageWithMediaUrl(storedMessageId, imageUrl);
                    logInfo('Updated message with image URL for UI rendering', {
                        messageId: messageInfo.id,
                        storedMessageId,
                        imageUrl: imageUrl.substring(0, 100) + '...',
                        operation: 'handleMediaMessage'
                    });
                } catch (updateError) {
                    logWarning('Failed to update message with image URL', {
                        messageId: messageInfo.id,
                        storedMessageId,
                        error: updateError instanceof Error ? updateError.message : String(updateError),
                        operation: 'handleMediaMessage'
                    });
                }
            }

            // Analyze the image directly if URL is available
            let imageAnalysisResults = null;
            let ocrRawText = null;
            if (imageUrl) {
                const analysisResult = await processImageAnalysis(
                    imageUrl,
                    messageInfo.from,
                    messageInfo.id,
                    messageInfo.mediaInfo?.caption
                );
                imageAnalysisResults = analysisResult.success ? analysisResult.analysisResults : null;
                // Extract raw OCR text for embedding
                if (imageAnalysisResults && typeof imageAnalysisResults === 'object' && 'ocrResults' in imageAnalysisResults && imageAnalysisResults.ocrResults && typeof imageAnalysisResults.ocrResults === 'object' && 'rawText' in imageAnalysisResults.ocrResults) {
                    ocrRawText = imageAnalysisResults.ocrResults.rawText as string;
                }
            }

            // --- OCR Duplicate Detection Logic ---
            let isDuplicate = false;
            let duplicateInfo: Doc<'ocrEmbeddings'>[] = [];
            if (ocrRawText && ocrRawText.length > 20) { // Only embed if text is long enough
                // Use the new utility function for duplicate detection and storage
                const result = await checkOcrDuplicateAndStore({
                    ocrRawText,
                    context: {
                        messageId: messageInfo.id,
                        from: messageInfo.from,
                    }
                });
                isDuplicate = result.isDuplicate;
                duplicateInfo = result.duplicateInfo;
            }

            // Prepare text content for agent - include extracted text if available
            const caption = messageInfo.mediaInfo?.caption ?? null;
            let agentContent: string;
            if (isDuplicate && duplicateInfo && duplicateInfo.length > 0) {
                // If duplicate, inform the agent to notify the user, including both OCR texts
                agentContent = `This image appears to be a duplicate of a previously submitted receipt.\n\nOriginal OCR Text:\n${duplicateInfo[0].rawOcrText}\n\nDuplicate OCR Text:\n${ocrRawText}\n\nPlease inform the user that this receipt has already been submitted.`;
            } else {
                agentContent = generateImageAgentContent(imageUrl ?? null, imageAnalysisResults, caption as string | null);
            }

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
                // const agent = mastra.getAgent('whatsappAgent');
                const agent = await getWhatsappAgent();
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
