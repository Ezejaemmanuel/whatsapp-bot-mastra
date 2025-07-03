# WhatsApp Webhook Service - Refactored

This directory contains the refactored WhatsApp webhook service, which has been converted from a large class-based approach to a modular, functional architecture.

## Architecture Overview

The service is now split into focused, single-responsibility modules:

### Core Modules

1. **`whatsapp-service.ts`** - Main service interface (functional + legacy class)
2. **`webhook-processor.ts`** - Core webhook processing logic
3. **`message-handlers.ts`** - Message type handlers (text, media, location, contacts)
4. **`status-handlers.ts`** - Message status update handlers
5. **`response-sender.ts`** - Response sending and database storage
6. **`media-processor.ts`** - Media processing and image analysis
7. **`error-handler.ts`** - Error handling and formatting
8. **`utils.ts`** - Utility functions and logging
9. **`types.ts`** - TypeScript type definitions
10. **`index.ts`** - Main export interface

## Usage

### Functional Interface (Recommended)

```typescript
import { 
    initializeWhatsAppService, 
    handleIncomingMessage, 
    sendTextMessage 
} from './webhook';

// Initialize the service
const service = initializeWhatsAppService({
    accessToken: 'your-access-token',
    phoneNumberId: 'your-phone-number-id'
});

// Handle incoming messages
await handleIncomingMessage(webhookMessage);

// Send messages
await sendTextMessage('+1234567890', 'Hello!');
```

### Legacy Class Interface (For Backward Compatibility)

```typescript
import { WhatsAppWebhookService } from './webhook';

const service = new WhatsAppWebhookService(accessToken, phoneNumberId);
await service.processIncomingMessage(webhookMessage);
```

## Module Responsibilities

### `webhook-processor.ts`
- Service initialization
- Main webhook payload processing
- User/conversation management
- Message storage coordination

### `message-handlers.ts`
- Text message processing with AI agent
- Media message handling (images, audio, video, documents)
- Location message processing
- Contact message processing

### `status-handlers.ts`
- Message delivery status tracking
- Read receipt processing
- Failed message handling

### `response-sender.ts`
- Text message sending
- Template message sending
- Message read marking
- Database storage for outgoing messages

### `media-processor.ts`
- Media file processing and storage
- Image analysis for receipts
- Media validation and error handling

### `error-handler.ts`
- Error formatting (test mode vs production)
- Error response sending
- Comprehensive error logging

## Benefits of Refactoring

1. **Modularity**: Each module has a single responsibility
2. **Testability**: Functions can be tested independently
3. **Maintainability**: Easier to understand and modify specific functionality
4. **Reusability**: Functions can be imported and used individually
5. **Type Safety**: Better TypeScript support with focused interfaces
6. **Error Handling**: Centralized error handling with consistent patterns

## Migration Guide

### From Class-Based to Functional

**Before:**
```typescript
const service = new WhatsAppWebhookService(token, phoneId);
await service.processIncomingMessage(message);
```

**After:**
```typescript
initializeWhatsAppService({ accessToken: token, phoneNumberId: phoneId });
await handleIncomingMessage(message);
```

### Individual Function Usage

You can now import and use specific functions:

```typescript
import { sendTextReply } from './response-sender';
import { processImageAnalysis } from './media-processor';
import { formatErrorForTestMode } from './error-handler';

// Use functions directly with required dependencies
await sendTextReply(whatsappClient, phoneNumber, message);
```

## File Structure

```
app/api/webhook/
├── index.ts              # Main exports
├── whatsapp-service.ts   # Service interface
├── webhook-processor.ts  # Core processing
├── message-handlers.ts   # Message handlers
├── status-handlers.ts    # Status handlers
├── response-sender.ts    # Response management
├── media-processor.ts    # Media processing
├── error-handler.ts      # Error handling
├── utils.ts             # Utilities
├── types.ts             # Type definitions
├── route.ts             # API route handler
└── README.md           # This file
```

## Testing

Each module can be tested independently:

```typescript
import { handleTextMessage } from './message-handlers';
import { processImageAnalysis } from './media-processor';

// Test individual functions with mocked dependencies
await handleTextMessage(mockClient, mockDatabase, mockMessageInfo, conversationId);
```

## Environment Variables

The service still uses the same environment variables:
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`

## Error Handling

The service includes comprehensive error handling with:
- Test mode detailed error reporting
- Production-friendly error messages
- Proper error logging and context
- Fallback mechanisms for critical operations 