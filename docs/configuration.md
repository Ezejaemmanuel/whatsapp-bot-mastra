# Configuration Guide

## Table of Contents
- [Overview](#overview)
- [Environment Variables](#environment-variables)
- [Configuration Files](#configuration-files)
- [Database Configuration](#database-configuration)
- [WhatsApp API Configuration](#whatsapp-api-configuration)
- [AI Services Configuration](#ai-services-configuration)
- [Media Storage Configuration](#media-storage-configuration)
- [Development Configuration](#development-configuration)
- [Production Configuration](#production-configuration)
- [Security Configuration](#security-configuration)
- [Validation and Testing](#validation-and-testing)

## Overview

This guide provides detailed information about all configuration options available in the KhalidWid WhatsApp Bot system. Proper configuration is essential for the application to function correctly in both development and production environments.

## Environment Variables

### Required Variables

These variables must be set for the application to function:

```env
# Convex Database
NEXT_PUBLIC_CONVEX_URL=your_convex_deployment_url

# WhatsApp Business API
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_VERIFY_TOKEN=your_verify_token

# Google AI Services
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key
```

### Optional Variables

These variables enhance functionality but are not required:

```env
# Media Storage
UPLOADTHING_TOKEN=your_uploadthing_token

# Development
NODE_ENV=development
PORT=3000

# Monitoring
SENTRY_DSN=your_sentry_dsn
LOG_LEVEL=info

# Performance
CACHE_TTL=300
RATE_LIMIT_WINDOW=900000
```

### Environment Variable Descriptions

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `NEXT_PUBLIC_CONVEX_URL` | string | - | Convex database deployment URL |
| `WHATSAPP_ACCESS_TOKEN` | string | - | WhatsApp Business API access token |
| `WHATSAPP_PHONE_NUMBER_ID` | string | - | WhatsApp phone number ID |
| `WHATSAPP_VERIFY_TOKEN` | string | - | Webhook verification token |
| `GOOGLE_GENERATIVE_AI_API_KEY` | string | - | Google Gemini AI API key |
| `UPLOADTHING_TOKEN` | string | - | UploadThing media storage token |
| `NODE_ENV` | string | development | Application environment |
| `PORT` | number | 3000 | Server port |
| `SENTRY_DSN` | string | - | Sentry error tracking DSN |
| `LOG_LEVEL` | string | info | Logging level (debug, info, warn, error) |

## Configuration Files

### 1. `.env.local`

Local development environment variables. This file is not committed to version control.

```env
# Development configuration
NEXT_PUBLIC_CONVEX_URL=https://dev-xxx.convex.cloud
WHATSAPP_ACCESS_TOKEN=EAAJxxxxx...
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_VERIFY_TOKEN=your_verify_token
GOOGLE_GENERATIVE_AI_API_KEY=AIzaSyxxxxx...
UPLOADTHING_TOKEN=sk_live_xxxxxx...
```

### 2. `.env.production`

Production environment variables. This file should be secured in your hosting platform.

```env
# Production configuration
NEXT_PUBLIC_CONVEX_URL=https://prod-xxx.convex.cloud
WHATSAPP_ACCESS_TOKEN=EAAJyyyyy...
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_VERIFY_TOKEN=your_verify_token
GOOGLE_GENERATIVE_AI_API_KEY=AIzaSyyyyy...
NODE_ENV=production
PORT=3000
```

### 3. `next.config.ts`

Next.js configuration for build optimization and features.

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // React 19 experimental features
    experimental: {
        reactCompiler: true,
        turbo: {
            rules: {
                '*.svg': {
                    loaders: ['@svgr/webpack'],
                    as: '*.js',
                },
            },
        },
    },

    // Images configuration
    images: {
        domains: [
            'uploadthing.com',
            'utfs.io',
            'facebook.com',
            'graph.facebook.com',
        ],
        formats: ['image/webp', 'image/avif'],
    },

    // Webpack configuration
    webpack: (config) => {
        config.module.rules.push({
            test: /\.svg$/,
            use: ['@svgr/webpack'],
        });
        return config;
    },

    // Headers configuration
    async headers() {
        return [
            {
                source: '/api/:path*',
                headers: [
                    { key: 'Access-Control-Allow-Origin', value: '*' },
                    { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
                    { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
                ],
            },
        ];
    },
};

export default nextConfig;
```

### 4. `tailwind.config.ts`

Tailwind CSS configuration for styling.

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    prefix: "",
    theme: {
        container: {
            center: true,
            padding: "2rem",
            screens: {
                "2xl": "1400px",
            },
        },
        extend: {
            colors: {
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },
                // WhatsApp theme colors
                'whatsapp': {
                    'bg': 'hsl(var(--whatsapp-bg))',
                    'chat-bg': 'hsl(var(--whatsapp-chat-bg))',
                    'panel-bg': 'hsl(var(--whatsapp-panel-bg))',
                    'text-primary': 'hsl(var(--whatsapp-text-primary))',
                    'text-secondary': 'hsl(var(--whatsapp-text-secondary))',
                    'text-muted': 'hsl(var(--whatsapp-text-muted))',
                    'border': 'hsl(var(--whatsapp-border))',
                    'green': 'hsl(var(--whatsapp-green))',
                    'message-bg': 'hsl(var(--whatsapp-message-bg))',
                    'message-out': 'hsl(var(--whatsapp-message-out))',
                }
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            keyframes: {
                "accordion-down": {
                    from: { height: "0" },
                    to: { height: "var(--radix-accordion-content-height)" },
                },
                "accordion-up": {
                    from: { height: "var(--radix-accordion-content-height)" },
                    to: { height: "0" },
                },
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
            },
        },
    },
    plugins: [require("tailwindcss-animate")],
};

export default config;
```

### 5. `tsconfig.json`

TypeScript configuration for type safety.

```json
{
    "compilerOptions": {
        "lib": ["dom", "dom.iterable", "esnext"],
        "allowJs": true,
        "skipLibCheck": true,
        "strict": true,
        "noEmit": true,
        "esModuleInterop": true,
        "module": "esnext",
        "moduleResolution": "bundler",
        "resolveJsonModule": true,
        "isolatedModules": true,
        "jsx": "preserve",
        "incremental": true,
        "plugins": [
            {
                "name": "next"
            }
        ],
        "baseUrl": ".",
        "paths": {
            "@/*": ["./*"],
            "@/components/*": ["./components/*"],
            "@/lib/*": ["./lib/*"],
            "@/app/*": ["./app/*"],
            "@/convex/*": ["./convex/*"]
        }
    },
    "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
    "exclude": ["node_modules"]
}
```

## Database Configuration

### Convex Configuration

The database is configured through Convex's automatic setup. The main configuration is in the environment variable `NEXT_PUBLIC_CONVEX_URL`.

### Database Schema Configuration

File: `convex/schema.ts`

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    // Define all database tables
    users: defineTable({
        whatsappId: v.string(),
        phoneNumber: v.optional(v.string()),
        profileName: v.optional(v.string()),
        // ... other fields
    })
    .index("by_whatsapp_id", ["whatsappId"]),

    // ... other table definitions
});
```

### Database Validation Scripts

File: `scripts/validate-config.ts`

```typescript
#!/usr/bin/env tsx

import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

// Validate required variables
const requiredEnvVars = [
    'NEXT_PUBLIC_CONVEX_URL',
    'WHATSAPP_ACCESS_TOKEN',
    'WHATSAPP_PHONE_NUMBER_ID',
    'WHATSAPP_VERIFY_TOKEN',
    'GOOGLE_GENERATIVE_AI_API_KEY'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => {
        console.error(`   - ${varName}`);
    });
    process.exit(1);
}

console.log('✅ All required environment variables are set');
```

## WhatsApp API Configuration

### API Client Configuration

File: `whatsapp/whatsapp-client-service.ts`

```typescript
import WhatsAppCloudApiClient from './api/Api';

export class WhatsAppClientService {
    private client: WhatsAppCloudApiClient;

    constructor() {
        this.client = new WhatsAppCloudApiClient({
            accessToken: process.env.WHATSAPP_ACCESS_TOKEN!,
            version: 'v23.0',
        });
    }

    async sendMessage(to: string, message: any) {
        try {
            return await this.client.sendMessage({
                messagingProduct: 'whatsapp',
                to,
                ...message
            });
        } catch (error) {
            console.error('WhatsApp API error:', error);
            throw error;
        }
    }

    // ... other methods
}
```

### Webhook Configuration

File: `app/api/webhook/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { processIncomingMessage } from './webhook-processor';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
        return new NextResponse(challenge, { status: 200 });
    }

    return new NextResponse('Verification failed', { status: 403 });
}

export async function POST(request: NextRequest) {
    try {
        const payload = await request.json();
        await processIncomingMessage(payload);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Webhook processing failed:', error);
        return NextResponse.json(
            { error: 'Webhook processing failed' },
            { status: 500 }
        );
    }
}
```

## AI Services Configuration

### Mastra AI Configuration

File: `mastra.config.ts`

```typescript
import { defineConfig } from 'mastra';

export default defineConfig({
    aiSdkCompat: true,
    agents: {
        exchangeAgent: {
            model: {
                provider: 'google',
                model: 'gemini-2.5-flash',
            },
            tools: [
                'checkExchangeRates',
                'createTransaction',
                'analyzeReceipt',
                'sendWhatsAppMessage'
            ],
            memory: {
                type: 'unlimited',
            },
        },
    },
});
```

### Gemini AI Configuration

The AI service is configured through environment variables and uses the official Google AI SDK:

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
```

## Media Storage Configuration

### UploadThing Configuration

If using UploadThing for media storage:

```typescript
// components/UploadThingComponent.tsx
import { UploadButton } from "@uploadthing/react";

export function UploadThingComponent() {
    return (
        <UploadButton
            endpoint="imageUploader"
            onClientUploadComplete={(res) => {
                console.log("Files: ", res);
                alert("Upload Completed Successfully!");
            }}
            onUploadError={(error: Error) => {
                alert(`ERROR! ${error.message}`);
            }}
        />
    );
}
```

### Convex File Storage

The application uses Convex's built-in file storage:

```typescript
// Upload file to Convex
const storageId = await convex.storage.upload(fileBuffer, {
    contentType: 'image/jpeg',
});

// Get file URL
const fileUrl = await convex.storage.getUrl(storageId);
```

## Development Configuration

### Development Scripts

File: `package.json`

```json
{
    "scripts": {
        "dev": "next dev",
        "build": "next build",
        "start": "next start",
        "lint": "next lint",
        "dev:mastra": "mastra dev --dir mastra",
        "build:mastra": "mastra build --dir mastra",
        "config:validate": "tsx scripts/validate-config.ts",
        "diagnose": "tsx scripts/diagnose-api.ts",
        "db:setup": "npx convex dev --once",
        "db:deploy": "npx convex deploy",
        "db:clear": "tsx scripts/clear-databases.ts"
    }
}
```

### ESLint Configuration

File: `eslint.config.mjs`

```javascript
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
    baseDirectory: __dirname,
});

export default [
    ...compat.extends("next/core-web-vitals"),
    {
        rules: {
            "@next/next/no-html-link-for-pages": "off",
            "react-hooks/exhaustive-deps": "warn",
        },
    },
];
```

## Production Configuration

### Production Build Configuration

The production configuration is optimized for performance and security:

```typescript
// Production-specific optimizations
const productionConfig = {
    compress: true,
    poweredByHeader: false,
    generateEtags: false,
    httpAgentOptions: {
        keepAlive: true,
    },
};
```

### Environment-Specific Settings

```typescript
// Load configuration based on environment
const isProduction = process.env.NODE_ENV === 'production';

const config = {
    apiUrl: isProduction
        ? 'https://api.yourdomain.com'
        : 'http://localhost:3000/api',
    logLevel: isProduction ? 'warn' : 'debug',
    cacheTTL: isProduction ? 3600 : 0,
};
```

## Security Configuration

### Environment Variable Security

1. **Never commit sensitive variables** to version control
2. **Use different values** for development and production
3. **Rotate keys regularly** in production
4. **Use environment-specific** configuration files

### API Security

```typescript
// Security headers
const securityHeaders = [
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'X-XSS-Protection', value: '1; mode=block' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
];
```

### Webhook Security

```typescript
// Webhook verification
export function verifyWebhookSignature(payload: string, signature: string): boolean {
    const hmac = crypto.createHmac('sha256', process.env.WHATSAPP_VERIFY_TOKEN!);
    const digest = hmac.update(payload).digest('hex');
    return signature === digest;
}
```

## Validation and Testing

### Configuration Validation

Run this script to validate your configuration:

```bash
# Validate all configuration
pnpm config:validate

# Test API connectivity
pnpm diagnose

# Check database connection
npx convex status
```

### Configuration Testing

File: `scripts/test-config.ts`

```typescript
#!/usr/bin/env tsx

import { config } from 'dotenv';

config();

async function testConfiguration() {
    console.log('🔍 Testing Configuration...\n');

    // Test environment variables
    console.log('✓ Environment variables loaded');

    // Test Convex connection
    try {
        const { ConvexHttpClient } = await import('convex/http');
        const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
        await client.query(api.health.check());
        console.log('✓ Convex database connection');
    } catch (error) {
        console.error('✗ Convex database connection failed');
        process.exit(1);
    }

    // Test WhatsApp API
    try {
        const testResponse = await fetch('https://graph.facebook.com/v19.0/me', {
            headers: {
                'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
            },
        });
        if (testResponse.ok) {
            console.log('✓ WhatsApp API access');
        } else {
            console.error('✗ WhatsApp API access failed');
            process.exit(1);
        }
    } catch (error) {
        console.error('✗ WhatsApp API connection failed');
        process.exit(1);
    }

    // Test AI API
    try {
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        await model.generateContent('test');
        console.log('✓ Google AI API access');
    } catch (error) {
        console.error('✗ Google AI API access failed');
        process.exit(1);
    }

    console.log('\n🎉 All configuration tests passed!');
}

testConfiguration().catch(console.error);
```

### Configuration Checklist

#### Development Environment
- [ ] Node.js 18+ installed
- [ ] pnpm installed
- [ ] All required environment variables set in `.env.local`
- [ ] Convex database URL configured
- [ ] WhatsApp API credentials configured
- [ ] Google AI API key configured
- [ ] Application starts without errors
- [ ] Database migrations applied
- [ ] Sample data seeded (optional)

#### Production Environment
- [ ] Production environment variables set
- [ ] Convex database deployed to production
- [ ] Application builds successfully
- [ ] WhatsApp webhook configured for production URL
- [ ] SSL/TLS certificates configured
- [ ] Domain properly configured
- [ ] Monitoring and logging set up
- [ ] Backup procedures in place
- [ ] Security headers configured

---

This comprehensive configuration guide covers all aspects of configuring the KhalidWid WhatsApp Bot system. Proper configuration is crucial for the application's security, performance, and reliability. Always test your configuration thoroughly before deploying to production.