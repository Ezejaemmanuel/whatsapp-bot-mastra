# Database Schema Documentation

## Overview

The WhatsApp bot uses **Convex** as its database solution, providing real-time data synchronization and type-safe database operations. The schema is designed to handle WhatsApp messaging, user management, currency exchange transactions, and administrative functions.

## Table of Contents

- [Core Tables](#core-tables)
  - [Users](#users)
  - [Conversations](#conversations)
  - [Messages](#messages)
  - [Media Files](#media-files)
- [Exchange System](#exchange-system)
  - [Exchange Rates](#exchange-rates)
  - [Transactions](#transactions)
  - [Admin Bank Details](#admin-bank-details)
- [Administrative](#administrative)
  - [Admin Status](#admin-status)
  - [Image Hashes](#image-hashes)
- [Data Types and Enums](#data-types-and-enums)
- [Indexes and Performance](#indexes-and-performance)

## Core Tables

### Users

Stores WhatsApp user information and their banking details.

```typescript
users: {
  whatsappId: string,           // Unique WhatsApp ID (required)
  phoneNumber?: string,         // Phone number
  profileName?: string,         // Profile name
  isBlocked?: boolean,          // Whether user is blocked
  bankName?: string,            // Customer's bank name
  accountNumber?: string,       // Customer's account number
  accountName?: string,         // Customer's account name
  metadata?: any,               // Additional user metadata
}
```

**Indexes:**
- `by_whatsapp_id`: Fast lookup by WhatsApp ID
- `by_phone_number`: Search by phone number

### Conversations

Manages conversation sessions between users and the bot/admin.

```typescript
conversations: {
  userId: Id<"users">,          // Reference to user
  userName: string,             // User's display name
  status?: ConversationStatus,  // "active" | "archived" | "closed"
  inCharge: InCharge,          // "bot" | "admin"
  lastMessageAt?: number,       // Last message timestamp
  lastMessageSummary?: string,  // Snippet of last message
  metadata?: any,               // Conversation metadata
  unreadCount?: number,         // Unread message count
}
```

**Indexes:**
- `by_user_id`: Find conversations by user
- `by_status`: Filter by conversation status
- `by_last_message_at`: Sort by recent activity
- `by_in_charge`: Filter by who's handling the conversation

### Messages

Stores all messages (incoming and outgoing) with rich metadata.

```typescript
messages: {
  conversationId: Id<"conversations">, // Reference to conversation
  whatsappMessageId?: string,          // WhatsApp message ID
  direction: MessageDirection,         // "inbound" | "outbound"
  senderRole: SenderRole,             // "user" | "bot" | "admin"
  senderName: string,                 // Display name of sender
  messageType: MessageType,           // Message type (see enum)
  content?: string,                   // Text content
  mediaUrl?: string,                  // Media file URL
  mediaType?: string,                 // MIME type
  fileName?: string,                  // Original filename
  caption?: string,                   // Media caption
  location?: any,                     // Location data
  contacts?: any,                     // Contact information
  context?: any,                      // Reply/forward context
  status?: MessageStatus,             // Message status
  timestamp: number,                  // Message timestamp
  metadata?: any,                     // Additional metadata
  error?: string,                     // Error message if failed
}
```

**Indexes:**
- `by_conversation_id`: Messages in a conversation
- `by_whatsapp_message_id`: WhatsApp message lookup
- `by_direction`: Filter by message direction
- `by_message_type`: Filter by message type
- `by_status`: Filter by message status
- `by_timestamp`: Sort by time
- `by_sender_role`: Filter by sender role

### Media Files

Manages uploaded media files with storage references.

```typescript
mediaFiles: {
  storageId?: Id<"_storage">,    // Convex storage ID
  messageId?: Id<"messages">,    // Reference to message
  whatsappMediaId?: string,      // WhatsApp media ID
  storedUrl?: string,            // Stored file URL
  fileName?: string,             // File name
  mimeType?: string,             // MIME type
  fileSize?: number,             // Size in bytes
  sha256?: string,               // WhatsApp hash
  uploadStatus?: UploadStatus,   // "pending" | "uploaded" | "failed"
  metadata?: any,                // Additional metadata
}
```

**Indexes:**
- `by_message_id`: Files for a message
- `by_whatsapp_media_id`: WhatsApp media lookup
- `by_upload_status`: Filter by upload status
- `by_storage_id`: Storage reference lookup

## Exchange System

### Exchange Rates

Stores currency exchange rates with separate buying and selling rates.

```typescript
exchangeRates: {
  fromCurrencyName: string,        // e.g., "United States Dollar"
  fromCurrencyCode: string,        // e.g., "USD"
  toCurrencyName: string,          // e.g., "Nigerian Naira"
  toCurrencyCode: string,          // e.g., "NGN"
  currencyPair: string,            // e.g., "USD-NGN"
  buyingCurrentMarketRate: number, // Current buying rate
  sellingCurrentMarketRate: number,// Current selling rate
  lastUpdated: number,             // Last update timestamp
  metadata?: any,                  // Additional metadata
}
```

**Indexes:**
- `by_currency_pair`: Fast lookup by currency pair
- `by_last_updated`: Sort by update time

### Transactions

Manages currency exchange transactions with flexible AI-driven creation.

```typescript
transactions: {
  userId: Id<"users">,              // Reference to user
  conversationId: Id<"conversations">, // Reference to conversation
  currencyFrom?: string,            // Source currency
  currencyTo?: string,              // Target currency
  amountFrom?: number,              // Amount to exchange
  amountTo?: number,                // Amount to receive
  negotiatedRate?: number,          // Final negotiated rate
  estimatedRate?: number,           // Initial estimated rate
  paymentReference?: string,        // Payment reference
  receiptImageUrl?: string,         // Receipt image URL
  imageUrl?: string,                // Transaction image URL
  extractedDetails?: any,           // OCR extracted data
  status: TransactionStatus,        // Transaction status
  createdAt: number,                // Creation timestamp
  updatedAt: number,                // Last update timestamp
  metadata?: any,                   // Additional metadata
  isRead?: boolean,                 // Admin read status
  lastReadAt?: number,              // Last read timestamp
  notes?: string,                   // Transaction notes
  
  // Transaction-specific bank details
  transactionBankName?: string,     // Bank for this transaction
  transactionAccountNumber?: string,// Account for this transaction
  transactionAccountName?: string,  // Account name for this transaction
  
  // Customer bank details
  customerBankName?: string,        // Customer's bank
  customerAccountNumber?: string,   // Customer's account
  customerAccountName?: string,     // Customer's account name
}
```

**Indexes:**
- `by_user_id`: User's transactions
- `by_conversation_id`: Conversation transactions
- `by_status`: Filter by transaction status
- `by_created_at`: Sort by creation time
- `by_updated_at`: Sort by update time

### Admin Bank Details

Stores admin bank account information for receiving payments.

```typescript
adminBankDetails: {
  accountNumber: string,           // Admin account number
  accountName: string,             // Account holder name
  bankName: string,                // Bank name
  description?: string,            // Account description
  accountType: AdminBankAccountType, // "buy" | "sell"
  createdAt: number,               // Creation timestamp
  updatedAt: number,               // Update timestamp
  metadata?: any,                  // Additional metadata
}
```

**Indexes:**
- `by_account_number`: Lookup by account number

## Administrative

### Admin Status

Manages admin availability and working hours.

```typescript
adminStatus: {
  isManuallyInactive: boolean,     // Manual inactive status
  recurringInactiveStart: string,  // "HH:mm" format
  recurringInactiveEnd: string,    // "HH:mm" format
}
```

**Indexes:**
- `by_is_manually_inactive`: Filter by manual status
- `by_recurring_inactive_start`: Sort by start time
- `by_recurring_inactive_end`: Sort by end time

### Image Hashes

Stores cryptographic and perceptual hashes for duplicate image detection.

```typescript
imageHashes: {
  cryptographicHash: string,       // SHA-256 hash for exact duplicates
  perceptualHash: string,          // Perceptual hash for near-duplicates
  imageUrl: string,                // Original image URL
  transactionId?: string,          // Associated transaction
  paymentReference?: string,       // Payment reference
  userId?: Id<"users">,            // Reference to user
  messageId?: Id<"messages">,      // Reference to message
  createdAt: number,               // Creation timestamp
  metadata?: any,                  // Additional metadata
}
```

**Indexes:**
- `by_cryptographic_hash`: Exact duplicate detection
- `by_perceptual_hash`: Near-duplicate detection
- `by_transaction_id`: Transaction association
- `by_payment_reference`: Payment reference lookup
- `by_user_id`: User's images
- `by_message_id`: Message images

## Data Types and Enums

### Conversation Status
- `"active"`: Active conversation
- `"archived"`: Archived conversation
- `"closed"`: Closed conversation

### In Charge
- `"bot"`: Bot is handling the conversation
- `"admin"`: Admin is handling the conversation

### Message Direction
- `"inbound"`: Message from user to bot/admin
- `"outbound"`: Message from bot/admin to user

### Sender Role
- `"user"`: Message from WhatsApp user
- `"bot"`: Message from AI bot
- `"admin"`: Message from human admin

### Message Type
- `"text"`: Text message
- `"image"`: Image message
- `"audio"`: Audio message
- `"video"`: Video message
- `"document"`: Document message
- `"location"`: Location message
- `"contact"`: Contact message
- `"system"`: System message

### Message Status
- `"sent"`: Message sent
- `"delivered"`: Message delivered
- `"read"`: Message read
- `"failed"`: Message failed

### Upload Status
- `"pending"`: Upload in progress
- `"uploaded"`: Upload completed
- `"failed"`: Upload failed

### Transaction Status
- `"pending"`: Transaction initiated
- `"image_received_and_being_reviewed"`: Image received, under review
- `"confirmed_and_money_sent_to_user"`: Transaction confirmed and completed
- `"cancelled"`: Transaction cancelled
- `"failed"`: Transaction failed

### Admin Bank Account Type
- `"buy"`: Account for buying currency
- `"sell"`: Account for selling currency

## Indexes and Performance

The schema includes comprehensive indexing for optimal query performance:

### Primary Lookups
- User identification: `whatsappId`, `phoneNumber`
- Message tracking: `whatsappMessageId`, `conversationId`
- Transaction management: `userId`, `status`, `createdAt`

### Filtering and Sorting
- Time-based queries: `timestamp`, `lastMessageAt`, `createdAt`
- Status filtering: `status` fields across all tables
- Role-based filtering: `senderRole`, `inCharge`

### Duplicate Detection
- Image hashes: `cryptographicHash`, `perceptualHash`
- Payment references: `paymentReference`

## Migration Notes

This schema was migrated from a previous Drizzle ORM implementation to Convex, maintaining data integrity while leveraging Convex's real-time capabilities and type safety features.

## Best Practices

1. **Use appropriate indexes** for your queries to ensure optimal performance
2. **Leverage Convex's real-time features** for live updates in the admin dashboard
3. **Use optional fields** strategically to allow flexible AI-driven data population
4. **Maintain referential integrity** through proper ID references
5. **Use metadata fields** for extensibility without schema changes