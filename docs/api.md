# API Documentation

## Table of Contents
- [Overview](#overview)
- [Authentication](#authentication)
- [Chat API](#chat-api)
- [Chatbot API](#chatbot-api)
- [Conversations API](#conversations-api)
- [Messages API](#messages-api)
- [Transactions API](#transactions-api)
- [Settings API](#settings-api)
- [Upload API](#upload-api)
- [Database Seeding](#database-seeding)
- [WhatsApp Cloud API](#whatsapp-cloud-api)
- [Webhook API](#webhook-api)
- [Database API (Convex)](#database-api-convex)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Examples](#examples)

## Overview

This document describes all APIs used in the KhalidWid WhatsApp Bot system, including internal Next.js API routes, external WhatsApp APIs, and database operations via Convex. The API provides comprehensive functionality for currency exchange operations, conversation management, and administrative controls.

### Base URL
```
Production: https://your-domain.com/api
Development: http://localhost:3000/api
```

### Content Types
- Request: `application/json`
- Response: `application/json`
- File uploads: `multipart/form-data`

## Authentication

Most endpoints require authentication through WhatsApp webhook verification or internal API keys.

### Webhook Verification
```http
GET /api/webhook?hub.mode=subscribe&hub.challenge=CHALLENGE&hub.verify_token=TOKEN
```

## Chat API

### Send Chat Message
Sends a message through the chat interface.

```http
POST /api/chat
```

**Request Body:**
```json
{
  "message": "string",
  "conversationId": "string",
  "userId": "string"
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "string",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Chatbot API

### Start Conversation
Initiates a new conversation with the chatbot.

```http
POST /api/chatbot/conversation
```

**Request Body:**
```json
{
  "phoneNumber": "+1234567890",
  "initialMessage": "string"
}
```

**Response:**
```json
{
  "conversationId": "string",
  "status": "active",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### Send Message to Bot
Sends a message to the chatbot for processing.

```http
POST /api/chatbot/send-message
```

**Request Body:**
```json
{
  "conversationId": "string",
  "message": "string",
  "messageType": "text|image|document",
  "mediaUrl": "string"
}
```

**Response:**
```json
{
  "response": "string",
  "actions": ["string"],
  "suggestedReplies": ["string"]
}
```

## Conversations API

### Update Conversation In-Charge
Assigns or updates the person in charge of a conversation.

```http
PUT /api/conversations/update-in-charge
```

**Request Body:**
```json
{
  "conversationId": "string",
  "inChargeUserId": "string",
  "reason": "string"
}
```

**Response:**
```json
{
  "success": true,
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

## Messages API

### Send Message
Sends a message through WhatsApp.

```http
POST /api/messages/send
```

**Request Body:**
```json
{
  "to": "+1234567890",
  "type": "text|image|document|interactive",
  "text": {
    "body": "string"
  },
  "interactive": {
    "type": "button|list",
    "body": {
      "text": "string"
    },
    "action": {
      "buttons": [
        {
          "type": "reply",
          "reply": {
            "id": "string",
            "title": "string"
          }
        }
      ]
    }
  }
}
```

## Transactions API

### Update Transaction Status
Updates the status of a currency exchange transaction.

```http
PUT /api/transactions/update-status
```

**Request Body:**
```json
{
  "transactionId": "string",
  "status": "pending|processing|completed|cancelled|failed",
  "notes": "string",
  "updatedBy": "string"
}
```

## Settings API

### Update AI Instructions
Updates the AI agent's behavior instructions.

```http
PUT /api/settings/ai-instructions
```

**Request Body:**
```json
{
  "instructions": "string",
  "category": "general|negotiation|customer_service",
  "isActive": true
}
```

## Upload API

### File Upload
Handles file uploads for receipts and documents.

```http
POST /api/uploads/[...filename]
```

**Request:**
- Content-Type: `multipart/form-data`
- File field: `file`

**Response:**
```json
{
  "success": true,
  "fileUrl": "string",
  "fileId": "string",
  "metadata": {
    "size": 12345,
    "type": "image/jpeg",
    "originalName": "receipt.jpg"
  }
}
```

## Database Seeding

### Seed Database
```http
POST /api/seedDB
```

### Seed Transactions
```http
POST /api/seedTransactions
```

### General Seed
```http
POST /api/seed
```

## WhatsApp Cloud API

### Type-Safe Client

The application includes a generated TypeScript client for the WhatsApp Cloud API, located in `whatsapp/api/Api.ts`. This client provides type-safe access to all WhatsApp Cloud API endpoints.

### Initialization

```typescript
import WhatsAppCloudApiClient from '../whatsapp/api/Api';

const client = new WhatsAppCloudApiClient({
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    version: 'v23.0',
});
```

### Message Operations

#### Send Text Message

```typescript
const response = await client.sendMessage({
    messagingProduct: 'whatsapp',
    to: '1234567890',
    text: {
        body: 'Hello from WhatsApp Cloud API!'
    }
});
```

#### Send Media Message

```typescript
const response = await client.sendMessage({
    messagingProduct: 'whatsapp',
    to: '1234567890',
    type: 'image',
    image: {
        id: 'media_id',
        caption: 'Check out this image!'
    }
});
```

#### Send Template Message

```typescript
const response = await client.sendMessage({
    messagingProduct: 'whatsapp',
    to: '1234567890',
    type: 'template',
    template: {
        name: 'hello_world',
        language: {
            code: 'en_US'
        }
    }
});
```

#### Send Interactive Message

```typescript
// Button Message
const response = await client.sendMessage({
    messagingProduct: 'whatsapp',
    to: '1234567890',
    interactive: {
        type: 'button',
        body: {
            text: 'Choose an option:'
        },
        action: {
            buttons: [
                { type: 'reply', reply: { id: 'btn1', title: 'Option 1' } },
                { type: 'reply', reply: { id: 'btn2', title: 'Option 2' } }
            ]
        }
    }
});

// List Message
const response = await client.sendMessage({
    messagingProduct: 'whatsapp',
    to: '1234567890',
    interactive: {
        type: 'list',
        body: {
            text: 'Select a currency:'
        },
        action: {
            button: 'Choose Currency',
            sections: [
                {
                    title: 'Popular Currencies',
                    rows: [
                        { id: 'usd', title: 'USD', description: 'US Dollar' },
                        { id: 'eur', title: 'EUR', description: 'Euro' }
                    ]
                }
            ]
        }
    }
});
```

### Media Operations

#### Upload Media

```typescript
const response = await client.uploadMedia({
    file: fileBuffer,
    type: 'image/jpeg',
    messagingProduct: 'whatsapp'
});
```

#### Retrieve Media URL

```typescript
const response = await client.getMediaUrl({
    mediaId: 'media_id'
});
```

#### Download Media

```typescript
const mediaUrl = await client.getMediaUrl({ mediaId: 'media_id' });
const response = await fetch(mediaUrl.url, {
    headers: {
        'Authorization': `Bearer ${accessToken}`
    }
});
const mediaBuffer = await response.buffer();
```

### Business Profile Operations

#### Get Business Profile

```typescript
const response = await client.getBusinessProfile({
    phoneNumberId: 'phone_number_id'
});
```

#### Update Business Profile

```typescript
const response = await client.updateBusinessProfile({
    phoneNumberId: 'phone_number_id',
    profileData: {
        about: 'We provide excellent currency exchange services!',
        email: 'support@khalidwid.com',
        websites: ['https://khalidwid.com']
    }
});
```

## Internal API Routes

### Webhook Endpoint

**POST** `/api/webhook`

Handles incoming WhatsApp webhook events including messages, status updates, and template notifications.

```typescript
// Webhook payload structure
interface WebhookPayload {
    object: 'whatsapp_business_account';
    entry: Array<{
        id: string;
        changes: Array<{
            field: 'messages';
            value: {
                messaging_product: 'whatsapp';
                metadata: {
                    display_phone_number: string;
                    phone_number_id: string;
                };
                contacts?: Array<{
                    wa_id: string;
                    profile: {
                        name: string;
                    };
                }>;
                messages?: Array<{
                    from: string;
                    id: string;
                    timestamp: string;
                    text?: { body: string };
                    image?: { id: string; mime_type: string };
                    // ... other message types
                }>;
            };
        }>;
    }>;
}
```

### Transaction Status Update

**POST** `/api/transactions/update-status`

Updates transaction status and sends notifications to customers.

```typescript
// Request body
interface UpdateStatusRequest {
    transactionId: Id<"transactions">;
    status: TransactionStatus;
    message?: string;
}

// Response
interface UpdateStatusResponse {
    success: boolean;
    message: string;
    transactionId: string;
}
```

**Example Request:**
```typescript
const response = await fetch('/api/transactions/update-status', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        transactionId: 'tx123',
        status: 'completed',
        message: 'Your transaction has been completed successfully!'
    })
});
```

### Database Seeding

**GET** `/api/seed`

Seeds the database with sample data for testing and development.

```typescript
// Response
interface SeedResponse {
    success: boolean;
    message: string;
    counts: {
        users: number;
        conversations: number;
        messages: number;
        transactions: number;
    };
}
```

### Health Check

**GET** `/api/health`

Basic health check endpoint for monitoring.

```typescript
// Response
interface HealthResponse {
    status: 'healthy' | 'unhealthy';
    timestamp: string;
    services: {
        database: 'up' | 'down';
        whatsapp: 'connected' | 'disconnected';
        ai: 'available' | 'unavailable';
    };
}
```

## Database API (Convex)

The application uses Convex for database operations with type-safe queries and mutations.

### User Operations

#### Get User by WhatsApp ID

```typescript
const user = await client.query.api.users.getUserByWhatsappId({
    whatsappId: '1234567890@c.us'
});
```

#### Create or Update User

```typescript
const userId = await client.mutation.api.users.createOrUpdateUser({
    whatsappId: '1234567890@c.us',
    profileName: 'John Doe',
    phoneNumber: '+1234567890',
    bankName: 'Test Bank',
    accountNumber: '1234567890',
    accountName: 'John Doe'
});
```

### Conversation Operations

#### Get All Conversations with Users

```typescript
const conversations = await client.query.api.conversations.getAllConversationsWithUsers({});
```

#### Mark Conversation as Read

```typescript
await client.mutation.api.conversations.markConversationAsRead({
    conversationId: 'conv123'
});
```

### Message Operations

#### Get Messages by Conversation

```typescript
const messages = await client.query.api.messages.getMessagesByConversation({
    conversationId: 'conv123'
});
```

#### Send Message (Database Storage)

```typescript
const messageId = await client.mutation.api.messages.sendMessage({
    conversationId: 'conv123',
    direction: 'outgoing',
    senderRole: 'admin',
    messageType: 'text',
    content: 'Hello from admin!',
    timestamp: Date.now()
});
```

### Transaction Operations

#### Create Transaction

```typescript
const transactionId = await client.mutation.api.transactions.createTransaction({
    userId: 'user123',
    conversationId: 'conv123',
    currencyFrom: 'USD',
    currencyTo: 'NGN',
    amountFrom: 100,
    amountTo: 75000,
    negotiatedRate: 750,
    status: 'pending',
    createdAt: Date.now(),
    updatedAt: Date.now()
});
```

#### Get Transaction by ID

```typescript
const transaction = await client.query.api.transactions.getTransaction({
    transactionId: 'txn123'
});
```

#### Update Transaction Status

```typescript
await client.mutation.api.transactions.updateTransactionStatus({
    transactionId: 'txn123',
    status: 'completed'
});
```

### Exchange Rate Operations

#### Get Current Exchange Rates

```typescript
const rates = await client.query.api.exchangeRates.getCurrentRates({});
```

#### Update Exchange Rates

```typescript
await client.mutation.api.exchangeRates.updateExchangeRates({
    rates: [
        {
            currencyPair: 'USD-NGN',
            buyingCurrentMarketRate: 750,
            sellingCurrentMarketRate: 760,
            lastUpdated: Date.now()
        }
    ]
});
```

### Media Operations

#### Get Media File by ID

```typescript
const mediaFile = await client.query.api.mediaFiles.getMediaFileById({
    mediaFileId: 'media123'
});
```

#### Upload Media File

```typescript
const mediaFileId = await client.mutation.api.mediaFiles.uploadMediaFile({
    fileName: 'receipt.jpg',
    mimeType: 'image/jpeg',
    fileSize: 1024000,
    uploadStatus: 'processing'
});
```

## Webhook API

### Webhook Verification

The webhook endpoint verifies incoming requests using a verify token:

```typescript
// Webhook verification
app.get('/api/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
});
```

### Message Processing Pipeline

The webhook processes messages through several stages:

1. **Validation**: Verify webhook signature and format
2. **Extraction**: Parse message data and metadata
3. **User Management**: Create or update user records
4. **Conversation Management**: Handle conversation state
5. **Message Processing**: Route to appropriate handler based on type
6. **Response Generation**: Generate and send response
7. **Database Storage**: Store conversation data

### Message Types Supported

#### Text Messages
```typescript
interface TextMessage {
    type: 'text';
    text: {
        body: string;
    };
}
```

#### Image Messages
```typescript
interface ImageMessage {
    type: 'image';
    image: {
        id: string;
        mime_type: string;
        sha256: string;
    };
}
```

#### Interactive Messages
```typescript
interface InteractiveMessage {
    type: 'interactive';
    interactive: {
        type: 'button_reply' | 'list_reply';
        button_reply?: {
            id: string;
            title: string;
        };
        list_reply?: {
            id: string;
            title: string;
            description?: string;
        };
    };
}
```

#### Location Messages
```typescript
interface LocationMessage {
    type: 'location';
    location: {
        latitude: number;
        longitude: number;
        name?: string;
        address?: string;
    };
}
```

#### Contact Messages
```typescript
interface ContactMessage {
    type: 'contacts';
    contacts: Array<{
        name: {
            formatted_name: string;
            first_name?: string;
            last_name?: string;
        };
        phones?: Array<{
            phone: string;
            type?: string;
        }>;
    }>;
}
```

## Authentication

### WhatsApp API Authentication

All WhatsApp API calls use Bearer token authentication:

```typescript
const headers = {
    'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
    'Content-Type': 'application/json'
};
```

### Internal API Authentication

Internal API routes use Convex's built-in authentication for database operations. For webhooks, verification is done via the verify token.

### Environment Variables Required

```env
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_id
WHATSAPP_VERIFY_TOKEN=your_verify_token
NEXT_PUBLIC_CONVEX_URL=your_convex_url
```

## Error Handling

### Standard Error Response Format

```typescript
interface ErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
        details?: any;
    };
    timestamp: string;
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_REQUEST` | 400 | Invalid request format or parameters |
| `UNAUTHORIZED` | 401 | Authentication failed |
| `FORBIDDEN` | 403 | Access denied |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |
| `SERVICE_UNAVAILABLE` | 503 | External service unavailable |

### Error Handling Examples

```typescript
// WhatsApp API error handling
try {
    const response = await client.sendMessage({ ... });
} catch (error) {
    if (error.response?.status === 429) {
        // Rate limited - implement retry logic
        await delay(1000);
        return retrySendMessage();
    } else if (error.response?.status === 401) {
        // Authentication error - refresh token
        await refreshWhatsAppToken();
        return retrySendMessage();
    } else {
        // Other errors - log and handle appropriately
        console.error('WhatsApp API error:', error);
        throw error;
    }
}

// Database operation error handling
try {
    const result = await client.mutation.api.users.createOrUpdateUser(userData);
} catch (error) {
    if (error.code === 'CONFLICT') {
        // Handle duplicate user scenario
        return await updateUser(existingUserId, userData);
    } else {
        // Log and rethrow
        console.error('Database error:', error);
        throw error;
    }
}
```

## Rate Limiting

### WhatsApp API Rate Limits

- **Messages**: 80 messages per second per phone number
- **Media Uploads**: 50 media uploads per second per phone number
- **Template Messages**: Template-specific rate limits apply

### Internal API Rate Limiting

The application implements rate limiting for internal APIs:

```typescript
// Rate limiting configuration
const rateLimits = {
    '/api/transactions/update-status': {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100 // limit each IP to 100 requests per windowMs
    },
    '/api/seed': {
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 5 // limit each IP to 5 requests per windowMs
    }
};
```

### Retry Strategy

For rate-limited requests, the application implements exponential backoff:

```typescript
async function withRetry<T>(
    fn: () => Promise<T>,
    maxRetries = 3,
    baseDelay = 1000
): Promise<T> {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (i === maxRetries - 1) throw error;

            if (error.response?.status === 429) {
                const delay = baseDelay * Math.pow(2, i);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                throw error;
            }
        }
    }
    throw new Error('Max retries exceeded');
}
```

## Examples

### Complete Message Processing Example

```typescript
// webhook-processor.ts
export async function processIncomingMessage(payload: WebhookPayload) {
    try {
        // 1. Validate webhook
        const validated = validateWebhookPayload(payload);

        // 2. Extract message info
        const messageInfo = extractMessageInfo(validated);

        // 3. Handle user and conversation
        const { userId, conversationId } = await handleUserAndConversation(messageInfo);

        // 4. Store incoming message
        await storeIncomingMessage(messageInfo, conversationId);

        // 5. Process based on message type
        let response: string | InteractiveMessage;

        switch (messageInfo.messageType) {
            case 'text':
                response = await handleTextMessage(messageInfo, conversationId);
                break;
            case 'image':
                response = await handleImageMessage(messageInfo, conversationId);
                break;
            case 'interactive':
                response = await handleInteractiveMessage(messageInfo, conversationId);
                break;
            default:
                response = await handleUnsupportedMessage(messageInfo);
        }

        // 6. Send response
        await sendWhatsAppMessage(messageInfo.from, response);

        // 7. Store outgoing message
        await storeOutgoingMessage(conversationId, response);

        return { success: true };

    } catch (error) {
        console.error('Message processing failed:', error);
        await sendErrorResponse(messageInfo.from, error);
        return { success: false, error };
    }
}
```

### Transaction Management Example

```typescript
// transactions/update-status/route.ts
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { transactionId, status, message } = body;

        // 1. Validate input
        if (!transactionId || !status) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // 2. Update transaction in database
        const updatedTransaction = await client.mutation.api.transactions.updateTransactionStatus({
            transactionId,
            status,
            updatedAt: Date.now()
        });

        // 3. Send notification to customer
        if (message) {
            const transaction = await client.query.api.transactions.getTransaction({ transactionId });
            const user = await client.query.api.users.getUserById({ userId: transaction.userId });

            await client.mutation.api.messages.sendMessage({
                conversationId: transaction.conversationId,
                direction: 'outgoing',
                senderRole: 'system',
                messageType: 'text',
                content: message,
                timestamp: Date.now()
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Transaction status updated successfully',
            transactionId
        });

    } catch (error) {
        console.error('Status update failed:', error);
        return NextResponse.json(
            { error: 'Failed to update transaction status' },
            { status: 500 }
        );
    }
}
```

### Media Processing Example

```typescript
// media-processor.ts
export async function processReceiptImage(
    messageId: string,
    imageUrl: string,
    conversationId: string
): Promise<ReceiptAnalysis> {
    try {
        // 1. Download image
        const imageBuffer = await downloadImage(imageUrl);

        // 2. Generate hashes for duplicate detection
        const { cryptographicHash, perceptualHash } = await generateImageHashes(imageBuffer);

        // 3. Check for duplicates
        const isDuplicate = await checkForDuplicateImage(cryptographicHash, perceptualHash);
        if (isDuplicate) {
            throw new Error('Duplicate receipt detected');
        }

        // 4. Store image file
        const mediaFileId = await client.mutation.api.mediaFiles.uploadMediaFile({
            fileName: `receipt_${Date.now()}.jpg`,
            mimeType: 'image/jpeg',
            fileSize: imageBuffer.length,
            uploadStatus: 'completed'
        });

        // 5. Perform OCR analysis
        const ocrResult = await performOCR(imageBuffer);

        // 6. AI analysis of extracted text
        const analysis = await analyzeReceiptWithAI(ocrResult.text);

        // 7. Store hash for fraud prevention
        await client.mutation.api.imageHashes.storeImageHash({
            cryptographicHash,
            perceptualHash,
            imageUrl,
            messageId,
            createdAt: Date.now()
        });

        return {
            extractedText: ocrResult.text,
            amount: analysis.amount,
            reference: analysis.reference,
            bankName: analysis.bank,
            confidence: analysis.confidence,
            mediaFileId
        };

    } catch (error) {
        console.error('Receipt processing failed:', error);
        throw error;
    }
}
```

---

This API documentation provides comprehensive coverage of all APIs used in the KhalidWid WhatsApp Bot system. The type-safe clients and modular architecture ensure reliable and maintainable code while providing full functionality for the currency exchange platform.