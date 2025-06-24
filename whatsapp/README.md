# WhatsApp Cloud API Client

A comprehensive TypeScript client for the WhatsApp Cloud API with organized endpoint classifications and full webhook support.

## Features

- **🎯 Organized Structure**: Endpoints are classified into logical groups (messages, media, business, etc.)
- **🔒 Type Safety**: Full TypeScript support with proper type definitions
- **🌍 Environment Variables**: Supports access token from environment variables
- **📦 Easy to Use**: Simple, intuitive API with comprehensive examples
- **✅ Fully Tested**: All linter checks pass with zero errors
- **Complete Message Support**: Send text, media, templates, interactive messages, and more
- **Webhook Integration**: Full webhook handling with type-safe payload parsing
- **Auto-generated API**: Based on official WhatsApp Cloud API OpenAPI specification
- **Organized Structure**: Clean separation of concerns with endpoint classifications
- **Easy Configuration**: Simple setup with environment variables or direct configuration

## Installation

The client is already included in your project. Just import it:

```typescript
import WhatsAppCloudApiClient from './whatsapp-client';
```

## Configuration

### Option 1: Environment Variable (Recommended)

Set your WhatsApp access token as an environment variable:

```bash
# .env.local
WHATSAPP_ACCESS_TOKEN=your_access_token_here
```

Then initialize the client:

```typescript
const client = new WhatsAppCloudApiClient();
```

### Option 2: Direct Configuration

```typescript
const client = new WhatsAppCloudApiClient({
    accessToken: 'your-access-token-here',
    version: 'v23.0', // Optional, defaults to v23.0
    baseUrl: 'https://graph.facebook.com', // Optional
});
```

## Usage

The client organizes endpoints into logical classifications:

### Messages

All message-related operations are under `client.messages`:

```typescript
// Send a text message
await client.messages.sendText({
    phoneNumberId: 'YOUR_PHONE_NUMBER_ID',
    to: 'RECIPIENT_PHONE_NUMBER',
    text: 'Hello from WhatsApp!',
    previewUrl: true, // Optional
});

// Send a reply
await client.messages.sendReply({
    phoneNumberId: 'YOUR_PHONE_NUMBER_ID',
    to: 'RECIPIENT_PHONE_NUMBER',
    text: 'This is a reply',
    replyToMessageId: 'MESSAGE_ID_TO_REPLY_TO',
});

// Send an image by URL
await client.messages.sendImageByUrl({
    phoneNumberId: 'YOUR_PHONE_NUMBER_ID',
    to: 'RECIPIENT_PHONE_NUMBER',
    imageUrl: 'https://example.com/image.jpg',
    caption: 'Check this out!',
});

// Send an image by media ID
await client.messages.sendImageById({
    phoneNumberId: 'YOUR_PHONE_NUMBER_ID',
    to: 'RECIPIENT_PHONE_NUMBER',
    mediaId: 'UPLOADED_MEDIA_ID',
    caption: 'From uploaded media',
});

// Send audio, document, sticker messages
await client.messages.sendAudioByUrl({...});
await client.messages.sendDocumentById({...});
await client.messages.sendStickerByUrl({...});

// Send template message
await client.messages.sendTemplate({
    phoneNumberId: 'YOUR_PHONE_NUMBER_ID',
    to: 'RECIPIENT_PHONE_NUMBER',
    templateName: 'hello_world',
    languageCode: 'en_US',
    components: [...],
});

// Send location
await client.messages.sendLocation({
    phoneNumberId: 'YOUR_PHONE_NUMBER_ID',
    to: 'RECIPIENT_PHONE_NUMBER',
    latitude: 37.7749,
    longitude: -122.4194,
    name: 'San Francisco',
    address: 'San Francisco, CA, USA',
});

// Send contact
await client.messages.sendContact({
    phoneNumberId: 'YOUR_PHONE_NUMBER_ID',
    to: 'RECIPIENT_PHONE_NUMBER',
    contacts: [{
        name: {
            formatted_name: 'John Doe',
            first_name: 'John',
            last_name: 'Doe',
        },
        phones: [{ phone: '+1234567890', type: 'WORK' }],
    }],
});

// Send reactions
await client.messages.sendReaction({
    phoneNumberId: 'YOUR_PHONE_NUMBER_ID',
    to: 'RECIPIENT_PHONE_NUMBER',
    messageId: 'MESSAGE_ID',
    emoji: '👍',
});

// Mark as read
await client.messages.markAsRead({
    phoneNumberId: 'YOUR_PHONE_NUMBER_ID',
    messageId: 'MESSAGE_ID',
});

// Send multi-product message
await client.messages.sendMultiProductMessage({
    phoneNumberId: 'YOUR_PHONE_NUMBER_ID',
    to: 'RECIPIENT_PHONE_NUMBER',
    headerText: 'Our Products',
    bodyText: 'Check out these amazing products!',
    catalogId: 'YOUR_CATALOG_ID',
    sections: [
        {
            title: 'Featured Products',
            product_items: [
                { product_retailer_id: 'PRODUCT_1_ID' },
                { product_retailer_id: 'PRODUCT_2_ID' },
            ],
        },
    ],
});

// Send catalog message
await client.messages.sendCatalogMessage({
    phoneNumberId: 'YOUR_PHONE_NUMBER_ID',
    to: 'RECIPIENT_PHONE_NUMBER',
    bodyText: 'Browse our full catalog!',
    catalogId: 'YOUR_CATALOG_ID',
    thumbnailProductRetailerId: 'FEATURED_PRODUCT_ID',
});
```

