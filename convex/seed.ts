import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { Faker, en } from "@faker-js/faker";
import { Doc } from "./_generated/dataModel";
import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { TransactionStatus, SenderRole } from "./types";

// A little helper function to get a random element from an array
const getRandom = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

type SeedResult = {
  success: boolean;
  message: string;
  skipped: boolean;
  usersCreated: number;
};

export const seedDatabase = action({
  handler: async (ctx): Promise<SeedResult> => {
    console.log("Starting database seeding...");

    // Check if seeding has already been done
    const existingUsers = await ctx.runQuery(api.users.getAllUsers, { limit: 1 });
    if (existingUsers && existingUsers.length > 0) {
      console.log("Database already contains users. Skipping seeding to prevent duplicates.");
      console.log("If you want to re-seed, please clear the database first.");
      return { success: true, message: "Database already seeded", skipped: true, usersCreated: 0 };
    }

    const faker = new Faker({ locale: [en] });

    console.log("Creating seed users and conversations...");
    const createdUsers = [];

    // Create 100 users
    for (let i = 0; i < 100; i++) {
      try {
        const profileName = faker.person.fullName();
        // Use a consistent seed-based prefix to avoid conflicts with real WhatsApp IDs
        const whatsappId = `seed_${faker.string.uuid()}`;
        const phoneNumber = faker.phone.number();

        const user: Doc<"users"> | null = await ctx.runMutation(api.users.getOrCreateUser, {
          whatsappId,
          profileName,
          phoneNumber,
        });

        if (!user) {
          console.error(`Failed to create user: ${profileName}`);
          continue;
        }

        createdUsers.push(user);

        const conversation = await ctx.runMutation(api.conversations.getOrCreateConversation, {
          userId: user._id,
          userName: user.profileName || 'Unknown User',
        });

        if (!conversation) {
          console.error(`Failed to create conversation for user: ${profileName}`);
          continue;
        }

        const messageCount = faker.number.int({ min: 5, max: 15 });
        let lastMessageContent: string = "Welcome to our exchange service!";

        for (let j = 0; j < messageCount; j++) {
          const timestamp = Date.now() - (messageCount - j) * 60000; // messages in the past
          const content = faker.lorem.sentence();
          lastMessageContent = content;

          try {
            if (j % 2 === 0) { // User message
              await ctx.runMutation(api.messages.storeIncomingMessage, {
                conversationId: conversation._id,
                senderRole: "user",
                senderName: user.profileName || 'User',
                messageType: "text",
                content,
                timestamp,
              });
            } else { // Bot message
              await ctx.runMutation(api.messages.storeOutgoingMessage, {
                conversationId: conversation._id,
                senderRole: "bot",
                senderName: "Exchange Bot",
                messageType: "text",
                content,
              });
            }
          } catch (messageError) {
            console.error(`Failed to create message ${j} for user ${profileName}:`, messageError);
            // Continue with next message instead of failing completely
          }
        }

        // Update conversation with last message info
        await ctx.runMutation(api.conversations.updateConversationLastMessage, {
          conversationId: conversation._id,
          lastMessageAt: Date.now(),
          lastMessageSummary: lastMessageContent,
        });

        // Log progress every 10 users
        if ((i + 1) % 10 === 0) {
          console.log(`Created ${i + 1}/100 users...`);
        }
      } catch (userError) {
        console.error(`Failed to create user ${i + 1}:`, userError);
        // Continue with next user instead of failing completely
      }
    }

    console.log(`Database seeding complete. Created ${createdUsers.length} users with conversations and messages.`);
    return {
      success: true,
      message: `Successfully seeded database with ${createdUsers.length} users`,
      usersCreated: createdUsers.length,
      skipped: false
    };
  },
});

type SeedTransactionsResult = {
  success: boolean;
  message: string;
  skipped: boolean;
  transactionsCreated: number;
};

export const seedTransactions = action({
  handler: async (ctx): Promise<SeedTransactionsResult> => {
    console.log("Starting transaction seeding...");

    const existingTransactions = await ctx.runQuery(api.transactions.getAllTransactions, { paginationOpts: { numItems: 1, cursor: null } });
    if (existingTransactions && existingTransactions.page.length > 0) {
      console.log("Database already contains transactions. Skipping seeding.");
      return { success: true, message: "Transactions already seeded", skipped: true, transactionsCreated: 0 };
    }

    const users = await ctx.runQuery(api.users.getAllUsers, {});
    if (!users || users.length === 0) {
      console.log("No users found in the database. Please seed users first.");
      return { success: true, message: "No users to create transactions for", skipped: true, transactionsCreated: 0 };
    }

    const faker = new Faker({ locale: [en] });
    let transactionsCreated = 0;
    const currencies = ["USD", "EUR", "GBP", "NGN", "GHS"];
    const transactionStatuses = ["pending", "completed", "failed", "cancelled"];

    for (const user of users) {
      const conversation = await ctx.runQuery(api.conversations.getConversationByUserId, { userId: user._id });
      if (!conversation) {
        console.log(`Skipping user ${user.profileName} as they have no conversation.`);
        continue;
      }

      const numTransactions = faker.number.int({ min: 2, max: 5 });

      for (let i = 0; i < numTransactions; i++) {
        const currencyFrom = getRandom(currencies);
        let currencyTo = getRandom(currencies);
        while (currencyTo === currencyFrom) {
          currencyTo = getRandom(currencies);
        }

        const amountFrom = faker.number.float({ min: 100, max: 5000, fractionDigits: 2 });
        const negotiatedRate = faker.number.float({ min: 0.8, max: 1.5, fractionDigits: 4 });
        const amountTo = amountFrom * negotiatedRate;

        await ctx.runMutation(api.transactions.createTransaction, {
          userId: user._id,
          conversationId: conversation._id,
          currencyFrom,
          currencyTo,
          amountFrom,
          amountTo,
          negotiatedRate,
        });
        transactionsCreated++;
      }
    }

    console.log(`Transaction seeding complete. Created ${transactionsCreated} transactions.`);
    return {
      success: true,
      message: `Successfully seeded ${transactionsCreated} transactions.`,
      transactionsCreated: transactionsCreated,
      skipped: false,
    };
  }
}); 