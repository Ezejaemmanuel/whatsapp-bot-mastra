# Setup and Installation Guide

## Table of Contents
- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Installation Steps](#installation-steps)
- [Configuration](#configuration)
- [Database Setup](#database-setup)
- [WhatsApp Integration](#whatsapp-integration)
- [AI Configuration](#ai-configuration)
- [Development Environment](#development-environment)
- [Testing](#testing)
- [Common Issues](#common-issues)
- [Next Steps](#next-steps)

## Quick Start

Get the WhatsApp Currency Exchange Bot running in under 10 minutes:

```bash
# 1. Clone the repository
git clone <repository-url>
cd whatsapp-bot-mastra

# 2. Install dependencies
pnpm install

# 3. Setup environment
cp .env.example .env.local
# Edit .env.local with your configuration

# 4. Initialize database
pnpm run db:setup

# 5. Start development server
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Prerequisites

### System Requirements

#### Minimum Requirements
- **Operating System**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 18.04+)
- **Node.js**: Version 18.0 or higher
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 2GB free space
- **Internet**: Stable connection for API calls

#### Recommended Setup
- **Node.js**: Latest LTS version (20.x)
- **Package Manager**: pnpm (faster than npm/yarn)
- **Code Editor**: VS Code with recommended extensions
- **Terminal**: Modern terminal with shell support

### Required Accounts

1. **Meta Developer Account**
   - For WhatsApp Business API access
   - Free registration at [developers.facebook.com](https://developers.facebook.com)

2. **WhatsApp Business Account**
   - Required for messaging capabilities
   - Verify your business information

3. **OpenAI Account** (or compatible AI service)
   - For AI-powered conversation handling
   - API key required

4. **Database Service** (Production)
   - PostgreSQL recommended for production
   - SQLite included for development

## Installation Steps

### Step 1: Install Node.js

#### Windows
1. Download Node.js from [nodejs.org](https://nodejs.org)
2. Run the installer and follow the setup wizard
3. Verify installation:
   ```cmd
   node --version
   npm --version
   ```

#### macOS
```bash
# Using Homebrew (recommended)
brew install node

# Or download from nodejs.org
# Verify installation
node --version
npm --version
```

#### Linux (Ubuntu/Debian)
```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### Step 2: Install pnpm

```bash
# Install pnpm globally
npm install -g pnpm

# Verify installation
pnpm --version
```

### Step 3: Clone Repository

```bash
# Clone the repository
git clone <repository-url>
cd whatsapp-bot-mastra

# Verify project structure
ls -la
```

### Step 4: Install Dependencies

```bash
# Install all project dependencies
pnpm install

# This will install:
# - Next.js framework
# - React components
# - Database tools
# - AI integration libraries
# - WhatsApp API clients
# - Development tools
```

### Step 5: Environment Setup

```bash
# Copy environment template
cp .env.example .env.local

# Open for editing
# Windows: notepad .env.local
# macOS: open .env.local
# Linux: nano .env.local
```

## Configuration

### Environment Variables

Edit `.env.local` with your specific configuration:

```env
# ===========================================
# APPLICATION CONFIGURATION
# ===========================================
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
PORT=3000

# ===========================================
# DATABASE CONFIGURATION
# ===========================================
# Development (SQLite)
DATABASE_URL="file:./dev.db"

# Production (PostgreSQL)
# DATABASE_URL="postgresql://username:password@localhost:5432/whatsapp_bot"

# ===========================================
# WHATSAPP BUSINESS API
# ===========================================
# Get these from Meta Developer Console
WHATSAPP_ACCESS_TOKEN=your_access_token_here
WHATSAPP_VERIFY_TOKEN=your_verify_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id

# Webhook URL (for production)
WHATSAPP_WEBHOOK_URL=https://yourdomain.com/api/whatsapp/webhook

# ===========================================
# AI CONFIGURATION
# ===========================================
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=1000
OPENAI_TEMPERATURE=0.7

# Alternative AI providers (optional)
# ANTHROPIC_API_KEY=your_anthropic_key
# GOOGLE_AI_API_KEY=your_google_ai_key

# ===========================================
# MASTRA AI FRAMEWORK
# ===========================================
MASTRA_API_KEY=your_mastra_api_key
MASTRA_ENVIRONMENT=development

# ===========================================
# SECURITY CONFIGURATION
# ===========================================
# Generate with: openssl rand -base64 32
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000

# Encryption key for sensitive data
ENCRYPTION_KEY=your_encryption_key_here

# ===========================================
# EXTERNAL SERVICES
# ===========================================
# Exchange rate API (optional)
EXCHANGE_RATE_API_KEY=your_exchange_api_key

# File upload service (optional)
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret

# ===========================================
# LOGGING AND MONITORING
# ===========================================
LOG_LEVEL=debug
ENABLE_LOGGING=true

# Sentry for error tracking (optional)
SENTRY_DSN=your_sentry_dsn

# ===========================================
# DEVELOPMENT SETTINGS
# ===========================================
# Disable telemetry for faster builds
NEXT_TELEMETRY_DISABLED=1

# Enable detailed error messages
DETAILED_ERRORS=true
```

### Configuration Validation

Run the configuration validator:

```bash
# Check if all required environment variables are set
pnpm run config:validate

# Test external service connections
pnpm run config:test
```

## Database Setup

### Development Database (SQLite)

For local development, SQLite is used by default:

```bash
# Initialize database
pnpm run db:setup

# This will:
# 1. Create SQLite database file
# 2. Run all migrations
# 3. Create necessary tables
# 4. Set up indexes

# Verify database setup
pnpm run db:status
```

### Database Operations

```bash
# Run migrations
pnpm run db:migrate

# Seed initial data
pnpm run db:seed

# Reset database (development only)
pnpm run db:reset

# Generate database client
pnpm run db:generate

# View database in browser
pnpm run db:studio
```

### Production Database (PostgreSQL)

For production, set up PostgreSQL:

#### Install PostgreSQL

**Windows:**
1. Download from [postgresql.org](https://www.postgresql.org/download/windows/)
2. Run installer and follow setup wizard
3. Remember the password for postgres user

**macOS:**
```bash
# Using Homebrew
brew install postgresql
brew services start postgresql
```

**Linux:**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### Create Database

```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE whatsapp_bot;
CREATE USER bot_user WITH PASSWORD 'secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE whatsapp_bot TO bot_user;
\q
```

#### Update Environment

```env
# Update .env.local or .env.production
DATABASE_URL="postgresql://bot_user:secure_password_here@localhost:5432/whatsapp_bot"
```

## WhatsApp Integration

### Step 1: Meta Developer Setup

1. **Create Developer Account**
   - Go to [developers.facebook.com](https://developers.facebook.com)
   - Sign up or log in with Facebook account
   - Complete developer verification

2. **Create New App**
   - Click "Create App"
   - Select "Business" as app type
   - Fill in app details:
     - App Name: "WhatsApp Currency Bot"
     - Contact Email: your email
     - Business Account: select or create

3. **Add WhatsApp Product**
   - In app dashboard, click "Add Product"
   - Find "WhatsApp" and click "Set Up"
   - Follow the setup wizard

### Step 2: WhatsApp Business Account

1. **Business Verification**
   - Provide business information
   - Upload required documents
   - Wait for verification (can take 1-3 days)

2. **Phone Number Setup**
   - Add phone number to WhatsApp Business
   - Verify phone number with SMS/call
   - Note the Phone Number ID

### Step 3: Get API Credentials

1. **Access Token**
   - Go to WhatsApp > API Setup
   - Copy the temporary access token
   - For production, create permanent token

2. **Verify Token**
   - Create a random string (e.g., "my_verify_token_123")
   - Use this for webhook verification

3. **Webhook Setup**
   - Webhook URL: `https://yourdomain.com/api/whatsapp/webhook`
   - Verify Token: your chosen verify token
   - Subscribe to: messages, message_deliveries

### Step 4: Test WhatsApp Integration

```bash
# Test webhook endpoint
curl -X GET "http://localhost:3000/api/whatsapp/webhook?hub.verify_token=your_verify_token&hub.challenge=test_challenge"

# Should return: test_challenge

# Test sending message (replace with your values)
curl -X POST "https://graph.facebook.com/v18.0/YOUR_PHONE_NUMBER_ID/messages" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "YOUR_TEST_NUMBER",
    "type": "text",
    "text": {
      "body": "Hello from WhatsApp Bot!"
    }
  }'
```

## AI Configuration

### OpenAI Setup

1. **Create OpenAI Account**
   - Go to [platform.openai.com](https://platform.openai.com)
   - Sign up and verify email
   - Add payment method for API usage

2. **Generate API Key**
   - Go to API Keys section
   - Click "Create new secret key"
   - Copy and save the key securely
   - Add to `.env.local`:
     ```env
     OPENAI_API_KEY=sk-your-api-key-here
     ```

3. **Configure Model Settings**
   ```env
   OPENAI_MODEL=gpt-4  # or gpt-3.5-turbo for lower cost
   OPENAI_MAX_TOKENS=1000
   OPENAI_TEMPERATURE=0.7
   ```

### Mastra AI Framework

1. **Install Mastra CLI**
   ```bash
   npm install -g @mastra/cli
   ```

2. **Initialize Mastra**
   ```bash
   # Initialize Mastra in project
   mastra init
   
   # Configure agents
   mastra agent:create whatsapp-agent
   ```

3. **Configure Agent**
   Edit `mastra/agents/whatsapp-agent.ts`:
   ```typescript
   import { Agent } from '@mastra/core';
   
   export const whatsappAgent = new Agent({
     name: 'WhatsApp Currency Bot',
     instructions: 'You are a helpful currency exchange assistant...',
     model: 'gpt-4',
     tools: [
       // Add your tools here
     ]
   });
   ```

### Test AI Integration

```bash
# Test AI response
pnpm run test:ai

# Test agent functionality
pnpm run test:agent

# Interactive AI testing
pnpm run ai:chat
```

## Development Environment

### Start Development Server

```bash
# Start the development server
pnpm run dev

# The application will be available at:
# http://localhost:3000

# API endpoints available at:
# http://localhost:3000/api/*
```

### Development Tools

```bash
# Type checking
pnpm run type-check

# Linting
pnpm run lint
pnpm run lint:fix

# Code formatting
pnpm run format

# Database studio
pnpm run db:studio

# View logs
pnpm run logs
```

### VS Code Setup

Recommended VS Code extensions:

1. **Install Extensions**
   ```bash
   # Install recommended extensions
   code --install-extension bradlc.vscode-tailwindcss
   code --install-extension esbenp.prettier-vscode
   code --install-extension ms-vscode.vscode-typescript-next
   code --install-extension prisma.prisma
   ```

2. **Workspace Settings**
   Create `.vscode/settings.json`:
   ```json
   {
     "typescript.preferences.importModuleSpecifier": "relative",
     "editor.formatOnSave": true,
     "editor.defaultFormatter": "esbenp.prettier-vscode",
     "tailwindCSS.experimental.classRegex": [
       ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
       ["cx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"],
       ["cn\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
     ]
   }
   ```

### Hot Reload

The development server supports hot reload for:
- React components
- API routes
- CSS/Tailwind changes
- TypeScript files

## Testing

### Run Tests

```bash
# Run all tests
pnpm run test

# Run tests in watch mode
pnpm run test:watch

# Run tests with coverage
pnpm run test:coverage

# Run specific test file
pnpm run test -- --testNamePattern="WhatsApp"
```

### Test Categories

1. **Unit Tests**
   ```bash
   # Test individual components
   pnpm run test:unit
   ```

2. **Integration Tests**
   ```bash
   # Test API endpoints
   pnpm run test:integration
   ```

3. **E2E Tests**
   ```bash
   # Test complete user flows
   pnpm run test:e2e
   ```

### Manual Testing

1. **WhatsApp Webhook**
   - Use ngrok for local testing
   - Send test messages to your WhatsApp number
   - Check logs for proper message handling

2. **Web Interface**
   - Test chat interface at `http://localhost:3000/chat`
   - Test admin dashboard at `http://localhost:3000/dashboard`
   - Test settings page at `http://localhost:3000/settings`

3. **API Endpoints**
   ```bash
   # Test chat API
   curl -X POST http://localhost:3000/api/chat \
     -H "Content-Type: application/json" \
     -d '{"message": "Hello"}'
   
   # Test webhook
   curl -X GET "http://localhost:3000/api/whatsapp/webhook?hub.verify_token=your_token&hub.challenge=test"
   ```

## Common Issues

### Installation Issues

#### Node.js Version Mismatch
```bash
# Check Node.js version
node --version

# If version is < 18, update Node.js
# Use nvm for version management
nvm install 18
nvm use 18
```

#### pnpm Installation Failed
```bash
# Clear npm cache
npm cache clean --force

# Reinstall pnpm
npm uninstall -g pnpm
npm install -g pnpm@latest
```

#### Dependency Installation Failed
```bash
# Clear pnpm cache
pnpm store prune

# Delete node_modules and reinstall
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install
```

### Configuration Issues

#### Environment Variables Not Loading
```bash
# Check if .env.local exists
ls -la .env*

# Verify environment variables
node -e "console.log(process.env.WHATSAPP_ACCESS_TOKEN)"

# Restart development server
pnpm run dev
```

#### Database Connection Failed
```bash
# Check database file (SQLite)
ls -la *.db

# Reset database
pnpm run db:reset
pnpm run db:setup

# Check database status
pnpm run db:status
```

### WhatsApp Integration Issues

#### Webhook Verification Failed
```bash
# Check verify token
echo $WHATSAPP_VERIFY_TOKEN

# Test webhook locally
curl -X GET "http://localhost:3000/api/whatsapp/webhook?hub.verify_token=$WHATSAPP_VERIFY_TOKEN&hub.challenge=test"

# Check webhook logs
pnpm run logs | grep webhook
```

#### Messages Not Received
```bash
# Check WhatsApp webhook subscription
# Verify phone number is added to WhatsApp Business
# Check access token validity
# Review Meta Developer Console for errors
```

### AI Integration Issues

#### OpenAI API Errors
```bash
# Check API key
echo $OPENAI_API_KEY

# Test API connection
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
  https://api.openai.com/v1/models

# Check API usage and billing
# Visit platform.openai.com/usage
```

### Performance Issues

#### Slow Development Server
```bash
# Clear Next.js cache
rm -rf .next

# Disable telemetry
echo "NEXT_TELEMETRY_DISABLED=1" >> .env.local

# Restart with clean cache
pnpm run dev
```

#### Memory Issues
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
pnpm run dev

# Or add to package.json scripts:
# "dev": "NODE_OPTIONS='--max-old-space-size=4096' next dev"
```

## Next Steps

After successful setup:

### 1. Customize Configuration
- Review and update AI instructions
- Configure exchange rate sources
- Set up admin users
- Customize UI themes

### 2. Test Core Features
- Send test messages via WhatsApp
- Test currency exchange flows
- Verify transaction processing
- Check admin dashboard functionality

### 3. Production Preparation
- Set up production database
- Configure production environment variables
- Set up monitoring and logging
- Plan deployment strategy

### 4. Documentation Review
- Read [User Guide](./user-guide.md) for feature overview
- Check [API Documentation](./api-documentation.md) for integration
- Review [Database Schema](./database.md) for data structure
- Study [Agent Documentation](./agent.md) for AI customization

### 5. Development Workflow
```bash
# Daily development routine
git pull origin main
pnpm install  # if package.json changed
pnpm run dev

# Before committing
pnpm run lint
pnpm run test
pnpm run type-check

# Commit changes
git add .
git commit -m "feat: add new feature"
git push origin feature-branch
```

### 6. Get Help

- **Documentation**: Check all docs in `/docs` folder
- **Issues**: Create GitHub issues for bugs
- **Discussions**: Use GitHub discussions for questions
- **Community**: Join project Discord/Slack if available

---

**Congratulations!** 🎉 Your WhatsApp Currency Exchange Bot is now set up and ready for development. Start by testing the basic functionality and then customize it according to your needs.

For deployment to production, see the [Deployment Guide](./deployment-guide.md).