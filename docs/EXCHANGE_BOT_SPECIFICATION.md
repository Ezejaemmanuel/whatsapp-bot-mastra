# WhatsApp Exchange Bot for KhalidWid - Technical Specification

## 🎯 Project Overview

The WhatsApp Exchange Bot is a customer service agent designed to provide real-time currency exchange rates and facilitate payment processing for KhalidWid's exchange business. The bot serves as the primary interface between customers and the exchange service, handling inquiries about Naira-to-Dollar exchange rates and processing payment verifications.

## 🎭 Bot Personality & Behavior

### Introduction Sequence
When a user initiates their first conversation, the bot will introduce itself:

```
👋 Hello! Welcome to KhalidWid Exchange!

I'm your personal exchange assistant, here to help you with:
💱 Real-time Naira to Dollar exchange rates
💳 Payment processing and verification
📞 Customer support

How can I assist you today?
```

### Core Capabilities
- **Text Communication**: Accepts and responds to text messages
- **Image Processing**: Accepts payment receipt images for verification
- **Rate Inquiries**: Provides current exchange rates from database
- **Payment Processing**: Guides users through payment verification
- **Customer Support**: Handles general inquiries and support requests

### Message Type Restrictions
The bot will only accept:
- ✅ **Text messages** - For inquiries and communication
- ✅ **Images** - For payment receipt verification
- ❌ **Other media types** (audio, video, documents, etc.)

For unsupported media types, the bot responds:
```
🚫 Sorry, I can only process text messages and images at the moment. 
Please send your message as text or share your payment receipt as an image.
```

## 🏗️ System Architecture

### Current Infrastructure
Based on the existing codebase, we have:

```
📁 WhatsApp Bot Infrastructure
├── 🤖 Mastra Agent (Google Gemini 2.5 Flash)
├── 💾 PostgreSQL Database (Drizzle ORM)
├── 📱 WhatsApp Cloud API Integration
├── 🧠 Memory System (Upstash Redis + Vector)
└── 📊 Comprehensive Message Logging
```

### Database Schema Enhancement
The existing schema supports our needs with these key tables:
- `users` - WhatsApp user profiles
- `conversations` - Chat sessions
- `messages` - All message history
- `media_files` - Payment receipt storage
- `message_statuses` - Delivery tracking

**Required Addition**: Exchange rates table
```sql
CREATE TABLE exchange_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    currency_pair VARCHAR(10) NOT NULL, -- 'USD_NGN'
    buy_rate DECIMAL(10,4) NOT NULL,
    sell_rate DECIMAL(10,4) NOT NULL,
    source VARCHAR(50) NOT NULL, -- 'manual', 'api', 'admin'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🎯 Core Functionalities

### 1. Exchange Rate Inquiries

**User Scenarios:**
- "What's the dollar rate today?"
- "How much is $100 in naira?"
- "Current exchange rate please"

**Bot Response Format:**
```
💱 Current Exchange Rates (KhalidWid)

🇺🇸 USD → 🇳🇬 NGN
• We Buy: ₦1,450.00 per $1
• We Sell: ₦1,470.00 per $1

📊 Last Updated: 2 hours ago
💬 Ready to exchange? Let me know how I can help!
```

### 2. Payment Processing Workflow

#### Step 1: Rate Confirmation
```
Bot: "Great! You want to exchange $200 to Naira.
At our current rate of ₦1,470 per dollar:
$200 = ₦294,000

Proceed with this transaction? (Yes/No)"
```

#### Step 2: Payment Instructions
```
Bot: "Perfect! Please make your payment to:

🏦 Bank Details:
• Account Name: KhalidWid Exchange
• Account Number: 1234567890
• Bank: GTBank
• Amount: $200

After payment, please send a screenshot of your receipt."
```

#### Step 3: Receipt Verification
```
Bot: "📸 Receipt received! 
I'm verifying your payment...

✅ Payment Verified!
• Amount: $200
• Reference: TXN123456789
• Status: Confirmed

