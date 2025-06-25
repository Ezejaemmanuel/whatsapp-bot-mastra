# WhatsApp Exchange Bot for KhalidWid - Technical Specification

## 🎯 Project Overview

The WhatsApp Exchange Bot is an intelligent customer service agent designed to provide dynamic currency exchange rates with smart bargaining capabilities. The bot facilitates payment processing for KhalidWid's exchange business, handling rate negotiations, payment verification through image processing, and preventing duplicate transactions.

## 🎭 Bot Personality & Behavior

### Personality Traits
- **Informal but Professional**: Friendly, approachable tone without being overly casual
- **Intelligent Negotiator**: Can bargain within defined rate limits
- **Helpful Guide**: Walks users through the entire exchange process
- **Security Conscious**: Prevents fraud and duplicate transactions
- **Patient**: Handles questions and concerns politely

### Introduction Sequence
When a user initiates their first conversation, the bot will introduce itself:

```
Hey there! 👋 Welcome to KhalidWid Exchange!

I'm your exchange buddy here to help you get the best rates for your currency exchange 💱

Here's what I can do for you:
• Get you real-time exchange rates
• Help you bargain for better deals (within limits!)
• Process your payments quickly and securely
• Answer any questions you have

What currency are you looking to exchange today?
```

### Core Capabilities
- **Intelligent Rate Negotiation**: Bargains within min/max rate boundaries
- **Dynamic Rate Checking**: Fetches current market rates from database
- **Image Processing**: Extracts transaction details from payment receipts
- **Duplicate Prevention**: Prevents processing of duplicate transactions
- **Secure Payment Flow**: Guides users through secure payment process
- **Data Extraction**: OCR and AI-powered receipt analysis

### Message Type Handling
The bot accepts and sends:
- ✅ **Text messages** - For inquiries, negotiations, and communication
- ✅ **Images** - For payment receipt verification and processing
- ✅ **Interactive Messages** - Buttons, lists, and quick replies for streamlined workflows
- ❌ **Other media types** (audio, video, documents, etc.)

For unsupported media types, the bot responds:
```
Hey! I can only work with text messages and images right now 📱
Send me a text or share your payment receipt as an image, and I'll help you out! 😊
```

### Interactive Message Capabilities
The bot uses WhatsApp Cloud API interactive messages to enhance user experience:

#### **Button Messages** - For quick decisions
```json
{
  "type": "interactive",
  "interactive": {
    "type": "button",
    "body": { "text": "Ready to proceed with ₦1,485 per dollar?" },
    "action": {
      "buttons": [
        { "id": "accept_rate", "title": "Accept Rate" },
        { "id": "negotiate_more", "title": "Negotiate" },
        { "id": "cancel_deal", "title": "Cancel" }
      ]
    }
  }
}
```

#### **List Messages** - For currency selection
```json
{
  "type": "interactive",
  "interactive": {
    "type": "list",
    "body": { "text": "Which currency would you like to exchange?" },
    "button": { "text": "Select Currency" },
    "action": {
      "sections": [
        {
          "title": "Popular Currencies",
          "rows": [
            { "id": "usd_ngn", "title": "USD to NGN", "description": "US Dollar to Naira" },
            { "id": "gbp_ngn", "title": "GBP to NGN", "description": "British Pound to Naira" },
            { "id": "eur_ngn", "title": "EUR to NGN", "description": "Euro to Naira" }
          ]
        }
      ]
    }
  }
}
```

#### **Quick Reply Buttons** - For common actions
```json
{
  "type": "interactive",
  "interactive": {
    "type": "button",
    "body": { "text": "What would you like to do next?" },
    "action": {
      "buttons": [
        { "id": "check_rates", "title": "📊 Check Rates" },
        { "id": "start_exchange", "title": "💱 Exchange Now" },
        { "id": "help_support", "title": "❓ Get Help" }
      ]
    }
  }
}
```

## 🏗️ System Architecture

