import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { google } from '@ai-sdk/google';
    import { WHATSAPP_AGENT_NAME, WHATSAPP_AGENT_INSTRUCTIONS, GEMINI_MODEL } from './agent-instructions';

// Validate required environment variables
if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error('GOOGLE_GENERATIVE_AI_API_KEY environment variable is required');
}

// Create simple memory configuration without external dependencies
const memory = new Memory({
    options: {
        lastMessages: 10, // Keep last 10 messages in context
      
        threads: {
            generateTitle: true, // Auto-generate thread titles
        },
    },
});

// Create the WhatsApp agent with Google Gemini 2.5 Flash
export const whatsappAgentSimple = new Agent({
    name: WHATSAPP_AGENT_NAME + ' (Simple)',
    description: 'A simple WhatsApp assistant powered by Google Gemini 2.5 Flash with basic memory',
    instructions: WHATSAPP_AGENT_INSTRUCTIONS,
    model: google(GEMINI_MODEL),
    // memory,
    // No tools for now as requested - we'll add them later
    tools: {},
});

console.log('✅ Simple WhatsApp agent created successfully (no external dependencies)'); 