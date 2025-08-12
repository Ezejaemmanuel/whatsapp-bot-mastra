import { WebhookMessage } from './types';
import { DatabaseService } from '@/lib/database-service';
import { MediaUploadService } from '@/lib/media-upload-service';
import { WhatsAppCloudApiClient } from '@/whatsapp/whatsapp-client';
import { Id, Doc } from '@/convex/_generated/dataModel';
import { fetchAction } from 'convex/nextjs';
import { TEST_MODE } from '@/constant';
// Mastra instructions no longer used
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

import { checkImageDuplicateAndStore, DuplicateCheckResult, validateImageBuffer } from './checkImageDuplicateAndStore';
import { api } from '@/convex/_generated/api';
// Mastra agent removed


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

            // --- Image Duplicate Detection Logic (Dual Hash) ---
            let isDuplicate = false;
            let duplicateInfo: DuplicateCheckResult['originalImageHash'] | null = null;
            let duplicateType: 'exact' | 'similar' | null = null;
            let confidence = 0;
            
            if (imageUrl) {
                try {
                    // Download image buffer for hash generation
                    const imageResponse = await fetch(imageUrl);
                    if (imageResponse.ok) {
                        const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
                        
                        // Validate image buffer
                        if (validateImageBuffer(imageBuffer)) {
                            logInfo('Starting dual hash duplicate detection', {
                                messageId: messageInfo.id,
                                from: messageInfo.from,
                                imageSize: imageBuffer.length,
                                operation: 'handleMediaMessage'
                            });
                            
                            // Get user for context
                            const user = await databaseService.getOrCreateUser(messageInfo.from);
                            
                            // Check for image duplicates using dual hash approach
                            const duplicateResult = await checkImageDuplicateAndStore(
                                imageBuffer,
                                imageUrl,
                                undefined, // transactionId - will be set later if needed
                                undefined, // paymentReference - will be set later if needed
                                user._id,
                                storedMessageId,
                                5 // maxHammingDistance for perceptual hash similarity
                            );
                            
                            isDuplicate = duplicateResult.isDuplicate;
                            duplicateInfo = duplicateResult.originalImageHash;
                            duplicateType = duplicateResult.duplicateType || null;
                            confidence = duplicateResult.confidence || 0;
                            
                            if (isDuplicate) {
                                logWarning('Image duplicate detected', {
                                    messageId: messageInfo.id,
                                    from: messageInfo.from,
                                    duplicateType,
                                    confidence,
                                    hammingDistance: duplicateResult.hammingDistance,
                                    originalImageUrl: duplicateInfo?.imageUrl,
                                    operation: 'handleMediaMessage'
                                });
                            } else {
                                logInfo('No image duplicate found, new hashes stored', {
                                    messageId: messageInfo.id,
                                    from: messageInfo.from,
                                    operation: 'handleMediaMessage'
                                });
                            }
                        } else {
                            logWarning('Invalid image buffer, skipping duplicate detection', {
                                messageId: messageInfo.id,
                                from: messageInfo.from,
                                bufferSize: imageBuffer.length,
                                operation: 'handleMediaMessage'
                            });
                        }
                    } else {
                        logWarning('Failed to download image for duplicate detection', {
                            messageId: messageInfo.id,
                            from: messageInfo.from,
                            imageUrl: imageUrl.substring(0, 100) + '...',
                            status: imageResponse.status,
                            operation: 'handleMediaMessage'
                        });
                    }
                } catch (duplicateError) {
                    logError('Error in image duplicate detection', duplicateError as Error, {
                        messageId: messageInfo.id,
                        from: messageInfo.from,
                        operation: 'handleMediaMessage'
                    });
                    // Continue processing even if duplicate detection fails
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

            let response: string;

            // Check if duplicate was detected - send direct message without AI agent processing
            if (isDuplicate && duplicateInfo) {
                const confidencePercent = Math.round(confidence * 100);
                const duplicateTypeText = duplicateType === 'exact' ? 'exact duplicate' : 'very similar image';
                const originalDate = duplicateInfo.createdAt ? new Date(duplicateInfo.createdAt).toLocaleString() : 'Unknown';
                
                response = `🚨 **Duplicate Receipt Detected** 🚨

I've already processed this receipt before!

📋 **Details:**
• Type: ${duplicateTypeText}
• Confidence: ${confidencePercent}%
• Previously submitted: ${originalDate}

❗ **What to do next:**
If you have a new transaction, please send a different receipt. If this is the same transaction, no need to resubmit - I already have it on record! 📝

Need help? Just ask! 😊`;
                
                logInfo('Duplicate image detected - sending direct response without AI agent', {
                    messageId: messageInfo.id,
                    from: messageInfo.from,
                    duplicateType,
                    confidence: confidencePercent,
                    originalDate,
                    operation: 'handleMediaMessage'
                });
            } else {
                // No duplicate detected - process with AI agent as usual
                const caption = messageInfo.mediaInfo?.caption ?? null;
                const agentContent = generateImageAgentContent(imageUrl ?? null, imageAnalysisResults, caption as string | null);

                try {
                    // Get user and conversation for proper memory context
                    const user = await databaseService.getOrCreateUser(messageInfo.from);
                    const userName = user.profileName || user.phoneNumber || messageInfo.from;
                    const conversation = await databaseService.getOrCreateConversation(user._id, userName);

                    // Generate via Convex Agent action using image analysis summary
                    const result = await fetchAction(api.ai.generateReply, {
                        userId: user._id,
                        conversationId: conversation._id,
                        prompt: agentContent,
                    });

                    if (result?.text && result.text.trim().length > 0) {
                        response = result.text;
                    } else {
                        const emptyResponseError = new Error(`Agent returned an empty response.`);
                        logWarning('Agent generated an empty response after multiple retries', {
                            messageId: messageInfo.id,
                            from: messageInfo.from,
                            threadId: `whatsapp-${messageInfo.from}`,
                            operation: 'handleMediaMessage',
                        });
                        response = formatErrorForTestMode(emptyResponseError, {
                            operation: 'handleMediaMessage',
                            messageId: messageInfo.id,
                            from: messageInfo.from,
                            errorType: 'agent_empty_response_media',
                        });
                        if (!TEST_MODE) {
                            response = imageUrl ?
                                'I received your receipt image but had trouble analyzing it. Could you try sending it again or provide the transaction details as text?' :
                                'I had trouble processing your image. Could you try sending it again or send me the transaction details as text?';
                        }
                    }

                    logInfo('Generated exchange agent response for image', {
                        messageId: messageInfo.id,
                        from: messageInfo.from,
                        responseLength: response.length,
                        threadId: `whatsapp-${messageInfo.from}`,
                        hasImageUrl: !!imageUrl,
                        hasToolCalls: false,
                        toolCallsCount: 0,
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