### Enhanced Infrastructure
```
📁 WhatsApp Exchange Bot Infrastructure
├── 🤖 Mastra Agent (Google Gemini 2.5 Flash) - Intelligent Bargaining
├── 💾 Convex Database - Real-time Data Storage
├── 📱 WhatsApp Cloud API Integration
├── 🧠 Memory System (Upstash Redis + Vector)
├── 🖼️ Image Processing (OCR + AI Analysis)
├── 🔒 Duplicate Detection System
└── 📊 Transaction Monitoring & Logging
```

### Enhanced Database Schema

#### Exchange Rates Table
```sql
CREATE TABLE exchange_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    currency_pair VARCHAR(10) NOT NULL, -- 'USD_NGN', 'GBP_NGN', etc.
    min_rate DECIMAL(10,4) NOT NULL, -- Minimum acceptable rate
    max_rate DECIMAL(10,4) NOT NULL, -- Maximum rate for customers
    current_market_rate DECIMAL(10,4) NOT NULL, -- Current market rate
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Transactions Table
```sql
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    conversation_id UUID REFERENCES conversations(id),
    currency_from VARCHAR(3) NOT NULL,
    currency_to VARCHAR(3) NOT NULL,
    amount_from DECIMAL(15,2) NOT NULL,
    amount_to DECIMAL(15,2) NOT NULL,
    negotiated_rate DECIMAL(10,4) NOT NULL,
    customer_bank_name VARCHAR(100),
    customer_account_number VARCHAR(20),
    customer_account_name VARCHAR(100),
    payment_reference VARCHAR(100),
    receipt_image_url VARCHAR(500),
    extracted_details JSONB, -- OCR extracted data
    status VARCHAR(20) DEFAULT 'pending', -- pending, paid, verified, completed, failed
    duplicate_check_hash VARCHAR(64), -- For duplicate prevention
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(duplicate_check_hash)
);
```

## 🎯 Enhanced Core Functionalities

### 1. Intelligent Rate Inquiry & Bargaining

**User Scenarios:**
- "What's the dollar rate today?"
- "Can you do better than that rate?"
- "I saw ₦1,500 elsewhere, can you match it?"

**Bot Response with Bargaining:**
```
Hey! Here are today's rates 💱

🇺🇸 USD → 🇳🇬 NGN
• Current Rate: ₦1,470 per $1
• My Best Rate: ₦1,485 per $1

How much are you looking to exchange? 
And hey, if you've got a better offer elsewhere, let me know - I might be able to work something out! 😉
```

**Bargaining Logic:**
- Bot never goes below the minimum rate from database
- Can negotiate up to maximum rate based on amount and relationship
- Uses AI to respond naturally to bargaining attempts
- Considers transaction volume for better rates

### 2. Enhanced Payment Processing Workflow with Interactive Messages

#### Step 1: Currency Selection (Interactive List)
```
Bot sends interactive list message:
"Which currency would you like to exchange today?"
[Select Currency Button] → Shows list of USD/NGN, GBP/NGN, EUR/NGN
```

#### Step 2: Amount & Rate Negotiation with Buttons
```
User: "I want to exchange $500, but can you do ₦1,490?"

Bot: "₦1,490 for $500? 🤔 
That's pretty close to my best rate! 

I can do ₦1,485 per dollar for $500.
That gives you ₦742,500 total."

[Interactive Buttons]:
• "Accept ₦1,485" 
• "Counter Offer"
• "Check Other Rates"
```

#### Step 3: Customer Account Details Collection
```
Bot: "Awesome! ₦1,485 it is! 💪

Now I need your account details for the transfer:"

[Interactive Buttons]:
• "Enter Details Manually"
• "Send Account Screenshot"
• "Use Saved Details" (for returning customers)

If manual entry selected:
"Please provide:
• Bank Name
• Account Number  
• Account Name

Send them in any format - I'll sort it out!"
```

#### Step 4: Payment Instructions with Action Buttons
```
Bot: "Perfect! Here's where to send your $500:

