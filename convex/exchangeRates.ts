import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get current exchange rates for a specific currency pair
 */
export const getCurrentRates = query({
    args: { currencyPair: v.optional(v.string()) },
    handler: async (ctx, args) => {
        if (args.currencyPair) {
            return await ctx.db
                .query("exchangeRates")
                .withIndex("by_currency_pair", (q) => q.eq("currencyPair", args.currencyPair!))
                .first();
        }

        // Return all active rates if no specific pair requested
        return await ctx.db
            .query("exchangeRates")
            .collect();
    },
});

/**
 * Get all available exchange rates
 */
export const getAllExchangeRates = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db
            .query("exchangeRates")
            .collect();
    },
});

/**
 * Create or update exchange rate
 */
export const upsertExchangeRate = mutation({
    args: {
        fromCurrencyName: v.string(),
        fromCurrencyCode: v.string(),
        toCurrencyName: v.string(),
        toCurrencyCode: v.string(),
        minRate: v.number(),
        maxRate: v.number(),
        currentMarketRate: v.number(),
        metadata: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        const currencyPair = `${args.fromCurrencyCode.toUpperCase()}-${args.toCurrencyCode.toUpperCase()}`;

        const existingRate = await ctx.db
            .query("exchangeRates")
            .withIndex("by_currency_pair", (q) => q.eq("currencyPair", currencyPair))
            .first();

        const now = Date.now();

        if (existingRate) {
            // Update existing rate
            return await ctx.db.patch(existingRate._id, {
                fromCurrencyName: args.fromCurrencyName,
                fromCurrencyCode: args.fromCurrencyCode.toUpperCase(),
                toCurrencyName: args.toCurrencyName,
                toCurrencyCode: args.toCurrencyCode.toUpperCase(),
                currencyPair,
                minRate: args.minRate,
                maxRate: args.maxRate,
                currentMarketRate: args.currentMarketRate,
                lastUpdated: now,
                metadata: args.metadata ?? existingRate.metadata,
            });
        } else {
            // Create new rate
            return await ctx.db.insert("exchangeRates", {
                fromCurrencyName: args.fromCurrencyName,
                fromCurrencyCode: args.fromCurrencyCode.toUpperCase(),
                toCurrencyName: args.toCurrencyName,
                toCurrencyCode: args.toCurrencyCode.toUpperCase(),
                currencyPair,
                minRate: args.minRate,
                maxRate: args.maxRate,
                currentMarketRate: args.currentMarketRate,
                lastUpdated: now,
                metadata: args.metadata,
            });
        }
    },
});

/**
 * Update market rate for a currency pair
 */
export const updateMarketRate = mutation({
    args: {
        currencyPair: v.string(),
        newMarketRate: v.number(),
    },
    handler: async (ctx, args) => {
        const rate = await ctx.db
            .query("exchangeRates")
            .withIndex("by_currency_pair", (q) => q.eq("currencyPair", args.currencyPair))
            .first();

        if (!rate) {
            throw new Error(`Exchange rate not found for currency pair: ${args.currencyPair}`);
        }

        return await ctx.db.patch(rate._id, {
            currentMarketRate: args.newMarketRate,
            lastUpdated: Date.now(),
        });
    },
});

/**
 * Deactivate exchange rate
 */
export const deactivateRate = mutation({
    args: { currencyPair: v.string() },
    handler: async (ctx, args) => {
        const rate = await ctx.db
            .query("exchangeRates")
            .withIndex("by_currency_pair", (q) => q.eq("currencyPair", args.currencyPair))
            .first();

        if (!rate) {
            throw new Error(`Exchange rate not found for currency pair: ${args.currencyPair}`);
        }

        return await ctx.db.patch(rate._id, {
            lastUpdated: Date.now(),
        });
    },
});

/**
 * Delete exchange rate
 */
export const deleteRate = mutation({
    args: { rateId: v.id("exchangeRates") },
    handler: async (ctx, args) => {
        // You might want to add authentication/authorization checks here
        // to ensure only authorized users can delete rates.

        const rate = await ctx.db.get(args.rateId);
        if (!rate) {
            throw new Error("Exchange rate not found");
        }

        await ctx.db.delete(args.rateId);

        return { success: true };
    },
});

/**
 * Check if a negotiated rate is within acceptable bounds
 */
export const validateNegotiatedRate = query({
    args: {
        currencyPair: v.string(),
        proposedRate: v.number(),
    },
    handler: async (ctx, args) => {
        const rate = await ctx.db
            .query("exchangeRates")
            .withIndex("by_currency_pair", (q) => q.eq("currencyPair", args.currencyPair))
            .first();

        if (!rate) {
            return {
                valid: false,
                reason: "Currency pair not found or inactive",
            };
        }

        const isValid = args.proposedRate >= rate.minRate && args.proposedRate <= rate.maxRate;

        return {
            valid: isValid,
            reason: isValid
                ? "Rate is within acceptable bounds"
                : `Rate must be between ${rate.minRate} and ${rate.maxRate}`,
            minRate: rate.minRate,
            maxRate: rate.maxRate,
            currentMarketRate: rate.currentMarketRate,
        };
    },
}); 