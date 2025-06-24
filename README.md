# WhatsApp Bot with Mastra & TypeScript API

This project provides a complete WhatsApp Bot solution built with Next.js, Mastra framework, and includes a fully type-safe TypeScript API client for the WhatsApp Cloud API.

## 🚀 Features

- **Next.js Application** - Modern React framework with App Router
- **Mastra Integration** - AI agents, tools, and workflows for WhatsApp automation
- **TypeScript API Client** - Fully type-safe WhatsApp Cloud API client generated from OpenAPI
- **OpenAPI Specification** - Complete API documentation in JSON and YAML formats
- **Automated Conversion** - Scripts to convert Postman collections to OpenAPI and generate TypeScript clients

## 📁 Project Structure

```
whatsapp-bot-mastra/
├── app/                          # Next.js app directory
│   ├── mastra/                   # Mastra configuration
│   │   ├── agents/               # AI agents
│   │   ├── tools/                # Mastra tools
│   │   └── workflows/            # Automation workflows
│   └── page.tsx                  # Main page component
├── src/                          # Source code
│   ├── api/                      # Generated TypeScript API client
│   │   └── Api.ts               # Complete WhatsApp Cloud API client
│   └── whatsapp-client-example.ts # Usage examples and wrapper
├── scripts/                      # Automation scripts
│   ├── convert-postman-to-openapi.js # Postman → OpenAPI converter
│   ├── generate-typescript-api.js     # OpenAPI → TypeScript generator
│   └── README.md                      # Scripts documentation
├── whatsapp-cloud-api-openapi.json   # OpenAPI specification (JSON)
├── whatsapp-cloud-api-openapi.yaml   # OpenAPI specification (YAML)
└── WhatsApp-Cloud-API.postman_collection.json # Original Postman collection
```

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd whatsapp-bot-mastra
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Generate API client** (if not already generated)
   ```bash
   # Convert Postman collection to OpenAPI
   pnpm run convert:postman
   
   # Generate TypeScript API client
   pnpm run generate:api
   ```

## 🚀 Quick Start

### 1. Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### 2. Mastra Development

```bash
pnpm run dev:mastra
```

### 3. Using the WhatsApp API Client

```typescript
import WhatsAppCloudApiClient from './src/whatsapp-client-example';

// Initialize the client
const client = new WhatsAppCloudApiClient({
  accessToken: 'YOUR_WHATSAPP_ACCESS_TOKEN',
  version: 'v23.0'
});

// Send a text message
await client.sendTextMessage({
  phoneNumberId: 'YOUR_PHONE_NUMBER_ID',
  to: 'RECIPIENT_PHONE_NUMBER',
  text: 'Hello from WhatsApp Cloud API!'
});

// Send a template message
await client.sendTemplateMessage({
  phoneNumberId: 'YOUR_PHONE_NUMBER_ID',
  to: 'RECIPIENT_PHONE_NUMBER',
  templateName: 'hello_world',
  languageCode: 'en_US'
});
```

## 📚 API Documentation

### WhatsApp Cloud API Client

The generated TypeScript client provides type-safe access to all WhatsApp Cloud API endpoints:

- **Messages** - Send text, media, template, and interactive messages
- **Media** - Upload, download, and manage media files
- **Business Profile** - Manage business profile information
- **Phone Numbers** - Manage phone number settings
- **Templates** - Create and manage message templates
- **Webhooks** - Subscribe to and manage webhook notifications
- **Flows** - Create and manage WhatsApp Flows

### Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start Next.js development server |
| `pnpm build` | Build the Next.js application |
| `pnpm start` | Start production server |
| `pnpm dev:mastra` | Start Mastra development mode |
| `pnpm build:mastra` | Build Mastra components |
| `pnpm convert:postman` | Convert Postman collection to OpenAPI |
| `pnpm generate:api` | Generate TypeScript API client |

| `pnpm lint` | Run ESLint |

## 🔧 Configuration

### Environment Setup

1. **Copy environment template**
   ```bash
   cp .env.example .env
   ```

2. **Configure required variables**
   Edit `.env` and fill in your WhatsApp configuration:
   ```env
   # Required WhatsApp Configuration
   WHATSAPP_ACCESS_TOKEN=your_access_token_here
   WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
   WHATSAPP_BUSINESS_ACCOUNT_ID=your_waba_id_here
   WHATSAPP_TEST_NUMBER=+1234567890
   
   # Optional Configuration
   WHATSAPP_API_VERSION=v23.0
   WHATSAPP_BASE_URL=https://graph.facebook.com
   ```

3. **Start the application**
   ```bash
   pnpm run dev
   ```
   
   The application will automatically validate environment variables on startup and show descriptive error messages if any are missing.

### WhatsApp Cloud API Setup

