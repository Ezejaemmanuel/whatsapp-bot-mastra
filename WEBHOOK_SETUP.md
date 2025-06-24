# WhatsApp Webhook Setup Guide

## Overview
This project includes a Next.js API route (`/api/webhook`) that handles WhatsApp Cloud API webhooks with detailed logging and security features.

## Environment Variables

Create a `.env.local` file in your project root with the following variables:

```env
# Required: Your custom verify token (can be any random string)
WHATSAPP_VERIFY_TOKEN=your-custom-verify-token-here

# Optional: Webhook secret for signature verification (recommended for production)
WHATSAPP_WEBHOOK_SECRET=your-webhook-secret-from-meta

# For sending messages (if needed later)
WHATSAPP_ACCESS_TOKEN=your-whatsapp-access-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
```

## Webhook Endpoint

The webhook is available at: `https://your-domain.com/api/webhook`

### Supported Methods:

- **GET**: Webhook verification (required by WhatsApp)
- **POST**: Receives webhook events (messages, status updates)
- **PUT/DELETE/PATCH**: Returns 405 Method Not Allowed

## Features

### 1. Webhook Verification (GET)
- Handles WhatsApp's webhook verification process
- Validates the verify token
- Returns the challenge parameter on successful verification

### 2. Event Processing (POST)
- Accepts all WhatsApp webhook events
- Detailed logging of all incoming data
- Signature verification (if webhook secret is configured)
- Processes and logs:
  - Received messages
  - Message status updates
  - Business account information
  - Phone number details

### 3. Security Features
- HMAC SHA256 signature verification
- Request validation
- Error handling and logging
- IP and User-Agent logging

### 4. Detailed Logging
All webhook events are logged with:
- Timestamp
- Log level (INFO, WARN, ERROR)
- Message details
- Processing time
- Request metadata

## Setting Up in Meta Developer Console

1. Go to your Meta Developer App
2. Navigate to WhatsApp > Configuration
3. Set Callback URL: `https://your-domain.com/api/webhook`
4. Enter your verify token (same as `WHATSAPP_VERIFY_TOKEN`)
5. Subscribe to webhook fields:
   - `messages` (for receiving messages)
   - `message_status` (for delivery/read receipts)

## Testing the Webhook

### Local Development
1. Use ngrok or similar tool to expose your local server:
   ```bash
   ngrok http 3000
   ```
2. Use the ngrok URL as your webhook URL in Meta console
3. Test verification by clicking "Verify and save" in Meta console

### Production
1. Deploy your Next.js app to a hosting service
2. Use your production URL as the webhook URL
3. Ensure HTTPS is properly configured

## Log Output Example

```
[2024-01-15T10:30:45.123Z] [INFO] WhatsApp Webhook: Webhook POST request received
Data: {
  "contentLength": 1234,
  "hasSignature": true,
  "userAgent": "WhatsApp/1.0",
  "ip": "31.13.84.1"
}

[2024-01-15T10:30:45.125Z] [INFO] WhatsApp Webhook: Webhook data processed successfully
Data: {
  "summary": {
    "object": "whatsapp_business_account",
    "totalEntries": 1,
    "totalMessages": 1,
    "totalStatuses": 0,
    "businessAccounts": ["123456789"],
    "phoneNumbers": ["987654321"]
  }
}

[2024-01-15T10:30:45.126Z] [INFO] WhatsApp Webhook: Received message
Data: {
  "messageId": "wamid.ABC123",
  "from": "1234567890",
  "timestamp": "1642248645",
  "type": "text",
  "messagePreview": "Hello, this is a test message"
}
```

## Error Handling

The webhook handles various error scenarios:
- Invalid JSON payloads
- Signature verification failures
- Missing required parameters
- Unexpected server errors

All errors are logged with detailed information for debugging.

## Features Included

### 1. Comprehensive Webhook Processing
- **Type-safe**: Full TypeScript support with proper interfaces
- **Detailed Logging**: Comprehensive logging of all webhook events
- **Security**: HMAC SHA256 signature verification
- **Error Handling**: Robust error handling with proper responses

### 2. WhatsApp Service Integration
- **Auto-responses**: Built-in message processing with example responses
- **Message Types**: Handles text, media, interactive, location, and contact messages
- **Status Tracking**: Processes delivery, read, and failure status updates
- **API Integration**: Uses existing WhatsApp client for sending messages

### 3. Reusable Components
- **Types**: Comprehensive TypeScript interfaces in `types.ts`
- **Utils**: Reusable utility functions in `utils.ts`
- **Service**: WhatsApp service class for message processing
- **Integration**: Seamless integration with existing API structure

## Customization

### Auto-Response Logic
Edit `app/api/webhook/whatsapp-service.ts` to customize message handling:

```typescript
// Example: Custom text message handler
private async handleTextMessage(messageInfo: ReturnType<typeof extractMessageInfo>): Promise<void> {
  const text = messageInfo.text?.toLowerCase() || '';
  
  if (text.includes('hello')) {
    await this.sendTextReply(messageInfo.from, 'Hello! How can I help?', messageInfo.id);
  } else if (text.includes('help')) {
    await this.sendButtonMessage(messageInfo.from, 'How can I assist you?', [
      { id: 'support', title: 'Support' },
      { id: 'info', title: 'Information' }
    ]);
  }
}
```

### Database Integration
Add database storage by extending the service:

```typescript
// Store messages in database
await this.storeMessage(messageInfo);

// Store status updates
await this.updateMessageStatus(statusInfo);
```

## Next Steps

You can further extend this webhook to:
- Store messages and conversations in a database
- Implement AI-powered chatbots
- Add business logic for different use cases
- Integrate with CRM systems
- Send notifications to other services
- Process different message types with custom logic

## Security Recommendations

1. Always use HTTPS in production
2. Configure the webhook secret for signature verification
3. Implement rate limiting if needed
4. Monitor logs for suspicious activity
5. Keep your access tokens secure 