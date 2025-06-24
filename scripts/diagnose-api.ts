#!/usr/bin/env tsx

/**
 * WhatsApp API Diagnostic Tool
 * 
 * This script tests your WhatsApp API connectivity and helps identify
 * specific issues with message reading and media processing.
 */

import { config } from 'dotenv';
import { WhatsAppCloudApiClient } from '../whatsapp/whatsapp-client';

// Load environment variables
config({ path: '.env.local' });

async function runDiagnostics(): Promise<void> {
    console.log('🔧 WhatsApp API Diagnostic Tool\n');

    // Check environment variables
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;

    if (!accessToken || !phoneNumberId || !businessAccountId) {
        console.log('❌ Missing required environment variables');
        console.log('   Run `pnpm config:validate` to check your configuration');
        process.exit(1);
    }

    console.log('✅ Environment variables found\n');

    try {
        // Initialize WhatsApp client
        const client = new WhatsAppCloudApiClient({
            accessToken,
            phoneNumberId,
            wabaId: businessAccountId
        });

        console.log('🔍 Testing WhatsApp API connectivity...\n');

        // Test 1: Check if we can access the API
        console.log('Test 1: API Access Test');
        console.log('======================');

        try {
            // Try to get phone number info (this tests basic API access)
            const phoneInfo = await client.getRawApi().phoneNumberId.phoneNumberIdList({
                version: 'v23.0',
                phoneNumberId: phoneNumberId
            });

            console.log('✅ API access successful');
            console.log(`   Phone Number Status: ${phoneInfo.status || 'Unknown'}`);
        } catch (error) {
            console.log('❌ API access failed');
            console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            console.log('   This suggests an issue with your access token or phone number ID');
        }
        console.log('');

        // Test 2: Test message reading capability
        console.log('Test 2: Message Read API Test');
        console.log('=============================');

        try {
            // Try to mark a test message as read (this will fail but tells us about the API structure)
            await client.messages.markAsRead({
                messageId: 'test_message_id_for_diagnostics'
            });
            console.log('⚠️  Unexpected success (test message ID should not exist)');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            if (errorMessage.includes('Invalid message ID') || errorMessage.includes('not found')) {
                console.log('✅ Message read API is accessible (test message ID correctly rejected)');
            } else if (errorMessage.includes('Invalid access token') || errorMessage.includes('unauthorized')) {
                console.log('❌ Message read API failed - Access token issue');
                console.log(`   Error: ${errorMessage}`);
            } else {
                console.log('⚠️  Message read API test inconclusive');
                console.log(`   Error: ${errorMessage}`);
            }
        }
        console.log('');

        // Test 3: Test media API access
        console.log('Test 3: Media API Test');
        console.log('======================');

        try {
            // Try to get media info for a test media ID
            await client.getRawApi().mediaId.mediaIdList({
                version: 'v23.0',
                mediaId: 'test_media_id_for_diagnostics'
            });
            console.log('⚠️  Unexpected success (test media ID should not exist)');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            if (errorMessage.includes('Invalid media ID') || errorMessage.includes('not found')) {
                console.log('✅ Media API is accessible (test media ID correctly rejected)');
            } else if (errorMessage.includes('Invalid access token') || errorMessage.includes('unauthorized')) {
                console.log('❌ Media API failed - Access token issue');
                console.log(`   Error: ${errorMessage}`);
            } else {
                console.log('⚠️  Media API test inconclusive');
                console.log(`   Error: ${errorMessage}`);
            }
        }
        console.log('');

        // Test 4: UploadThing configuration
        console.log('Test 4: UploadThing Configuration');
        console.log('=================================');

        const uploadThingToken = process.env.UPLOADTHING_TOKEN;
        if (!uploadThingToken) {
            console.log('❌ UPLOADTHING_TOKEN not configured');
            console.log('   This will cause media processing to fail');
        } else {
            console.log('✅ UPLOADTHING_TOKEN is configured');
            // Basic token format check
            if (uploadThingToken.length < 20) {
                console.log('⚠️  UploadThing token seems short - verify it\'s correct');
            }
        }
        console.log('');

        // Summary and recommendations
        console.log('📋 Diagnostic Summary');
        console.log('====================');
        console.log('Based on the tests above:');
        console.log('');
        console.log('For "Failed to mark message as read" errors:');
        console.log('- If API access failed: Check your WHATSAPP_ACCESS_TOKEN');
        console.log('- If message read API failed: Verify token permissions include message reading');
        console.log('- The error might be non-critical if it only affects read receipts');
        console.log('');
        console.log('For "Failed to process media file" errors:');
        console.log('- If Media API failed: Check your WHATSAPP_ACCESS_TOKEN permissions');
        console.log('- If UploadThing not configured: Set UPLOADTHING_TOKEN in your .env.local');
        console.log('- Check that your WhatsApp Business Account has media permissions');
        console.log('');
        console.log('🔧 Next Steps:');
        console.log('1. Fix any failed tests above');
        console.log('2. Run `pnpm dev` and test with real WhatsApp messages');
        console.log('3. Check the webhook logs for more detailed error information');

    } catch (error) {
        console.log('❌ Failed to initialize WhatsApp client');
        console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        console.log('   Check your environment configuration with `pnpm config:validate`');
    }
}

// Run diagnostics
runDiagnostics().catch(console.error); 