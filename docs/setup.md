# Setup and Installation Guide

## Table of Contents
- [Prerequisites](#prerequisites)
- [Installation Steps](#installation-steps)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [WhatsApp API Setup](#whatsapp-api-setup)
- [AI Services Setup](#ai-services-setup)
- [Development Environment](#development-environment)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)
- [Verification Steps](#verification-steps)

## Prerequisites

### System Requirements
- **Node.js**: Version 18.0 or higher
- **pnpm**: Version 8.0 or higher (package manager)
- **Git**: Version 2.0 or higher
- **Operating System**: Windows, macOS, or Linux

### Required Accounts
1. **Convex Account**: For real-time database ([convex.dev](https://convex.dev/))
2. **Meta for Developers Account**: For WhatsApp Business API ([developers.facebook.com](https://developers.facebook.com/))
3. **Google Cloud Account**: For Gemini AI API ([ai.google.dev](https://ai.google.dev/))
4. **UploadThing Account**: For media storage ([uploadthing.com](https://uploadthing.com/)) (optional)

### Development Tools (Recommended)
- **VS Code**: Visual Studio Code with TypeScript extension
- **Git**: For version control
- **Postman**: For API testing
- **Docker**: For containerized deployment (optional)

## Installation Steps

### 1. Clone the Repository

```bash
# Clone the repository
git clone <repository-url>
cd whatsapp-bot-mastra

# Install dependencies
pnpm install
```

### 2. Verify Installation

```bash
# Check Node.js version
node --version  # Should be 18.0 or higher

# Check pnpm version
pnpm --version  # Should be 8.0 or higher

# Run development server (should start without errors)
pnpm dev
```

## Environment Configuration

### 1. Create Environment Files

```bash
# Copy environment template
cp .env.example .env.local

# Copy for production if needed
cp .env.example .env.production
```

### 2. Configure Environment Variables

Edit `.env.local` with your configuration:

```env
# Convex Database Configuration
NEXT_PUBLIC_CONVEX_URL=your_convex_deployment_url

# WhatsApp Business API Configuration
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_VERIFY_TOKEN=your_webhook_verify_token

# AI Services Configuration
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key

# Optional Services
UPLOADTHING_TOKEN=your_uploadthing_token
```

### 3. Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NEXT_PUBLIC_CONVEX_URL` | ✅ | Convex database deployment URL | `https://polite-lark-123.convex.cloud` |
| `WHATSAPP_ACCESS_TOKEN` | ✅ | WhatsApp Business API access token | `EAAJxxxxx...` |
| `WHATSAPP_PHONE_NUMBER_ID` | ✅ | WhatsApp phone number ID | `123456789012345` |
| `WHATSAPP_VERIFY_TOKEN` | ✅ | Webhook verification token | `your_custom_verify_token` |
| `GOOGLE_GENERATIVE_AI_API_KEY` | ✅ | Google Gemini API key | `AIzaSyxxxxx...` |
| `UPLOADTHING_TOKEN` | ❌ | UploadThing media storage token | `sk_live_xxxxxx...` |

## Database Setup

### 1. Convex Database Initialization

```bash
# Login to Convex
npx convex login

# Initialize project
npx convex dev
```

### 2. Deploy Database Schema

```bash
# Deploy schema to development
npx convex deploy

# Verify deployment
npx convex dashboard
```

### 3. Seed Database with Sample Data

```bash
# Method 1: Using web interface
# 1. Start development server: pnpm dev
# 2. Visit: http://localhost:3000/test
# 3. Click "Seed Database with Sample Data"

# Method 2: Using API endpoint
curl http://localhost:3000/api/seed
```

### 4. Verify Database Setup

```bash
# Check Convex functions
npx convex run

# View database dashboard
npx convex dashboard
```

## WhatsApp API Setup

### 1. Create Meta App

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create a new app
3. Select "Business" app type
4. Add "WhatsApp" product to your app

### 2. Configure WhatsApp Business

1. **Get Phone Number ID**:
   - Navigate to WhatsApp → Getting Started
   - Copy the Phone Number ID from the "From" field

2. **Get Access Token**:
   - Go to WhatsApp → Getting Started
   - Copy your temporary access token (24-hour validity)
   - For permanent token, create a System User with appropriate permissions

3. **Get Business Account ID**:
   - Go to WhatsApp → Configuration
   - Copy the WhatsApp Business Account ID (WABA ID)

### 3. Configure Webhook

1. **Set Webhook URL**:
   ```
   https://yourdomain.com/api/webhook
   ```

2. **Verify Webhook**:
   - Add your verify token from environment variables
   - Facebook will send a GET request to verify the webhook

3. **Subscribe to Webhook Fields**:
   - `messages`
   - `message_template_status`
   - `phone_number_status`

### 4. Test WhatsApp Connection

```bash
# Test API connectivity
pnpm diagnose

# Validate configuration
pnpm config:validate
```

## AI Services Setup

### 1. Google Gemini API Setup

1. **Create Google Cloud Project**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project

2. **Enable Gemini API**:
   - Navigate to APIs & Services → Library
   - Search for "Gemini API"
   - Click "Enable"

3. **Create API Key**:
   - Go to APIs & Services → Credentials
   - Create API Key
   - Copy the API key

4. **Configure Quotas**:
   - Set appropriate usage limits
   - Monitor usage in Google Cloud Console

### 2. Verify AI Integration

```bash
# Test AI services
curl -X POST https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $GOOGLE_GENERATIVE_AI_API_KEY" \
  -d '{"contents":[{"parts":[{"text":"Hello!"}]}]}'
```

## Development Environment

### 1. Start Development Servers

```bash
# Terminal 1: Start Next.js development server
pnpm dev

# Terminal 2: Start Mastra development (if using)
pnpm dev:mastra

# Terminal 3: Start Convex development (if needed)
npx convex dev
```

### 2. Access Development URLs

- **Main Application**: http://localhost:3000
- **Test Interface**: http://localhost:3000/test
- **Convex Dashboard**: Open via `npx convex dashboard`
- **Mastra Playground**: Check Mastra documentation

### 3. Development Workflow

```bash
# 1. Make code changes
# 2. Run linter
pnpm lint

# 3. Fix any linting errors
# 4. Test functionality
# 5. Commit changes
git add .
git commit -m "Descriptive commit message"

# 6. Push to repository
git push origin main
```

### 4. Database Development

```bash
# Generate database types (automatically done by Convex)
npx convex dev

# View database schema
cat convex/schema.ts

# Test database queries
npx convex run
```

## Production Deployment

### 1. Build Application

```bash
# Build for production
pnpm build

# Test production build locally
pnpm start
```

### 2. Deploy Convex Database

```bash
# Deploy to production
npx convex deploy

# Verify production deployment
npx convex dashboard --prod
```

### 3. Deploy to Hosting Platform

#### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel
vercel --prod

# Configure environment variables in Vercel dashboard
```

#### Netlify Deployment

```bash
# Build application
pnpm build

# Deploy to Netlify
netlify deploy --prod --dir=.next
```

### 4. Configure Production Environment

1. **Set Environment Variables**:
   - Add all required variables to your hosting platform
   - Ensure Convex URL points to production deployment

2. **Configure Webhook**:
   - Update WhatsApp webhook URL to production endpoint
   - Verify webhook works in production

3. **Test Production Setup**:
   - Send test messages via WhatsApp
   - Verify admin dashboard works
   - Check transaction processing

### 5. Production Monitoring

```bash
# Monitor Convex functions
npx convex logs --prod

# Check application logs
# Check your hosting platform's logging dashboard
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Issues

**Problem**: Convex connection fails
```bash
Error: Could not connect to Convex
```

**Solution**:
```bash
# Verify Convex URL is correct
echo $NEXT_PUBLIC_CONVEX_URL

# Re-login to Convex
npx convex login

# Check Convex status
npx convex status
```

#### 2. WhatsApp API Issues

**Problem**: WhatsApp API calls fail
```bash
Error: Authentication failed
```

**Solution**:
```bash
# Verify environment variables
echo $WHATSAPP_ACCESS_TOKEN
echo $WHATSAPP_PHONE_NUMBER_ID

# Test WhatsApp connection
pnpm diagnose

# Regenerate access token if expired
```

#### 3. AI Service Issues

**Problem**: Gemini API calls fail
```bash
Error: API key invalid or quota exceeded
```

**Solution**:
```bash
# Verify API key
echo $GOOGLE_GENERATIVE_AI_API_KEY

# Check quotas in Google Cloud Console
# Regenerate API key if needed
```

#### 4. Build Errors

**Problem**: Next.js build fails
```bash
Error: Type error or build failure
```

**Solution**:
```bash
# Check TypeScript errors
pnpm build

# Run linter
pnpm lint

# Clear Next.js cache
rm -rf .next
pnpm build
```

#### 5. Port Conflicts

**Problem**: Port 3000 already in use
```bash
Error: Port 3000 is already in use
```

**Solution**:
```bash
# Find process using port 3000
lsof -ti:3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows

# Or use different port
PORT=3001 pnpm dev
```

### Debug Commands

```bash
# Validate configuration
pnpm config:validate

# Test API connectivity
pnpm diagnose

# Check Convex functions
npx convex run

# View Convex logs
npx convex logs

# Test WhatsApp webhook
curl -X POST http://localhost:3000/api/health
```

### Log Locations

- **Application Logs**: Console output during development
- **Convex Logs**: `npx convex logs`
- **Production Logs**: Your hosting platform's logging dashboard
- **WhatsApp API Logs**: Meta for Developers dashboard

## Verification Steps

### 1. Database Verification

```bash
# Check Convex connection
npx convex status

# List database tables
npx convex dashboard

# Test sample data
curl http://localhost:3000/api/seed
```

### 2. WhatsApp Integration Verification

```bash
# Test webhook endpoint
curl http://localhost:3000/api/health

# Send test message via WhatsApp
# Check if message appears in admin dashboard

# Verify message processing
# Check Convex for new records
```

### 3. AI Services Verification

```bash
# Test Gemini API
curl -H "Authorization: Bearer $GOOGLE_GENERATIVE_AI_API_KEY" \
     https://generativelanguage.googleapis.com/v1beta/models

# Test AI integration in app
# Send a message that requires AI processing
```

### 4. Complete System Test

1. **Start all services**:
   ```bash
   pnpm dev
   npx convex dev
   ```

2. **Access application**: http://localhost:3000

3. **Test key features**:
   - View conversations in admin dashboard
   - Send test WhatsApp message
   - Process a transaction
   - Verify real-time updates

4. **Check error handling**:
   - Send invalid data
   - Test rate limiting
   - Verify error messages

### 5. Production Readiness Checklist

- [ ] All environment variables set in production
- [ ] Convex database deployed to production
- [ ] Application builds successfully
- [ ] WhatsApp webhook configured for production URL
- [ ] AI services working with production keys
- [ ] Database seeded with production data (if needed)
- [ ] SSL/TLS certificates configured
- [ ] Monitoring and logging set up
- [ ] Backup and recovery procedures tested
- [ ] Performance under load tested

---

This comprehensive setup guide should help you successfully install, configure, and deploy the KhalidWid WhatsApp Bot system. If you encounter any issues not covered here, please check the troubleshooting section or refer to the main README.md for additional support resources.