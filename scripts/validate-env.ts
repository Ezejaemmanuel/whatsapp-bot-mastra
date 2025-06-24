#!/usr/bin/env tsx
/**
 * Environment Validation Script
 * 
 * Run this script to validate that all required environment variables are properly configured.
 * Usage: pnpm run validate-env or npx tsx scripts/validate-env.ts
 */

import { validateWhatsAppConfig, getConfigSummary, WHATSAPP_CONFIG } from '../lib/env-config';

async function main() {
    console.log('🔍 Validating WhatsApp Bot Environment Configuration...\n');

    try {
        // Validate all required environment variables
        validateWhatsAppConfig();

        console.log('✅ All required environment variables are properly configured!\n');

        // Show configuration summary (without sensitive values)
        console.log('📋 Configuration Summary:');
        console.log('========================');
        const summary = getConfigSummary();
        Object.entries(summary).forEach(([key, value]) => {
            console.log(`${key}: ${value}`);
        });

        console.log('\n🚀 Your WhatsApp bot is ready to run!');
        console.log('\nNext steps:');
        console.log('1. Start your development server: pnpm run dev');
        console.log('2. Configure your webhook URL in Meta Business Manager');
        console.log('3. Test your webhook endpoint');

    } catch (error) {
        console.error('❌ Environment validation failed!\n');

        if (error instanceof Error) {
            console.error('Error:', error.message);
        } else {
            console.error('Unknown error occurred');
        }

        console.log('\n🔧 How to fix this:');
        console.log('1. Copy .env.example to .env: cp .env.example .env');
        console.log('2. Fill in all required environment variables in .env');
        console.log('3. Get values from your Meta Business Account:');
        console.log('   - Visit: https://business.facebook.com/');
        console.log('   - Go to WhatsApp > API Setup');
        console.log('   - Copy your Access Token and Phone Number ID');
        console.log('4. Run this script again to validate');

        process.exit(1);
    }
}

// Additional validation functions
async function validateDatabaseConnection() {
    console.log('🔍 Validating database connection...');

    try {
        const dbUrl = process.env.DATABASE_URL;
        if (!dbUrl) {
            throw new Error('DATABASE_URL environment variable is not configured');
        }

        console.log('✅ Database URL is configured');
    } catch (error) {
        console.error('❌ Database validation failed:', error instanceof Error ? error.message : error);
        throw error;
    }
}

async function validateUploadThingConfig() {
    console.log('🔍 Validating UploadThing configuration...');

    try {
        const uploadThingToken = process.env.UPLOADTHING_TOKEN;
        if (!uploadThingToken) {
            console.log('⚠️  UPLOADTHING_TOKEN not configured (media uploads will be disabled)');
        } else {
            console.log('✅ UploadThing token is configured');
        }
    } catch (error) {
        console.error('❌ UploadThing validation failed:', error instanceof Error ? error.message : error);
        throw error;
    }
}

// Extended validation (optional)
async function runExtendedValidation() {
    console.log('\n🔍 Running extended validation...\n');

    try {
        await validateDatabaseConnection();
        await validateUploadThingConfig();
        console.log('\n✅ Extended validation completed successfully!');
    } catch (error) {
        console.log('\n⚠️  Extended validation found issues (non-critical):');
        console.log('   These won\'t prevent the basic bot from working, but some features may be limited.');
    }
}

// Run the validation
main().then(() => {
    // Run extended validation if requested
    if (process.argv.includes('--extended')) {
        return runExtendedValidation();
    }
}).catch((error) => {
    console.error('Validation failed:', error);
    process.exit(1);
}); 