🏦 **Payment Details:**
• Account Name: KhalidWid Exchange Ltd
• Account Number: 1234567890
• Bank: GTBank
• Amount: $500.00 USD"

[Interactive Buttons]:
• "📸 Upload Receipt"
• "⏰ Payment Sent"
• "❓ Need Help"
• "📋 Copy Details"
```

#### Step 5: Receipt Processing with Status Updates
```
Bot: "Got your receipt! 📸 Let me check the details...

🔍 **Extracted Information:**
• Amount: $500.00 ✅
• Reference: TXN789123456
• Date: Dec 1, 2024, 2:30 PM
• Bank: Chase Bank

Everything looks good! Your transaction is confirmed 🎉
Reference ID: KW-20241201-003"

[Interactive Buttons]:
• "✅ Confirm Details"
• "❌ Report Issue"
• "📱 Get Updates"
• "💬 Chat Support"

"Your ₦742,500 will hit your account within 10 minutes!"
```

### 3. Duplicate Prevention System

**Detection Methods:**
- Hash of (amount + reference + timestamp + sender)
- Image similarity checking
- Reference number tracking
- Sender pattern analysis

**Duplicate Response:**
```
Hold up! 🛑 

I think I've seen this transaction before. 
Reference: TXN789123456 was already processed at 2:30 PM today.

If this is a new transaction, please double-check your receipt or contact support.
Want me to help you with something else instead? 😊
```

## 🧠 AI Bargaining Intelligence

### Negotiation Parameters
```typescript
interface NegotiationContext {
  userAmount: number;
  requestedRate: number;
  minAllowedRate: number;
  maxAllowedRate: number;
  currentMarketRate: number;
  userHistory: TransactionHistory[];
  volumeBonus: number;
}
```

### Bargaining Strategies
1. **Volume-Based**: Better rates for larger amounts
2. **Loyalty-Based**: Improved rates for repeat customers
3. **Market-Adaptive**: Adjusts based on current market conditions
4. **Competitive**: Responds to competitor rate mentions

### Sample Negotiation Responses
```typescript
const negotiationResponses = {
  tooLow: "Ouch! That's below my minimum rate 😅 The best I can do is ₦{minRate}. Still interested?",
  reasonable: "Hmm, ₦{requestedRate}? I can meet you halfway at ₦{counterRate}. What do you say?",
  acceptable: "You drive a hard bargain! 😄 ₦{requestedRate} works for me. Let's do it!",
  volumeBonus: "For ${amount}? Now we're talking! 💰 I can do ₦{specialRate} for that volume."
};
```

## 🖼️ Image Processing Pipeline

### OCR & AI Analysis
```typescript
interface ReceiptAnalysis {
  extractedText: string;
  amount: number;
  currency: string;
  reference: string;
  bankName: string;
  timestamp: Date;
  confidence: number;
  rawData: object;
}
```

### Processing Steps
1. **Image Upload** → Convex file storage
2. **OCR Extraction** → Text extraction from receipt
3. **AI Analysis** → Gemini processes extracted text
4. **Data Validation** → Verify against transaction details
5. **Duplicate Check** → Compare with existing transactions
6. **Storage** → Save to Convex database

## 📱 Interactive Message Flow Patterns

### Common Interactive Patterns

#### **Welcome Menu (First Contact)**
```json
{
  "body": { "text": "Hey there! 👋 Welcome to KhalidWid Exchange!\n\nWhat can I help you with today?" },
  "action": {
    "buttons": [
      { "id": "check_rates", "title": "📊 Check Rates" },
      { "id": "start_exchange", "title": "💱 Start Exchange" },
      { "id": "help_support", "title": "❓ Get Help" }
    ]
  }
}
```

#### **Rate Confirmation Buttons**
```json
{
  "body": { "text": "Current rate: ₦1,485 per $1\nFor $500 = ₦742,500\n\nReady to proceed?" },
  "action": {
    "buttons": [
      { "id": "accept_rate", "title": "✅ Accept" },
      { "id": "negotiate_rate", "title": "💬 Negotiate" },
      { "id": "check_other", "title": "🔄 Other Rates" }
    ]
  }
}
```

#### **Payment Method Selection**
```json
{
  "body": { "text": "How would you like to provide your account details?" },
  "action": {
    "buttons": [
      { "id": "manual_entry", "title": "⌨️ Type Details" },
      { "id": "screenshot_account", "title": "📸 Send Screenshot" },
      { "id": "saved_details", "title": "💾 Use Saved" }
    ]
  }
}
```

#### **Transaction Status Menu**
```json
{
  "body": { "text": "Transaction KW-20241201-003 confirmed! ✅\n\nWhat would you like to do next?" },
  "action": {
    "buttons": [
      { "id": "track_payment", "title": "📍 Track Payment" },
      { "id": "new_exchange", "title": "🔄 New Exchange" },
      { "id": "get_receipt", "title": "📄 Get Receipt" }
    ]
  }
}
```

### Interactive Message Response Handling

#### Button Response Processing
```typescript
interface InteractiveResponse {
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
}

