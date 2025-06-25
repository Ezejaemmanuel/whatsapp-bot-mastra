# KhalidWid Exchange Bot - Setup Guide

## 🎯 Overview

The KhalidWid Exchange Bot is a comprehensive WhatsApp-based currency exchange system built with Mastra, featuring:

- **Intelligent Rate Negotiation**: AI-powered bargaining within business boundaries
- **Real-time Transaction Processing**: Complete exchange workflow management
- **Receipt Processing**: Image analysis for payment verification
- **Fraud Prevention**: Duplicate detection and security measures
- **Interactive UI**: WhatsApp buttons and lists for better UX
- **Memory & Context**: Persistent conversation state management

## 🏗️ Architecture

```
📁 KhalidWid Exchange Bot Infrastructure
├── 🤖 Mastra Agent (Google Gemini 2.5 Flash) - Intelligent Bargaining
├── 💾 Convex Database - Real-time Data Storage
├── 📱 WhatsApp Cloud API Integration
├── 🧠 Memory System (Upstash Redis + Vector)
├── 🖼️ Image Processing (OCR + AI Analysis)
├── 🔒 Duplicate Detection System
└── 📊 Transaction Monitoring & Logging
```

## 🔧 Prerequisites

### Required Environment Variables

Create a `.env.local` file with the following variables:

```bash
# WhatsApp Business API (Meta Business)
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_VERIFY_TOKEN=your_verify_token

# Convex Database
NEXT_PUBLIC_CONVEX_URL=your_convex_deployment_url

# Google AI (Gemini 2.5 Flash)
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key

# Upstash Redis (Memory Storage)
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token

# Upstash Vector (Embeddings)
UPSTASH_VECTOR_REST_URL=your_upstash_vector_url
UPSTASH_VECTOR_REST_TOKEN=your_upstash_vector_token

# UploadThing (Media Processing)
UPLOADTHING_TOKEN=your_uploadthing_token
```

### Required Services Setup

1. **WhatsApp Business API**
   - Create a Meta Business account
   - Set up WhatsApp Business API
   - Get access token and phone number ID
   - Configure webhook URL: `https://yourdomain.com/api/webhook`

2. **Convex Database**
   - Create a Convex project
   - Deploy the database schema
   - Get the deployment URL

3. **Google AI Platform**
   - Enable Gemini API
   - Get API key for Gemini 2.5 Flash

4. **Upstash**
   - Create Redis database for memory storage
   - Create Vector database for embeddings
   - Get connection URLs and tokens

5. **UploadThing** (Optional for enhanced media processing)
   - Create UploadThing account
   - Get API token

## 📦 Installation

1. **Install Dependencies**
   ```bash
   pnpm install
   ```

2. **Deploy Convex Schema**
   ```bash
   npx convex deploy
   ```

3. **Setup Exchange Rates**
   ```bash
   npx tsx scripts/setup-exchange-rates.ts
   ```

4. **Start Development Server**
   ```bash
   pnpm dev
   ```

## 🎛️ Configuration

### Exchange Rate Configuration

The bot uses predefined rate boundaries stored in the database:

```typescript
// Example rates (modify in scripts/setup-exchange-rates.ts)
{
  currencyPair: "USD_NGN",
  minRate: 1450.00,      // Business minimum (floor)
  maxRate: 1500.00,      // Customer maximum (ceiling)
  currentMarketRate: 1475.00, // Market reference
}
```

### Agent Configuration

The bot's personality and behavior are configured in `mastra/agents/agent-instructions.ts`:

- **Negotiation Strategy**: Smart bargaining within rate boundaries
- **Conversation Flow**: Multi-step exchange process
- **Security Measures**: Fraud prevention and duplicate detection
- **Interactive Features**: WhatsApp buttons and lists

## 🚀 Usage

### Basic Flow

1. **Welcome**: User starts conversation
2. **Currency Selection**: Choose currency pair (USD/GBP/EUR/CAD to NGN)
3. **Rate Inquiry**: Get current rates and negotiate
4. **Transaction Creation**: Agree on terms and create transaction
5. **Account Details**: Provide customer bank information
6. **Payment**: Send payment to KhalidWid account
7. **Receipt Verification**: Upload payment receipt for processing
8. **Completion**: Transaction verified and completed

### Sample Conversation

```
User: Hi
Bot: Hey there! 👋 Welcome to KhalidWid Exchange!
     I'm your exchange buddy here to help you get the best rates...
     What currency are you looking to exchange today?

User: I want to exchange $500
Bot: Great! Here are today's rates 💱
     🇺🇸 USD → 🇳🇬 NGN
     • Current Rate: ₦1,470 per $1
     • My Best Rate: ₦1,485 per $1
     For $500 = ₦742,500
     Ready to proceed? [Accept] [Negotiate] [Other Rates]

User: Can you do ₦1,490?
Bot: ₦1,490 for $500? 🤔 You drive a hard bargain!
     I can do ₦1,485 per dollar for $500.
     That gives you ₦742,500 total. Deal? 🤝
```

