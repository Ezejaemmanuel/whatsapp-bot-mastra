import { action, type ActionCtx } from "./_generated/server";
import { v } from "convex/values";
import { whatsappAgent } from "./agent";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

// Simple action to generate a reply given a user and thread linkage
export const generateReply = action({
  args: {
    userId: v.id("users"),
    conversationId: v.id("conversations"),
    prompt: v.string(),
  },
  handler: async (
    ctx: ActionCtx,
    {
      userId,
      conversationId,
      prompt,
    }: { userId: Id<"users">; conversationId: Id<"conversations">; prompt: string },
  ): Promise<{ text: string }> => {
    // Lookup existing agent threadId stored on the conversation metadata
    const conversation = await ctx.runQuery(api.conversations.getConversationById, { conversationId });
    const convMetadata = (conversation?.metadata ?? {}) as Record<string, unknown>;
    let threadId: string | null = (convMetadata["agentThreadId"] as string | undefined) ?? null;

    if (!threadId) {
      const created = await whatsappAgent.createThread(ctx, { userId });
      threadId = created.threadId;
      // Persist mapping so future messages continue same thread
      const nextMetadata: Record<string, unknown> = {
        ...(conversation?.metadata ?? {}),
        agentThreadId: threadId,
      };
      await ctx.runMutation(api.conversations.updateConversationMetadata, {
        conversationId,
        metadata: nextMetadata,
      });
    }

    const { thread } = await whatsappAgent.continueThread(ctx, { threadId });

    const result = await thread.generateText({ prompt });
    return { text: result.text };
  },
});


