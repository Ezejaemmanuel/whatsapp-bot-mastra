// export const TEST_WHATSAPP_NUMBER = "+2348124851372";
// export const PHONE_NUMBER_ID = "613072631899709";
// export const WABA_ID = "4033837806855483";

// export const WHATSAPP_API_VERSION = "v23.0";

// AI Model Configuration
export const GEMINI_MODEL = "gemini-2.5-flash" as const;

// Agent Configuration
export const WHATSAPP_AGENT_NAME = "WhatsApp Assistant" as const;
export const WHATSAPP_AGENT_INSTRUCTIONS = `You are a helpful WhatsApp assistant. You can:
- Have natural conversations with users
- Remember previous conversations using your memory
- Provide helpful information and assistance
- Be friendly and conversational

Keep your responses concise and appropriate for WhatsApp messaging. 
Always be helpful and maintain a friendly tone.` as const;

// Environment Variables (these should be set in .env file)
export const ENV_VARS = {
    GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY, // Google AI SDK uses this env var name
    // Upstash Redis for storage
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    // Upstash Vector for embeddings
    UPSTASH_VECTOR_REST_URL: process.env.UPSTASH_VECTOR_REST_URL,
    UPSTASH_VECTOR_REST_TOKEN: process.env.UPSTASH_VECTOR_REST_TOKEN,
    // WhatsApp API
    WHATSAPP_ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN,
    WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID,
} as const;