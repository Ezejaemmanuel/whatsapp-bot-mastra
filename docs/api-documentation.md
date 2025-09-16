# API Documentation

## Table of Contents
- [Overview](#overview)
- [Authentication](#authentication)
- [Base URL](#base-url)
- [Response Format](#response-format)
- [Error Handling](#error-handling)
- [Endpoints](#endpoints)
  - [Chat Management](#chat-management)
  - [Transaction Management](#transaction-management)
  - [Exchange Rates](#exchange-rates)
  - [Bank Details](#bank-details)
  - [AI Settings](#ai-settings)
  - [WhatsApp Integration](#whatsapp-integration)
- [WebSocket Events](#websocket-events)
- [Rate Limiting](#rate-limiting)
- [Examples](#examples)

## Overview

The WhatsApp Currency Exchange Bot API provides RESTful endpoints for managing conversations, transactions, exchange rates, and system settings. The API is built with Next.js and uses modern web standards.

### API Version
- **Current Version**: v1
- **Protocol**: HTTPS
- **Format**: JSON
- **Architecture**: RESTful

## Authentication

Currently, the API operates without explicit authentication for admin dashboard access. In production environments, implement proper authentication mechanisms.

### Future Authentication Methods
- **API Keys**: For programmatic access
- **JWT Tokens**: For session management
- **OAuth 2.0**: For third-party integrations

## Base URL

```
http://localhost:3000/api
```

*Replace with your production domain in live environments.*

## Response Format

All API responses follow a consistent JSON format:

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {
      // Additional error information
    }
  }
}
```

## Error Handling

### HTTP Status Codes
- **200**: Success
- **201**: Created
- **400**: Bad Request
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not Found
- **422**: Unprocessable Entity
- **500**: Internal Server Error

### Common Error Codes
- `INVALID_REQUEST`: Malformed request data
- `RESOURCE_NOT_FOUND`: Requested resource doesn't exist
- `VALIDATION_ERROR`: Input validation failed
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INTERNAL_ERROR`: Server-side error

## Endpoints

### Chat Management

#### Get All Conversations
```http
GET /api/chats
```

**Description**: Retrieve all customer conversations

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "chat_123",
      "customerId": "customer_456",
      "customerName": "John Doe",
      "customerPhone": "+1234567890",
      "lastMessage": "Hello, I want to exchange currency",
      "lastMessageTime": "2024-01-15T10:30:00Z",
      "status": "active",
      "unreadCount": 2,
      "createdAt": "2024-01-15T09:00:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### Get Conversation Details
```http
GET /api/chats/{chatId}
```

**Parameters**:
- `chatId` (string): Unique conversation identifier

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "chat_123",
    "customer": {
      "id": "customer_456",
      "name": "John Doe",
      "phone": "+1234567890",
      "joinedAt": "2024-01-15T09:00:00Z"
    },
    "messages": [
      {
        "id": "msg_789",
        "content": "Hello, I want to exchange currency",
        "sender": "customer",
        "timestamp": "2024-01-15T10:30:00Z",
        "status": "delivered",
        "type": "text"
      },
      {
        "id": "msg_790",
        "content": "Hello! I can help you with currency exchange. What currencies would you like to exchange?",
        "sender": "bot",
        "timestamp": "2024-01-15T10:31:00Z",
        "status": "sent",
        "type": "text"
      }
    ],
    "status": "active",
    "createdAt": "2024-01-15T09:00:00Z",
    "updatedAt": "2024-01-15T10:31:00Z"
  }
}
```

#### Send Message
```http
POST /api/chats/{chatId}/messages
```

**Request Body**:
```json
{
  "content": "Thank you for your inquiry. Let me help you with that.",
  "type": "text",
  "sender": "admin"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "msg_791",
    "content": "Thank you for your inquiry. Let me help you with that.",
    "sender": "admin",
    "timestamp": "2024-01-15T10:32:00Z",
    "status": "sent",
    "type": "text"
  }
}
```

### Transaction Management

#### Get All Transactions
```http
GET /api/transactions
```

**Query Parameters**:
- `status` (optional): Filter by transaction status
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Pagination offset (default: 0)
- `sortBy` (optional): Sort field (default: createdAt)
- `sortOrder` (optional): asc or desc (default: desc)

**Response**:
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "txn_123",
        "customerId": "customer_456",
        "customerName": "John Doe",
        "customerPhone": "+1234567890",
        "fromCurrency": "USD",
        "toCurrency": "EUR",
        "amount": 1000,
        "exchangeRate": 0.85,
        "convertedAmount": 850,
        "status": "pending",
        "createdAt": "2024-01-15T10:00:00Z",
        "updatedAt": "2024-01-15T10:00:00Z",
        "chatId": "chat_123"
      }
    ],
    "pagination": {
      "total": 150,
      "limit": 50,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

#### Get Transaction Details
```http
GET /api/transactions/{transactionId}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "txn_123",
    "customer": {
      "id": "customer_456",
      "name": "John Doe",
      "phone": "+1234567890"
    },
    "fromCurrency": "USD",
    "toCurrency": "EUR",
    "amount": 1000,
    "exchangeRate": 0.85,
    "convertedAmount": 850,
    "status": "pending",
    "statusHistory": [
      {
        "status": "pending",
        "timestamp": "2024-01-15T10:00:00Z",
        "note": "Transaction initiated"
      }
    ],
    "bankDetails": {
      "accountName": "Admin Account",
      "accountNumber": "1234567890",
      "bankName": "Example Bank"
    },
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z",
    "chatId": "chat_123"
  }
}
```

#### Update Transaction Status
```http
PUT /api/transactions/{transactionId}/status
```

**Request Body**:
```json
{
  "status": "completed",
  "note": "Payment processed successfully"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "txn_123",
    "status": "completed",
    "updatedAt": "2024-01-15T11:00:00Z"
  }
}
```

#### Create Transaction
```http
POST /api/transactions
```

**Request Body**:
```json
{
  "customerId": "customer_456",
  "fromCurrency": "USD",
  "toCurrency": "EUR",
  "amount": 1000,
  "exchangeRate": 0.85,
  "chatId": "chat_123"
}
```

### Exchange Rates

#### Get All Exchange Rates
```http
GET /api/rates
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "rate_123",
      "fromCurrency": "USD",
      "toCurrency": "EUR",
      "buyRate": 0.85,
      "sellRate": 0.83,
      "isActive": true,
      "lastUpdated": "2024-01-15T09:00:00Z",
      "validUntil": "2024-01-15T18:00:00Z"
    }
  ]
}
```

#### Update Exchange Rate
```http
PUT /api/rates/{rateId}
```

**Request Body**:
```json
{
  "buyRate": 0.86,
  "sellRate": 0.84,
  "isActive": true,
  "validUntil": "2024-01-16T18:00:00Z"
}
```

#### Create Exchange Rate
```http
POST /api/rates
```

**Request Body**:
```json
{
  "fromCurrency": "GBP",
  "toCurrency": "USD",
  "buyRate": 1.25,
  "sellRate": 1.23,
  "isActive": true,
  "validUntil": "2024-01-16T18:00:00Z"
}
```

### Bank Details

#### Get Bank Details
```http
GET /api/bank-details
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "bank_123",
      "accountName": "Admin Account",
      "accountNumber": "1234567890",
      "bankName": "Example Bank",
      "routingNumber": "987654321",
      "swiftCode": "EXAMPLEXXX",
      "accountType": "checking",
      "currency": "USD",
      "isDefault": true,
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

#### Update Bank Details
```http
PUT /api/bank-details/{bankId}
```

**Request Body**:
```json
{
  "accountName": "Updated Admin Account",
  "accountNumber": "1234567890",
  "bankName": "Updated Bank Name",
  "routingNumber": "987654321",
  "swiftCode": "UPDATEDXXX",
  "accountType": "checking",
  "currency": "USD",
  "isDefault": true,
  "isActive": true
}
```

#### Create Bank Account
```http
POST /api/bank-details
```

**Request Body**:
```json
{
  "accountName": "New Admin Account",
  "accountNumber": "9876543210",
  "bankName": "New Bank",
  "routingNumber": "123456789",
  "swiftCode": "NEWBANKXXX",
  "accountType": "savings",
  "currency": "EUR",
  "isDefault": false,
  "isActive": true
}
```

### AI Settings

#### Get AI Instructions
```http
GET /api/ai-settings
```

**Response**:
```json
{
  "success": true,
  "data": {
    "instructions": "You are a helpful currency exchange assistant...",
    "model": "gpt-4",
    "temperature": 0.7,
    "maxTokens": 1000,
    "lastUpdated": "2024-01-15T10:00:00Z"
  }
}
```

#### Update AI Instructions
```http
PUT /api/ai-settings
```

**Request Body**:
```json
{
  "instructions": "Updated AI instructions for currency exchange bot...",
  "model": "gpt-4",
  "temperature": 0.8,
  "maxTokens": 1200
}
```

### WhatsApp Integration

#### Webhook Endpoint
```http
POST /api/whatsapp/webhook
```

**Description**: Receives WhatsApp webhook events

**Request Body** (WhatsApp format):
```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "WHATSAPP_BUSINESS_ACCOUNT_ID",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "PHONE_NUMBER",
              "phone_number_id": "PHONE_NUMBER_ID"
            },
            "messages": [
              {
                "from": "CUSTOMER_PHONE_NUMBER",
                "id": "MESSAGE_ID",
                "timestamp": "TIMESTAMP",
                "text": {
                  "body": "MESSAGE_BODY"
                },
                "type": "text"
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```

#### Send WhatsApp Message
```http
POST /api/whatsapp/send
```

**Request Body**:
```json
{
  "to": "+1234567890",
  "message": "Hello! How can I help you today?",
  "type": "text"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "messageId": "whatsapp_msg_123",
    "status": "sent",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

## WebSocket Events

The application supports real-time updates via WebSocket connections.

### Connection
```javascript
const socket = new WebSocket('ws://localhost:3000/api/ws');
```

### Events

#### New Message
```json
{
  "type": "new_message",
  "data": {
    "chatId": "chat_123",
    "message": {
      "id": "msg_789",
      "content": "Hello!",
      "sender": "customer",
      "timestamp": "2024-01-15T10:30:00Z"
    }
  }
}
```

#### Transaction Update
```json
{
  "type": "transaction_update",
  "data": {
    "transactionId": "txn_123",
    "status": "completed",
    "timestamp": "2024-01-15T11:00:00Z"
  }
}
```

#### Rate Update
```json
{
  "type": "rate_update",
  "data": {
    "rateId": "rate_123",
    "fromCurrency": "USD",
    "toCurrency": "EUR",
    "newRate": 0.86,
    "timestamp": "2024-01-15T12:00:00Z"
  }
}
```

## Rate Limiting

### Limits
- **General API**: 1000 requests per hour per IP
- **WhatsApp Webhook**: 10000 requests per hour
- **WebSocket**: 100 connections per IP

### Headers
Rate limit information is included in response headers:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642248000
```

## Examples

### JavaScript/Node.js

#### Fetch Conversations
```javascript
const response = await fetch('/api/chats', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data.data); // Array of conversations
```

#### Update Transaction Status
```javascript
const updateTransaction = async (transactionId, status) => {
  const response = await fetch(`/api/transactions/${transactionId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      status: status,
      note: 'Status updated via API'
    })
  });
  
  return await response.json();
};
```

#### WebSocket Connection
```javascript
const socket = new WebSocket('ws://localhost:3000/api/ws');

