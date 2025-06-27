import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';

// API key setup
const GOOGLE_GENERATIVE_AI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

if (!GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error('GOOGLE_GENERATIVE_AI_API_KEY environment variable is required for image analysis');
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

        if (!imageUrl) {
            throw new Error("Image URL is required for analysis");
        }

        const mimeType = getMimeTypeFromUrl(imageUrl);

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
            console.log(`🖼️ Analyzing image with Gemini Vision: ${imageUrl}`);
            console.log(`📋 MIME type detected: ${mimeType}`);

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

            console.log(`🤖 AI Image Analysis completed`);
            console.log(`📊 Analysis result: ${result.object.isReceipt ? 'Receipt detected' : 'Not a receipt'}`);
            console.log(`🎯 Confidence: ${result.object.analysisQuality.confidence}`);

            const analysisResult = result.object;

            if (!analysisResult) {
                throw new Error("AI failed to generate structured analysis. The vision model may not be processing the image correctly.");
            }

            // Validate that we got meaningful analysis
            if (!analysisResult.analysisQuality) {
                throw new Error("AI did not provide quality assessment. This suggests the analysis may be incomplete.");
            }

            return analysisResult;

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);

            console.error("❌ Image analysis error:", error);
            console.error("🔧 Error details:", {
                imageUrl,
                mimeType,
                errorType: error instanceof Error ? error.constructor.name : typeof error,
                errorMessage
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