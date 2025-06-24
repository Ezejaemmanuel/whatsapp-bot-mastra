import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { UpstashStore, UpstashVector } from '@mastra/upstash';
import { google } from '@ai-sdk/google';
import { fastembed } from '@mastra/fastembed';
import { GEMINI_MODEL, WHATSAPP_AGENT_NAME, WHATSAPP_AGENT_INSTRUCTIONS, ENV_VARS } from '../../../constant';

// Validate required environment variables
if (!ENV_VARS.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error('GOOGLE_GENERATIVE_AI_API_KEY environment variable is required');
}

if (!ENV_VARS.UPSTASH_URL || !ENV_VARS.UPSTASH_TOKEN) {
    throw new Error('UPSTASH_URL and UPSTASH_TOKEN environment variables are required');
}

// Configure Upstash storage
const upstashStorage = new UpstashStore({
    url: ENV_VARS.UPSTASH_URL!,
    token: ENV_VARS.UPSTASH_TOKEN!,
});

// Configure Upstash vector database
const upstashVector = new UpstashVector({
    url: ENV_VARS.UPSTASH_URL!,
    token: ENV_VARS.UPSTASH_TOKEN!,
});

// Configure memory with Upstash storage and vector database
const memory = new Memory({
    storage: upstashStorage,
    vector: upstashVector, // Separate vector database
    embedder: fastembed, // Local FastEmbed - free, fast, and private!
    options: {
        lastMessages: 10, // Keep last 10 messages in context
        semanticRecall: {
            topK: 3, // Retrieve 3 most similar messages
            messageRange: 2, // Include 2 messages before and after each match
            scope: 'thread', // Search within current thread
        },
        workingMemory: {
            enabled: true,
            template: `
# User Information
- Name:
- Phone Number:
- Preferences:
- Current Topic:
- Important Notes:

# Conversation Context
- Last Interaction:
- Ongoing Tasks:
- User Needs:
`,
        },
        threads: {
            generateTitle: true, // Auto-generate thread titles
        },
    },
});

// Create the WhatsApp agent with Google Gemini 2.5 Flash
export const whatsappAgent = new Agent({
    name: WHATSAPP_AGENT_NAME,
    description: 'A WhatsApp assistant powered by Google Gemini 2.5 Flash with memory capabilities',
    instructions: WHATSAPP_AGENT_INSTRUCTIONS,
    model: google(GEMINI_MODEL), // API key should be set via GOOGLE_GENERATIVE_AI_API_KEY environment variable
    memory,
    // No tools for now as requested - we'll add them later
    tools: {},
}); 