import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Get all admin bank details
 */
export const getAllAdminBankDetails = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db
            .query("adminBankDetails")
            .order("desc")
            .collect();
    },
});

/**
 * Get admin bank details by ID
 */
export const getAdminBankDetailsById = query({
    args: {
        bankDetailsId: v.id("adminBankDetails"),
    },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.bankDetailsId);
    },
});

/**
 * Create or update admin bank details
 */
export const upsertAdminBankDetails = mutation({
    args: {
        _id: v.optional(v.id("adminBankDetails")),
        accountNumber: v.string(),
        accountName: v.string(),
        bankName: v.string(),
        description: v.optional(v.string()),
        accountType: v.union(v.literal("buy"), v.literal("sell")),
        metadata: v.optional(v.any()),
    },
    handler: async (ctx, { _id, ...args }) => {
        const now = Date.now();
        if (_id) {
            await ctx.db.patch(_id, { ...args, updatedAt: now });
            return _id;
        }
        return await ctx.db.insert("adminBankDetails", {
            ...args,
            createdAt: now,
            updatedAt: now,
            accountType: args.accountType,
        });
    },
});

/**
 * Delete admin bank details
 */
export const deleteAdminBankDetails = mutation({
    args: {
        bankDetailsId: v.id("adminBankDetails"),
    },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.bankDetailsId);
        return { success: true, deletedId: args.bankDetailsId };
    },
});