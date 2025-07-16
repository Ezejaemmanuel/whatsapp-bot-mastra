import { mutation, action, query } from "./_generated/server";
import { v } from "convex/values";
import type { MutationCtx, ActionCtx, QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { api } from "./_generated/api";

/**
 * Mutation to store a new OCR embedding and its metadata
 */
export const storeOcrEmbedding = mutation({
    args: {
        rawOcrText: v.string(),
        embedding: v.array(v.float64()),
        transactionId: v.optional(v.string()),
        paymentReference: v.optional(v.string()),
        userId: v.optional(v.id("users")),
        messageId: v.optional(v.id("messages")),
        metadata: v.optional(v.any()),
    },
    handler: async (ctx: MutationCtx, args) => {
        const createdAt = Date.now();
        const id = await ctx.db.insert("ocrEmbeddings", {
            ...args,
            createdAt,
        });
        return id;
    },
});

/**
 * Query to fetch multiple OCR embeddings by IDs (for use in actions)
 */
export const getByIds = query({
    args: { ids: v.array(v.id("ocrEmbeddings")) },
    handler: async (ctx: QueryCtx, { ids }) => {
        const docs: Doc<"ocrEmbeddings">[] = [];
        for (const id of ids) {
            const doc = await ctx.db.get(id);
            if (doc) docs.push(doc);
        }
        return docs;
    },
});

/**
 * Action to perform similarity search for a given embedding
 * Returns the top K most similar embeddings above a similarity threshold
 */
export const findSimilarOcrEmbeddings = action({
    args: {
        embedding: v.array(v.float64()),
        topK: v.optional(v.number()),
        minScore: v.optional(v.float64()),
    },
    handler: async (ctx: ActionCtx, { embedding, topK = 5, minScore = 0.85 }) => {
        // Perform vector search using Convex vector index
        const results: { _id: Id<"ocrEmbeddings">; _score: number }[] = await ctx.vectorSearch(
            "ocrEmbeddings",
            "by_embedding",
            {
                vector: embedding,
                limit: topK,
            }
        );
        // Filter by similarity score
        const filtered = results.filter(r => r._score >= minScore);
        const ids = filtered.map(r => r._id);
        // Fetch full documents for the results
        const docs: Doc<"ocrEmbeddings">[] = await ctx.runQuery(api.ocrEmbeddings.getByIds, { ids });
        // Optionally, you can return the score along with the doc if needed
        return docs;
    },
}); 