socket.onopen = () => {
  console.log('Connected to WebSocket');
};

socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
  
  switch(data.type) {
    case 'new_message':
      // Handle new message
      break;
    case 'transaction_update':
      // Handle transaction update
      break;
    case 'rate_update':
      // Handle rate update
      break;
  }
};
```

### Python

#### Using requests library
```python
import requests
import json

# Get all transactions
response = requests.get('http://localhost:3000/api/transactions')
data = response.json()

if data['success']:
    transactions = data['data']['transactions']
    print(f"Found {len(transactions)} transactions")

# Update transaction status
def update_transaction_status(transaction_id, status):
    url = f'http://localhost:3000/api/transactions/{transaction_id}/status'
    payload = {
        'status': status,
        'note': 'Updated via Python script'
    }
    
    response = requests.put(url, json=payload)
    return response.json()
```

### cURL Examples

#### Get Conversations
```bash
curl -X GET http://localhost:3000/api/chats \
  -H "Content-Type: application/json"
```

#### Update Exchange Rate
```bash
curl -X PUT http://localhost:3000/api/rates/rate_123 \
  -H "Content-Type: application/json" \
  -d '{
    "buyRate": 0.86,
    "sellRate": 0.84,
    "isActive": true
  }'
```

#### Create Bank Account
```bash
curl -X POST http://localhost:3000/api/bank-details \
  -H "Content-Type: application/json" \
  -d '{
    "accountName": "New Account",
    "accountNumber": "1234567890",
    "bankName": "Example Bank",
    "currency": "USD",
    "isActive": true
  }'
```

---

*This API documentation is automatically generated and updated. For the latest information, please refer to the source code or contact the development team.*