const handleInteractiveResponse = (response: InteractiveResponse) => {
  switch (response.button_reply?.id) {
    case 'accept_rate':
      return proceedToAccountCollection();
    case 'negotiate_rate':
      return startNegotiation();
    case 'check_rates':
      return showCurrentRates();
    // ... more handlers
  }
};
```

## 🔄 Enhanced Conversation Flow States

### State Management
```typescript
interface ConversationState {
  currentFlow: 'welcome' | 'currency_selection' | 'rate_inquiry' | 'negotiation' | 'account_details' | 'payment' | 'verification' | 'completed';
  lastInteraction: 'text' | 'button' | 'list' | 'image';
  transactionData: {
    currencyFrom: string;
    currencyTo: string;
    amount: number;
    negotiatedRate: number;
    customerDetails: {
      bankName: string;
      accountNumber: string;
      accountName: string;
    };
    paymentReference?: string;
    status: TransactionStatus;
  };
  negotiationHistory: NegotiationAttempt[];
  duplicateCheckHash?: string;
  interactiveMenuState: {
    lastMenuSent: string;
    awaitingResponse: boolean;
    menuType: 'welcome' | 'rates' | 'payment' | 'confirmation';
  };
}
```

### Enhanced Flow Transitions
1. **Initial Contact** → Welcome Menu (Interactive Buttons)
2. **Currency Selection** → Interactive List → Rate Display
3. **Rate Inquiry** → Current Rates + Action Buttons
4. **Negotiation Phase** → Accept/Counter/Cancel Buttons
5. **Rate Agreement** → Account Details Methods (Buttons)
6. **Account Collection** → Manual/Screenshot/Saved Options
7. **Payment Instructions** → Action Buttons (Upload/Help/Copy)
8. **Receipt Upload** → Processing + Status Buttons
9. **Verification** → Confirmation + Next Action Buttons
10. **Transaction Complete** → New Exchange/Track/Receipt Buttons

## 🛡️ Security & Fraud Prevention

### Duplicate Prevention
- Transaction fingerprinting
- Image hash comparison
- Reference number tracking
- Time-based validation windows
- Sender behavior analysis

### Security Measures
- Encrypted data storage in Convex
- Secure image processing pipeline
- Rate manipulation detection
- Suspicious pattern identification
- Automated fraud alerts

## 📊 Enhanced Database Operations

### Rate Management Service
```typescript
interface RateService {
  getCurrentRates(currencyPair: string): Promise<ExchangeRate>;
  canNegotiate(requestedRate: number, minRate: number, maxRate: number): boolean;
  calculateCounterOffer(context: NegotiationContext): Promise<number>;
  updateRates(rates: ExchangeRate[]): Promise<void>;
}
```

### Transaction Service
```typescript
interface TransactionService {
  createTransaction(details: TransactionDetails): Promise<Transaction>;
  processReceipt(image: Buffer, transactionId: string): Promise<ReceiptAnalysis>;
  checkDuplicate(hash: string): Promise<boolean>;
  updateTransactionStatus(id: string, status: string): Promise<void>;
  extractReceiptDetails(imageUrl: string): Promise<ReceiptAnalysis>;
}
```

### Interactive Message Service
```typescript
interface InteractiveMessageService {
  sendWelcomeMenu(to: string): Promise<void>;
  sendCurrencyList(to: string): Promise<void>;
  sendRateConfirmation(to: string, rate: number, amount: number, total: number): Promise<void>;
  sendAccountDetailsOptions(to: string): Promise<void>;
  sendPaymentInstructions(to: string, paymentDetails: PaymentDetails): Promise<void>;
  sendTransactionStatus(to: string, transaction: Transaction): Promise<void>;
  handleButtonResponse(buttonId: string, context: ConversationState): Promise<void>;
  handleListResponse(listId: string, context: ConversationState): Promise<void>;
}
```

### Interactive Message Templates
```typescript
const interactiveTemplates = {
  welcomeMenu: {
    type: 'button',
    body: "Hey there! 👋 Welcome to KhalidWid Exchange!\n\nWhat can I help you with today?",
    buttons: [
      { id: 'check_rates', title: '📊 Check Rates' },
      { id: 'start_exchange', title: '💱 Start Exchange' },
      { id: 'help_support', title: '❓ Get Help' }
    ]
  },
  
  currencySelection: {
    type: 'list',
    body: "Which currency would you like to exchange?",
    buttonText: "Select Currency",
    sections: [
      {
        title: "Popular Currencies",
        rows: [
          { id: 'usd_ngn', title: 'USD to NGN', description: 'US Dollar to Naira' },
          { id: 'gbp_ngn', title: 'GBP to NGN', description: 'British Pound to Naira' },
          { id: 'eur_ngn', title: 'EUR to NGN', description: 'Euro to Naira' },
          { id: 'cad_ngn', title: 'CAD to NGN', description: 'Canadian Dollar to Naira' }
        ]
      }
    ]
  },
  
  rateConfirmation: (rate: number, amount: number, total: number) => ({
    type: 'button',
    body: `Current rate: ₦${rate} per $1\nFor $${amount} = ₦${total.toLocaleString()}\n\nReady to proceed?`,
    buttons: [
      { id: 'accept_rate', title: '✅ Accept' },
      { id: 'negotiate_rate', title: '💬 Negotiate' },
      { id: 'check_other', title: '🔄 Other Rates' }
    ]
  }),
  
  accountDetailsOptions: {
    type: 'button',
    body: "How would you like to provide your account details?",
    buttons: [
      { id: 'manual_entry', title: '⌨️ Type Details' },
      { id: 'screenshot_account', title: '📸 Send Screenshot' },
      { id: 'saved_details', title: '💾 Use Saved' }
    ]
  },
  
  paymentActions: {
    type: 'button',
    body: "Payment details sent! What's next?",
    buttons: [
      { id: 'upload_receipt', title: '📸 Upload Receipt' },
      { id: 'payment_sent', title: '⏰ Payment Sent' },
      { id: 'need_help', title: '❓ Need Help' },
      { id: 'copy_details', title: '📋 Copy Details' }
    ]
  },
  
  transactionComplete: (transactionId: string) => ({
    type: 'button',
    body: `Transaction ${transactionId} confirmed! ✅\n\nWhat would you like to do next?`,
    buttons: [
      { id: 'track_payment', title: '📍 Track Payment' },
      { id: 'new_exchange', title: '🔄 New Exchange' },
      { id: 'get_receipt', title: '📄 Get Receipt' }
    ]
  })
};
```

## 🎨 Enhanced User Experience

### Conversational Tone Examples
```
// Friendly but professional
"Hey! Looking to exchange some currency today? 😊"

