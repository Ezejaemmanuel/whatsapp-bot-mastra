import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';

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

// Schema for receipt information
const receiptSchema = z.object({
    isReceipt: z.boolean().describe("Whether this image is a payment receipt or transaction confirmation"),

    // Receipt-specific information (only if isReceipt is true)
    receiptDetails: z.object({
        transactionAmount: z.string().optional().describe("Transaction amount with currency symbol"),
        currency: z.string().optional().describe("Currency of the transaction (e.g., USD, NGN, GBP)"),
        transactionId: z.string().optional().describe("Transaction ID, reference number, or receipt number"),
        date: z.string().optional().describe("Date of the transaction"),
        time: z.string().optional().describe("Time of the transaction"),
        bankName: z.string().optional().describe("Bank name or payment service provider"),
        senderName: z.string().optional().describe("Sender name or account details"),
        receiverName: z.string().optional().describe("Receiver name or account details"),
        paymentMethod: z.string().optional().describe("Payment method (transfer, card, mobile money, etc.)"),
        transactionStatus: z.string().optional().describe("Transaction status (successful, pending, failed)"),
        additionalDetails: z.string().optional().describe("Any other important details found on the receipt")
    }).optional(),

    // General image information (if not a receipt)
    imageAnalysis: z.object({
        description: z.string().describe("Brief description of what the image contains"),
        content: z.string().describe("Detailed analysis of the image content"),
        isRelevantToExchange: z.boolean().describe("Whether this image might be relevant to currency exchange business"),
        suggestedAction: z.string().describe("Suggested response or action for the user")
    }).optional(),

    // Analysis confidence and quality assessment
    analysisQuality: z.object({
        imageQuality: z.enum(['excellent', 'good', 'fair', 'poor']).describe("Quality of the image for analysis"),
        confidence: z.enum(['high', 'medium', 'low']).describe("Confidence level in the analysis"),
        issues: z.array(z.string()).optional().describe("Any issues with image quality or readability")
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
        const analysisPrompt = `You are an expert image analyst specializing in financial documents and receipt analysis. 

Your task is to analyze this image and determine:

1. **Is this a payment receipt or transaction confirmation?**
   - Look for transaction amounts, bank names, reference numbers, dates
   - Check for payment confirmations, transfer receipts, bank statements
   - Identify any financial transaction evidence

2. **If it IS a receipt/transaction:**
   - Extract ALL visible transaction details
   - Include amounts, currencies, reference numbers, dates, times
   - Note bank names, sender/receiver information
   - Identify transaction status and payment method
   - Extract any other relevant financial information

3. **If it is NOT a receipt:**
   - Provide a brief, clear description of what the image shows
   - Explain why this is not a valid receipt for financial verification
   - Suggest what the user should send instead if they need to verify a payment
   - Be helpful but clear about what's needed for exchange verification

4. **Quality Assessment:**
   - Evaluate image quality (excellent/good/fair/poor)
   - Rate your confidence in the analysis (high/medium/low)
   - Note any issues that affect readability

${analysisContext ? `\n**Additional Context:** ${analysisContext}` : ''}

**Instructions:**
- Be thorough in extracting financial information from receipts
- Be honest about image quality and confidence levels
- If text is unclear, note specific issues
- For non-receipts, be polite but clear about requirements
- Always prioritize accuracy over completeness

Analyze the image now:`;

        try {
            logInfo('Initiating Gemini Vision analysis', {
                mimeType,
                promptLength: analysisPrompt.length,
                hasAdditionalContext: !!analysisContext,
                operation: 'analyze_image'
            });

            // Use generateObject for structured outputs with AI SDK
            const result = await generateObject({
                model: google('gemini-2.0-flash'),
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
                isReceipt: analysisResult.isReceipt,
                imageQuality: analysisResult.analysisQuality?.imageQuality,
                confidence: analysisResult.analysisQuality?.confidence,
                hasReceiptDetails: !!analysisResult.receiptDetails,
                hasImageAnalysis: !!analysisResult.imageAnalysis,
                hasIssues: !!analysisResult.analysisQuality?.issues && analysisResult.analysisQuality.issues.length > 0,
                issuesCount: analysisResult.analysisQuality?.issues?.length || 0,
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
            if (!analysisResult.analysisQuality) {
                logError('AI did not provide quality assessment', new Error('Missing quality assessment'), {
                    hasReceiptDetails: !!analysisResult.receiptDetails,
                    hasImageAnalysis: !!analysisResult.imageAnalysis,
                    executionTimeMs: executionTime,
                    operation: 'analyze_image',
                    errorType: 'incomplete_analysis'
                });
                throw new Error("AI did not provide quality assessment. This suggests the analysis may be incomplete.");
            }

            // Log detailed analysis results for debugging
            if (analysisResult.isReceipt) {
                logInfo('Receipt analysis details', {
                    transactionAmount: analysisResult.receiptDetails?.transactionAmount,
                    currency: analysisResult.receiptDetails?.currency,
                    hasTransactionId: !!analysisResult.receiptDetails?.transactionId,
                    hasBankName: !!analysisResult.receiptDetails?.bankName,
                    hasDate: !!analysisResult.receiptDetails?.date,
                    paymentMethod: analysisResult.receiptDetails?.paymentMethod,
                    transactionStatus: analysisResult.receiptDetails?.transactionStatus,
                    operation: 'analyze_image'
                });
            } else {
                logInfo('General image analysis details', {
                    description: analysisResult.imageAnalysis?.description?.substring(0, 100),
                    isRelevantToExchange: analysisResult.imageAnalysis?.isRelevantToExchange,
                    hasSuggestedAction: !!analysisResult.imageAnalysis?.suggestedAction,
                    operation: 'analyze_image'
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

            // Return a structured error response instead of throwing
            return {
                isReceipt: false,
                imageAnalysis: {
                    description: "Error analyzing image",
                    content: `Failed to analyze the image: ${errorMessage}`,
                    isRelevantToExchange: false,
                    suggestedAction: "Please try uploading the image again or contact support if the issue persists."
                },
                analysisQuality: {
                    imageQuality: 'poor' as const,
                    confidence: 'low' as const,
                    issues: [`Analysis failed: ${errorMessage}`]
                }
            };
        }
    },
}); 