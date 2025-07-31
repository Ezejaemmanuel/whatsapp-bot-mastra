import { WebhookMessage } from './types';
import { MediaUploadService } from '@/lib/media-upload-service';
import { Id } from '@/convex/_generated/dataModel';
import { logInfo, logError, logSuccess, logWarning } from './utils';
import { analyzeImageDirectly } from '@/mastra/tools/image-analysis-tool';
import { sendDebugMessage } from '@/mastra/tools/utils';

/**
 * Check if message is a media message
 */
export function isMediaMessage(message: WebhookMessage): boolean {
    return ['image', 'audio', 'video', 'document', 'sticker'].includes(message.type);
}

/**
 * Media info interface for different media types
 */
export interface MediaInfo {
    id: string;
    mime_type: string;
    filename?: string;
    sha256?: string;
    caption?: string;
}

/**
 * Get media information from message
 */
export function getMediaInfo(message: WebhookMessage): MediaInfo | null {
    switch (message.type) {
        case 'image': return message.image || null;
        case 'audio': return message.audio || null;
        case 'video': return message.video || null;
        case 'document': return message.document || null;
        case 'sticker': return message.sticker || null;
        default: return null;
    }
}

/**
 * Safe media processing that doesn't crash the main flow
 */
export async function processAndStoreMediaSafely(
    mediaUploadService: MediaUploadService,
    message: WebhookMessage,
    messageId: Id<"messages">,
    userPhoneNumber: string
): Promise<{ success: boolean; storedUrl?: string; error?: string }> {
    try {
        logInfo('Starting safe media processing', {
            messageType: message.type,
            messageId,
            userPhoneNumber,
            operation: 'processAndStoreMediaSafely'
        });

        // Validate media message structure
        const mediaInfo = getMediaInfo(message);
        if (!mediaInfo || !mediaInfo.id) {
            const validationError = new Error('Invalid media message structure: missing media info or ID');
            logError('Media validation failed', validationError, {
                messageId,
                messageType: message.type,
                hasMediaInfo: !!mediaInfo,
                mediaInfo: mediaInfo ? Object.keys(mediaInfo) : 'null',
                operation: 'processAndStoreMediaSafely'
            });
            return { success: false, error: validationError.message };
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
        const uploadResult = await mediaUploadService.processMediaMessage(
            mediaInfo.id,
            mediaInfo.filename,
            mediaInfo.mime_type,
            mediaInfo.sha256,
            messageId
        );

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
            return { success: true, storedUrl: uploadResult.storedUrl };
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
            return { success: false, error: errorMessage };
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
        return { success: false, error: errorMessage };
    }
}

/**
 * Process image analysis for OCR processing
 */
export async function processImageAnalysis(
    imageUrl: string,
    userPhoneNumber: string,
    messageId: string,
    caption?: string
): Promise<{ success: boolean; analysisResults?: unknown; error?: string }> {
    try {
        logInfo('Starting direct image analysis for OCR processing', {
            messageId,
            from: userPhoneNumber,
            operation: 'processImageAnalysis'
        });

        await sendDebugMessage(userPhoneNumber, 'STARTING DIRECT IMAGE ANALYSIS FOR OCR PROCESSING', {
            messageId,
            from: userPhoneNumber,
            operation: 'processImageAnalysis'
        });

        const imageAnalysisResults = await analyzeImageDirectly(
            imageUrl,
            userPhoneNumber,
            `Image from WhatsApp message. ${caption ? `User caption: ${caption}` : 'No caption provided.'}`
        );

        await sendDebugMessage(userPhoneNumber, 'DIRECT IMAGE ANALYSIS COMPLETED SUCCESSFULLY', {
            messageId,
            from: userPhoneNumber,
            imageUrl,
            imageAnalysisResults,
            operation: 'processImageAnalysis'
        });

        logSuccess('Direct image analysis completed successfully', {
            messageId,
            from: userPhoneNumber,
            hasText: !!imageAnalysisResults.rawText,
            textLength: imageAnalysisResults.rawText?.length || 0,
            hasTransactionRef: !!imageAnalysisResults.transactionReference,
            operation: 'processImageAnalysis'
        });

        return { success: true, analysisResults: imageAnalysisResults };
    } catch (analysisError) {
        logError('Direct image analysis failed', analysisError as Error, {
            messageId,
            from: userPhoneNumber,
            operation: 'processImageAnalysis'
        });

        await sendDebugMessage(userPhoneNumber, 'DIRECT IMAGE ANALYSIS FAILED', {
            messageId,
            from: userPhoneNumber,
            operation: 'processImageAnalysis'
        });

        return { success: false, error: analysisError instanceof Error ? analysisError.message : 'Unknown analysis error' };
    }
}

/**
 * Generate agent content for image processing
 */
export function generateImageAgentContent(
    imageUrl: string | null,
    imageAnalysisResults: unknown | null,
    caption?: string | null
): string {
    const results = imageAnalysisResults as any;
    if (imageUrl && results?.rawText) {
        let content = `The user sent an image. I have analyzed it and extracted the following text:

**EXTRACTED TEXT**:
---
${results.rawText}
---

${results.transactionReference ? `**TRANSACTION REFERENCE**: ${results.transactionReference}\n\n` : ''}`;
        
        content += `Please analyze this text to identify if it's a transaction receipt or payment proof. Look for:
- Transaction amounts
- Dates and times
- Recipient/sender information
- Bank or payment service details
- Reference numbers

Validate this information against the current transaction details and check for any discrepancies.`;
        
        if (caption) {
            content += `\n\nUser's caption: ${caption}`;
        }
        return content;
    } else if (imageUrl) {
        return `The user sent an image but I couldn't extract any meaningful text from it. Please ask them to provide a clearer image of the transaction receipt.${caption ? `\n\nUser's caption: ${caption}` : ''}`;
    } else {
        return `The user sent an image but it couldn't be processed. ${caption ? `Caption: ${caption}` : ''} Please ask them to resend it or contact support if the issue persists.`;
    }
}