// Encouraging bargaining
"That's a tough ask, but let me see what I can do... 🤔"

// Celebrating agreement
"Deal! 🤝 You're getting a great rate there!"

// Guiding through process
"Almost there! Just need that receipt photo and we're golden ✨"

// Problem solving
"Hmm, something doesn't look right. Let me help you sort this out 🔧"
```

### Error Handling Responses
```
// Rate too low
"I wish I could go that low, but ₦{minRate} is my absolute floor 😅"

// Image processing failed
"Having trouble reading that receipt 📸 Mind taking another photo? Maybe a bit clearer?"

// Duplicate detected
"Hold up! This looks familiar... 🤔 Have we processed this one already?"

// System error
"Oops! Something hiccupped on my end 🤖 Give me a sec to sort this out..."
```

## 🚀 Success Metrics

### Enhanced KPIs
- **Negotiation Success Rate**: >85% of negotiations result in transactions
- **Rate Accuracy**: >99% accurate rate calculations
- **Image Processing Accuracy**: >95% successful receipt extraction
- **Duplicate Prevention**: >99.5% duplicate detection rate
- **Customer Satisfaction**: >4.7/5 rating
- **Transaction Completion**: >92% successful end-to-end transactions

## 🔧 Technical Implementation Requirements

### Environment Variables
```env
# WhatsApp API
WHATSAPP_ACCESS_TOKEN=your_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_id
WHATSAPP_VERIFY_TOKEN=your_verify_token

