import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { formatInTimeZone, toDate } from "date-fns-tz";

// =================================================================
// Query: Get Admin Status
// =================================================================
export const getAdminStatus = query({
    handler: async (ctx) => {
        const adminStatus = await ctx.db.query("adminStatus").unique();

        if (!adminStatus) {
            // If no status is set, assume admin is active
            return {
                isInactive: false,
                reason: "no_config",
            };
        }

        // 1. Check for manual override
        if (adminStatus.isManuallyInactive) {
            return {
                isInactive: true,
                reason: "manual_override",
                activeTime: null,
            };
        }

        // 2. Check recurring schedule
        const { recurringInactiveStart, recurringInactiveEnd, timezone } = adminStatus;

        if (!recurringInactiveStart || !recurringInactiveEnd || !timezone) {
            return {
                isInactive: false,
                reason: "incomplete_schedule",
            };
        }

        try {
            const now = new Date();
            const zonedNow = toDate(now, { timeZone: timezone });

            const currentTime = formatInTimeZone(zonedNow, timezone, "HH:mm");

            const startTime = recurringInactiveStart; // "HH:mm"
            const endTime = recurringInactiveEnd; // "HH:mm"

            let isInactive = false;

            // Handle overnight schedule (e.g., 22:00 to 08:00)
            if (startTime > endTime) {
                if (currentTime >= startTime || currentTime < endTime) {
                    isInactive = true;
                }
            } else { // Handle same-day schedule (e.g., 09:00 to 17:00)
                if (currentTime >= startTime && currentTime < endTime) {
                    isInactive = true;
                }
            }

            if (isInactive) {
                return {
                    isInactive: true,
                    reason: "recurring_schedule",
                    activeTime: endTime,
                };
            }

            return {
                isInactive: false,
                reason: "active_hours",
            };
        } catch (error) {
            console.error("Error checking admin status:", error);
            // Fallback to active in case of time parsing errors
            return {
                isInactive: false,
                reason: "error",
            };
        }
    },
});

// =================================================================
// Query: Get Admin Status Settings
// =================================================================
export const getAdminStatusSettings = query({
    handler: async (ctx) => {
        const adminStatus = await ctx.db.query("adminStatus").unique();
        return adminStatus;
    },
});

// =================================================================
// Mutation: Set Admin Status (Singleton)
// =================================================================
export const setAdminStatus = mutation({
    args: {
        isManuallyInactive: v.optional(v.boolean()),
        recurringInactiveStart: v.optional(v.string()),
        recurringInactiveEnd: v.optional(v.string()),
        timezone: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const existingStatus = await ctx.db.query("adminStatus").unique();

        if (existingStatus) {
            await ctx.db.patch(existingStatus._id, args);
        } else {
            await ctx.db.insert("adminStatus", {
                isManuallyInactive: args.isManuallyInactive ?? false,
                recurringInactiveStart: args.recurringInactiveStart ?? "",
                recurringInactiveEnd: args.recurringInactiveEnd ?? "",
                timezone: args.timezone ?? "Africa/Nairobi",
            });
        }
        return await ctx.db.query("adminStatus").unique();
    },
});

// =================================================================
// Mutation: Toggle Manual Inactive Status
// =================================================================
export const toggleManualStatus = mutation({
    args: {
        isManuallyInactive: v.boolean(),
    },
    handler: async (ctx, { isManuallyInactive }) => {
        const existingStatus = await ctx.db.query("adminStatus").unique();
        if (existingStatus) {
            return await ctx.db.patch(existingStatus._id, { isManuallyInactive });
        } else {
            // Create a new one if it doesn't exist
            return await ctx.db.insert("adminStatus", {
                isManuallyInactive,
                recurringInactiveStart: "",
                recurringInactiveEnd: "",
                timezone: "Africa/Nairobi",
            });
        }
    },
}); 