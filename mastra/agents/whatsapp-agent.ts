import { Agent } from '@mastra/core';
import { Memory } from '@mastra/memory';
import { UpstashStore, UpstashVector } from '@mastra/upstash';
import { gateway } from '@ai-sdk/gateway';
import { WHATSAPP_AGENT_NAME, WHATSAPP_AGENT_INSTRUCTIONS,  CHAT_AI_MODEL_GATEWAY } from './agent-instructions';
import { getCurrentRatesTool, manageTransactionTool } from '../tools/exchange-tools';
import { getUserTransactionsTool, getLatestUserTransactionTool, getAdminBankDetailsTool, getUserTool, updateTransactionBankDetailsTool } from '../tools/exchange-tools-2';
import { getKenyaTimeTool } from '../tools/time-tool';
import { getAdminStatusTool } from '../tools/admin-status-tool';
import { Redis } from '@upstash/redis';
import { PROMPT_KEY } from '@/constant';    
import { google } from '@ai-sdk/google';

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

// Enhanced memory configuration for comprehensive conversation state management
const memory = new Memory({
    storage: upstashStorage, // Redis for general storage
    vector: upstashVector, // Vector database for embeddings
    embedder: google.textEmbeddingModel('text-embedding-004'),
    options: {
        lastMessages: 12, // Increased to capture more conversation context
        semanticRecall: {
            topK: 5, // Increased for better context retrieval
            messageRange: 3, // Enhanced context range
        },
        workingMemory: {
            enabled: true,
            template: `
# 📋 CONVERSATION STATE
**Last Updated**: {{timestamp}}
**User Name**: {{user_name}} // Store user's name here
**User Verified**: {{user_verified}} // (yes/no)
**Admin Status**: {{admin_status}} // (active/inactive)

# 💱 CURRENT SESSION
**Session Type**: {{session_type}} // (inquiry/instant_exchange/receipt_processing)
**Currency Requested**: {{currency_requested}} // (shillings/naira)
**Exchange Direction**: {{exchange_direction}} // (buying_shillings/selling_shillings/buying_naira/selling_naira)
**Rate Provided**: {{rate_provided}}
**Bank Details Sent**: {{bank_details_sent}} // (yes/no)
**Extracted Amount**: {{extracted_amount}} // Amount from receipt

# 🔄 ACTIVE TRANSACTION
**Transaction ID**: {{transaction_id}}
**Transaction Status**: {{transaction_status}} // (none/pending/image_received/completed)
**Amount From**: {{amount_from}}
**Amount To**: {{amount_to}}
**Rate Used**: {{rate_used}}
**Payment Proof Received**: {{payment_proof_received}} // (yes/no)

# 🏦 USER BANK DETAILS
**Bank Details Status**: {{bank_details_status}} // (none/saved/needs_update)
**Bank Name**: {{bank_name}}
**Account Number**: {{account_number}}
**Account Name**: {{account_name}}

# 🎯 NEXT ACTION
**Waiting For**: {{waiting_for}} // (greeting/payment_proof/bank_details/none)
**Last Action**: {{last_action}}
**Receipt Processing**: {{receipt_processing}} // (pending/completed/failed)
`,
        },
        threads: {
            generateTitle: true, // Auto-generate thread titles
        },
    },
});

// Helper function to fetch the system prompt from Redis
async function fetchSystemPromptFromRedis(): Promise<string> {
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!redisUrl || !redisToken) {
        throw new Error('Upstash Redis credentials are not configured in environment variables.');
    }
    const redis = new Redis({ url: redisUrl, token: redisToken });
    // You can change this key as needed
    const prompt = await redis.get(PROMPT_KEY);
    if (typeof prompt === 'string' && prompt.trim().length > 0) {
        return prompt;
    }
    // Fallback to the default instructions if not found in Redis
    return WHATSAPP_AGENT_INSTRUCTIONS;
}

// Export an async function to get the WhatsApp agent with dynamic instructions
export async function getWhatsappAgent() {
    const instructions = await fetchSystemPromptFromRedis();
    return new Agent({
        name: WHATSAPP_AGENT_NAME,
        description: 'An intelligent WhatsApp exchange bot for KhalidWid Exchange, specializing in currency exchange with comprehensive user verification, smart state management, transaction processing, and fraud prevention.',
        instructions,
        model: gateway(CHAT_AI_MODEL_GATEWAY), // Using Vercel AI Gateway for unified model management
        memory,
        tools: {
            getCurrentRatesTool,
            manageTransactionTool,
            getUserTransactionsTool,
            getLatestUserTransactionTool,
            getAdminBankDetailsTool,
            getUserTool,
            updateTransactionBankDetailsTool,
            getKenyaTimeTool,
            getAdminStatusTool,
        },
    });
} 

export const whatsappAgent = new Agent({
    name: WHATSAPP_AGENT_NAME,
    description: 'An intelligent WhatsApp exchange bot for KhalidWid Exchange, specializing in currency exchange with comprehensive user verification, smart state management, transaction processing, and fraud prevention.',
    instructions: WHATSAPP_AGENT_INSTRUCTIONS,
    model: gateway(CHAT_AI_MODEL_GATEWAY), // API key should be set via GOOGLE_GENERATIVE_AI_API_KEY environment variable
    memory,
    tools: {
        getCurrentRatesTool,
        manageTransactionTool,
        getUserTransactionsTool,
        getLatestUserTransactionTool,
        getAdminBankDetailsTool,
        getUserTool,
        updateTransactionBankDetailsTool,
        getKenyaTimeTool,
        getAdminStatusTool,
    },
});