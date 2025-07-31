import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
    ConversationStatusUnion,
    InChargeUnion,
    MessageDirectionUnion,
    SenderRoleUnion,
    MessageTypeUnion,
    MessageStatusUnion,
    UploadStatusUnion,
    TransactionStatusUnion,
    AdminBankAccountTypeUnion
} from "./schemaUnions";

/**
 * Convex Schema for WhatsApp Bot
 * 
 * This schema defines the structure of all tables used by the WhatsApp bot,
 * migrated from the previous Drizzle ORM schema.
 */

export default defineSchema({
    /**
     * Users table - stores WhatsApp user information
     */
    users: defineTable({
        whatsappId: v.string(), // Unique WhatsApp ID
        phoneNumber: v.optional(v.string()), // Phone number
        profileName: v.optional(v.string()), // Profile name
        isBlocked: v.optional(v.boolean()), // Whether user is blocked
        bankName: v.optional(v.string()), // Customer's bank name
        accountNumber: v.optional(v.string()), // Customer's account number
        accountName: v.optional(v.string()), // Customer's account name
        metadata: v.optional(v.any()), // Additional user metadata
    })
        .index("by_whatsapp_id", ["whatsappId"])
        .index("by_phone_number", ["phoneNumber"]),

    /**
     * Conversations table - stores conversation sessions
     */
    conversations: defineTable({
        userId: v.id("users"), // Reference to user
        userName: v.string(), // User's profile name or phone number for display
        status: v.optional(ConversationStatusUnion), // Conversation status
        inCharge: InChargeUnion, // Who is handling the conversation
        lastMessageAt: v.optional(v.number()), // Last message timestamp
        lastMessageSummary: v.optional(v.string()), // A snippet of the last message content
        metadata: v.optional(v.any()), // Conversation-specific metadata
        unreadCount: v.optional(v.number()),
    })
        .index("by_user_id", ["userId"])
        .index("by_status", ["status"])
        .index("by_last_message_at", ["lastMessageAt"])
        .index("by_in_charge", ["inCharge"]),

    /**
     * Messages table - stores all messages (incoming and outgoing)
     */
    messages: defineTable({
        conversationId: v.id("conversations"), // Reference to conversation
        whatsappMessageId: v.optional(v.string()), // WhatsApp message ID
        direction: MessageDirectionUnion, // Message direction
        senderRole: SenderRoleUnion, // Who sent the message
        senderName: v.string(), // Display name of the sender (user name, 'Bot', or admin name)
        messageType: MessageTypeUnion, // Message type
        content: v.optional(v.string()), // Text content for text messages
        mediaUrl: v.optional(v.string()), // URL for media files
        mediaType: v.optional(v.string()), // MIME type for media
        fileName: v.optional(v.string()), // Original filename for documents
        caption: v.optional(v.string()), // Caption for media messages
        location: v.optional(v.any()), // Location data {latitude, longitude, name, address}
        contacts: v.optional(v.any()), // Contact information
        context: v.optional(v.any()), // Message context (reply, forward info)
        status: v.optional(MessageStatusUnion), // Message status
        timestamp: v.number(), // Message timestamp
        metadata: v.optional(v.any()), // Additional message metadata
        error: v.optional(v.string()), // Error message if status is 'failed'
    })
        .index("by_conversation_id", ["conversationId"])
        .index("by_whatsapp_message_id", ["whatsappMessageId"])
        .index("by_direction", ["direction"])
        .index("by_message_type", ["messageType"])
        .index("by_status", ["status"])
        .index("by_timestamp", ["timestamp"])
        .index("by_sender_role", ["senderRole"]),

    /**
     * Media files table - stores information about uploaded media files
     */
    mediaFiles: defineTable({
        storageId: v.optional(v.id("_storage")), // Convex storage ID
        messageId: v.optional(v.id("messages")), // Reference to message
        whatsappMediaId: v.optional(v.string()), // WhatsApp media ID
        storedUrl: v.optional(v.string()), // Stored file URL from Convex storage
        fileName: v.optional(v.string()), // File name
        mimeType: v.optional(v.string()), // MIME type
        fileSize: v.optional(v.number()), // Size in bytes
        sha256: v.optional(v.string()), // WhatsApp provided hash
        uploadStatus: v.optional(UploadStatusUnion), // Upload status
        metadata: v.optional(v.any()), // Additional file metadata
    })
        .index("by_message_id", ["messageId"])
        .index("by_whatsapp_media_id", ["whatsappMediaId"])
        .index("by_upload_status", ["uploadStatus"])
        .index("by_storage_id", ["storageId"]),

    /**
     * Exchange rates table - stores currency exchange rates with separate buying and selling rates
     */
    exchangeRates: defineTable({
        fromCurrencyName: v.string(), // e.g. United States Dollar
        fromCurrencyCode: v.string(), // e.g. USD
        toCurrencyName: v.string(), // e.g. Nigerian Naira
        toCurrencyCode: v.string(), // e.g. NGN
        currencyPair: v.string(), // 'USD-NGN', 'GBP-NGN', etc. auto-generated

        // Only one fixed rate for buying and selling
        buyingCurrentMarketRate: v.number(), // Current market buying rate
        sellingCurrentMarketRate: v.number(), // Current market selling rate
        lastUpdated: v.number(), // Last update timestamp
        metadata: v.optional(v.any()), // Additional rate metadata
    })
        .index("by_currency_pair", ["currencyPair"])
        .index("by_last_updated", ["lastUpdated"]),

    /**
     * Transactions table - stores exchange transaction details
     * Most fields are optional to allow flexible AI-driven transaction creation
     */
    transactions: defineTable({
        userId: v.id("users"), // Reference to user
        conversationId: v.id("conversations"), // Reference to conversation
        currencyFrom: v.optional(v.string()), // Source currency (USD, GBP, EUR, etc.) - AI can set later
        currencyTo: v.optional(v.string()), // Target currency (NGN, etc.) - AI can set later
        amountFrom: v.optional(v.number()), // Amount to exchange from - AI can set later
        amountTo: v.optional(v.number()), // Amount to receive - AI can set later
        negotiatedRate: v.optional(v.number()), // Final rate - AI can set during negotiation
        estimatedRate: v.optional(v.number()), // Initial estimated rate before negotiation
        paymentReference: v.optional(v.string()), // Payment reference number
        receiptImageUrl: v.optional(v.string()), // URL to receipt image
        extractedDetails: v.optional(v.any()), // OCR extracted data from receipt
        status: TransactionStatusUnion, // Transaction status
        createdAt: v.number(), // Transaction creation timestamp
        updatedAt: v.number(), // Last update timestamp
        metadata: v.optional(v.any()), // Additional transaction metadata
        isRead: v.optional(v.boolean()), // Whether the transaction has been read by an admin/agent
        lastReadAt: v.optional(v.number()), // Timestamp when it was last read
        notes: v.optional(v.string()), // Additional transaction notes
        // Transaction-specific bank details (collected after receipt confirmation)
        transactionBankName: v.optional(v.string()), // Bank name for this specific transaction
        transactionAccountNumber: v.optional(v.string()), // Account number for this specific transaction
        transactionAccountName: v.optional(v.string()), // Account name for this specific transaction
        // Customer bank details for this transaction
        customerBankName: v.optional(v.string()), // Customer's bank name
        customerAccountNumber: v.optional(v.string()), // Customer's account number
        customerAccountName: v.optional(v.string()), // Customer's account name
    })
        .index("by_user_id", ["userId"])
        .index("by_conversation_id", ["conversationId"])
        .index("by_status", ["status"])
        .index("by_created_at", ["createdAt"])
        .index("by_updated_at", ["updatedAt"]),

    /**
     * Admin bank details table - stores admin bank account information for receiving payments
     */
    adminBankDetails: defineTable({
        accountNumber: v.string(), // Admin account number
        accountName: v.string(), // Admin account holder name
        bankName: v.string(), // Admin bank name
        description: v.optional(v.string()), // Optional description for the account
        accountType: AdminBankAccountTypeUnion, // 'buy' or 'sell'
        createdAt: v.number(), // Account creation timestamp
        updatedAt: v.number(), // Last update timestamp
        metadata: v.optional(v.any()), // Additional account metadata
    })
        .index("by_account_number", ["accountNumber"]),

    /**
     * Admin status table - stores admin's manual and scheduled availability, along with their timezone
     */
    adminStatus: defineTable({
        isManuallyInactive: v.boolean(),
        recurringInactiveStart: v.string(), // "HH:mm" in 24-hour format
        recurringInactiveEnd: v.string(), // "HH:mm" in 24-hour format
    })
        .index("by_is_manually_inactive", ["isManuallyInactive"])
        .index("by_recurring_inactive_start", ["recurringInactiveStart"])
        .index("by_recurring_inactive_end", ["recurringInactiveEnd"]),



    /**
     * Image Hashes table - stores cryptographic and perceptual hashes for image duplicate detection
     */
    imageHashes: defineTable({
        cryptographicHash: v.string(), // SHA-256 hash for exact duplicate detection
        perceptualHash: v.string(), // Perceptual hash for near-duplicate detection
        imageUrl: v.string(), // URL of the original image
        transactionId: v.optional(v.string()), // Associated transaction ID (if available)
        paymentReference: v.optional(v.string()), // Payment reference (if available)
        userId: v.optional(v.id("users")), // Reference to user
        messageId: v.optional(v.id("messages")), // Reference to message
        createdAt: v.number(), // Timestamp when hashes were created
        metadata: v.optional(v.any()), // Additional metadata
    })
        .index("by_cryptographic_hash", ["cryptographicHash"])
        .index("by_perceptual_hash", ["perceptualHash"])
        .index("by_transaction_id", ["transactionId"])
        .index("by_payment_reference", ["paymentReference"])
        .index("by_user_id", ["userId"])
        .index("by_message_id", ["messageId"]),
});