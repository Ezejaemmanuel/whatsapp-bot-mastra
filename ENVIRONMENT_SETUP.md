# WhatsApp Bot Environment Setup Guide

This guide will help you set up all the required environment variables for the WhatsApp bot to work correctly.

## 🚨 Critical Issues Fixed

The errors you're seeing:
- `[WARN] WhatsApp Webhook: Failed to mark message as read`
- `[ERROR] WhatsApp Webhook: Failed to process media file`

These are typically caused by missing or incorrect environment configuration.

## 📋 Required Environment Variables

Create a `.env.local` file in your project root with the following variables:

```bash
# =============================================================================
# WHATSAPP BUSINESS API CONFIGURATION (REQUIRED)
# =============================================================================

# WhatsApp Business API Access Token (starts with EAA)
# Get this from: Meta Business Manager > WhatsApp Business Platform
WHATSAPP_ACCESS_TOKEN=your_access_token_here

# WhatsApp Business Phone Number ID 
# Found in your WhatsApp Business API dashboard
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here

# WhatsApp Business Account ID (WABA ID)
# Found in your WhatsApp Business API dashboard  
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id_here

# =============================================================================
# WEBHOOK CONFIGURATION (REQUIRED)
# =============================================================================

# Webhook verification token (set this to any secure string)
WHATSAPP_VERIFY_TOKEN=your_secure_verify_token_here

# Webhook secret for signature verification (recommended)
WHATSAPP_WEBHOOK_SECRET=your_webhook_secret_here

# WhatsApp API Version (optional, defaults to v23.0)
WHATSAPP_API_VERSION=v23.0

# =============================================================================
# UPLOADTHING CONFIGURATION (REQUIRED FOR MEDIA)
# =============================================================================

# UploadThing token for media file storage
# Get from: https://uploadthing.com/dashboard
UPLOADTHING_TOKEN=your_uploadthing_token_here

# =============================================================================
# DATABASE CONFIGURATION (REQUIRED)
# =============================================================================

# PostgreSQL connection string
DATABASE_URL=postgresql://username:password@localhost:5432/whatsapp_bot
```

## 🔧 Step-by-Step Setup

### 1. WhatsApp Business API Setup

1. Go to [Meta Business Manager](https://business.facebook.com)
2. Navigate to **Business Settings** > **WhatsApp Business Platform**
3. Follow the setup wizard to create your WhatsApp Business Account
4. Get your credentials:
   - **Access Token**: From the API setup page (starts with `EAA`)
   - **Phone Number ID**: From your phone number settings
   - **Business Account ID**: From your account overview

### 2. UploadThing Setup (for media handling)

1. Go to [UploadThing](https://uploadthing.com)
2. Create an account and project
3. Get your **API Token** from the dashboard
4. Add it to your `.env.local` as `UPLOADTHING_TOKEN`

### 3. Database Setup

1. Set up a PostgreSQL database (local or cloud)
2. Add the connection string to `DATABASE_URL`
3. Run database migrations:
   ```bash
   pnpm db:setup
   pnpm db:migrate
   ```

### 4. Webhook Configuration

1. Set `WHATSAPP_VERIFY_TOKEN` to a secure random string
2. In Meta Business Manager, set your webhook URL to:
   ```
   https://yourdomain.com/api/webhook
   ```
3. Use the same verify token you set in your environment

## 🐛 Troubleshooting Common Issues

### "Failed to mark message as read"
- **Cause**: Invalid access token or missing phone number ID
- **Fix**: Verify `WHATSAPP_ACCESS_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` are correct

### "Failed to process media file"
- **Cause**: Missing UploadThing configuration or invalid WhatsApp API credentials
- **Fix**: Verify `UPLOADTHING_TOKEN` is set and WhatsApp API credentials are valid

### Environment Variables Not Loading
- **Cause**: Wrong file name or location
- **Fix**: Ensure file is named `.env.local` (not `.env`) and is in project root

### Invalid Access Token Format
- **Cause**: Wrong token format
- **Fix**: WhatsApp access tokens should start with `EAA`

## 🔍 Verification

After setting up your environment:

1. **Check configuration**:
   ```bash
   pnpm dev
   ```
   Look for: `✅ WhatsApp environment configuration validated successfully`

2. **Test webhook**:
   - Send a message to your WhatsApp Business number
   - Check logs for successful processing

3. **Test media handling**:
   - Send an image/document to your WhatsApp Business number
   - Verify it's processed and stored successfully

## 📝 Environment File Template

Copy this template to `.env.local` and fill in your values:

```bash
# WhatsApp Business API
WHATSAPP_ACCESS_TOKEN=EAA...your_token_here
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_BUSINESS_ACCOUNT_ID=123456789012345
WHATSAPP_VERIFY_TOKEN=your_secure_random_string
WHATSAPP_WEBHOOK_SECRET=your_webhook_secret

# UploadThing
UPLOADTHING_TOKEN=your_uploadthing_token

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/whatsapp_bot

# Optional
WHATSAPP_API_VERSION=v23.0
NODE_ENV=development
```

## 🚀 Next Steps

1. Create your `.env.local` file with the template above
2. Fill in all required values
3. Run `pnpm db:setup` to initialize the database
4. Run `pnpm dev` to start the development server
5. Test your webhook with a WhatsApp message

## 💡 Pro Tips

- **Security**: Never commit your `.env.local` file to version control
- **Testing**: Use WhatsApp Business API Test Numbers for development
- **Monitoring**: Check the console logs for detailed error information
- **Backup**: Keep a backup of your environment configuration

## 📞 Support

If you're still experiencing issues after following this guide:

1. Check the console logs for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure your WhatsApp Business API account is active
4. Test your webhook URL is accessible from the internet 