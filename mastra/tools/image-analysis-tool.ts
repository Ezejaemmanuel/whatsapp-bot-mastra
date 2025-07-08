import { z } from "zod";
import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { IMAGE_EXTRACTION_GEMINI_MODEL, IMAGE_EXTRACTION_TEMPERATURE } from "../agents/agent-instructions";
// import { sendDebugMessage } from "./utils";

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

// Schema for OCR extraction
export const receiptSchema = z.object({
    ocrResults: z.object({
        rawText: z.string().describe("Complete raw text extracted from the image"),
        formattedText: z.object({
            lines: z.array(z.string()).describe("Text split into lines, preserving formatting"),
            sections: z.array(z.object({
                content: z.string(),
                type: z.enum(['text', 'numbers', 'date', 'alphanumeric']).optional()
            })).describe("Text organized into sections with type hints")
        }).describe("Structured representation of the extracted text")
    }),

    // Basic image quality assessment
    imageQuality: z.object({
        quality: z.enum(['excellent', 'good', 'fair', 'poor']).describe("Quality of the image for text extraction"),
        confidence: z.enum(['high', 'medium', 'low']).describe("Confidence level in text extraction"),
        issues: z.array(z.string()).optional().describe("Any issues affecting text extraction")
    })
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
): Promise<z.infer<typeof receiptSchema>> {
    const startTime = Date.now();

    // Send debug message about function start
    // if (phoneNumber) {
    //     await sendDebugMessage(phoneNumber, 'DIRECT IMAGE ANALYSIS STARTED', {
    //         imageUrl: imageUrl ? `${imageUrl.substring(0, 100)}...` : 'missing',
    //         hasContext: !!context,
    //         contextLength: context?.length || 0,
    //         startTime: new Date(startTime).toISOString(),
    //         operation: 'analyzeImageDirectly'
    //     });
    // }

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

        if (phoneNumber) {
            // await sendDebugMessage(phoneNumber, 'VALIDATION ERROR', {
            //     error: errorMsg,
            //     type: 'Missing image URL'
            // });
        }

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
    const analysisPrompt = `You are an expert OCR system focused on precise text extraction. Your task is to:

1. EXTRACT ALL TEXT EXACTLY AS SHOWN:
   - Capture every visible text element
   - Preserve exact formatting and line breaks
   - Maintain all numbers, symbols, and special characters
   - Keep dates and times in original format
   - Extract account numbers and amounts precisely

2. ORGANIZE TEXT:
   - Split into lines as shown in image
   - Group related text into sections
   - Label sections by content type (text/numbers/date/alphanumeric)
   - Preserve spatial relationships in formatting

3. QUALITY CHECK:
   - Note any unclear or unreadable text
   - Report confidence in extraction accuracy
   - Flag any image quality issues

${context ? `\nContext: ${context}` : ''}

Extract all text now, maintaining exact formatting:`;

    try {
        logInfo('Initiating Gemini Vision analysis', {
            mimeType,
            promptLength: analysisPrompt.length,
            hasAdditionalContext: !!context,
            operation: 'analyzeImageDirectly'
        });

        // Send debug message about AI processing start
        if (phoneNumber) {
            // await sendDebugMessage(phoneNumber, 'AI PROCESSING STARTED', {
            //     model: IMAGE_EXTRACTION_GEMINI_MODEL,
            //     temperature: IMAGE_EXTRACTION_TEMPERATURE,
            //     promptLength: analysisPrompt.length,
            //     mimeType
            // });
        }

        // Use generateObject for structured outputs with AI SDK
        const result = await generateObject({
            model: google(IMAGE_EXTRACTION_GEMINI_MODEL),
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
            schema: receiptSchema,
        });

        const executionTime = Date.now() - startTime;
        const analysisResult = result.object;

        logSuccess('AI image analysis completed successfully', {
            imageQuality: analysisResult.imageQuality?.quality,
            confidence: analysisResult.imageQuality?.confidence,
            hasIssues: !!analysisResult.imageQuality?.issues && analysisResult.imageQuality.issues.length > 0,
            issuesCount: analysisResult.imageQuality?.issues?.length || 0,
            executionTimeMs: executionTime,
            operation: 'analyzeImageDirectly'
        });

        // // Send debug message with AI results
        // if (phoneNumber) {
        //     await sendDebugMessage(phoneNumber, 'AI PROCESSING COMPLETED', {
        //         success: true,
        //         executionTimeMs: executionTime,
        //         imageQuality: analysisResult.imageQuality?.quality,
        //         confidence: analysisResult.imageQuality?.confidence,
        //         issuesCount: analysisResult.imageQuality?.issues?.length || 0,
        //         textLinesCount: analysisResult.ocrResults?.formattedText?.lines?.length || 0,
        //         sectionsCount: analysisResult.ocrResults?.formattedText?.sections?.length || 0
        //     });
        // }

        // Send extracted OCR results as debug message
        if (phoneNumber && analysisResult.ocrResults) {
            // await sendDebugMessage(phoneNumber, 'OCR EXTRACTION RESULTS', {
            //     rawTextLength: analysisResult.ocrResults.rawText?.length || 0,
            //     rawTextPreview: analysisResult.ocrResults.rawText,
            //     linesCount: analysisResult.ocrResults.formattedText?.lines?.length || 0,
            //     sectionsCount: analysisResult.ocrResults.formattedText?.sections?.length || 0,
            //     firstFewLines: analysisResult.ocrResults.formattedText?.lines?.slice(0, 10) || []
            // });

            // // Send the complete raw text as a separate message for full OCR visibility
            // if (analysisResult.ocrResults.rawText) {
            //     await sendDebugMessage(phoneNumber, 'COMPLETE OCR RAW TEXT', analysisResult.ocrResults.rawText);
            // }
        }

        if (!analysisResult) {
            const errorMsg = 'AI failed to generate structured analysis. The vision model may not be processing the image correctly.';
            logError('AI failed to generate structured analysis', new Error('Empty analysis result'), {
                executionTimeMs: executionTime,
                operation: 'analyzeImageDirectly',
                errorType: 'ai_processing_error'
            });

            if (phoneNumber) {
                // await sendDebugMessage(phoneNumber, 'AI PROCESSING FAILED', {
                //     error: errorMsg,
                //     executionTimeMs: executionTime,
                //     type: 'Empty analysis result'
                // });
            }

            throw new Error(errorMsg);
        }

        // Validate that we got meaningful analysis
        if (!analysisResult.imageQuality) {
            const errorMsg = 'AI did not provide quality assessment. This suggests the analysis may be incomplete.';
            logError('AI did not provide quality assessment', new Error('Missing quality assessment'), {
                executionTimeMs: executionTime,
                operation: 'analyzeImageDirectly',
                errorType: 'incomplete_analysis'
            });

            // if (phoneNumber) {
            //     await sendDebugMessage(phoneNumber, 'ANALYSIS VALIDATION FAILED', {
            //         error: errorMsg,
            //         executionTimeMs: executionTime,
            //         type: 'Missing quality assessment'
            //     });
            // }

            throw new Error(errorMsg);
        }

        // Log detailed analysis results for debugging
        logInfo('General image analysis details', {
            description: analysisResult.ocrResults?.rawText?.substring(0, 100),
            isRelevantToExchange: false,
            hasSuggestedAction: false,
            operation: 'analyzeImageDirectly'
        });

        // // Send final success debug message
        // if (phoneNumber) {
        //     await sendDebugMessage(phoneNumber, 'DIRECT IMAGE ANALYSIS COMPLETED SUCCESSFULLY', {
        //         totalExecutionTimeMs: executionTime,
        //         finalQuality: analysisResult.imageQuality.quality,
        //         finalConfidence: analysisResult.imageQuality.confidence,
        //         hasExtractedText: !!analysisResult.ocrResults.rawText,
        //         analysisComplete: true
        //     });
        // }

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

        // Send debug message about the error
        // if (phoneNumber) {
        //     await sendDebugMessage(phoneNumber, 'DIRECT IMAGE ANALYSIS ERROR', {
        //         error: errorMessage,
        //         errorType: error instanceof Error ? error.constructor.name : typeof error,
        //         executionTimeMs: executionTime,
        //         stack: error instanceof Error ? error.stack : undefined,
        //         isGeminiError: errorMessage.includes('contents.parts must not be empty'),
        //         isNetworkError: errorMessage.includes('network') || errorMessage.includes('fetch'),
        //         isAuthError: errorMessage.includes('API key') || errorMessage.includes('auth')
        //     });
        // }

        // Return a structured error response instead of throwing
        return {
            ocrResults: {
                rawText: "Error analyzing image",
                formattedText: {
                    lines: [],
                    sections: []
                }
            },
            imageQuality: {
                quality: 'poor' as const,
                confidence: 'low' as const,
                issues: [`Analysis failed: ${errorMessage}`]
            }
        };
    }
}