1. **Create a Meta App**
   - Go to [Meta for Developers](https://developers.facebook.com/)
   - Create a new app and add WhatsApp product

2. **Get Access Token**
   - Navigate to WhatsApp > Getting Started
   - Copy your temporary access token (24h) or create a permanent system user token

3. **Get Phone Number ID**
   - In WhatsApp > Getting Started
   - Copy the Phone Number ID from the "From" field

4. **Get Business Account ID (WABA ID)**
   - Go to WhatsApp > Configuration
   - Copy the WhatsApp Business Account ID

5. **Configure Webhook** (Optional)
   - Set up webhook URL for receiving messages
   - Configure webhook fields and verification

### Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `WHATSAPP_ACCESS_TOKEN` | ✅ | WhatsApp Business API access token | `EAAxxxxx...` |
| `WHATSAPP_PHONE_NUMBER_ID` | ✅ | Phone number ID from Meta Business | `123456789012345` |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | ✅ | WhatsApp Business Account ID (WABA) | `987654321098765` |
| `WHATSAPP_TEST_NUMBER` | ✅ | Test phone number with country code | `+1234567890` |
| `WHATSAPP_API_VERSION` | ❌ | WhatsApp API version (default: v23.0) | `v23.0` |
| `WHATSAPP_BASE_URL` | ❌ | API base URL (default: Graph API) | `https://graph.facebook.com` |
| `DATABASE_URL` | ❌ | Database connection string | `postgresql://...` |
| `UPLOADTHING_TOKEN` | ❌ | UploadThing token for media storage | `sk_live_...` |

## 🤖 Mastra Integration

This project includes Mastra agents and tools for WhatsApp automation:

- **Weather Agent** - Provides weather information via WhatsApp
- **Weather Tool** - Fetches weather data for locations
- **Weather Workflow** - Automated weather update workflows

## 📖 Examples

### Send Different Message Types

```typescript
// Text message
await client.sendTextMessage({
  phoneNumberId: 'PHONE_NUMBER_ID',
  to: '+1234567890',
  text: 'Hello World!'
});

// Image message
await client.sendMediaMessage({
  phoneNumberId: 'PHONE_NUMBER_ID',
  to: '+1234567890',
  type: 'image',
  mediaId: 'MEDIA_ID',
  caption: 'Check this out!'
});

// Template message with parameters
await client.sendTemplateMessage({
  phoneNumberId: 'PHONE_NUMBER_ID',
  to: '+1234567890',
  templateName: 'order_confirmation',
  languageCode: 'en_US',
  components: [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: 'John Doe' },
        { type: 'text', text: 'ORD-12345' }
      ]
    }
  ]
});
```

### Business Profile Management

```typescript
// Get business profile
const profile = await client.getBusinessProfile({
  phoneNumberId: 'PHONE_NUMBER_ID'
});

// Update business profile
await client.updateBusinessProfile({
  phoneNumberId: 'PHONE_NUMBER_ID',
  profileData: {
    about: 'We provide excellent customer service!',
    email: 'support@company.com',
    websites: ['https://company.com']
  }
});
```

## 🔗 API Reference

The complete API reference is available in the generated OpenAPI specifications:

- **JSON Format**: `whatsapp-cloud-api-openapi.json`
- **YAML Format**: `whatsapp-cloud-api-openapi.yaml`

You can view these in any OpenAPI viewer like Swagger UI or Postman.

## 🧪 Testing

The TypeScript client includes comprehensive type checking and IntelliSense support. All API methods are fully typed with:

- Request parameter validation
- Response type definitions
- Error handling types
- Optional parameter support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **WhatsApp Cloud API**: [Official Documentation](https://developers.facebook.com/docs/whatsapp/cloud-api)
- **Mastra Framework**: [Mastra Documentation](https://mastra.ai)
- **Next.js**: [Next.js Documentation](https://nextjs.org/docs)

## 🙏 Acknowledgments

- **Meta** for the WhatsApp Cloud API
- **@scalar/postman-to-openapi** for the conversion library
- **swagger-typescript-api** for TypeScript generation
- **Mastra** for the AI framework

## 🐛 Troubleshooting

### Common Webhook Errors

#### "Failed to mark message as read"
This warning indicates that the bot cannot mark incoming messages as read. This is usually non-critical but can be fixed:

**Causes:**
- Invalid or expired WhatsApp access token
- Missing phone number ID configuration
- Insufficient API permissions

**Solutions:**
1. Verify your environment configuration:
   ```bash
   pnpm config:validate
   ```
2. Check your WhatsApp Business API token permissions
3. Ensure `WHATSAPP_ACCESS_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` are correct
4. Run diagnostic tests:
   ```bash
   pnpm diagnose
   ```

#### "Failed to process media file"
This error occurs when the bot cannot download and store media files (images, documents, etc.).

**Causes:**
- Missing UploadThing configuration
- Invalid WhatsApp API credentials
- Network connectivity issues

**Solutions:**
1. Configure UploadThing for media storage:
   - Sign up at [UploadThing](https://uploadthing.com)
   - Get your API token
   - Add `UPLOADTHING_TOKEN=your_token` to `.env.local`
2. Verify WhatsApp API permissions include media access
3. Run diagnostic tests:
   ```bash
   pnpm diagnose
   ```

### Configuration Validation

Before running the bot, validate your configuration:

```bash
# Check if all required environment variables are set
pnpm config:validate

# Test API connectivity and permissions
pnpm diagnose

# Initialize database
pnpm db:setup
```

### Environment Setup

If you're missing environment variables, see the comprehensive setup guide:
- Read `ENVIRONMENT_SETUP.md` for detailed instructions
- Use the provided environment template
- Ensure your `.env.local` file is in the project root

### Getting Help

1. **Check logs**: Look at the console output for detailed error messages
2. **Validate config**: Run `pnpm config:validate` to check your setup
3. **Test API**: Run `pnpm diagnose` to test WhatsApp API connectivity
4. **Review setup**: Follow `ENVIRONMENT_SETUP.md` step by step

## 🔧 Development Tools

### Configuration Management
```bash
# Validate environment configuration
pnpm config:validate

# Test WhatsApp API connectivity
pnpm diagnose
```

### Database Management
```bash
# Setup database and run migrations
pnpm db:setup

# Generate new migrations
pnpm db:generate

# Run migrations
pnpm db:migrate

# Open database studio
pnpm db:studio
```
