# Architecture Guide

## Table of Contents
- [System Overview](#system-overview)
- [High-Level Architecture](#high-level-architecture)
- [Frontend Architecture](#frontend-architecture)
- [Backend Architecture](#backend-architecture)
- [Database Architecture](#database-architecture)
- [WhatsApp Integration](#whatsapp-integration)
- [AI Agent Architecture](#ai-agent-architecture)
- [State Management](#state-management)
- [Security Architecture](#security-architecture)
- [Performance Optimization](#performance-optimization)
- [Scalability Considerations](#scalability-considerations)

## System Overview

The KhalidWid WhatsApp Bot is a sophisticated full-stack application that combines several modern technologies to create a seamless currency exchange platform. The system is designed around a real-time chat interface with intelligent AI-powered customer service.

### Core Components

1. **WhatsApp Interface**: Customer-facing bot using WhatsApp Cloud API
2. **Admin Dashboard**: WhatsApp-like web interface for human agents
3. **AI Agent System**: Mastra-powered intelligence for automated responses
4. **Real-time Database**: Convex for instant data synchronization
5. **Media Processing**: OCR and image analysis for receipt verification
6. **Security Layer**: Fraud prevention and duplicate detection

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CUSTOMER FACING                           │
├─────────────────────────────────────────────────────────────────┤
│  WhatsApp Client  │  WhatsApp Cloud API  │  Meta Platforms      │
│  (Mobile App)     │  (Webhook & API)     │  (Infrastructure)    │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                           │
├─────────────────────────────────────────────────────────────────┤
│  Next.js Frontend  │  API Routes  │  Mastra AI Agents  │  Media  │
│  (Admin Dashboard) │  (Backend)   │  (Intelligence)     │  Processing│
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                 │
├─────────────────────────────────────────────────────────────────┤
│  Convex Database  │  File Storage  │  External APIs  │  Cache   │
│  (Real-time)      │  (Media Files) │  (Services)      │  Layer   │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Customer sends message** → WhatsApp Cloud API
2. **Webhook receives message** → Next.js API route
3. **Message processed** → Mastra AI agent or database storage
4. **AI generates response** → WhatsApp API sends reply
5. **Admin dashboard updates** → Real-time via Convex
6. **Data synchronized** → All clients update instantly

## Frontend Architecture

### Technology Stack

- **Framework**: Next.js 15 with App Router
- **UI Library**: Radix UI + Tailwind CSS
- **State Management**: Zustand with TanStack Query
- **Styling**: Tailwind CSS with custom WhatsApp theme
- **Icons**: Lucide React

### Component Architecture

```
WhatsAppLayout (Root Component)
├── SideNavigation (Tab switching)
├── ChatList/TransactionList (Data views)
├── ChatView/TransactionView (Detail views)
├── MobileNavBar (Mobile navigation)
└── Various Dialog Components (Modals)
```

### Key Frontend Features

1. **Responsive Design**: Mobile-first with desktop optimization
2. **Real-time Updates**: Instant UI synchronization via Convex
3. **WhatsApp Theme**: Authentic colors and styling
4. **State Management**: Centralized store with Zustand
5. **Performance**: Optimized rendering and data fetching

### State Management Pattern

```typescript
// Centralized store structure
interface WhatsAppStore {
    // Data stores
    users: Map<Id<"users">, User>;
    conversations: Map<Id<"conversations">, Conversation>;
    messages: Map<Id<"conversations">, Message[]>;
    transactions: Map<Id<"transactions">, Transaction>;

    // UI state
    ui: {
        selectedConversationId?: Id<"conversations">;
        selectedTransactionId?: Id<"transactions">;
        activeTab: 'chats' | 'transactions' | 'settings' | 'rates' | 'bank';
        isMobile: boolean;
        // ... more UI state
    };

    // Actions and selectors
    // ...
}
```

## Backend Architecture

### Next.js API Routes

The backend uses Next.js API routes for server-side logic:

```
app/api/
├── webhook/                # WhatsApp webhook processing
│   ├── route.ts           # Main webhook handler
│   ├── index.ts           # Exported functions
│   ├── message-handlers.ts # Message type processors
│   ├── status-handlers.ts  # Status update handlers
│   ├── response-sender.ts  # Response management
│   ├── media-processor.ts  # Media file handling
│   └── error-handler.ts    # Error management
├── transactions/          # Transaction management
│   └── update-status/     # Status updates
├── seed/                  # Database seeding
└── health/                # Health checks
```

### Webhook Processing Architecture

The webhook system uses a modular, functional approach:

```typescript
// Modular webhook processing
export async function handleIncomingMessage(payload: WebhookPayload) {
    // 1. Validate and parse webhook
    const parsed = validateWebhookPayload(payload);

    // 2. Extract message information
    const messageInfo = extractMessageInfo(parsed);

    // 3. Handle user and conversation
    const { userId, conversationId } = await handleUserAndConversation(messageInfo);

    // 4. Process based on message type
    switch (messageInfo.messageType) {
        case 'text':
            await handleTextMessage(messageInfo, conversationId);
            break;
        case 'image':
            await handleImageMessage(messageInfo, conversationId);
            break;
        // ... other message types
    }
}
```

### Error Handling Strategy

- **Test Mode**: Detailed error responses for development
- **Production**: User-friendly error messages
- **Logging**: Comprehensive error tracking
- **Recovery**: Graceful fallback mechanisms

## Database Architecture

### Convex Schema Design

The database uses Convex's real-time schema with the following main tables:

```typescript
// Core entities
users: WhatsApp user profiles and bank details
conversations: Chat sessions with status tracking
messages: All message types with full metadata
transactions: Exchange transactions with OCR data

// Supporting entities
exchangeRates: Currency rates with boundaries
mediaFiles: Uploaded media processing status
adminBankDetails: Payment receiving accounts
adminStatus: Availability management
imageHashes: Fraud prevention data
```

### Database Relationships

```
users (1) ←→ (N) conversations
conversations (1) ←→ (N) messages
conversations (1) ←→ (N) transactions
users (1) ←→ (N) transactions
messages (1) ←→ (0..1) mediaFiles
transactions (1) ←→ (0..1) imageHashes
```

### Real-time Features

- **Live Updates**: All clients receive instant updates
- **Optimistic Updates**: UI updates immediately, syncs later
- **Conflict Resolution**: Automatic merge conflict handling
- **Offline Support**: Built-in offline capabilities

### Indexing Strategy

```typescript
// Optimized indexes for common queries
users: defineTable({
    // ...
})
.index("by_whatsapp_id", ["whatsappId"])
.index("by_phone_number", ["phoneNumber"])

conversations: defineTable({
    // ...
})
.index("by_user_id", ["userId"])
.index("by_status", ["status"])
.index("by_last_message_at", ["lastMessageAt"])
```

## WhatsApp Integration

### API Client Architecture

The WhatsApp integration uses a type-safe client generated from OpenAPI specifications:

```typescript
// Generated TypeScript client
class WhatsAppCloudApiClient {
    // Messages
    async sendTextMessage(params: TextMessageParams): Promise<MessageResponse>;
    async sendMediaMessage(params: MediaMessageParams): Promise<MessageResponse>;
    async sendTemplateMessage(params: TemplateMessageParams): Promise<MessageResponse>;

    // Media management
    async uploadMedia(file: Buffer): Promise<MediaUploadResponse>;
    async getMediaUrl(mediaId: string): Promise<MediaUrlResponse>;

    // Business profile
    async getBusinessProfile(params: BusinessProfileParams): Promise<BusinessProfile>;
}
```

### Webhook Architecture

The webhook system handles various WhatsApp events:

```typescript
interface WebhookPayload {
    object: 'whatsapp_business_account';
    entry: WebhookEntry[];
}

interface WebhookEntry {
    id: string;
    changes: WebhookChange[];
}

interface WebhookChange {
    field: 'messages' | 'message_template_status' | 'phone_number_status';
    value: WebhookValue;
}
```

### Interactive Messages

The system supports WhatsApp's interactive message types:

```typescript
// Button messages
interface ButtonMessage {
    type: 'interactive';
    interactive: {
        type: 'button';
        body: { text: string };
        action: { buttons: Button[] };
    };
}

// List messages
interface ListMessage {
    type: 'interactive';
    interactive: {
        type: 'list';
        body: { text: string };
        button: { text: string };
        action: { sections: Section[] };
    };
}
```

## AI Agent Architecture

### Mastra Integration

The AI agent system uses Mastra framework with Google Gemini 2.5 Flash:

```typescript
// Agent definition
export class ExchangeAgent extends Agent {
    async processMessage(message: Message, context: ConversationContext): Promise<AgentResponse> {
        // Analyze message intent
        const intent = await this.analyzeIntent(message.content);

        // Generate context-aware response
        const response = await this.generateResponse(intent, context);

        return response;
    }
}
```

### Agent Capabilities

1. **Natural Language Understanding**: Parse user intents
2. **Rate Negotiation**: Intelligent bargaining algorithms
3. **Context Memory**: Remember conversation history
4. **Multi-turn Dialogues**: Handle complex conversations
5. **Personalization**: Adapt to user preferences

### Tools and Skills

```typescript
// Agent tools for external interactions
const agentTools = {
    checkExchangeRates: async (currencyPair: string) => {
        // Fetch current rates from database
    },

    createTransaction: async (transactionDetails: TransactionDetails) => {
        // Create new transaction record
    },

    analyzeReceipt: async (imageUrl: string) => {
        // OCR and AI analysis of receipt
    },

    sendWhatsAppMessage: async (to: string, message: string) => {
        // Send message via WhatsApp API
    }
};
```

### Conversation Flow Management

```typescript
interface ConversationState {
    currentFlow: 'welcome' | 'currency_selection' | 'rate_inquiry' | 'negotiation' | 'account_details' | 'payment' | 'verification' | 'completed';
    lastInteraction: 'text' | 'button' | 'list' | 'image';
    transactionData: TransactionData;
    negotiationHistory: NegotiationAttempt[];
}
```

## Security Architecture

### Authentication & Authorization

- **WhatsApp API**: Token-based authentication
- **Webhook Verification**: HMAC signature verification
- **Database Access**: Role-based access control
- **API Routes**: Protected endpoints where necessary

### Fraud Prevention

#### Duplicate Detection

```typescript
// Multi-layered duplicate detection
interface DuplicateDetection {
    cryptographicHash: string;  // SHA-256 for exact duplicates
    perceptualHash: string;    // pHash for near-duplicates
    transactionId: string;     // Associated transaction
    paymentReference: string;  // Payment reference
    timestamp: number;         // Creation time
}
```

#### Image Analysis

- **OCR Processing**: Extract text from receipts
- **AI Verification**: Validate extracted information
- **Pattern Matching**: Detect suspicious patterns
- **Hash Comparison**: Prevent duplicate uploads

### Data Protection

- **Encryption**: Data encrypted at rest and in transit
- **Validation**: Input validation and sanitization
- **Logging**: Comprehensive audit trails
- **Backup**: Automated backup and recovery

## Performance Optimization

### Frontend Optimization

1. **Code Splitting**: Lazy loading of components
2. **Image Optimization**: Next.js image optimization
3. **Caching**: Strategic caching of data
4. **Bundle Analysis**: Optimized bundle sizes
5. **Rendering**: Server-side rendering where beneficial

### Backend Optimization

1. **Database Indexes**: Optimized query performance
2. **Connection Pooling**: Efficient database connections
3. **API Caching**: Response caching for frequent requests
4. **Background Jobs**: Async processing for heavy tasks
5. **Rate Limiting**: Prevent abuse and ensure fair usage

### Real-time Performance

1. **Websocket Optimization**: Efficient real-time updates
2. **Delta Updates**: Only send changed data
3. **Debouncing**: Prevent excessive updates
4. **Offline Support**: Graceful offline handling

## Scalability Considerations

### Horizontal Scaling

- **Stateless Design**: API routes can scale horizontally
- **Database Sharding**: Convex handles scaling automatically
- **Load Balancing**: Multiple instances supported
- **CDN Integration**: Static asset distribution

### Vertical Scaling

- **Memory Management**: Efficient memory usage
- **CPU Optimization**: Optimized algorithms
- **I/O Optimization**: Minimal blocking operations
- **Resource Monitoring**: Performance metrics tracking

### Database Scalability

- **Automatic Scaling**: Convex handles infrastructure scaling
- **Query Optimization**: Efficient database queries
- **Index Strategy**: Optimal indexes for common queries
- **Data Partitioning**: Logical data organization

## Monitoring & Observability

### Application Monitoring

- **Error Tracking**: Comprehensive error logging
- **Performance Metrics**: Response times and throughput
- **User Analytics**: Usage patterns and behaviors
- **System Health**: Service availability and performance

### Business Metrics

- **Conversion Rates**: Successful transaction completion
- **Customer Satisfaction**: User feedback and ratings
- **Fraud Detection**: Security effectiveness
- **Revenue Tracking**: Business performance metrics

## Future Enhancements

### Planned Improvements

1. **Multi-language Support**: International customer base
2. **Advanced Analytics**: Business intelligence features
3. **Mobile App**: Native mobile applications
4. **API Integration**: Third-party service integrations
5. **Machine Learning**: Improved fraud detection

### Technical Roadmap

1. **Microservices**: Break down monolithic components
2. **Event Sourcing**: Audit trail and replay capabilities
3. **Advanced Caching**: Redis integration
4. **Containerization**: Docker and Kubernetes support
5. **API Gateway**: Centralized API management

---

This architecture provides a solid foundation for a scalable, secure, and feature-rich WhatsApp-based currency exchange platform. The modular design allows for easy maintenance and future enhancements while maintaining high performance and reliability.