# Convex Database
NEXT_PUBLIC_CONVEX_URL=your_convex_url

# AI/Memory
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_key
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token

# Image Processing
UPLOADTHING_TOKEN=your_uploadthing_token

# Exchange Rate API (optional)
EXCHANGE_API_KEY=your_exchange_api_key
```

### Enhanced Dependencies
- `@mastra/core` - Agent framework with negotiation logic
- `@mastra/memory` - Conversation state management
- `convex` - Real-time database operations
- `@ai-sdk/google` - Gemini AI for bargaining and OCR analysis
- `sharp` - Image processing
- `tesseract.js` - OCR capabilities
- `crypto` - Hash generation for duplicate detection

## 📋 Development Checklist

### Phase 1: Core Bargaining System
- [ ] Create enhanced exchange rates table with min/max rates
- [ ] Implement intelligent rate negotiation logic
- [ ] Add conversation state management for bargaining
- [ ] Create natural language bargaining responses
- [ ] Implement rate boundary enforcement
- [ ] Add customer details collection flow
- [ ] Test negotiation scenarios

### Phase 2: Image Processing & Security
- [ ] Set up image upload to Convex
- [ ] Implement OCR receipt processing
- [ ] Add AI-powered data extraction
- [ ] Create duplicate detection system
- [ ] Implement transaction hash generation
- [ ] Add fraud prevention measures
- [ ] Test image processing pipeline

### Phase 3: Integration & Optimization
- [ ] Integrate all components
- [ ] Add comprehensive error handling
- [ ] Implement logging and monitoring
- [ ] Performance optimization
- [ ] Security testing
- [ ] User acceptance testing

## 🚀 WhatsApp Cloud API Interactive Message Implementation

### Interactive Message Client Extension
```typescript
// Enhanced WhatsApp Client with Interactive Messages
class WhatsAppInteractiveClient extends WhatsAppCloudApiClient {
  
  async sendInteractiveMessage(to: string, interactive: InteractiveMessage): Promise<void> {
    const payload = {
      messaging_product: "whatsapp",
      to: to,
      type: "interactive",
      interactive: interactive
    };
    
    const response = await this.api.post(`/${this.phoneNumberId}/messages`, payload);
    return response.data;
  }
  
  async sendButtonMessage(to: string, body: string, buttons: Button[]): Promise<void> {
    const interactive = {
      type: "button",
      body: { text: body },
      action: { buttons: buttons.slice(0, 3) } // WhatsApp allows max 3 buttons
    };
    
    await this.sendInteractiveMessage(to, interactive);
  }
  
