import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { IMAGE_EXTRACTION_GEMINI_MODEL, IMAGE_EXTRACTION_TEMPERATURE } from "../agents/agent-instructions";

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

// Helper function to validate image URL accessibility (optional - can be removed if not needed)
async function validateImageUrl(url: string): Promise<void> {
    try {
        const response = await fetch(url, { method: 'HEAD' });
        if (!response.ok) {
            throw new Error(`Image returned ${response.status}: ${response.statusText}`);
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to access image (${url}): ${errorMessage}`);
    }
}

// Schema for OCR extraction
const receiptSchema = z.object({
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

export const imageAnalysisTool = createTool({
    id: "analyze_image",
    description: "Analyze receipt images to extract transaction details or provide general image analysis if it's not a receipt. This tool can identify if an image is a payment receipt and extract relevant financial information, or provide a summary of any other type of image.",
    inputSchema: z.object({
        imageUrl: z.string().describe("URL of the image to analyze"),
        context: z.string().optional().describe("Additional context about what type of analysis is expected")
    }),
    outputSchema: receiptSchema,
    execute: async ({ context }) => {
        const { imageUrl, context: analysisContext } = context;
        const startTime = Date.now();

        logInfo('Starting image analysis', {
            imageUrl: imageUrl ? 'provided' : 'missing',
            imageUrlLength: imageUrl?.length || 0,
            hasContext: !!analysisContext,
            contextLength: analysisContext?.length || 0,
            operation: 'analyze_image'
        });

        if (!imageUrl) {
            logError('Image URL is required for analysis', new Error('Missing image URL'), {
                operation: 'analyze_image',
                errorType: 'validation_error'
            });
            throw new Error("Image URL is required for analysis");
        }

        const mimeType = getMimeTypeFromUrl(imageUrl);

        logInfo('Image URL validation and preprocessing', {
            imageUrl: imageUrl.substring(0, 100) + '...', // Log partial URL for security
            mimeType,
            urlLength: imageUrl.length,
            operation: 'analyze_image'
        });

        // Optional validation - uncomment if needed
        // console.log(`🔍 Validating image accessibility...`);
        // await validateImageUrl(imageUrl);

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

${analysisContext ? `\nContext: ${analysisContext}` : ''}

Extract all text now, maintaining exact formatting:`;

        try {
            logInfo('Initiating Gemini Vision analysis', {
                mimeType,
                promptLength: analysisPrompt.length,
                hasAdditionalContext: !!analysisContext,
                operation: 'analyze_image'
            });

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
                operation: 'analyze_image'
            });

            if (!analysisResult) {
                logError('AI failed to generate structured analysis', new Error('Empty analysis result'), {
                    executionTimeMs: executionTime,
                    operation: 'analyze_image',
                    errorType: 'ai_processing_error'
                });
                throw new Error("AI failed to generate structured analysis. The vision model may not be processing the image correctly.");
            }

            // Validate that we got meaningful analysis
            if (!analysisResult.imageQuality) {
                logError('AI did not provide quality assessment', new Error('Missing quality assessment'), {
                    executionTimeMs: executionTime,
                    operation: 'analyze_image',
                    errorType: 'incomplete_analysis'
                });
                throw new Error("AI did not provide quality assessment. This suggests the analysis may be incomplete.");
            }

            // Log detailed analysis results for debugging
            logInfo('General image analysis details', {
                description: analysisResult.ocrResults?.rawText?.substring(0, 100),
                isRelevantToExchange: false,
                hasSuggestedAction: false,
                operation: 'analyze_image'
            });

            return analysisResult;

        } catch (error) {
            const executionTime = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : String(error);

            logError('Image analysis failed', error as Error, {
                imageUrl: imageUrl.substring(0, 100) + '...', // Log partial URL for security
                mimeType,
                errorType: error instanceof Error ? error.constructor.name : typeof error,
                errorMessage,
                executionTimeMs: executionTime,
                operation: 'analyze_image',
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
    },
}); 