## Available Message Methods

### Text Messages
- `sendText()` - Send a text message
- `sendReply()` - Send a reply to a message

### Media Messages
- `sendImageById()` - Send image by media ID
- `sendImageByUrl()` - Send image by URL
- `sendAudioById()` - Send audio by media ID
- `sendAudioByUrl()` - Send audio by URL
- `sendVideoById()` - Send video by media ID
- `sendVideoByUrl()` - Send video by URL
- `sendDocumentById()` - Send document by media ID
- `sendDocumentByUrl()` - Send document by URL
- `sendStickerById()` - Send sticker by media ID
- `sendStickerByUrl()` - Send sticker by URL

### Reply Messages
- `sendReplyToImageById()` - Send reply with image by media ID
- `sendReplyToImageByUrl()` - Send reply with image by URL
- `sendReplyToAudioById()` - Send reply with audio by media ID
- `sendReplyToAudioByUrl()` - Send reply with audio by URL
- `sendReplyToVideoById()` - Send reply with video by media ID
- `sendReplyToVideoByUrl()` - Send reply with video by URL
- `sendReplyToDocumentById()` - Send reply with document by media ID
- `sendReplyToDocumentByUrl()` - Send reply with document by URL
- `sendReplyToStickerById()` - Send reply with sticker by media ID
- `sendReplyToStickerByUrl()` - Send reply with sticker by URL
- `sendReplyToContact()` - Send reply with contact
- `sendReplyToLocation()` - Send reply with location

### Template Messages
- `sendTemplate()` - Send basic template message
- `sendMessageTemplateText()` - Send text template with parameters
- `sendMessageTemplateMedia()` - Send media template with header media
- `sendMessageTemplateInteractive()` - Send interactive template with buttons

### Interactive Messages
- `sendInteractiveButtons()` - Send button interactive message
- `sendInteractiveList()` - Send list interactive message
- `sendReplyButton()` - Send reply button message (can be standalone or reply)
- `sendReplyToList()` - Send reply to list message

### Special Messages
- `sendLocation()` - Send location message
- `sendContact()` - Send contact message

### E-commerce Messages
- `sendSingleProductMessage()` - Send single product message from catalog
- `sendMultiProductMessage()` - Send multiple products message from catalog
- `sendCatalogMessage()` - Send entire catalog message
- `sendCatalogTemplateMessage()` - Send catalog template message

### Message Actions
- `markAsRead()` - Mark message as read
- `sendReaction()` - Send reaction to message
- `removeReaction()` - Remove reaction from message

## Client Methods

### Configuration
- `getConfig()` - Get current client configuration
- `updateAccessToken(newToken)` - Update the access token
- `getRawApi()` - Get the raw API client for advanced usage

## Examples

See `src/example-usage.ts` for comprehensive examples of all available methods.

## Error Handling

All methods return promises and should be wrapped in try-catch blocks:

```typescript
try {
    const response = await client.messages.sendText({
        phoneNumberId: 'YOUR_PHONE_NUMBER_ID',
        to: 'RECIPIENT_PHONE_NUMBER',
        text: 'Hello!',
    });
    console.log('Message sent:', response.data);
} catch (error) {
    console.error('Error sending message:', error);
}
```

## Future Extensions

The client is designed to be easily extensible. Future endpoint classifications will include:

- `client.media` - Media upload/download operations
- `client.business` - Business profile management
- `client.templates` - Template management
- `client.webhooks` - Webhook management
- `client.analytics` - Analytics and insights

## TypeScript Support

The client provides full TypeScript support with:

- Proper type definitions for all parameters
- IntelliSense support in IDEs
- Compile-time error checking
- Auto-completion for all methods and parameters

