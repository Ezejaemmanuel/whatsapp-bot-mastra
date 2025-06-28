import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Get the default active admin bank details
 */
export const getDefaultAdminBankDetails = query({
    args: {},
    handler: async (ctx) => {
        // Try to get the default account first
        const defaultAccount = await ctx.db
            .query("adminBankDetails")
            .withIndex("by_is_default", (q) => q.eq("isDefault", true))
            .filter((q) => q.eq(q.field("isActive"), true))
            .first();

        if (defaultAccount) {
            return defaultAccount;
        }

        // If no default account, get any active account
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
        accountNumber: v.string(),
        accountName: v.string(),
        bankName: v.string(),
        isActive: v.optional(v.boolean()),
        isDefault: v.optional(v.boolean()),
        description: v.optional(v.string()),
        metadata: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        const isActive = args.isActive ?? true;
        const isDefault = args.isDefault ?? false;

        // Check if an account with the same details already exists
        const existingAccount = await ctx.db
            .query("adminBankDetails")
            .filter((q) =>
                q.and(
                    q.eq(q.field("accountNumber"), args.accountNumber),
                    q.eq(q.field("bankName"), args.bankName)
                )
            )
            .first();

        if (existingAccount) {
            // Update existing account
            await ctx.db.patch(existingAccount._id, {
                accountName: args.accountName,
                isActive,
                isDefault,
                description: args.description,
                updatedAt: now,
                metadata: args.metadata,
            });
            return existingAccount._id;
        }

        // If this is set as default, remove default status from other accounts
        if (isDefault) {
            const currentDefaults = await ctx.db
                .query("adminBankDetails")
                .withIndex("by_is_default", (q) => q.eq("isDefault", true))
                .collect();

            for (const account of currentDefaults) {
                await ctx.db.patch(account._id, { isDefault: false });
            }
        }

        // Create new account
        const bankDetailsId = await ctx.db.insert("adminBankDetails", {
            accountNumber: args.accountNumber,
            accountName: args.accountName,
            bankName: args.bankName,
            isActive,
            isDefault,
            description: args.description,
            createdAt: now,
            updatedAt: now,
            metadata: args.metadata,
        });

        return bankDetailsId;
    },
});

/**
 * Update admin bank details status
 */
export const updateAdminBankDetailsStatus = mutation({
    args: {
        bankDetailsId: v.id("adminBankDetails"),
        isActive: v.optional(v.boolean()),
        isDefault: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        const updates: any = { updatedAt: now };

        if (args.isActive !== undefined) {
            updates.isActive = args.isActive;
        }

        if (args.isDefault !== undefined) {
            updates.isDefault = args.isDefault;

            // If setting as default, remove default status from other accounts
            if (args.isDefault) {
                const currentDefaults = await ctx.db
                    .query("adminBankDetails")
                    .withIndex("by_is_default", (q) => q.eq("isDefault", true))
                    .collect();

                for (const account of currentDefaults) {
                    if (account._id !== args.bankDetailsId) {
                        await ctx.db.patch(account._id, { isDefault: false });
                    }
                }
            }
        }

        await ctx.db.patch(args.bankDetailsId, updates);
        return await ctx.db.get(args.bankDetailsId);
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