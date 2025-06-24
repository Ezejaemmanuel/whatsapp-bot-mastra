#!/usr/bin/env tsx

/**
 * WhatsApp Bot Configuration Validator
 * 
 * This script validates your environment configuration and provides
 * detailed feedback on what needs to be fixed.
 */

import { config } from 'dotenv';
import { existsSync } from 'fs';
import { join } from 'path';

// Load environment variables
config({ path: '.env.local' });

interface ConfigCheck {
    name: string;
    value: string | undefined;
    required: boolean;
    validator?: (value: string) => { valid: boolean; message?: string };
    description: string;
}

const configChecks: ConfigCheck[] = [
    {
        name: 'WHATSAPP_ACCESS_TOKEN',
        value: process.env.WHATSAPP_ACCESS_TOKEN,
        required: true,
        validator: (value: string) => {
            if (!value.startsWith('EAA')) {
                return {
                    valid: false,
                    message: 'WhatsApp access tokens typically start with "EAA"'
                };
            }
            if (value.length < 50) {
                return {
                    valid: false,
                    message: 'Access token seems too short (should be ~200+ characters)'
                };
            }
            return { valid: true };
        },
        description: 'WhatsApp Business API access token from Meta Business Manager'
    },
    {
        name: 'WHATSAPP_PHONE_NUMBER_ID',
        value: process.env.WHATSAPP_PHONE_NUMBER_ID,
        required: true,
        validator: (value: string) => {
            if (!/^\d+$/.test(value)) {
                return {
                    valid: false,
                    message: 'Phone Number ID should contain only digits'
                };
            }
            if (value.length < 10) {
                return {
                    valid: false,
                    message: 'Phone Number ID seems too short'
                };
            }
            return { valid: true };
        },
        description: 'WhatsApp Business Phone Number ID'
    },
    {
        name: 'WHATSAPP_BUSINESS_ACCOUNT_ID',
        value: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
        required: true,
        validator: (value: string) => {
            if (!/^\d+$/.test(value)) {
                return {
                    valid: false,
                    message: 'Business Account ID should contain only digits'
                };
            }
            return { valid: true };
        },
        description: 'WhatsApp Business Account ID (WABA ID)'
    },
    {
        name: 'WHATSAPP_VERIFY_TOKEN',
        value: process.env.WHATSAPP_VERIFY_TOKEN,
        required: true,
        validator: (value: string) => {
            if (value.length < 10) {
                return {
                    valid: false,
                    message: 'Verify token should be at least 10 characters for security'
                };
            }
            return { valid: true };
        },
        description: 'Webhook verification token (can be any secure string)'
    },
    {
        name: 'UPLOADTHING_TOKEN',
        value: process.env.UPLOADTHING_TOKEN,
        required: true,
        description: 'UploadThing API token for media file storage'
    },
    {
        name: 'DATABASE_URL',
        value: process.env.DATABASE_URL,
        required: true,
        validator: (value: string) => {
            if (!value.startsWith('postgresql://') && !value.startsWith('postgres://')) {
                return {
                    valid: false,
                    message: 'Database URL should start with postgresql:// or postgres://'
                };
            }
            return { valid: true };
        },
        description: 'PostgreSQL database connection string'
    },
    {
        name: 'WHATSAPP_WEBHOOK_SECRET',
        value: process.env.WHATSAPP_WEBHOOK_SECRET,
        required: false,
        description: 'Webhook signature verification secret (recommended for production)'
    },
    {
        name: 'WHATSAPP_API_VERSION',
        value: process.env.WHATSAPP_API_VERSION,
        required: false,
        description: 'WhatsApp API version (defaults to v23.0)'
    }
];

function validateConfiguration(): void {
    console.log('🔍 WhatsApp Bot Configuration Validator\n');

    // Check if .env.local exists
    const envPath = join(process.cwd(), '.env.local');
    if (!existsSync(envPath)) {
        console.log('❌ .env.local file not found!');
        console.log('   Create a .env.local file in your project root');
        console.log('   See ENVIRONMENT_SETUP.md for a template\n');
        process.exit(1);
    }

    console.log('✅ .env.local file found\n');

    let hasErrors = false;
    let hasWarnings = false;

    // Validate each configuration
    for (const check of configChecks) {
        const { name, value, required, validator, description } = check;

        if (required && !value) {
            console.log(`❌ ${name}: MISSING (REQUIRED)`);
            console.log(`   ${description}`);
            hasErrors = true;
        } else if (!required && !value) {
            console.log(`⚠️  ${name}: Not set (optional)`);
            console.log(`   ${description}`);
            hasWarnings = true;
        } else if (value) {
            if (validator) {
                const validation = validator(value);
                if (!validation.valid) {
                    console.log(`❌ ${name}: INVALID`);
                    console.log(`   ${validation.message}`);
                    console.log(`   Current value: ${value.substring(0, 20)}...`);
                    hasErrors = true;
                } else {
                    console.log(`✅ ${name}: Valid`);
                }
            } else {
                console.log(`✅ ${name}: Set`);
            }
        }
        console.log('');
    }

    // Summary
    console.log('📊 Configuration Summary:');
    console.log('========================');

    if (hasErrors) {
        console.log('❌ Configuration has errors that need to be fixed');
        console.log('   Please update your .env.local file and run this script again');
        console.log('   See ENVIRONMENT_SETUP.md for detailed instructions');
        process.exit(1);
    } else if (hasWarnings) {
        console.log('⚠️  Configuration is valid but has optional items missing');
        console.log('   Your bot should work, but consider setting optional variables for production');
    } else {
        console.log('✅ All configuration checks passed!');
        console.log('   Your WhatsApp bot should be ready to run');
    }

    console.log('\n🚀 Next Steps:');
    console.log('1. Run `pnpm db:setup` to initialize the database');
    console.log('2. Run `pnpm dev` to start the development server');
    console.log('3. Test your webhook by sending a message to your WhatsApp Business number');
}

// Run validation
validateConfiguration(); 