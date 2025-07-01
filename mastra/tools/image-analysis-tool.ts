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

Your PRIMARY task is to first determine if this is a genuine payment receipt or transaction confirmation.

**Receipt Validation Checklist:**
1. **Visual Structure Check:**
   - Does it have a structured layout typical of financial documents?
   - Are there clear sections for amount, date, reference numbers?
   - Does it use formal banking/payment service formatting?

2. **Key Elements Check:**
   - Transaction amount in clear numbers
   - Currency indicators
   - Date and timestamp
   - Transaction/reference numbers
   - Bank/payment service provider branding
   - Sender/receiver information
   - Payment status indicators

3. **Authenticity Indicators:**
   - Official banking/payment service formatting
   - Transaction reference numbers in expected format
   - Professional financial document layout
   - Digital receipt markers (QR codes, verification links)
   - Proper financial institution branding

Only if it passes these checks, proceed with detailed analysis:

1. **For Confirmed Receipts:**
   - Extract ALL transaction details meticulously
   - Verify all critical fields are present
   - Note any missing but expected information
   - Assess receipt quality and completeness

2. **If NOT a Valid Receipt:**
   - Explain clearly why it's not a valid payment proof
   - Describe what the image actually shows
   - Provide specific guidance on what a proper receipt should look like
   - Be firm but helpful about requirements

3. **Quality Assessment:**
   - Image clarity and readability
   - Completeness of visible information
   - Any signs of manipulation or editing
   - Overall confidence in authenticity

${analysisContext ? `\n**Additional Context:** ${analysisContext}` : ''}

**Critical Instructions:**
- Be STRICT in receipt validation
- Flag ANY suspicious or non-standard elements
- Don't assume it's a receipt just because it has numbers
- Be direct but professional about invalid submissions
- Prioritize security and accuracy above all

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