import { Agent } from '@mastra/core';
import { Memory } from '@mastra/memory';
import { UpstashStore, UpstashVector } from '@mastra/upstash';
import { google } from '@ai-sdk/google';
import { WHATSAPP_AGENT_NAME, WHATSAPP_AGENT_INSTRUCTIONS, GEMINI_MODEL } from './agent-instructions';
import { getCurrentRatesTool, createTransactionTool, updateTransactionStatusTool } from '../tools/exchange-tools';
import { getUserTransactionsTool, getLatestUserTransactionTool, getAdminBankDetailsTool, getUserTool, updateTransactionBankDetailsTool } from '../tools/exchange-tools-2';
import { getKenyaTimeTool } from '../tools/time-tool';
import { getAdminStatusTool } from '../tools/admin-status-tool';
import { Redis } from '@upstash/redis';
import { PROMPT_KEY } from '@/constant';    

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
    embedder: google.textEmbeddingModel('text-embedding-004', {
        outputDimensionality: 768, // Optional: adjust dimensions
    }),
    options: {
        lastMessages: 12, // Increased to capture more conversation context
        semanticRecall: {
            topK: 5, // Increased for better context retrieval
            messageRange: 3, // Enhanced context range
        },
        workingMemory: {
            enabled: true,
            template: `
# 📋 CONVERSATION SNAPSHOT
**Last Updated**: {{timestamp}}
**Conversation Status**: {{conversation_status}} // (initializing/active/transaction_pending/completed/paused)

# 👤 USER PROFILE & VERIFICATION
**WhatsApp ID**: {{whatsapp_id}}
**Phone Number**: {{phone_number}}
**Profile Name**: {{profile_name}}
**User Name Known**: {{user_name_known}} // (yes/no)
**User Name Retrieved**: {{user_name_retrieved}} // (yes/no)
**User Account Status**: {{user_account_status}} // (new_user/returning_user/verified_user)
**User Details Checked**: {{user_details_checked}} // (yes/no/pending)
**Profile Verification Date**: {{profile_verification_date}}

# 🏦 SAVED BANK DETAILS
**Bank Details Status**: {{bank_details_status}} // (none/exists/needs_confirmation/confirmed/needs_update)
**Saved Bank Name**: {{saved_bank_name}}
**Saved Account Number**: {{saved_account_number}} // (masked for security)
**Saved Account Name**: {{saved_account_name}}
**Bank Details Last Updated**: {{bank_details_last_updated}}
**Bank Details Confirmed**: {{bank_details_confirmed}} // (yes/no/pending_confirmation)

# 💱 CURRENT EXCHANGE SESSION
**Exchange Session Status**: {{exchange_session_status}} // (none/inquiry/rate_provided/amount_confirmed/bank_details_phase/ready_to_process/processing/completed)
**Currency Pair**: {{currency_pair}} // (e.g., USD_to_NGN, NGN_to_USD)
**Exchange Direction**: {{exchange_direction}} // (selling_foreign/buying_foreign)
**Requested Amount**: {{requested_amount}}
**Calculated Receiving Amount**: {{calculated_receiving_amount}}
**Exchange Rate Applied**: {{exchange_rate_applied}}
**Rate Confirmation Status**: {{rate_confirmation_status}} // (pending/confirmed/expired)

# 🔄 TRANSACTION STATE
**Active Transaction ID**: {{active_transaction_id}}
**Transaction Status**: {{transaction_status}} // (none/created/pending_payment/image_sent_waiting_for_confirmation/payment_received/processing/completed/failed)
**Transaction Created Date**: {{transaction_created_date}}
**Payment Method**: {{payment_method}}
**Payment Status**: {{payment_status}} // (pending/received/verified/failed)
**Admin Notification Sent**: {{admin_notification_sent}} // (yes/no)

# 📊 LATEST TRANSACTION SUMMARY
**Last Transaction ID**: {{last_transaction_id}}
**Last Transaction Status**: {{last_transaction_status}}
**Last Transaction Amount**: {{last_transaction_amount}}
**Last Transaction Date**: {{last_transaction_date}}
**Last Transaction Success**: {{last_transaction_success}} // (yes/no)

# 🎯 CONVERSATION FLOW STATE
**Current Flow Step**: {{current_flow_step}} // (user_name_verification/welcome/user_verification/exchange_inquiry/rate_confirmation/bank_details_verification/final_confirmation/transaction_processing/completion)
**Next Expected Action**: {{next_expected_action}}
**Waiting For User Input**: {{waiting_for_user_input}} // (none/bank_confirmation/amount_confirmation/final_approval/payment_proof/image_sent_waiting_for_confirmation)
**Flow Completion Percentage**: {{flow_completion_percentage}}%

# 🔐 SECURITY & VALIDATION
**Security Checks Passed**: {{security_checks_passed}} // (pending/passed/failed)
**Fraud Risk Level**: {{fraud_risk_level}} // (low/medium/high)
**Verification Required**: {{verification_required}} // (none/phone/bank_details/payment_proof)
**Session Security Status**: {{session_security_status}} // (secure/needs_verification/flagged)

# 📝 SESSION NOTES & CONTEXT
**Customer Preferences**: {{customer_preferences}}
**Special Instructions**: {{special_instructions}}
**Conversation Tone**: {{conversation_tone}} // (formal/friendly/business)
**Language Preference**: {{language_preference}}
**Timezone**: {{timezone}}

# 🚨 ALERTS & REMINDERS
**Pending Actions**: {{pending_actions}}
**System Alerts**: {{system_alerts}}
**Follow-up Required**: {{follow_up_required}} // (none/rate_update/payment_reminder/completion_confirmation)
**Session Expiry**: {{session_expiry}}
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
        model: google(GEMINI_MODEL), // API key should be set via GOOGLE_GENERATIVE_AI_API_KEY environment variable
        memory,
        tools: {
            getCurrentRatesTool,
            createTransactionTool,
            updateTransactionStatusTool,
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
    model: google(GEMINI_MODEL), // API key should be set via GOOGLE_GENERATIVE_AI_API_KEY environment variable
    memory,
    tools: {
        getCurrentRatesTool,
        createTransactionTool,
        updateTransactionStatusTool,
        getUserTransactionsTool,
        getLatestUserTransactionTool,
        getAdminBankDetailsTool,
        getUserTool,
        updateTransactionBankDetailsTool,
        getKenyaTimeTool,
        getAdminStatusTool,
    },
});