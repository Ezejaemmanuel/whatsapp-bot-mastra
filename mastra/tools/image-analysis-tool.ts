import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { IMAGE_EXTRACTION_GEMINI_MODEL, IMAGE_EXTRACTION_TEMPERATURE } from "../agents/agent-instructions";
import { TEST_MODE } from "../../constant";
import WhatsAppCloudApiClient from "@/whatsapp/whatsapp-client";

// API key setup
const GOOGLE_GENERATIVE_AI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

if (!GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error('GOOGLE_GENERATIVE_AI_API_KEY environment variable is required for image analysis');
}

/**
 * Send debug message via WhatsApp when TEST_MODE is enabled
 */
async function sendDebugMessage(phoneNumber: string, title: string, data: any): Promise<void> {
    if (!TEST_MODE) return;

    try {
        // Dynamically import WhatsApp client to avoid circular dependencies

        const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
        const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

        if (!accessToken || !phoneNumberId) {
            console.log('⚠️ DEBUG: WhatsApp credentials not available for debug messaging');
            return;
        }

        const client = new WhatsAppCloudApiClient();


        // Format debug message
        const debugMessage = `🔧 DEBUG - ${title}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏰ Time: ${new Date().toISOString()}
📱 Tool: Image Analysis

📊 Data:
${typeof data === 'string' ? data : JSON.stringify(data, null, 2)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ This is a DEBUG message - only shown in TEST_MODE`;

        // Split long messages if needed (WhatsApp has character limits)
        const maxLength = 4000;
        if (debugMessage.length > maxLength) {
            const chunks = [];
            for (let i = 0; i < debugMessage.length; i += maxLength) {
                chunks.push(debugMessage.slice(i, i + maxLength));
            }

            for (let i = 0; i < chunks.length; i++) {
                const chunkMessage = `${chunks[i]}${i < chunks.length - 1 ? '\n\n📄 (Continued in next message...)' : ''}`;
                await client.messages.sendText({
                    to: phoneNumber,
                    text: chunkMessage
                });

                // Small delay between chunks
                if (i < chunks.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
        } else {
            await client.messages.sendText({
                to: phoneNumber,
                text: debugMessage
            });
        }

        console.log(`📱 DEBUG message sent to ${phoneNumber}: ${title}`);
    } catch (error) {
        console.error('❌ Failed to send debug message:', error);
        // Don't throw - debug messaging shouldn't break the main flow
    }
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
    execute: async ({ context, runtimeContext }) => {
        const { imageUrl, context: analysisContext } = context;
        const startTime = Date.now();

        // Extract context data using new consistent naming
        const phoneNumber = runtimeContext?.get('phoneNumber') as string;
        const userId = runtimeContext?.get('userId') as string;
        const conversationId = runtimeContext?.get('conversationId') as string;

        // Send debug message about tool start
        if (phoneNumber) {
            await sendDebugMessage(phoneNumber, 'IMAGE ANALYSIS TOOL STARTED', {
                imageUrl: imageUrl ? `${imageUrl.substring(0, 100)}...` : 'missing',
                hasContext: !!analysisContext,
                contextLength: analysisContext?.length || 0,
                startTime: new Date(startTime).toISOString(),
                userId,
                conversationId
            });
        }

        logInfo('Starting image analysis', {
            imageUrl: imageUrl ? 'provided' : 'missing',
            imageUrlLength: imageUrl?.length || 0,
            hasContext: !!analysisContext,
            contextLength: analysisContext?.length || 0,
            operation: 'analyze_image'
        });

        if (!imageUrl) {
            const errorMsg = 'Image URL is required for analysis';
            logError(errorMsg, new Error('Missing image URL'), {
                operation: 'analyze_image',
                errorType: 'validation_error'
            });

            if (phoneNumber) {
                await sendDebugMessage(phoneNumber, 'VALIDATION ERROR', {
                    error: errorMsg,
                    type: 'Missing image URL'
                });
            }

            throw new Error(errorMsg);
        }

        const mimeType = getMimeTypeFromUrl(imageUrl);

        logInfo('Image URL validation and preprocessing', {
            imageUrl: imageUrl.substring(0, 100) + '...', // Log partial URL for security
            mimeType,
            urlLength: imageUrl.length,
            operation: 'analyze_image'
        });

        // Send debug message about preprocessing
        if (phoneNumber) {
            await sendDebugMessage(phoneNumber, 'IMAGE PREPROCESSING', {
                mimeType,
                urlLength: imageUrl.length,
                validationComplete: true
            });
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

${analysisContext ? `\nContext: ${analysisContext}` : ''}

Extract all text now, maintaining exact formatting:`;

        try {
            logInfo('Initiating Gemini Vision analysis', {
                mimeType,
                promptLength: analysisPrompt.length,
                hasAdditionalContext: !!analysisContext,
                operation: 'analyze_image'
            });

            // Send debug message about AI processing start
            if (phoneNumber) {
                await sendDebugMessage(phoneNumber, 'AI PROCESSING STARTED', {
                    model: IMAGE_EXTRACTION_GEMINI_MODEL,
                    temperature: IMAGE_EXTRACTION_TEMPERATURE,
                    promptLength: analysisPrompt.length,
                    mimeType
                });
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
                operation: 'analyze_image'
            });

            // Send debug message with AI results
            if (phoneNumber) {
                await sendDebugMessage(phoneNumber, 'AI PROCESSING COMPLETED', {
                    success: true,
                    executionTimeMs: executionTime,
                    imageQuality: analysisResult.imageQuality?.quality,
                    confidence: analysisResult.imageQuality?.confidence,
                    issuesCount: analysisResult.imageQuality?.issues?.length || 0,
                    textLinesCount: analysisResult.ocrResults?.formattedText?.lines?.length || 0,
                    sectionsCount: analysisResult.ocrResults?.formattedText?.sections?.length || 0
                });
            }

            // Send extracted OCR results as debug message
            if (phoneNumber && analysisResult.ocrResults) {
                await sendDebugMessage(phoneNumber, 'OCR EXTRACTION RESULTS', {
                    rawTextLength: analysisResult.ocrResults.rawText?.length || 0,
                    rawTextPreview: analysisResult.ocrResults.rawText?.substring(0, 500) + (analysisResult.ocrResults.rawText?.length > 500 ? '...' : ''),
                    linesCount: analysisResult.ocrResults.formattedText?.lines?.length || 0,
                    sectionsCount: analysisResult.ocrResults.formattedText?.sections?.length || 0,
                    firstFewLines: analysisResult.ocrResults.formattedText?.lines?.slice(0, 10) || []
                });

                // Send the complete raw text as a separate message for full OCR visibility
                if (analysisResult.ocrResults.rawText) {
                    await sendDebugMessage(phoneNumber, 'COMPLETE OCR RAW TEXT', analysisResult.ocrResults.rawText);
                }
            }

            if (!analysisResult) {
                const errorMsg = 'AI failed to generate structured analysis. The vision model may not be processing the image correctly.';
                logError('AI failed to generate structured analysis', new Error('Empty analysis result'), {
                    executionTimeMs: executionTime,
                    operation: 'analyze_image',
                    errorType: 'ai_processing_error'
                });

                if (phoneNumber) {
                    await sendDebugMessage(phoneNumber, 'AI PROCESSING FAILED', {
                        error: errorMsg,
                        executionTimeMs: executionTime,
                        type: 'Empty analysis result'
                    });
                }

                throw new Error(errorMsg);
            }

            // Validate that we got meaningful analysis
            if (!analysisResult.imageQuality) {
                const errorMsg = 'AI did not provide quality assessment. This suggests the analysis may be incomplete.';
                logError('AI did not provide quality assessment', new Error('Missing quality assessment'), {
                    executionTimeMs: executionTime,
                    operation: 'analyze_image',
                    errorType: 'incomplete_analysis'
                });

                if (phoneNumber) {
                    await sendDebugMessage(phoneNumber, 'ANALYSIS VALIDATION FAILED', {
                        error: errorMsg,
                        executionTimeMs: executionTime,
                        type: 'Missing quality assessment'
                    });
                }

                throw new Error(errorMsg);
            }

            // Log detailed analysis results for debugging
            logInfo('General image analysis details', {
                description: analysisResult.ocrResults?.rawText?.substring(0, 100),
                isRelevantToExchange: false,
                hasSuggestedAction: false,
                operation: 'analyze_image'
            });

            // Send final success debug message
            if (phoneNumber) {
                await sendDebugMessage(phoneNumber, 'IMAGE ANALYSIS COMPLETED SUCCESSFULLY', {
                    totalExecutionTimeMs: executionTime,
                    finalQuality: analysisResult.imageQuality.quality,
                    finalConfidence: analysisResult.imageQuality.confidence,
                    hasExtractedText: !!analysisResult.ocrResults.rawText,
                    analysisComplete: true
                });
            }

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

            // Send debug message about the error
            if (phoneNumber) {
                await sendDebugMessage(phoneNumber, 'IMAGE ANALYSIS ERROR', {
                    error: errorMessage,
                    errorType: error instanceof Error ? error.constructor.name : typeof error,
                    executionTimeMs: executionTime,
                    stack: error instanceof Error ? error.stack : undefined,
                    isGeminiError: errorMessage.includes('contents.parts must not be empty'),
                    isNetworkError: errorMessage.includes('network') || errorMessage.includes('fetch'),
                    isAuthError: errorMessage.includes('API key') || errorMessage.includes('auth')
                });
            }

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
