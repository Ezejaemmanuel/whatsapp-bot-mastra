import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Get or create a user by WhatsApp ID
 */
export const getOrCreateUser = mutation({
    args: {
        whatsappId: v.string(),
        profileName: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Check if user already exists
        const existingUser = await ctx.db
            .query("users")
            .withIndex("by_whatsapp_id", (q) => q.eq("whatsappId", args.whatsappId))
            .first();

        if (existingUser) {
            // Prepare updates object
            const updates: { profileName?: string; phoneNumber?: string } = {};
            let hasUpdates = false;

            // Update profile name if provided and different
            if (args.profileName && existingUser.profileName !== args.profileName) {
                updates.profileName = args.profileName;
                hasUpdates = true;
            }

            // Update phone number - always derive it from whatsappId by adding '+' prefix
            const phoneNumber = `+${args.whatsappId}`;
            if (phoneNumber && existingUser.phoneNumber !== phoneNumber) {
                updates.phoneNumber = phoneNumber;
                hasUpdates = true;
            }

            // Apply updates if any
            if (hasUpdates) {
                await ctx.db.patch(existingUser._id, updates);
                return { ...existingUser, ...updates };
            }
            
            return existingUser;
        }

        // Create new user
        // Always derive phoneNumber from whatsappId by adding '+' prefix
        const phoneNumber = `+${args.whatsappId}`;
        
        const userId = await ctx.db.insert("users", {
            whatsappId: args.whatsappId,
            profileName: args.profileName,
            phoneNumber: phoneNumber,
            isBlocked: false,
        });

        const newUser = await ctx.db.get(userId);
        return newUser;
    },
});

/**
 * Get user by WhatsApp ID
 */
export const getUserByWhatsAppId = query({
    args: {
        whatsappId: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("users")
            .withIndex("by_whatsapp_id", (q) => q.eq("whatsappId", args.whatsappId))
            .first();
    },
});

/**
 * Get user by ID
 */
export const getUserById = query({
    args: {
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.userId);
    },
});

/**
 * Get all users with pagination
 */
export const getAllUsers = query({
    args: {
        limit: v.optional(v.number()),
        offset: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit || 50;
        const offset = args.offset || 0;

        return await ctx.db
            .query("users")
            .order("desc")
            .paginate({ numItems: limit, cursor: null })
            .then(result => result.page);
    },
});

/**
 * Update user profile
 */
export const updateUser = mutation({
    args: {
        userId: v.id("users"),
        profileName: v.optional(v.string()),
        phoneNumber: v.optional(v.string()),
        isBlocked: v.optional(v.boolean()),
        bankName: v.optional(v.string()),
        accountNumber: v.optional(v.string()),
        accountName: v.optional(v.string()),
        metadata: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        const { userId, ...updates } = args;

        // Remove undefined values
        const cleanUpdates = Object.fromEntries(
            Object.entries(updates).filter(([_, value]) => value !== undefined)
        );

        await ctx.db.patch(userId, cleanUpdates);
        return await ctx.db.get(userId);
    },
});

/**
 * Update user bank details
 */
export const updateUserBankDetails = mutation({
    args: {
        userId: v.id("users"),
        bankName: v.string(),
        accountNumber: v.string(),
        accountName: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.userId, {
            bankName: args.bankName,
            accountNumber: args.accountNumber,
            accountName: args.accountName,
        });
        return await ctx.db.get(args.userId);
    },
});

/**
 * Block/unblock a user
 */
export const toggleUserBlock = mutation({
    args: {
        userId: v.id("users"),
        isBlocked: v.boolean(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.userId, {
            isBlocked: args.isBlocked,
        });
        return await ctx.db.get(args.userId);
    },
});

/**
 * Get users with recent activity
 */
export const getUsersWithRecentActivity = query({
    args: {
        limit: v.optional(v.number()),
        hoursAgo: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit || 20;
        const hoursAgo = args.hoursAgo || 24;
        const cutoffTime = Date.now() - (hoursAgo * 60 * 60 * 1000);

        // Get users who have conversations with recent messages
        const recentConversations = await ctx.db
            .query("conversations")
            .withIndex("by_last_message_at", (q) => q.gte("lastMessageAt", cutoffTime))
            .collect();

        const userIds = Array.from(new Set(recentConversations.map(c => c.userId)));

        const users = await Promise.all(
            userIds.slice(0, limit).map(id => ctx.db.get(id))
        );

        return users.filter(user => user !== null);
    },
});