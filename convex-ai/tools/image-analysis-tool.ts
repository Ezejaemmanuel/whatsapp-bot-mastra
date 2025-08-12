import { z } from "zod";
import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { IMAGE_EXTRACTION_AI_MODEL_NORMAL, IMAGE_EXTRACTION_TEMPERATURE } from "../agents/agent-instructions";

// API key setup
const GOOGLE_GENERATIVE_AI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

if (!GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error('GOOGLE_GENERATIVE_AI_API_KEY environment variable is required for image analysis');
}

/**
 * Enhanced logging utility for image analysis tool
 */
function logImageAnalysisEvent(
    level: 'INFO' | 'ERROR' | 'WARN' | 'SUCCESS',
    message: string,
    data?: Record<string, any>
): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        level,
        source: 'Image Analysis Tool',
        message,
        ...data
    };

    const levelEmoji = {
        'INFO': '📋',
        'ERROR': '❌',
        'WARN': '⚠️',
        'SUCCESS': '✅'
    };

    console.log(`[${timestamp}] ${levelEmoji[level] || '📋'} [${level}] Image Analysis Tool: ${message}`);

    if (data && Object.keys(data).length > 0) {
        console.log('📊 Analysis Data:', JSON.stringify(data, null, 2));
    }
}

function logSuccess(message: string, data?: Record<string, any>): void {
    logImageAnalysisEvent('SUCCESS', message, data);
}

function logError(message: string, error?: Error | string, data?: Record<string, any>): void {
    const errorData = {
        ...data,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
    };
    logImageAnalysisEvent('ERROR', message, errorData);
}

function logWarn(message: string, data?: Record<string, any>): void {
    logImageAnalysisEvent('WARN', message, data);
}

function logInfo(message: string, data?: Record<string, any>): void {
    logImageAnalysisEvent('INFO', message, data);
}

// Helper function to determine MIME type from URL
function getMimeTypeFromUrl(url: string): string {
    const extension = url.toLowerCase().split('.').pop()?.split('?')[0]; // Remove query params

    switch (extension) {
        case 'jpg':
        case 'jpeg':
            return 'image/jpeg';
        case 'png':
            return 'image/png';
        case 'webp':
            return 'image/webp';
        case 'gif':
            return 'image/gif';
        default:
            return 'image/jpeg'; // Default fallback
    }
}

// Schema for OCR extraction - simplified to only return what's actually used
export const ocrSchema = z.object({
    rawText: z.string().describe("Complete raw text extracted from the image"),
    transactionReference: z.string().optional().describe('Transaction reference or ID')
});

/**
 * Standalone image analysis function that can be called directly without tools
 * @param imageUrl - URL of the image to analyze
 * @param phoneNumber - Phone number for debug messages
 * @param context - Additional context about what type of analysis is expected
 * @returns Promise<z.infer<typeof receiptSchema>> - The analysis result
 */
export async function analyzeImageDirectly(
    imageUrl: string,
    phoneNumber?: string,
    context?: string
): Promise<z.infer<typeof ocrSchema>> {
    const startTime = Date.now();

    logInfo('Starting direct image analysis', {
        imageUrl: imageUrl ? 'provided' : 'missing',
        imageUrlLength: imageUrl?.length || 0,
        hasContext: !!context,
        contextLength: context?.length || 0,
        operation: 'analyzeImageDirectly'
    });

    if (!imageUrl) {
        const errorMsg = 'Image URL is required for analysis';
        logError(errorMsg, new Error('Missing image URL'), {
            operation: 'analyzeImageDirectly',
            errorType: 'validation_error'
        });

        throw new Error(errorMsg);
    }

    const mimeType = getMimeTypeFromUrl(imageUrl);

    logInfo('Image URL validation and preprocessing', {
        imageUrl: imageUrl.substring(0, 100) + '...', // Log partial URL for security
        mimeType,
        urlLength: imageUrl.length,
        operation: 'analyzeImageDirectly'
    });

    // Send debug message about preprocessing
    if (phoneNumber) {
        // await sendDebugMessage(phoneNumber, 'IMAGE PREPROCESSING', {
        //     mimeType,
        //     urlLength: imageUrl.length,
        //     validationComplete: true
        // });
    }

    // Create the analysis prompt
    const analysisPrompt = `Extract all visible text from this image and identify any transaction reference/ID numbers.

${context ? `Context: ${context}` : ''}

Return the complete text and any transaction references found.`;

    try {
        logInfo('Initiating Gemini Vision analysis', {
            mimeType,
            promptLength: analysisPrompt.length,
            hasAdditionalContext: !!context,
            operation: 'analyzeImageDirectly'
        });

        // Use generateObject for structured outputs with AI SDK
        const result = await generateObject({
            model: google(IMAGE_EXTRACTION_AI_MODEL_NORMAL),
            temperature: IMAGE_EXTRACTION_TEMPERATURE, // Lower temperature for more precise text extraction
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: "text",
                            text: analysisPrompt
                        },
                        {
                            type: "image",
                            image: imageUrl // AI SDK can handle URLs directly
                        }
                    ]
                }
            ],
            schema: ocrSchema,
        });

        const executionTime = Date.now() - startTime;
        const analysisResult = result.object;

        logSuccess('AI image analysis completed successfully', {
            hasText: !!analysisResult.rawText,
            textLength: analysisResult.rawText?.length || 0,
            executionTimeMs: executionTime,
            operation: 'analyzeImageDirectly'
        });

        if (!analysisResult) {
            const errorMsg = 'AI failed to generate structured analysis. The vision model may not be processing the image correctly.';
            logError('AI failed to generate structured analysis', new Error('Empty analysis result'), {
                executionTimeMs: executionTime,
                operation: 'analyzeImageDirectly',
                errorType: 'ai_processing_error'
            });



            throw new Error(errorMsg);
        }

        // Validate that we got meaningful analysis
        if (!analysisResult.rawText) {
            const errorMsg = 'AI did not extract any text from the image.';
            logError('AI did not extract text', new Error('Missing raw text'), {
                executionTimeMs: executionTime,
                operation: 'analyzeImageDirectly',
                errorType: 'incomplete_analysis'
            });

            throw new Error(errorMsg);
        }

        // Log detailed analysis results for debugging
        logInfo('General image analysis details', {
            description: analysisResult.rawText?.substring(0, 100),
            operation: 'analyzeImageDirectly'
        });

        return analysisResult;

    } catch (error) {
        const executionTime = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : String(error);

        logError('Direct image analysis failed', error as Error, {
            imageUrl: imageUrl.substring(0, 100) + '...', // Log partial URL for security
            mimeType,
            errorType: error instanceof Error ? error.constructor.name : typeof error,
            errorMessage,
            executionTimeMs: executionTime,
            operation: 'analyzeImageDirectly',
            errorDetails: {
                name: error instanceof Error ? error.name : 'Unknown',
                message: errorMessage,
                isGeminiContentError: errorMessage.includes('contents.parts must not be empty'),
                isNetworkError: errorMessage.includes('network') || errorMessage.includes('fetch'),
                isAuthError: errorMessage.includes('API key') || errorMessage.includes('auth')
            }
        });

        // Return a structured error response instead of throwing
        return {
            rawText: "Error analyzing image"
        };
    }
}