  async sendListMessage(to: string, body: string, buttonText: string, sections: Section[]): Promise<void> {
    const interactive = {
      type: "list",
      body: { text: body },
      button: { text: buttonText },
      action: { sections: sections }
    };
    
    await this.sendInteractiveMessage(to, interactive);
  }
  
  async sendWelcomeMenu(to: string): Promise<void> {
    await this.sendButtonMessage(to, 
      "Hey there! 👋 Welcome to KhalidWid Exchange!\n\nWhat can I help you with today?",
      [
        { id: 'check_rates', title: '📊 Check Rates' },
        { id: 'start_exchange', title: '💱 Start Exchange' },
        { id: 'help_support', title: '❓ Get Help' }
      ]
    );
  }
  
  async sendCurrencySelectionList(to: string): Promise<void> {
    await this.sendListMessage(to,
      "Which currency would you like to exchange?",
      "Select Currency",
      [
        {
          title: "Popular Currencies",
          rows: [
            { id: 'usd_ngn', title: 'USD to NGN', description: 'US Dollar to Naira' },
            { id: 'gbp_ngn', title: 'GBP to NGN', description: 'British Pound to Naira' },
            { id: 'eur_ngn', title: 'EUR to NGN', description: 'Euro to Naira' },
            { id: 'cad_ngn', title: 'CAD to NGN', description: 'Canadian Dollar to Naira' }
          ]
        }
      ]
    );
  }
  
  async sendRateConfirmation(to: string, rate: number, amount: number, total: number): Promise<void> {
    await this.sendButtonMessage(to,
      `Current rate: ₦${rate} per $1\nFor $${amount} = ₦${total.toLocaleString()}\n\nReady to proceed?`,
      [
        { id: 'accept_rate', title: '✅ Accept' },
        { id: 'negotiate_rate', title: '💬 Negotiate' },
        { id: 'check_other', title: '🔄 Other Rates' }
      ]
    );
  }
}
```

### Webhook Handler for Interactive Messages
```typescript
// Enhanced Webhook Service with Interactive Message Handling
interface InteractiveWebhookPayload {
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

class EnhancedWhatsAppWebhookService extends WhatsAppWebhookService {
  
  async handleInteractiveMessage(payload: InteractiveWebhookPayload, from: string): Promise<void> {
    const { interactive } = payload;
    
    if (interactive.type === 'button_reply') {
      await this.handleButtonClick(interactive.button_reply!.id, from);
    } else if (interactive.type === 'list_reply') {
      await this.handleListSelection(interactive.list_reply!.id, from);
    }
  }
  
  private async handleButtonClick(buttonId: string, from: string): Promise<void> {
    const conversationState = await this.getConversationState(from);
    
    switch (buttonId) {
      case 'check_rates':
        await this.sendCurrentRatesWithActions(from);
        break;
        
      case 'start_exchange':
        await this.whatsappClient.sendCurrencySelectionList(from);
        await this.updateConversationState(from, { currentFlow: 'currency_selection' });
        break;
        
      case 'accept_rate':
        await this.proceedToAccountCollection(from);
        break;
        
      case 'negotiate_rate':
        await this.startNegotiationFlow(from);
        break;
        
      case 'manual_entry':
        await this.requestManualAccountDetails(from);
        break;
        
      case 'upload_receipt':
        await this.requestReceiptUpload(from);
        break;
        
      case 'new_exchange':
        await this.whatsappClient.sendWelcomeMenu(from);
        await this.resetConversationState(from);
        break;
        
      default:
        await this.handleUnknownButton(buttonId, from);
    }
  }
  
  private async handleListSelection(listId: string, from: string): Promise<void> {
    switch (listId) {
      case 'usd_ngn':
        await this.startExchangeFlow(from, 'USD', 'NGN');
        break;
      case 'gbp_ngn':
        await this.startExchangeFlow(from, 'GBP', 'NGN');
        break;
      case 'eur_ngn':
        await this.startExchangeFlow(from, 'EUR', 'NGN');
        break;
      case 'cad_ngn':
        await this.startExchangeFlow(from, 'CAD', 'NGN');
        break;
      default:
        await this.handleUnknownSelection(listId, from);
    }
  }
  
