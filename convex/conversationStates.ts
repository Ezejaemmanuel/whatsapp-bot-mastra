import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get conversation state
 */
export const getConversationState = query({
    args: { conversationId: v.id("conversations") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("conversationStates")
            .withIndex("by_conversation_id", (q) => q.eq("conversationId", args.conversationId))
            .first();
    },
});

/**
 * Create or update conversation state
 */
export const upsertConversationState = mutation({
    args: {
        conversationId: v.id("conversations"),
        currentFlow: v.string(),
        lastInteraction: v.string(),
        transactionData: v.optional(v.any()),
        negotiationHistory: v.optional(v.array(v.any())),
        interactiveMenuState: v.optional(v.any()),
        awaitingResponse: v.optional(v.string()),
        contextData: v.optional(v.any()),
        expiresAt: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const existingState = await ctx.db
            .query("conversationStates")
            .withIndex("by_conversation_id", (q) => q.eq("conversationId", args.conversationId))
            .first();

        const now = Date.now();

        if (existingState) {
            // Update existing state
            return await ctx.db.patch(existingState._id, {
                currentFlow: args.currentFlow,
                lastInteraction: args.lastInteraction,
                transactionData: args.transactionData ?? existingState.transactionData,
                negotiationHistory: args.negotiationHistory ?? existingState.negotiationHistory,
                interactiveMenuState: args.interactiveMenuState ?? existingState.interactiveMenuState,
                awaitingResponse: args.awaitingResponse ?? existingState.awaitingResponse,
                contextData: args.contextData ?? existingState.contextData,
                lastUpdated: now,
                expiresAt: args.expiresAt ?? existingState.expiresAt,
            });
        } else {
            // Create new state
            return await ctx.db.insert("conversationStates", {
                conversationId: args.conversationId,
                currentFlow: args.currentFlow,
                lastInteraction: args.lastInteraction,
                transactionData: args.transactionData,
                negotiationHistory: args.negotiationHistory || [],
                interactiveMenuState: args.interactiveMenuState,
                awaitingResponse: args.awaitingResponse,
                contextData: args.contextData,
                lastUpdated: now,
                expiresAt: args.expiresAt,
            });
        }
    },
});

/**
 * Update conversation flow state
 */
export const updateConversationFlow = mutation({
    args: {
        conversationId: v.id("conversations"),
        currentFlow: v.string(),
        lastInteraction: v.string(),
        awaitingResponse: v.optional(v.string()),
        contextData: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        const existingState = await ctx.db
            .query("conversationStates")
            .withIndex("by_conversation_id", (q) => q.eq("conversationId", args.conversationId))
            .first();

        const now = Date.now();

        if (existingState) {
            return await ctx.db.patch(existingState._id, {
                currentFlow: args.currentFlow,
                lastInteraction: args.lastInteraction,
                awaitingResponse: args.awaitingResponse,
                contextData: args.contextData ? { ...existingState.contextData, ...args.contextData } : existingState.contextData,
                lastUpdated: now,
            });
        } else {
            return await ctx.db.insert("conversationStates", {
                conversationId: args.conversationId,
                currentFlow: args.currentFlow,
                lastInteraction: args.lastInteraction,
                awaitingResponse: args.awaitingResponse,
                contextData: args.contextData,
                lastUpdated: now,
            });
        }
    },
});

/**
 * Update transaction data in conversation state
 */
export const updateTransactionData = mutation({
    args: {
        conversationId: v.id("conversations"),
        transactionData: v.any(),
    },
    handler: async (ctx, args) => {
        const existingState = await ctx.db
            .query("conversationStates")
            .withIndex("by_conversation_id", (q) => q.eq("conversationId", args.conversationId))
            .first();

        if (!existingState) {
            throw new Error("Conversation state not found");
        }

        return await ctx.db.patch(existingState._id, {
            transactionData: { ...existingState.transactionData, ...args.transactionData },
            lastUpdated: Date.now(),
        });
    },
});

/**
 * Add negotiation to conversation state history
 */
export const addNegotiationToState = mutation({
    args: {
        conversationId: v.id("conversations"),
        negotiation: v.any(),
    },
    handler: async (ctx, args) => {
        const existingState = await ctx.db
            .query("conversationStates")
            .withIndex("by_conversation_id", (q) => q.eq("conversationId", args.conversationId))
            .first();

        if (!existingState) {
            throw new Error("Conversation state not found");
        }

        const updatedHistory = [...(existingState.negotiationHistory || []), args.negotiation];

        return await ctx.db.patch(existingState._id, {
            negotiationHistory: updatedHistory,
            lastUpdated: Date.now(),
        });
    },
});

/**
 * Update interactive menu state
 */
export const updateInteractiveMenuState = mutation({
    args: {
        conversationId: v.id("conversations"),
        menuState: v.any(),
    },
    handler: async (ctx, args) => {
        const existingState = await ctx.db
            .query("conversationStates")
            .withIndex("by_conversation_id", (q) => q.eq("conversationId", args.conversationId))
            .first();

        if (!existingState) {
            throw new Error("Conversation state not found");
        }

        return await ctx.db.patch(existingState._id, {
            interactiveMenuState: args.menuState,
            lastUpdated: Date.now(),
        });
    },
});

/**
 * Reset conversation state (for new conversation or completion)
 */
export const resetConversationState = mutation({
    args: { conversationId: v.id("conversations") },
    handler: async (ctx, args) => {
        const existingState = await ctx.db
            .query("conversationStates")
            .withIndex("by_conversation_id", (q) => q.eq("conversationId", args.conversationId))
            .first();

        const now = Date.now();

        if (existingState) {
            return await ctx.db.patch(existingState._id, {
                currentFlow: "welcome",
                lastInteraction: "text",
                transactionData: undefined,
                negotiationHistory: [],
                interactiveMenuState: undefined,
                awaitingResponse: undefined,
                contextData: undefined,
                lastUpdated: now,
                expiresAt: undefined,
            });
        } else {
            return await ctx.db.insert("conversationStates", {
                conversationId: args.conversationId,
                currentFlow: "welcome",
                lastInteraction: "text",
                negotiationHistory: [],
                lastUpdated: now,
            });
        }
    },
});

/**
 * Get expired conversation states (for cleanup)
 */
export const getExpiredStates = query({
    args: { limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        const now = Date.now();

        let query = ctx.db
            .query("conversationStates")
            .withIndex("by_expires_at", (q) => q.lt("expiresAt", now));

        if (args.limit) {
            return await query.take(args.limit);
        }

        return await query.collect();
    },
});

/**
 * Delete conversation state
 */
export const deleteConversationState = mutation({
    args: { conversationId: v.id("conversations") },
    handler: async (ctx, args) => {
        const existingState = await ctx.db
            .query("conversationStates")
            .withIndex("by_conversation_id", (q) => q.eq("conversationId", args.conversationId))
            .first();

        if (existingState) {
            await ctx.db.delete(existingState._id);
        }
    },
});

/**
 * Get conversations by flow state (for monitoring)
 */
export const getConversationsByFlow = query({
    args: {
        currentFlow: v.string(),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        let query = ctx.db
            .query("conversationStates")
            .withIndex("by_current_flow", (q) => q.eq("currentFlow", args.currentFlow))
            .order("desc");

        if (args.limit) {
            return await query.take(args.limit);
        }

        return await query.collect();
    },
}); 