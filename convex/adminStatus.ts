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
            return {
                isInactive: false,
                reason: "no_config",
                settings: null,
            };
        }

        let status: {
            isInactive: boolean;
            reason: string;
            activeTime?: string | null;
        };

        if (adminStatus.isManuallyInactive) {
            status = {
                isInactive: true,
                reason: "manual_override",
                activeTime: null,
            };
        } else {
            const { recurringInactiveStart, recurringInactiveEnd, timezone } = adminStatus;

            if (!recurringInactiveStart || !recurringInactiveEnd || !timezone) {
                status = {
                    isInactive: false,
                    reason: "incomplete_schedule",
                };
            } else {
                try {
                    const now = new Date();
                    const zonedNow = toDate(now, { timeZone: timezone });
                    const currentTime = formatInTimeZone(zonedNow, timezone, "HH:mm");
                    const startTime = recurringInactiveStart;
                    const endTime = recurringInactiveEnd;

                    let isInactiveNow = false;
                    if (startTime > endTime) {
                        if (currentTime >= startTime || currentTime < endTime) {
                            isInactiveNow = true;
                        }
                    } else {
                        if (currentTime >= startTime && currentTime < endTime) {
                            isInactiveNow = true;
                        }
                    }

                    if (isInactiveNow) {
                        status = {
                            isInactive: true,
                            reason: "recurring_schedule",
                            activeTime: endTime,
                        };
                    } else {
                        status = {
                            isInactive: false,
                            reason: "active_hours",
                        };
                    }
                } catch (error) {
                    console.error("Error checking admin status:", error);
                    status = {
                        isInactive: false,
                        reason: "error",
                    };
                }
            }
        }

        return {
            ...status,
            settings: adminStatus,
        };
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