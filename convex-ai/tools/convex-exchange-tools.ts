import { createTool } from "@convex-dev/agent";
import z from "zod";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";

// Convex-native tool wrappers that reuse existing Convex queries/mutations

export const getCurrentRatesTool = createTool({
  description: "Get ALL current exchange rates.",
  args: z.object({}),
  handler: async (ctx,): Promise<Doc<"exchangeRates">[]> => {
    return await ctx.runQuery(api.exchangeRates.getAllExchangeRates, {});
  },
});

export const createTransactionTool = createTool({
  description: "Create a new transaction (auto-extracts user and conversation).",
  args: z.object({
    currencyFrom: z.string().optional(),
    currencyTo: z.string().optional(),
    amountFrom: z.number().optional(),
    amountTo: z.number().optional(),
    negotiatedRate: z.number().optional(),
    estimatedRate: z.number().optional(),
    imageUrl: z.string().optional(),
    notes: z.string().optional(),
    customerBankName: z.string().optional(),
    customerAccountNumber: z.string().optional(),
    customerAccountName: z.string().optional(),
    transactionBankName: z.string().optional(),
    transactionAccountNumber: z.string().optional(),
    transactionAccountName: z.string().optional(),
  }),
  handler: async (
    ctx,
    args: {
      currencyFrom?: string;
      currencyTo?: string;
      amountFrom?: number;
      amountTo?: number;
      negotiatedRate?: number;
      estimatedRate?: number;
      imageUrl?: string;
      notes?: string;
      customerBankName?: string;
      customerAccountNumber?: string;
      customerAccountName?: string;
      transactionBankName?: string;
      transactionAccountNumber?: string;
      transactionAccountName?: string;
    },
    _options,
  ): Promise<Id<"transactions">> => {
    const userId = ctx.userId as Id<"users"> | undefined;
    if (!userId) {
      throw new Error("Missing userId in tool context.");
    }

    // Resolve or create an active conversation for this user
    let conversation = await ctx.runQuery(api.conversations.getConversationByUserId, { userId });
    if (!conversation) {
      const user = await ctx.runQuery(api.users.getUserById, { userId });
      const userName = (user?.profileName || user?.phoneNumber || "User") as string;
      conversation = await ctx.runMutation(api.conversations.getOrCreateConversation, { userId, userName });
    }

    if (!conversation) {
      throw new Error("Failed to resolve a conversation for the current user.");
    }

    const id = await ctx.runMutation(api.transactions.createTransaction, {
      ...args,
      userId,
      conversationId: conversation._id as Id<"conversations">,
    });
    return id as Id<"transactions">;
  },
});

export const updateTransactionTool = createTool({
  description: "Update transaction status and fields.",
  args: z.object({
    transactionId: z.string(),
    status: z
      .enum([
        "pending",
        "image_received_and_being_reviewed",
        "confirmed_and_money_sent_to_user",
        "cancelled",
        "failed",
      ] as const)
      .optional(),
    paymentReference: z.string().optional(),
    receiptImageUrl: z.string().optional(),
    imageUrl: z.string().optional(),
    extractedDetails: z.record(z.unknown()).optional(),
    customerBankName: z.string().optional(),
    customerAccountNumber: z.string().optional(),
    customerAccountName: z.string().optional(),
    transactionBankName: z.string().optional(),
    transactionAccountNumber: z.string().optional(),
    transactionAccountName: z.string().optional(),
    notes: z.string().optional(),
  }),
  handler: async (
    ctx,
    args: {
      transactionId: string;
      status?:
        | "pending"
        | "image_received_and_being_reviewed"
        | "confirmed_and_money_sent_to_user"
        | "cancelled"
        | "failed";
      paymentReference?: string;
      receiptImageUrl?: string;
      imageUrl?: string;
      extractedDetails?: unknown;
      customerBankName?: string;
      customerAccountNumber?: string;
      customerAccountName?: string;
      transactionBankName?: string;
      transactionAccountNumber?: string;
      transactionAccountName?: string;
      notes?: string;
    },
    _options,
  ): Promise<void> => {
    const userId = ctx.userId as Id<"users"> | undefined;
    if (!userId) {
      throw new Error("Missing userId in tool context.");
    }

    // Ensure the transaction exists and belongs to the current user
    const tx = await ctx.runQuery(api.transactions.getTransaction, {
      transactionId: args.transactionId as Id<"transactions">,
    });
    if (!tx) {
      throw new Error("Transaction not found");
    }
    if (tx.userId !== userId) {
      throw new Error("You cannot modify a transaction that belongs to a different user.");
    }

    await ctx.runMutation(api.transactions.updateTransactionStatus, {
      ...args,
      transactionId: args.transactionId as Id<"transactions">,
    });
  },
});

export const getAdminBankDetailsTool = createTool({
  description: "Get admin bank details.",
  args: z.object({}),
  handler: async (
    ctx,
  ): Promise<Doc<"adminBankDetails">[]> => {
    return await ctx.runQuery(api.adminBankDetails.getAllAdminBankDetails, {});
  },
});


