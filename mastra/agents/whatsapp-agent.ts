import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { UpstashStore, UpstashVector } from '@mastra/upstash';
import { google } from '@ai-sdk/google';
import { fastembed } from '@mastra/fastembed';
import { WHATSAPP_AGENT_NAME, WHATSAPP_AGENT_INSTRUCTIONS, GEMINI_MODEL } from './agent-instructions';
import { exchangeTools } from '../tools/exchange-tools';

// Validate required environment variables
if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error('GOOGLE_GENERATIVE_AI_API_KEY environment variable is required');
}

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables are required');
}

if (!process.env.UPSTASH_VECTOR_REST_URL || !process.env.UPSTASH_VECTOR_REST_TOKEN) {
    throw new Error('UPSTASH_VECTOR_REST_URL and UPSTASH_VECTOR_REST_TOKEN environment variables are required');
}

// Configure Upstash Redis storage for general memory storage
const upstashStorage = new UpstashStore({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Configure Upstash Vector database for embeddings and semantic search
const upstashVector = new UpstashVector({
    url: process.env.UPSTASH_VECTOR_REST_URL!,
    token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
});

// Enhanced memory configuration for exchange bot context
const memory = new Memory({
    storage: upstashStorage, // Redis for general storage
    vector: upstashVector, // Vector database for embeddings
    embedder: fastembed, // Local FastEmbed - free, fast, and private!
    options: {
        lastMessages: 15, // Keep more messages for complex exchange conversations
        semanticRecall: {
            topK: 5, // Retrieve more similar messages for better context
            messageRange: 3, // Include more context around matches
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

// Convert tools array to tools object for agent
const toolsObject = exchangeTools.reduce((acc, tool) => {
    acc[tool.id] = tool;
    return acc;
}, {} as Record<string, any>);

// Create the enhanced WhatsApp Exchange Agent with Google Gemini 2.5 Flash
export const whatsappAgent = new Agent({
    name: WHATSAPP_AGENT_NAME,
    description: 'An intelligent WhatsApp exchange bot for KhalidWid Exchange, specializing in currency exchange with smart negotiation, transaction processing, and fraud prevention capabilities.',
    instructions: WHATSAPP_AGENT_INSTRUCTIONS,
    model: google(GEMINI_MODEL), // API key should be set via GOOGLE_GENERATIVE_AI_API_KEY environment variable
    memory,
    tools: toolsObject,
}); 