  private async sendCurrentRatesWithActions(from: string): Promise<void> {
    const rates = await this.getRatesService().getCurrentRates();
    const rateText = this.formatRatesMessage(rates);
    
    await this.whatsappClient.sendButtonMessage(from, rateText, [
      { id: 'start_exchange', title: '💱 Start Exchange' },
      { id: 'check_other', title: '🔄 Other Currencies' },
      { id: 'help_support', title: '❓ Need Help' }
    ]);
  }
  
  private async proceedToAccountCollection(from: string): Promise<void> {
    await this.whatsappClient.sendButtonMessage(from,
      "Great! Now I need your account details for the transfer.\n\nHow would you like to provide them?",
      [
        { id: 'manual_entry', title: '⌨️ Type Details' },
        { id: 'screenshot_account', title: '📸 Send Screenshot' },
        { id: 'saved_details', title: '💾 Use Saved' }
      ]
    );
    
    await this.updateConversationState(from, { currentFlow: 'account_details' });
  }
  
  private async requestReceiptUpload(from: string): Promise<void> {
    await this.whatsappClient.sendMessage(from, 
      "Perfect! 📸 Please send a clear photo of your payment receipt.\n\nMake sure all details are visible - amount, reference number, date, and bank info!"
    );
    
    await this.updateConversationState(from, { currentFlow: 'verification' });
  }
}
```

### Interactive Message Types & Interfaces
```typescript
interface Button {
  id: string;
  title: string; // Max 20 characters
}

interface Section {
  title: string;
  rows: Row[];
}

interface Row {
  id: string;
  title: string; // Max 24 characters
  description?: string; // Max 72 characters
}

interface InteractiveMessage {
  type: 'button' | 'list';
  body: { text: string };
  button?: { text: string }; // For list messages
  action: {
    buttons?: Button[]; // Max 3 buttons
    sections?: Section[]; // For list messages
  };
}

// Enhanced message handling in webhook
interface EnhancedWebhookMessage {
  type: 'text' | 'image' | 'interactive';
  text?: { body: string };
  image?: { id: string; mime_type: string };
  interactive?: InteractiveWebhookPayload['interactive'];
}
```

### Integration with Existing Agent System
```typescript
// Enhanced Mastra Agent with Interactive Message Support
export class EnhancedExchangeAgent extends Agent {
  
  async processMessage(message: EnhancedWebhookMessage, from: string): Promise<void> {
    switch (message.type) {
      case 'text':
        await this.handleTextMessage(message.text!.body, from);
        break;
        
      case 'image':
        await this.handleImageMessage(message.image!, from);
        break;
        
      case 'interactive':
        await this.handleInteractiveMessage(message.interactive!, from);
        break;
    }
  }
  
  private async handleInteractiveMessage(interactive: InteractiveWebhookPayload['interactive'], from: string): Promise<void> {
    // Delegate to webhook service for interactive handling
    await this.webhookService.handleInteractiveMessage({ interactive }, from);
  }
  
  // Enhanced response methods with interactive capabilities
  async respondWithWelcome(from: string): Promise<void> {
    await this.whatsappClient.sendWelcomeMenu(from);
  }
  
  async respondWithRateOptions(from: string, rates: ExchangeRate[]): Promise<void> {
    const rateText = this.formatRatesMessage(rates);
    await this.whatsappClient.sendButtonMessage(from, rateText, [
      { id: 'start_exchange', title: '💱 Exchange Now' },
      { id: 'get_better_rate', title: '💰 Better Rate?' },
      { id: 'help_support', title: '❓ Questions' }
    ]);
  }
}
```

This comprehensive specification now includes full WhatsApp Cloud API interactive message support, enabling a sophisticated exchange bot that can intelligently negotiate rates, process payments through image analysis, prevent fraud, and provide an intuitive user experience through interactive buttons and lists - all while maintaining a friendly, conversational tone that encourages user engagement. 