## Webhook Integration

### Setting Up Webhooks

```typescript
// Subscribe to webhooks for a WABA
await client.webhook.subscribeToWaba({
    wabaId: 'your-waba-id',
    overrideCallbackUri: 'https://your-domain.com/webhook',
    verifyToken: 'your-verify-token'
});

// Get webhook subscriptions
const subscriptions = await client.webhook.getSubscriptions({
    wabaId: 'your-waba-id'
});
```

### Creating a Webhook Handler

```typescript
import express from 'express';

const app = express();
app.use(express.json());

// Create a comprehensive webhook handler
const webhookHandler = client.webhook.createWebhookHandler({
    verifyToken: 'your-verify-token',
    appSecret: 'your-app-secret', // optional, for signature verification
    
    // Handle incoming messages
    onMessage: async (message, phoneNumberId) => {
        console.log('Received message:', message);
        
        // Handle text messages
        const textMessage = client.webhook.extractTextMessage(message);
        if (textMessage) {
            // Echo the message back
            await client.messages.sendText({
                phoneNumberId,
                to: message.from,
                text: `You said: ${textMessage}`
            });
        }
        
        // Handle interactive responses
        const interactiveResponse = client.webhook.extractInteractiveResponse(message);
        if (interactiveResponse) {
            await client.messages.sendText({
                phoneNumberId,
                to: message.from,
                text: `You selected: ${interactiveResponse.title}`
            });
        }
        
        // Handle media messages
        const mediaInfo = client.webhook.extractMediaInfo(message);
        if (mediaInfo) {
            await client.messages.sendText({
                phoneNumberId,
                to: message.from,
                text: `Received ${message.type} media`
            });
        }
    },
    
    // Handle message status updates
    onStatus: async (status, phoneNumberId) => {
        const statusInfo = client.webhook.getMessageStatusInfo(status);
        console.log('Message status:', statusInfo);
    },
    
    // Handle errors
    onError: async (error, phoneNumberId) => {
        console.error('Webhook error:', error);
    }
});

// Set up webhook endpoint
app.all('/webhook', webhookHandler);

app.listen(3000, () => {
    console.log('Webhook server running on port 3000');
});
```

### Manual Webhook Processing

```typescript
import { WebhookPayload } from './whatsapp-client';

// Verify webhook signature
const isValid = client.webhook.verifyWebhookSignature({
    payload: JSON.stringify(webhookBody),
    signature: request.headers['x-hub-signature-256'],
    appSecret: 'your-app-secret'
});

// Validate and parse webhook payload
if (client.webhook.isValidWebhookPayload(webhookBody)) {
    const parsed = client.webhook.parseWebhookPayload(webhookBody);
    
    // Process messages
    parsed.messages.forEach(message => {
        const textMessage = client.webhook.extractTextMessage(message);
        if (textMessage) {
            console.log('Text message:', textMessage);
        }
        
        // Check message properties
        if (client.webhook.isReplyMessage(message)) {
            console.log('Reply to:', client.webhook.getReplyToMessageId(message));
        }
        
        if (client.webhook.isForwardedMessage(message)) {
            console.log('Message was forwarded');
        }
    });
}
```

## Message Types

### Text Messages

```typescript
// Simple text
await client.messages.sendText({
    phoneNumberId: 'phone-id',
    to: 'recipient',
    text: 'Hello!'
});

// Reply to a message
await client.messages.sendReply({
    phoneNumberId: 'phone-id',
    to: 'recipient',
    text: 'This is a reply',
    replyToMessageId: 'message-id'
});
```

### Media Messages

```typescript
// Image by URL
await client.messages.sendImageByUrl({
    phoneNumberId: 'phone-id',
    to: 'recipient',
    imageUrl: 'https://example.com/image.jpg',
    caption: 'Image caption'
});

// Document by media ID
await client.messages.sendDocumentById({
    phoneNumberId: 'phone-id',
    to: 'recipient',
    mediaId: 'media-id',
    filename: 'document.pdf'
});
```

### Interactive Messages

```typescript
// Interactive buttons
await client.messages.sendInteractiveButtons({
    phoneNumberId: 'phone-id',
    to: 'recipient',
    bodyText: 'Choose an option:',
    buttons: [
        { id: 'btn1', title: 'Button 1' },
        { id: 'btn2', title: 'Button 2' }
    ],
    headerText: 'Menu',
    footerText: 'Footer text'
});

// Interactive list
await client.messages.sendInteractiveList({
    phoneNumberId: 'phone-id',
    to: 'recipient',
    bodyText: 'Select from list:',
    buttonText: 'View Options',
    sections: [
        {
            title: 'Section 1',
            rows: [
                { id: 'opt1', title: 'Option 1', description: 'Description 1' },
                { id: 'opt2', title: 'Option 2', description: 'Description 2' }
            ]
        }
    ]
});
```

