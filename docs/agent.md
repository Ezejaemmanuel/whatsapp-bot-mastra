# WhatsApp Bot Agent Documentation

## Table of Contents
- [Overview](#overview)
- [Agent Architecture](#agent-architecture)
- [Mastra Framework Integration](#mastra-framework-integration)
- [Agent Configuration](#agent-configuration)
- [Memory Management](#memory-management)
- [Tools and Capabilities](#tools-and-capabilities)
- [Message Processing](#message-processing)
- [AI Instructions](#ai-instructions)
- [Error Handling](#error-handling)
- [Performance Optimization](#performance-optimization)
- [Debugging and Monitoring](#debugging-and-monitoring)

## Overview

The KhalidWid WhatsApp Bot is powered by an intelligent AI agent built using the Mastra framework. The agent handles currency exchange negotiations, customer service, and transaction management through natural language processing and structured workflows.

### Key Features
- **AI-Powered Negotiations**: Uses Google Gemini 2.5 Flash for intelligent rate negotiations
- **Memory Management**: Maintains conversation context using Upstash Redis and Vector storage
- **Tool Integration**: Accesses exchange rates, transaction data, and external APIs
- **Multi-Modal Support**: Handles text, images, and documents
- **Real-Time Processing**: Processes WhatsApp messages in real-time

## Agent Architecture

The agent follows a modular architecture with clear separation of concerns:

```
mastra/
├── agents/
│   └── whatsapp-agent.ts     # Main agent configuration
├── tools/
│   ├── exchange-tools.ts     # Currency exchange tools
│   ├── transaction-tools.ts  # Transaction management tools
│   └── media-tools.ts        # Media processing tools
├── memory/
│   └── conversation-memory.ts # Memory management
└── workflows/
    └── exchange-workflow.ts   # Exchange process workflows
```

## Mastra Framework Integration

The agent is built using the Mastra framework, which provides:

### Core Components

```typescript
import { Agent, createTool, createWorkflow } from '@mastra/core';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Agent initialization
const whatsappAgent = new Agent({
  name: 'WhatsApp Currency Exchange Agent',
  instructions: AGENT_INSTRUCTIONS,
  model: {
    provider: 'google',
    name: 'gemini-2.0-flash-exp',
    toolChoice: 'auto'
  },
  tools: [getCurrentRatesTool, ...otherTools],
  memory: enhancedMemory
});
```

### Environment Configuration

```typescript
// Required environment variables
const config = {
  googleApiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY!,
  upstashUrl: process.env.UPSTASH_REDIS_REST_URL!,
  upstashToken: process.env.UPSTASH_REDIS_REST_TOKEN!,
  vectorUrl: process.env.UPSTASH_VECTOR_REST_URL!,
  vectorToken: process.env.UPSTASH_VECTOR_REST_TOKEN!
};
```

## Agent Configuration

### Memory Setup

The agent uses enhanced memory configuration for maintaining conversation context:

```typescript
const enhancedMemory = {
  provider: 'upstash',
  config: {
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!
  },
  vectorProvider: {
    provider: 'upstash',
    config: {
      url: process.env.UPSTASH_VECTOR_REST_URL!,
      token: process.env.UPSTASH_VECTOR_REST_TOKEN!
    }
  },
  conversationStateTemplate: {
    currentExchangeRequest: null,
    negotiationHistory: [],
    customerPreferences: {},
    transactionStatus: 'none',
    lastRateQuoted: null,
    customerSentiment: 'neutral'
  }
};
```

### Conversation State Template

The agent maintains detailed conversation state:

| Field | Type | Description |
|-------|------|-------------|
| `currentExchangeRequest` | Object | Current exchange details (amount, from/to currencies) |
| `negotiationHistory` | Array | History of rate negotiations |
| `customerPreferences` | Object | Customer preferences and requirements |
| `transactionStatus` | String | Current transaction status |
| `lastRateQuoted` | Number | Last exchange rate offered |
| `customerSentiment` | String | Customer sentiment analysis |

## Memory Management

### Redis Storage

Conversation data is stored in Upstash Redis with the following structure:

```typescript
// Conversation key format
const conversationKey = `conversation:${phoneNumber}`;

// Stored data structure
interface ConversationData {
  messages: Message[];
  state: ConversationState;
  metadata: {
    createdAt: string;
    lastActivity: string;
    messageCount: number;
  };
}
```

### Vector Storage

Vector embeddings are stored for semantic search and context retrieval:

```typescript
// Vector storage for message embeddings
interface VectorData {
  id: string;
  vector: number[];
  metadata: {
    phoneNumber: string;
    messageContent: string;
    timestamp: string;
    messageType: 'text' | 'image' | 'document';
  };
}
```

## Tools and Capabilities

### Exchange Rate Tool

Fetches current exchange rates from the database:

```typescript
const getCurrentRatesTool = createTool({
  id: 'getCurrentRates',
  description: 'Get current exchange rates for all supported currencies',
  inputSchema: z.object({}), // No input parameters required
  execute: async () => {
    const rates = await ctx.runQuery(api.exchangeRates.getAllRates);
    return {
      rates: rates.map(rate => ({
        fromCurrency: rate.fromCurrency,
        toCurrency: rate.toCurrency,
        rate: rate.rate,
        lastUpdated: rate.lastUpdated
      }))
    };
  }
});
```

### Transaction Management Tools

Tools for managing currency exchange transactions:

```typescript
// Create transaction tool
const createTransactionTool = createTool({
  id: 'createTransaction',
  description: 'Create a new currency exchange transaction',
  inputSchema: z.object({
    phoneNumber: z.string(),
    fromCurrency: z.string(),
    toCurrency: z.string(),
    amount: z.number(),
    agreedRate: z.number()
  }),
  execute: async (input) => {
    const transaction = await ctx.runMutation(api.transactions.create, input);
    return { transactionId: transaction._id, status: 'created' };
  }
});

// Update transaction status tool
const updateTransactionTool = createTool({
  id: 'updateTransaction',
  description: 'Update transaction status',
  inputSchema: z.object({
    transactionId: z.string(),
    status: z.enum(['pending', 'processing', 'completed', 'cancelled'])
  }),
  execute: async (input) => {
    await ctx.runMutation(api.transactions.updateStatus, input);
    return { success: true };
  }
});
```

### Media Processing Tools

Tools for handling images and documents:

```typescript
const processImageTool = createTool({
  id: 'processImage',
  description: 'Process and analyze uploaded images',
  inputSchema: z.object({
    imageUrl: z.string(),
    messageId: z.string()
  }),
  execute: async (input) => {
    // Image processing logic
    const analysis = await analyzeImage(input.imageUrl);
    return {
      type: analysis.type, // 'receipt', 'id', 'other'
      extractedText: analysis.text,
      confidence: analysis.confidence
    };
  }
});
```

## Message Processing

### Text Message Flow

1. **Message Reception**: WhatsApp webhook receives message
2. **Context Loading**: Agent loads conversation context from memory
3. **Intent Recognition**: AI analyzes message intent
4. **Tool Execution**: Relevant tools are called based on intent
5. **Response Generation**: AI generates appropriate response
6. **Memory Update**: Conversation state is updated
7. **Response Sending**: Message is sent back to WhatsApp

### Processing Pipeline

```typescript
async function processMessage(message: WhatsAppMessage) {
  // 1. Load conversation context
  const context = await loadConversationContext(message.from);
  
  // 2. Process with agent
  const response = await whatsappAgent.generate([
    {
      role: 'user',
      content: message.text.body
    }
  ], {
    conversationId: message.from,
    context: context
  });
  
  // 3. Execute any tool calls
  if (response.toolCalls) {
    for (const toolCall of response.toolCalls) {
      await executeToolCall(toolCall);
    }
  }
  
  // 4. Send response
  await sendWhatsAppMessage(message.from, response.text);
  
  // 5. Update memory
  await updateConversationMemory(message.from, {
    userMessage: message.text.body,
    agentResponse: response.text,
    toolCalls: response.toolCalls
  });
}
```

## AI Instructions

The agent operates under comprehensive instructions that define its behavior:

### Core Personality
- Professional and friendly currency exchange specialist
- Knowledgeable about market rates and trends
- Patient and helpful in negotiations
- Security-conscious and fraud-aware

### Negotiation Guidelines
- Always start with current market rates
- Allow reasonable negotiation within 2-3% margin
- Explain rate factors (market conditions, volume, etc.)
- Maintain professional boundaries

### Security Protocols
- Verify customer identity for large transactions
- Flag suspicious patterns or requests
- Require receipt uploads for completed transactions
- Never share sensitive system information

### Response Patterns

```typescript
const AGENT_INSTRUCTIONS = `
You are a professional currency exchange specialist for KhalidWid.

Core Responsibilities:
1. Provide accurate exchange rate quotes
2. Negotiate rates within acceptable margins
3. Guide customers through the exchange process
4. Ensure transaction security and compliance

Negotiation Rules:
- Start with current market rates
- Allow up to 2-3% negotiation margin
- Explain rate factors clearly
- Be patient but firm on limits

Security Requirements:
- Verify identity for transactions >$1000
- Request receipts for completed exchanges
- Flag suspicious activities
- Protect customer information

Communication Style:
- Professional yet friendly
- Clear and concise
- Use appropriate emojis sparingly
- Respond in customer's language when possible
`;
```

## Error Handling

### Agent Error Recovery

```typescript
try {
  const response = await whatsappAgent.generate(messages, options);
  return response;
} catch (error) {
  if (error.code === 'RATE_LIMIT_EXCEEDED') {
    // Implement exponential backoff
    await delay(calculateBackoff(retryCount));
    return retryGeneration(messages, options, retryCount + 1);
  }
  
  if (error.code === 'CONTEXT_LENGTH_EXCEEDED') {
    // Summarize conversation history
    const summarized = await summarizeConversation(messages);
    return whatsappAgent.generate(summarized, options);
  }
  
  // Log error and send fallback response
  console.error('Agent error:', error);
  return generateFallbackResponse();
}
```

### Fallback Responses

```typescript
const FALLBACK_RESPONSES = {
  technical_error: "I'm experiencing technical difficulties. Please try again in a moment.",
  rate_limit: "I'm currently handling many requests. Please wait a moment and try again.",
  unknown_intent: "I didn't quite understand that. Could you please rephrase your request?",
  service_unavailable: "Our exchange service is temporarily unavailable. Please try again later."
};
```

## Performance Optimization

### Caching Strategy

```typescript
// Cache exchange rates for 5 minutes
const rateCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getCachedRates() {
  const cached = rateCache.get('current_rates');
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  const rates = await fetchCurrentRates();
  rateCache.set('current_rates', {
    data: rates,
    timestamp: Date.now()
  });
  
  return rates;
}
```

### Memory Optimization

```typescript
// Limit conversation history to last 50 messages
const MAX_HISTORY_LENGTH = 50;

async function trimConversationHistory(conversationId: string) {
  const messages = await getConversationMessages(conversationId);
  if (messages.length > MAX_HISTORY_LENGTH) {
    const toKeep = messages.slice(-MAX_HISTORY_LENGTH);
    await updateConversationMessages(conversationId, toKeep);
  }
}
```

## Debugging and Monitoring

### Logging

```typescript
const logger = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, data);
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error);
  },
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, data);
    }
  }
};
```

### Performance Metrics

```typescript
interface AgentMetrics {
  responseTime: number;
  toolCallCount: number;
  memoryUsage: number;
  errorRate: number;
  conversationLength: number;
}

async function trackMetrics(conversationId: string, metrics: AgentMetrics) {
  await ctx.runMutation(api.analytics.recordMetrics, {
    conversationId,
    metrics,
    timestamp: Date.now()
  });
}
```

### Health Checks

```typescript
async function performHealthCheck() {
  const checks = {
    agent: await testAgentResponse(),
    memory: await testMemoryConnection(),
    tools: await testToolExecution(),
    database: await testDatabaseConnection()
  };
  
  return {
    status: Object.values(checks).every(Boolean) ? 'healthy' : 'unhealthy',
    checks,
    timestamp: new Date().toISOString()
  };
}
```

This documentation provides comprehensive coverage of the WhatsApp bot agent functionality, from basic configuration to advanced optimization techniques. The agent is designed to be robust, scalable, and maintainable while providing excellent user experience for currency exchange operations.