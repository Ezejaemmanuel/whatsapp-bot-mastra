import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Get the main admin bank details
 */
export const getMainAdminBankDetails = query({
    args: {},
    handler: async (ctx) => {
        // Try to get the main account first
        const mainAccount = await ctx.db
            .query("adminBankDetails")
            .withIndex("by_is_main", (q) => q.eq("isMain", true))
            .filter((q) => q.eq(q.field("isActive"), true))
            .first();

        if (mainAccount) {
            return mainAccount;
        }

        // If no main account, get any active account
        const activeAccount = await ctx.db
            .query("adminBankDetails")
            .withIndex("by_is_active", (q) => q.eq("isActive", true))
            .first();

        return activeAccount;
    },
});

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
        isActive: v.optional(v.boolean()),
        isMain: v.optional(v.boolean()),
        description: v.optional(v.string()),
        metadata: v.optional(v.any()),
    },
    handler: async (ctx, { _id, ...args }) => {
        const now = Date.now();

        if (args.isMain) {
            const currentMain = await ctx.db
                .query("adminBankDetails")
                .withIndex("by_is_main", (q) => q.eq("isMain", true))
                .filter(q => q.neq(q.field("_id"), _id))
                .first();
            if (currentMain) {
                await ctx.db.patch(currentMain._id, { isMain: false });
            }
        }

        if (_id) {
            await ctx.db.patch(_id, { ...args, updatedAt: now });
            return _id;
        }

        return await ctx.db.insert("adminBankDetails", {
            ...args,
            isActive: args.isActive ?? true,
            isMain: args.isMain ?? false,
            createdAt: now,
            updatedAt: now,
        });
    },
});


export const setMainAdminBankDetails = mutation({
    args: { bankDetailsId: v.id("adminBankDetails") },
    handler: async (ctx, args) => {
        const currentMain = await ctx.db
            .query("adminBankDetails")
            .withIndex("by_is_main", q => q.eq("isMain", true))
            .first();

        if (currentMain) {
            await ctx.db.patch(currentMain._id, { isMain: false });
        }

        await ctx.db.patch(args.bankDetailsId, { isMain: true });
    }
})

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