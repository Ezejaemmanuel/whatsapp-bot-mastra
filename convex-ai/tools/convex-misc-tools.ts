import { createTool } from "@convex-dev/agent";
import z from "zod";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";

export const getAdminStatusTool = createTool({
  description: "Get the admin's current online status.",
  args: z.object({}),
  handler: async (
    ctx,
  ): Promise<{
    isInactive: boolean;
    reason: string;
    settings: Doc<"adminStatus"> | null | undefined;
    activeTime?: string | null;
  }> => {
    return await ctx.runQuery(api.adminStatus.getAdminStatus, {});
  },
});

export const getKenyaTimeTool = createTool({
  description:
    "Get current time/date/part of day in Kenya (Africa/Nairobi) with helpful labels.",
  args: z.object({}),
  handler: async (_ctx) => {
    const now = new Date();
    const timeZone = "Africa/Nairobi";
    const timeString = now.toLocaleTimeString("en-GB", { timeZone });
    const dateString = now.toLocaleDateString("en-CA", { timeZone });
    const dateTimeString = `${dateString} ${timeString}`;
    const hour = parseInt(
      now
        .toLocaleTimeString("en-US", {
          timeZone,
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
        })
        .split(":")[0],
      10,
    );
    const partOfDay = hour < 12 ? "morning" : hour < 16 ? "afternoon" : "evening";
    const dayOfWeek = now.toLocaleDateString("en-US", { timeZone, weekday: "long" });
    let specialGreeting: string | null = null;
    if (dayOfWeek === "Saturday" || dayOfWeek === "Sunday") specialGreeting = "Happy weekend!";
    if (dayOfWeek === "Sunday") specialGreeting = "Happy Sunday!";
    if (dayOfWeek === "Monday") specialGreeting = "Happy new week!";
    return {
      success: true,
      time: timeString,
      date: dateString,
      dateTime: dateTimeString,
      partOfDay,
      dayOfWeek,
      specialGreeting,
    };
  },
});

export const updateTransactionBankDetailsTool = createTool({
  description: "Update transaction-specific bank details and cache on user.",
  args: z.object({
    transactionId: z.string(),
    transactionBankName: z.string(),
    transactionAccountNumber: z.string(),
    transactionAccountName: z.string(),
  }),
  handler: async (
    ctx,
    args: {
      transactionId: string;
      transactionBankName: string;
      transactionAccountNumber: string;
      transactionAccountName: string;
    },
    _options,
  ): Promise<{ updated: true }> => {
    const userId = ctx.userId as Id<"users"> | undefined;
    if (!userId) throw new Error("Missing userId in tool context.");

    // Ensure the transaction exists and belongs to the current user
    const tx = await ctx.runQuery(api.transactions.getTransaction, {
      transactionId: args.transactionId as Id<"transactions">,
    });
    if (!tx) throw new Error("Transaction not found");
    if (tx.userId !== userId) throw new Error("You cannot modify a transaction that belongs to a different user.");

    await ctx.runMutation(api.transactions.updateTransactionBankDetails, {
      transactionId: args.transactionId as Id<"transactions">,
      transactionBankName: args.transactionBankName,
      transactionAccountNumber: args.transactionAccountNumber,
      transactionAccountName: args.transactionAccountName,
    });
    await ctx.runMutation(api.users.updateUserBankDetails, {
      userId,
      bankName: args.transactionBankName,
      accountNumber: args.transactionAccountNumber,
      accountName: args.transactionAccountName,
    });
    return { updated: true } as const;
  },
});

export const getUserTransactionsTool = createTool({
  description: "Get transactions for the current user.",
  args: z.object({
    limit: z.number().optional(),
    status: z
      .enum([
        "pending",
        "image_received_and_being_reviewed",
        "confirmed_and_money_sent_to_user",
        "cancelled",
        "failed",
      ] as const)
      .optional(),
  }),
  handler: async (
    ctx,
    args: {
      limit?: number;
      status?:
        | "pending"
        | "image_received_and_being_reviewed"
        | "confirmed_and_money_sent_to_user"
        | "cancelled"
        | "failed";
    },
    _options,
  ): Promise<Doc<"transactions">[]> => {
    const userId = ctx.userId as Id<"users"> | undefined;
    if (!userId) throw new Error("Missing userId in tool context.");

    return await ctx.runQuery(api.transactions.getUserTransactions, {
      userId,
      ...(args.limit ? { limit: args.limit } : {}),
      ...(args.status ? { status: args.status } : {}),
    });
  },
});

export const getLatestUserTransactionTool = createTool({
  description: "Get the latest transaction for the current user.",
  args: z.object({}),
  handler: async (
    ctx,
  ): Promise<Doc<"transactions"> | null> => {
    const userId = ctx.userId as Id<"users"> | undefined;
    if (!userId) throw new Error("Missing userId in tool context.");

    const list = await ctx.runQuery(api.transactions.getUserTransactions, {
      userId,
      limit: 1,
    });
    return Array.isArray(list) && list.length > 0 ? (list[0] as Doc<"transactions">) : null;
  },
});

export const getUserTool = createTool({
  description: "Get current user info including bank details.",
  args: z.object({}),
  handler: async (
    ctx,
  ): Promise<Doc<"users"> | null> => {
    const userId = ctx.userId as Id<"users"> | undefined;
    if (!userId) throw new Error("Missing userId in tool context.");
    return await ctx.runQuery(api.users.getUserById, { userId });
  },
});


