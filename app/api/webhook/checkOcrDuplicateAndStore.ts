import { logError, logWarning } from "./utils";
import { generateTextEmbedding } from '@/mastra/tools/utils';
import { api } from '@/convex/_generated/api';
import { Doc } from '@/convex/_generated/dataModel';
import { ConvexHttpClient } from 'convex/browser';

/**
 * Checks for duplicate OCR text using embeddings and stores new embedding if not duplicate.
 * Returns { isDuplicate, duplicateInfo }.
 *
 * - Generates an embedding for the OCR text
 * - Searches for similar embeddings in Convex
 * - If duplicate, returns info about the original and duplicate
 * - If not, stores the new embedding in Convex
 *
 * @param ocrRawText - The raw OCR text to check for duplicates
 * @param context - Optional context for logging (e.g., messageId, from)
 */
export async function checkOcrDuplicateAndStore({
    ocrRawText,
    context = {}
}: {
    ocrRawText: string;
    context?: Record<string, unknown>;
}): Promise<{ isDuplicate: boolean; duplicateInfo: Doc<'ocrEmbeddings'>[] }> {
    if (!ocrRawText || ocrRawText.length < 20) {
        return { isDuplicate: false, duplicateInfo: [] };
    }
    try {
        // Generate embedding for the OCR text
        const embedding = await generateTextEmbedding(ocrRawText);
        // Initialize Convex HTTP client
        const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
        if (!convexUrl) throw new Error('Missing NEXT_PUBLIC_CONVEX_URL');
        const convex = new ConvexHttpClient(convexUrl);
        // Search for similar embeddings in Convex
        const similar = await convex.action(api.ocrEmbeddings.findSimilarOcrEmbeddings, {
            embedding,
            topK: 2,
            minScore: 0.92,
        }) as Doc<'ocrEmbeddings'>[];
        if (similar && similar.length > 0) {
            logWarning('Potential duplicate receipt detected by OCR embedding', {
                ...context,
                duplicateCount: similar.length,
                operation: 'ocrDuplicateDetection',
                similar,
            });
            // Return the original and duplicate OCR text for agent prompt
            return {
                isDuplicate: true,
                duplicateInfo: similar,
            };
        } else {
            // Store the new embedding in Convex
            await convex.mutation(api.ocrEmbeddings.storeOcrEmbedding, {
                rawOcrText: ocrRawText,
                embedding,
                // Optionally add more metadata here
            });
            return { isDuplicate: false, duplicateInfo: [] };
        }
    } catch (embedError) {
        logError('Error in OCR embedding/duplicate detection', embedError instanceof Error ? embedError : String(embedError), {
            ...context,
            operation: 'ocrDuplicateDetection',
        });
        return { isDuplicate: false, duplicateInfo: [] };
    }
} 