### Template Messages

```typescript
// Simple template
await client.messages.sendTemplate({
    phoneNumberId: 'phone-id',
    to: 'recipient',
    templateName: 'hello_world',
    languageCode: 'en_US'
});

// Template with parameters
await client.messages.sendMessageTemplateText({
    phoneNumberId: 'phone-id',
    to: 'recipient',
    templateName: 'welcome_message',
    languageCode: 'en_US',
    bodyParameters: [
        { type: 'text', text: 'John Doe' }
    ]
});
```

### Location and Contacts

```typescript
// Send location
await client.messages.sendLocation({
    phoneNumberId: 'phone-id',
    to: 'recipient',
    latitude: 37.7749,
    longitude: -122.4194,
    name: 'San Francisco',
    address: 'San Francisco, CA'
});

// Send contact
await client.messages.sendContact({
    phoneNumberId: 'phone-id',
    to: 'recipient',
    contacts: [{
        name: {
            formatted_name: 'John Doe',
            first_name: 'John',
            last_name: 'Doe'
        },
        phones: [{ phone: '+1234567890', type: 'WORK' }]
    }]
});
```

## Webhook Event Types

### Message Events

```typescript
interface WebhookMessage {
    id: string;
    from: string;
    timestamp: string;
    type: 'text' | 'image' | 'audio' | 'video' | 'document' | 'sticker' | 'location' | 'contacts' | 'interactive' | 'button' | 'system' | 'unknown';
    text?: { body: string };
    image?: WebhookMediaObject;
    // ... other message types
}
```

### Status Events

```typescript
interface WebhookMessageStatus {
    id: string;
    status: 'sent' | 'delivered' | 'read' | 'failed';
    timestamp: string;
    recipient_id: string;
    conversation?: {
        id: string;
        origin: { type: 'business_initiated' | 'user_initiated' };
    };
}
```

## Webhook Utilities

### Message Extraction

```typescript
// Extract different message types
const textMessage = client.webhook.extractTextMessage(message);
const mediaInfo = client.webhook.extractMediaInfo(message);
const interactiveResponse = client.webhook.extractInteractiveResponse(message);
const location = client.webhook.extractLocation(message);
const contacts = client.webhook.extractContacts(message);
```

### Message Properties

```typescript
// Check message properties
const isReply = client.webhook.isReplyMessage(message);
const isForwarded = client.webhook.isForwardedMessage(message);
const isFrequentlyForwarded = client.webhook.isFrequentlyForwardedMessage(message);

// Get reply information
const replyToId = client.webhook.getReplyToMessageId(message);
```

### Webhook Verification

```typescript
// Verify webhook for Meta's verification process
const verificationResponse = client.webhook.createVerificationResponse({
    mode: 'subscribe',
    token: 'received-token',
    challenge: 'challenge-string',
    verifyToken: 'your-verify-token'
});

// Returns challenge string if valid, null if invalid
```

## Configuration

### Environment Variables

```bash
WHATSAPP_ACCESS_TOKEN=your-access-token
```

### Configuration Object

```typescript
const client = new WhatsAppCloudApiClient({
    accessToken: 'your-access-token',
    version: 'v23.0',           // API version
    baseUrl: 'https://graph.facebook.com'  // API base URL
});
```

## Error Handling

```typescript
try {
    await client.messages.sendText({
        phoneNumberId: 'phone-id',
        to: 'recipient',
        text: 'Hello!'
    });
} catch (error) {
    console.error('Failed to send message:', error);
}
```

## Type Safety

All interfaces are exported for use in your application:

```typescript
import WhatsAppCloudApiClient, {
    WebhookPayload,
    WebhookMessage,
    WebhookMessageStatus,
    WebhookError
} from './whatsapp-client';
```

## Examples

See `example-usage.ts` for comprehensive examples of all functionality including:
- All message types
- Webhook setup and handling
- Interactive message processing
- Media handling
- Template messages
- Error handling

## API Reference

The client provides organized endpoint access:

- `client.messages.*` - All messaging operations
- `client.webhook.*` - All webhook operations

Each method includes full TypeScript type definitions and JSDoc documentation.

## Contributing

This client is generated from the official WhatsApp Cloud API OpenAPI specification and includes comprehensive webhook support for building robust WhatsApp applications. 