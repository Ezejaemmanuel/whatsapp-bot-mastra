# Deployment Guide

## Table of Contents
- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Local Development](#local-development)
- [Production Deployment](#production-deployment)
  - [Vercel Deployment](#vercel-deployment)
  - [Docker Deployment](#docker-deployment)
  - [Traditional Server Deployment](#traditional-server-deployment)
- [Database Setup](#database-setup)
- [WhatsApp Business API Setup](#whatsapp-business-api-setup)
- [Environment Variables](#environment-variables)
- [SSL/HTTPS Configuration](#sslhttps-configuration)
- [Monitoring and Logging](#monitoring-and-logging)
- [Backup and Recovery](#backup-and-recovery)
- [Troubleshooting](#troubleshooting)
- [Performance Optimization](#performance-optimization)
- [Security Considerations](#security-considerations)

## Overview

This guide covers the complete deployment process for the WhatsApp Currency Exchange Bot, from local development to production deployment. The application is built with Next.js and can be deployed on various platforms.

### Architecture Overview
- **Frontend**: Next.js React application
- **Backend**: Next.js API routes
- **Database**: SQLite (development) / PostgreSQL (production)
- **AI Integration**: Mastra AI framework
- **WhatsApp**: Meta WhatsApp Business API
- **Real-time**: WebSocket connections

## Prerequisites

### System Requirements
- **Node.js**: Version 18.0 or higher
- **pnpm**: Package manager (recommended)
- **Git**: Version control
- **Database**: SQLite (dev) or PostgreSQL (prod)

### Development Tools
- **Code Editor**: VS Code (recommended)
- **Terminal**: Command line interface
- **Browser**: Modern web browser for testing

### External Services
- **WhatsApp Business Account**: For messaging
- **Meta Developer Account**: For API access
- **AI Service**: OpenAI or compatible API
- **Domain**: For production deployment
- **SSL Certificate**: For HTTPS (production)

## Environment Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd whatsapp-bot-mastra
```

### 2. Install Dependencies
```bash
# Install pnpm if not already installed
npm install -g pnpm

# Install project dependencies
pnpm install
```

### 3. Environment Configuration
Create environment files:

```bash
# Development environment
cp .env.example .env.local

# Production environment
cp .env.example .env.production
```

## Local Development

### 1. Database Setup
```bash
# Initialize database
pnpm run db:setup

# Run migrations
pnpm run db:migrate

# Seed initial data (optional)
pnpm run db:seed
```

### 2. Start Development Server
```bash
# Start the development server
pnpm run dev

# The application will be available at:
# http://localhost:3000
```

### 3. Development Workflow
```bash
# Run tests
pnpm run test

# Run linting
pnpm run lint

# Type checking
pnpm run type-check

# Build for production (testing)
pnpm run build
```

### 4. Local WhatsApp Testing
For local WhatsApp webhook testing:

```bash
# Install ngrok for local tunneling
npm install -g ngrok

# Expose local server
ngrok http 3000

# Use the ngrok URL for WhatsApp webhook configuration
```

## Production Deployment

### Vercel Deployment

#### 1. Prepare for Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login
```

#### 2. Configure Vercel
Create `vercel.json`:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/api/whatsapp/webhook",
      "dest": "/api/whatsapp/webhook"
    },
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

#### 3. Deploy to Vercel
```bash
# Deploy
vercel

# Set environment variables
vercel env add WHATSAPP_ACCESS_TOKEN
vercel env add WHATSAPP_VERIFY_TOKEN
vercel env add DATABASE_URL
vercel env add OPENAI_API_KEY

# Deploy with environment variables
vercel --prod
```

### Docker Deployment

#### 1. Create Dockerfile
```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Install pnpm
RUN npm install -g pnpm

# Build the application
RUN pnpm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

#### 2. Create Docker Compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - WHATSAPP_ACCESS_TOKEN=${WHATSAPP_ACCESS_TOKEN}
      - WHATSAPP_VERIFY_TOKEN=${WHATSAPP_VERIFY_TOKEN}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=whatsapp_bot
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
```

#### 3. Deploy with Docker
```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Traditional Server Deployment

#### 1. Server Setup (Ubuntu/Debian)
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
npm install -g pnpm

# Install PM2 for process management
npm install -g pm2

# Install Nginx
sudo apt install nginx -y

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y
```

#### 2. Application Deployment
```bash
# Clone and setup application
git clone <repository-url> /var/www/whatsapp-bot
cd /var/www/whatsapp-bot

# Install dependencies
pnpm install

# Build application
pnpm run build

# Setup environment
cp .env.example .env.production
# Edit .env.production with production values

# Start with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save
pm2 startup
```

#### 3. PM2 Configuration
Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'whatsapp-bot',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/whatsapp-bot',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/whatsapp-bot/error.log',
    out_file: '/var/log/whatsapp-bot/out.log',
    log_file: '/var/log/whatsapp-bot/combined.log',
    time: true
  }]
};
```

## Database Setup

### PostgreSQL Setup

#### 1. Install PostgreSQL
```bash
# Ubuntu/Debian
sudo apt install postgresql postgresql-contrib

# macOS
brew install postgresql

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### 2. Create Database
```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE whatsapp_bot;
CREATE USER bot_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE whatsapp_bot TO bot_user;
\q
```

#### 3. Configure Connection
Update `.env.production`:
```env
DATABASE_URL="postgresql://bot_user:secure_password@localhost:5432/whatsapp_bot"
```

#### 4. Run Migrations
```bash
# Run database migrations
pnpm run db:migrate

# Seed initial data
pnpm run db:seed
```

## WhatsApp Business API Setup

### 1. Meta Developer Account
1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create a developer account
3. Create a new app
4. Add WhatsApp Business API product

### 2. WhatsApp Business Account
1. Set up WhatsApp Business Account
2. Verify your business
3. Add phone number
4. Get access token and verify token

### 3. Webhook Configuration
1. Set webhook URL: `https://yourdomain.com/api/whatsapp/webhook`
2. Set verify token (same as in environment variables)
3. Subscribe to message events

### 4. Environment Variables
```env
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_VERIFY_TOKEN=your_verify_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id
```

## Environment Variables

### Complete Environment Configuration

#### Development (.env.local)
```env
# Application
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database
DATABASE_URL="file:./dev.db"

# WhatsApp
WHATSAPP_ACCESS_TOKEN=your_dev_access_token
WHATSAPP_VERIFY_TOKEN=your_verify_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id

# AI
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4

# Security
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# Logging
LOG_LEVEL=debug
```

#### Production (.env.production)
```env
# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://yourdomain.com
PORT=3000

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/whatsapp_bot"

# WhatsApp
WHATSAPP_ACCESS_TOKEN=your_prod_access_token
WHATSAPP_VERIFY_TOKEN=your_verify_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id

# AI
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4

# Security
NEXTAUTH_SECRET=your_production_nextauth_secret
NEXTAUTH_URL=https://yourdomain.com

# Logging
LOG_LEVEL=info

# Performance
NEXT_TELEMETRY_DISABLED=1
```

## SSL/HTTPS Configuration

### Nginx Configuration
Create `/etc/nginx/sites-available/whatsapp-bot`:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/ssl/certs/yourdomain.com.crt;
    ssl_certificate_key /etc/ssl/private/yourdomain.com.key;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WhatsApp webhook specific configuration
    location /api/whatsapp/webhook {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Let's Encrypt SSL
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Monitoring and Logging

### 1. Application Monitoring
```bash
# PM2 monitoring
pm2 monit

# View logs
pm2 logs whatsapp-bot

# Restart application
pm2 restart whatsapp-bot
```

### 2. System Monitoring
```bash
# Install monitoring tools
sudo apt install htop iotop nethogs

# Monitor system resources
htop

# Monitor disk usage
df -h

# Monitor network
netstat -tulpn
```

### 3. Log Management
Create log rotation configuration:
```bash
# /etc/logrotate.d/whatsapp-bot
/var/log/whatsapp-bot/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reload whatsapp-bot
    endscript
}
```

## Backup and Recovery

### 1. Database Backup
```bash
# Create backup script
#!/bin/bash
# /usr/local/bin/backup-db.sh

DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/var/backups/whatsapp-bot"
DB_NAME="whatsapp_bot"

mkdir -p $BACKUP_DIR

# PostgreSQL backup
pg_dump $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/db_backup_$DATE.sql

# Remove backups older than 30 days
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

echo "Backup completed: db_backup_$DATE.sql.gz"
```

### 2. Application Backup
```bash
# Create application backup script
#!/bin/bash
# /usr/local/bin/backup-app.sh

DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/var/backups/whatsapp-bot"
APP_DIR="/var/www/whatsapp-bot"

mkdir -p $BACKUP_DIR

# Backup application files
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz -C $APP_DIR .

# Remove backups older than 7 days
find $BACKUP_DIR -name "app_backup_*.tar.gz" -mtime +7 -delete

echo "Application backup completed: app_backup_$DATE.tar.gz"
```

### 3. Automated Backups
```bash
# Add to crontab
sudo crontab -e

# Daily database backup at 2 AM
0 2 * * * /usr/local/bin/backup-db.sh

# Weekly application backup on Sunday at 3 AM
0 3 * * 0 /usr/local/bin/backup-app.sh
```

## Troubleshooting

### Common Issues

#### 1. Application Won't Start
```bash
# Check logs
pm2 logs whatsapp-bot

# Check port availability
sudo netstat -tulpn | grep :3000

# Check environment variables
pm2 env whatsapp-bot

# Restart application
pm2 restart whatsapp-bot
```

#### 2. Database Connection Issues
```bash
# Test database connection
psql -h localhost -U bot_user -d whatsapp_bot

# Check PostgreSQL status
sudo systemctl status postgresql

# Check database logs
sudo tail -f /var/log/postgresql/postgresql-*.log
```

#### 3. WhatsApp Webhook Issues
```bash
# Test webhook endpoint
curl -X GET https://yourdomain.com/api/whatsapp/webhook?hub.verify_token=your_token&hub.challenge=test

# Check webhook logs
pm2 logs whatsapp-bot | grep webhook

# Verify SSL certificate
ssl-cert-check -c yourdomain.com
```

#### 4. Performance Issues
```bash
# Monitor system resources
htop

# Check application performance
pm2 monit

# Analyze slow queries (PostgreSQL)
psql -d whatsapp_bot -c "SELECT query, mean_time, calls FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"
```

### Debug Mode
Enable debug mode for troubleshooting:
```env
# Add to environment variables
DEBUG=*
LOG_LEVEL=debug
NODE_ENV=development
```

## Performance Optimization

### 1. Application Optimization
```javascript
// next.config.js
module.exports = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client']
  },
  images: {
    domains: ['example.com']
  },
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  httpAgentOptions: {
    keepAlive: true
  }
};
```

### 2. Database Optimization
```sql
-- Add database indexes
CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM transactions WHERE status = 'pending';
```

### 3. Caching Strategy
```javascript
// Implement Redis caching
const redis = require('redis');
const client = redis.createClient();

// Cache exchange rates
const cacheExchangeRates = async (rates) => {
  await client.setex('exchange_rates', 3600, JSON.stringify(rates));
};

// Get cached rates
const getCachedRates = async () => {
  const cached = await client.get('exchange_rates');
  return cached ? JSON.parse(cached) : null;
};
```

### 4. Load Balancing
```nginx
# Nginx load balancing
upstream whatsapp_bot {
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
}

server {
    location / {
        proxy_pass http://whatsapp_bot;
    }
}
```

## Security Considerations

### 1. Environment Security
```bash
# Secure environment files
chmod 600 .env.production
chown root:root .env.production

# Use secrets management
# Consider using HashiCorp Vault or AWS Secrets Manager
```

### 2. Network Security
```bash
# Configure firewall
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw deny 3000  # Don't expose app port directly
```

### 3. Application Security
```javascript
// Implement rate limiting
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

// Apply to webhook endpoint
app.use('/api/whatsapp/webhook', limiter);
```

### 4. Data Protection
```javascript
// Encrypt sensitive data
const crypto = require('crypto');

const encrypt = (text) => {
  const cipher = crypto.createCipher('aes-256-cbc', process.env.ENCRYPTION_KEY);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};

const decrypt = (encryptedText) => {
  const decipher = crypto.createDecipher('aes-256-cbc', process.env.ENCRYPTION_KEY);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};
```

---

*This deployment guide covers comprehensive setup and deployment strategies. Always test deployments in staging environments before production releases.*