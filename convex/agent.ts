import { Agent } from "@convex-dev/agent";
import { components } from "./_generated/api";
import { gateway } from "@ai-sdk/gateway";
import { google } from "@ai-sdk/google";
import { WHATSAPP_AGENT_INSTRUCTIONS, WHATSAPP_AGENT_NAME, CHAT_AI_MODEL_GATEWAY } from "../convex-ai/agents/agent-instructions";
import {
  getCurrentRatesTool,
  createTransactionTool,
  updateTransactionTool,
  getAdminBankDetailsTool,
} from "../convex-ai/tools/convex-exchange-tools";
import {
  getAdminStatusTool,
  getKenyaTimeTool,
  updateTransactionBankDetailsTool,
  getUserTransactionsTool,
  getLatestUserTransactionTool,
  getUserTool,
} from "../convex-ai/tools/convex-misc-tools";

// NOTE: Using Vercel AI Gateway for chat; Google for embeddings
export const whatsappAgent = new Agent(components.agent, {
  name: WHATSAPP_AGENT_NAME,
  instructions: WHATSAPP_AGENT_INSTRUCTIONS, // Manually passed for now
  // Use Google embeddings directly
  textEmbedding: google.textEmbedding("text-embedding-004"),
  // Use Vercel AI Gateway for chat model (provider/model slug configured in instructions)
  chat: gateway(CHAT_AI_MODEL_GATEWAY),
  tools: {
    getCurrentRatesTool,
    createTransactionTool,
    updateTransactionTool,
    getAdminBankDetailsTool,
    getAdminStatusTool,
    getKenyaTimeTool,
    updateTransactionBankDetailsTool,
    getUserTransactionsTool,
    getLatestUserTransactionTool,
    getUserTool,
  },
  maxSteps: 10, // allow tool call chains
});


