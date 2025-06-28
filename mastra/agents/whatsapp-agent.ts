import { Agent } from '@mastra/core';
import { Memory } from '@mastra/memory';
import { UpstashStore, UpstashVector } from '@mastra/upstash';
import { google } from '@ai-sdk/google';
import { WHATSAPP_AGENT_NAME, WHATSAPP_AGENT_INSTRUCTIONS, GEMINI_MODEL } from './agent-instructions';
import { getCurrentRatesTool, createTransactionTool, updateTransactionStatusTool, checkDuplicateTool, generateDuplicateHashTool } from '../tools/exchange-tools';
import { imageAnalysisTool } from '../tools/image-analysis-tool';
import { sendInteractiveButtonsTool, sendInteractiveListTool } from '../tools/whatsapp-interactive-tool';

const GOOGLE_GENERATIVE_AI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
console.log("GOOGLE_GENERATIVE_AI_API_KEY", GOOGLE_GENERATIVE_AI_API_KEY);
const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const UPSTASH_VECTOR_REST_URL = process.env.UPSTASH_VECTOR_REST_URL;
const UPSTASH_VECTOR_REST_TOKEN = process.env.UPSTASH_VECTOR_REST_TOKEN;
//log everything in the environment variables
console.log("UPSTASH_REDIS_REST_URL", UPSTASH_REDIS_REST_URL);
console.log("UPSTASH_REDIS_REST_TOKEN", UPSTASH_REDIS_REST_TOKEN);
console.log("UPSTASH_VECTOR_REST_URL", UPSTASH_VECTOR_REST_URL);
console.log("UPSTASH_VECTOR_REST_TOKEN", UPSTASH_VECTOR_REST_TOKEN);
console.log("GOOGLE_GENERATIVE_AI_API_KEY", GOOGLE_GENERATIVE_AI_API_KEY);


if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
    throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables are required');
}

// Validate required environment variables
if (!GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error('GOOGLE_GENERATIVE_AI_API_KEY environment variable is required');
}



if (!UPSTASH_VECTOR_REST_URL || !UPSTASH_VECTOR_REST_TOKEN) {
    throw new Error('UPSTASH_VECTOR_REST_URL and UPSTASH_VECTOR_REST_TOKEN environment variables are required');
}

// Configure Upstash Redis storage for general memory storage
const upstashStorage = new UpstashStore({
    url: UPSTASH_REDIS_REST_URL!,
    token: UPSTASH_REDIS_REST_TOKEN!,
});

// Configure Upstash Vector database for embeddings and semantic search
const upstashVector = new UpstashVector({
    url: UPSTASH_VECTOR_REST_URL!,
    token: UPSTASH_VECTOR_REST_TOKEN!,
});

/**
 * Content validation utility to prevent Gemini "contents.parts must not be empty" error
 * This ensures all content sent to Gemini API has valid, non-empty parts
 */
function validateAndSanitizeContent(content: string): string {
    // Remove null, undefined, and empty strings
    if (!content || typeof content !== 'string') {
        return 'Hello'; // Fallback to simple greeting
    }

    // Trim whitespace and normalize
    const sanitized = content.trim();

    // Ensure minimum content length to prevent empty parts
    if (sanitized.length === 0) {
        return 'Hello'; // Fallback to simple greeting
    }

    // Remove any potential problematic characters that might cause parsing issues
    const cleaned = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // Final check - ensure we have actual content
    return cleaned.length > 0 ? cleaned : 'Hello';
}

// Enhanced memory configuration for exchange bot context with Gemini-safe settings
const memory = new Memory({
    storage: upstashStorage, // Redis for general storage
    vector: upstashVector, // Vector database for embeddings
    embedder: google.textEmbeddingModel('text-embedding-004', {
        outputDimensionality: 768, // Optional: adjust dimensions
        taskType: 'SEMANTIC_SIMILARITY', // Optional: specify task type
    }),
    options: {
        // ✅ CRITICAL: Reduced settings to prevent empty message accumulation
        lastMessages: 8, // Significantly reduced from 15 to minimize empty message risk
        semanticRecall: {
            topK: 2, // Reduced from 4 to minimize empty message retrieval
            messageRange: 1, // Reduced from 2 to prevent context pollution
            scope: 'thread', // Search within current thread
        },
        workingMemory: {
            enabled: true,
            template: `
# Customer Information
- WhatsApp ID: 
- Phone Number:
- Profile Name:
- Customer Status: (new/returning)
- Preferred Currency Pairs:
- Transaction History Summary:

# Current Exchange Session
- Current Flow State: (welcome/currency_selection/rate_inquiry/negotiation/account_details/payment/verification/completed)
- Selected Currency Pair:
- Exchange Amount:
- Negotiated Rate:
- Transaction ID:
- Customer Bank Details:
- Payment Status:

# Conversation Context
- Last Interaction Type: (text/button/list/image)
- Awaiting Response: 
- Negotiation History:
- Important Notes:
- Security Flags:

# Business Context
- Current Market Conditions:
- Rate Boundaries:
- Volume Considerations:
- Special Instructions:
`,
        },
        threads: {
            generateTitle: true, // Auto-generate thread titles
        },
    },
});


// Create the enhanced WhatsApp Exchange Agent with Gemini-safe configuration
export const whatsappAgent = new Agent({

    name: WHATSAPP_AGENT_NAME,
    description: 'An intelligent WhatsApp exchange bot for KhalidWid Exchange, specializing in currency exchange with smart negotiation, transaction processing, fraud prevention, and receipt processing through specialized tools.',
    instructions: WHATSAPP_AGENT_INSTRUCTIONS,
    model: google(GEMINI_MODEL), // API key should be set via GOOGLE_GENERATIVE_AI_API_KEY environment variable
    memory,
    tools: {
        getCurrentRatesTool,
        createTransactionTool,
        updateTransactionStatusTool,
        checkDuplicateTool,
        generateDuplicateHashTool,
        imageAnalysisTool,
        sendInteractiveButtonsTool,
        sendInteractiveListTool,
    },
});

// ✅ Export the content validation utility for use in other files
export { validateAndSanitizeContent }; 