import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { Redis } from '@upstash/redis';

/**
 * A powerful tool for the agent to completely reset a user's conversation by deleting
 * the underlying thread data directly from Upstash Redis.
 * This should only be used when the agent is certain a conversational context is finished.
 */
export const endTransactionAndResetMemoryTool = createTool({
    id: 'endTransactionAndResetMemoryTool',
    description: 'Call this tool ONLY after a transaction is fully handed off (e.g., payment proof acknowledged). This completely deletes the current conversation history and working memory to start a fresh conversation. Do not call this for casual image shares.',
    inputSchema: z.object({}), // No input needed
    execute: async ({ threadId, resourceId, mastra }) => {
        if (!threadId || !resourceId || !mastra) {
            throw new Error('threadId, resourceId, and mastra instance are required to reset memory.');
        }

        const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
        const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

        if (!redisUrl || !redisToken) {
            throw new Error("Upstash Redis credentials are not configured in environment variables.");
        }

        try {
            const redis = new Redis({ url: redisUrl, token: redisToken });

            // Define the keys based on Mastra's internal storage patterns for Upstash
            const threadKey = `mastra:thread:${threadId}`;
            const messagesKey = `mastra:messages:${threadId}`;
            const workingMemoryKey = `mastra:working-memory:${threadId}`;

            // 1. Get all message IDs from the thread's message list
            const messageIds = await redis.lrange(messagesKey, 0, -1);

            // 2. Create a pipeline for efficient bulk deletion
            const pipeline = redis.pipeline();

            // 3. Queue deletion of all individual message objects
            if (messageIds && messageIds.length > 0) {
                const individualMessageKeys = messageIds.map(id => `mastra:message:${id}`);
                pipeline.del(...individualMessageKeys);
            }

            // 4. Queue deletion of the main thread keys
            pipeline.del(messagesKey, threadKey, workingMemoryKey);

            // 5. Execute all deletion commands in one go
            await pipeline.exec();

            

            return {
                success: true,
                message: 'Conversation history and working memory have been successfully deleted. Ready for a new conversation.'
            };
        } catch (error) {
            console.error(`Failed to delete thread data from Upstash for thread ${threadId}:`, error);
            throw new Error(`Failed to reset memory for thread ${threadId}`);
        }
    }
});