## 🛠️ Customization

### Adding New Currency Pairs

1. **Update Exchange Rates**
   ```typescript
   // In scripts/setup-exchange-rates.ts
   {
     currencyPair: "AUD_NGN", // New pair
     minRate: 950.00,
     maxRate: 1020.00,
     currentMarketRate: 985.00,
     isActive: true,
   }
   ```

2. **Update Agent Instructions**
   ```typescript
   // In mastra/agents/agent-instructions.ts
   // Add new currency to supported list
   ```

### Modifying Negotiation Logic

Edit the `suggestCounterOfferTool` in `mastra/tools/exchange-tools.ts`:

```typescript
// Customize business rules
if (transactionAmount >= 1000) { // Volume bonus threshold
  counterOffer = Math.min(customerProposedRate, maxRate);
  strategy = 'accept_volume';
}
```

### Adding Interactive Messages

Extend the WhatsApp service to send interactive buttons/lists:

```typescript
await this.sendButtonMessage(
  messageInfo.from,
  "Choose your preferred option:",
  [
    { id: 'option1', title: 'Option 1' },
    { id: 'option2', title: 'Option 2' },
  ]
);
```

## 🔍 Monitoring & Debugging

### Logs

- **Convex Dashboard**: Database operations and queries
- **Upstash Console**: Memory and vector operations
- **Browser Console**: Agent responses and tool calls
- **Webhook Logs**: WhatsApp API interactions

### Testing Tools

1. **WhatsApp Business API Testing**
   ```bash
   # Test webhook endpoint
   curl -X POST https://yourdomain.com/api/webhook \
     -H "Content-Type: application/json" \
     -d '{"test": "message"}'
   ```

2. **Database Testing**
   ```bash
   # Test exchange rates
   npx tsx scripts/setup-exchange-rates.ts
   ```

3. **Agent Testing**
   ```typescript
   // Test agent directly
   import { whatsappAgent } from './mastra/agents/whatsapp-agent';
   const response = await whatsappAgent.generate([{
     role: 'user',
     content: 'What is the USD rate?'
   }]);
   ```

## 🚨 Security Considerations

### Fraud Prevention

- **Duplicate Detection**: Hash-based transaction verification
- **Rate Boundaries**: Strict min/max rate enforcement
- **Receipt Verification**: AI-powered payment confirmation
- **User Validation**: Phone number and profile verification

### Data Protection

- **Encrypted Storage**: All data encrypted in Convex
- **Memory Isolation**: Thread-based conversation separation
- **Audit Trail**: Complete transaction logging
- **Access Control**: Environment-based configuration

## 📈 Performance Optimization

### Database

- **Indexed Queries**: Optimized for fast lookups
- **Efficient Schema**: Minimal data duplication
- **Batch Operations**: Grouped database writes

### Memory

- **Smart Caching**: Conversation state persistence
- **Vector Search**: Fast semantic recall
- **Cleanup Jobs**: Automated memory management

### API

- **Rate Limiting**: Prevent API abuse
- **Error Handling**: Graceful failure recovery
- **Monitoring**: Real-time performance tracking

## 🔄 Deployment

### Production Setup

1. **Environment Configuration**
   ```bash
   # Production environment variables
   NODE_ENV=production
   # ... other production configs
   ```

2. **Database Migration**
   ```bash
   npx convex deploy --prod
   ```

3. **Webhook Configuration**
   ```bash
   # Update WhatsApp webhook URL to production domain
   # Configure SSL certificates
   # Set up monitoring alerts
   ```

### Scaling Considerations

- **Horizontal Scaling**: Multiple webhook instances
- **Database Sharding**: User-based data distribution
- **Cache Optimization**: Redis cluster setup
- **Load Balancing**: Traffic distribution

## 📚 Additional Resources

- [Mastra Documentation](https://mastra.ai/docs)
- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)
- [Convex Documentation](https://docs.convex.dev)
- [Upstash Documentation](https://docs.upstash.com)
- [Google AI Documentation](https://ai.google.dev)

## 🆘 Troubleshooting

### Common Issues

1. **Agent Not Responding**
   - Check Google AI API key
   - Verify memory configuration
   - Review agent instructions

2. **Database Errors**
   - Validate Convex deployment
   - Check schema migrations
   - Review environment variables

3. **WhatsApp Integration Issues**
   - Verify webhook URL
   - Check access tokens
   - Review API permissions

4. **Memory Problems**
   - Check Upstash connections
   - Verify Redis/Vector configs
   - Review memory limits

### Support

For technical support or questions:
- Check the GitHub issues
- Review the documentation
- Contact the development team

---

**Happy exchanging! 💱🚀** 