Your Naira equivalent (₦294,000) will be processed within 10 minutes.
Transaction ID: KW-20241201-001"
```

### 3. Customer Support Features

**Common Inquiries:**
- Business hours and contact information
- Transaction status checks
- Rate history and trends
- Account verification processes

## 🔄 Conversation Flow States

### State Management
The bot maintains conversation context using Mastra's memory system:

```typescript
interface ConversationState {
  currentFlow: 'inquiry' | 'transaction' | 'support' | 'verification';
  transactionData?: {
    amount: number;
    currency: 'USD' | 'NGN';
    rate: number;
    paymentMethod: string;
    status: 'pending' | 'paid' | 'verified' | 'completed';
  };
  userPreferences: {
    language: string;
    notifications: boolean;
  };
}
```

### Flow Transitions
1. **Initial Contact** → Introduction + Rate Display
2. **Rate Inquiry** → Current Rates + Transaction Offer
3. **Transaction Intent** → Payment Instructions
4. **Payment Submitted** → Verification Process
5. **Verification Complete** → Transaction Completion

## 🛠️ Implementation Phases

### Phase 1: Text-Based Core (Current Focus)
- ✅ Basic WhatsApp message handling (Already implemented)
- 🔄 Exchange rate database integration
- 🔄 Rate inquiry responses
- 🔄 Transaction flow logic
- 🔄 Customer support responses

### Phase 2: Image Processing (Future)
- Payment receipt image analysis
- OCR for payment verification
- Automated transaction matching
- Receipt storage and retrieval

### Phase 3: Advanced Features (Future)
- Multi-language support
- Rate alerts and notifications
- Transaction history
- Admin dashboard integration

## 📊 Database Operations

### Exchange Rate Management
```typescript
interface ExchangeRateService {
  getCurrentRates(): Promise<ExchangeRate[]>;
  updateRates(rates: ExchangeRate[]): Promise<void>;
  getRateHistory(days: number): Promise<ExchangeRate[]>;
  calculateExchange(amount: number, from: string, to: string): Promise<number>;
}
```

### Transaction Tracking
```typescript
interface TransactionService {
  createTransaction(userId: string, details: TransactionDetails): Promise<Transaction>;
  updateTransactionStatus(id: string, status: TransactionStatus): Promise<void>;
  getTransactionHistory(userId: string): Promise<Transaction[]>;
  verifyPayment(receiptImage: Buffer): Promise<PaymentVerification>;
}
```

## 🔒 Security & Compliance

### Data Protection
- All conversations encrypted in transit and at rest
- Payment information handled securely
- User data anonymization options
- GDPR compliance for data retention

### Transaction Security
- Payment verification through multiple channels
- Fraud detection algorithms
- Transaction limits and monitoring
- Audit trail for all operations

## 📈 Performance Requirements

### Response Times
- Text responses: < 2 seconds
- Rate queries: < 1 second  
- Image processing: < 30 seconds
- Database operations: < 500ms

### Scalability
- Support for 1000+ concurrent users
- Message throughput: 10,000+ per hour
- Database optimization for high-frequency rate updates
- Caching layer for frequently accessed data

## 🎨 User Experience Guidelines

### Message Formatting
- Use emojis for visual appeal and clarity
- Keep responses concise and scannable
- Provide clear action items
- Use consistent formatting patterns

### Error Handling
- Graceful degradation for system issues
- Clear error messages with next steps
- Fallback to human support when needed
- Retry mechanisms for failed operations

### Accessibility
- Simple language for broad audience
- Support for multiple languages (future)
- Voice message transcription (future)
- Integration with accessibility tools

## 🚀 Success Metrics

### Key Performance Indicators
- **Response Accuracy**: >95% correct rate information
- **Transaction Completion Rate**: >90% successful transactions
- **User Satisfaction**: >4.5/5 average rating
- **System Uptime**: >99.9% availability

### Business Metrics
- Daily active users
- Transaction volume and value
- Customer acquisition cost
- Revenue per conversation

## 🔧 Technical Requirements

### Environment Variables
```env
# WhatsApp API
WHATSAPP_ACCESS_TOKEN=your_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_id
WHATSAPP_VERIFY_TOKEN=your_verify_token

# Database
DATABASE_URL=postgresql://...

# AI/Memory
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_key
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token

# Exchange API (if using external rates)
EXCHANGE_API_KEY=your_exchange_api_key
```

### Dependencies
- `@mastra/core` - Agent framework
- `@mastra/memory` - Conversation memory
- `drizzle-orm` - Database operations
- `@ai-sdk/google` - Gemini AI integration
- WhatsApp Cloud API client

## 📋 Development Checklist

### Phase 1 Implementation
- [ ] Create exchange rates database table
- [ ] Implement rate query service
- [ ] Update agent instructions for exchange focus
- [ ] Add transaction flow state management
- [ ] Create rate display formatting
- [ ] Implement basic transaction workflow
- [ ] Add customer support responses
- [ ] Test conversation flows
- [ ] Add error handling and fallbacks
- [ ] Performance optimization

### Testing Strategy
- [ ] Unit tests for rate calculations
- [ ] Integration tests for WhatsApp API
- [ ] End-to-end conversation flow tests
- [ ] Load testing for concurrent users
- [ ] Security testing for payment flows

This specification provides a comprehensive roadmap for building KhalidWid's WhatsApp Exchange Bot, focusing on delivering excellent customer service while maintaining security and reliability in financial transactions. 