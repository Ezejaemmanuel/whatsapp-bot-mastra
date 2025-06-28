import WhatsAppCloudApiClient, {
    WebhookPayload,
    WebhookMessage,
    WebhookMessageStatus
} from './whatsapp-client';

/**
 * Test file to verify webhook functionality
 */

// Initialize client
const client = new WhatsAppCloudApiClient({
    accessToken: 'test-token',
});

function testWebhookValidation() {
    console.log('Testing webhook payload validation...');

    // Valid payload
    const validPayload: WebhookPayload = {
        object: 'whatsapp_business_account',
        entry: [
            {
                id: 'WABA_ID',
                changes: [
                    {
                        value: {
                            messaging_product: 'whatsapp',
                            metadata: {
                                display_phone_number: '+1234567890',
                                phone_number_id: 'PHONE_NUMBER_ID',
                            },
                            messages: [
                                {
                                    id: 'MESSAGE_ID',
                                    from: '1234567890',
                                    timestamp: '1234567890',
                                    type: 'text',
                                    text: {
                                        body: 'Hello World!',
                                    },
                                },
                            ],
                        },
                        field: 'messages',
                    },
                ],
            },
        ],
    };

    // Test validation
    const isValid = client.webhook.isValidWebhookPayload(validPayload);
    console.log('Valid payload test:', isValid ? '✅' : '❌');

    // Test invalid payload
    const invalidPayload = { object: 'invalid' };
    const isInvalid = client.webhook.isValidWebhookPayload(invalidPayload);
    console.log('Invalid payload test:', !isInvalid ? '✅' : '❌');
}

// Test webhook payload parsing
function testWebhookParsing() {
    console.log('\nTesting webhook payload parsing...');

    const testPayload: WebhookPayload = {
        object: 'whatsapp_business_account',
        entry: [
            {
                id: 'WABA_ID',
                changes: [
                    {
                        value: {
                            messaging_product: 'whatsapp',
                            metadata: {
                                display_phone_number: '+1234567890',
                                phone_number_id: 'PHONE_NUMBER_ID',
                            },
                            messages: [
                                {
                                    id: 'TEXT_MESSAGE_ID',
                                    from: '1234567890',
                                    timestamp: '1234567890',
                                    type: 'text',
                                    text: {
                                        body: 'Hello World!',
                                    },
                                },
                                {
                                    id: 'INTERACTIVE_MESSAGE_ID',
                                    from: '1234567890',
                                    timestamp: '1234567891',
                                    type: 'interactive',
                                    interactive: {
                                        type: 'button_reply',
                                        button_reply: {
                                            id: 'button1',
                                            title: 'Button 1',
                                        },
                                    },
                                },
                            ],
                            statuses: [
                                {
                                    id: 'STATUS_MESSAGE_ID',
                                    status: 'delivered',
                                    timestamp: '1234567892',
                                    recipient_id: '1234567890',
                                },
                            ],
                        },
                        field: 'messages',
                    },
                ],
            },
        ],
    };

    const parsed = client.webhook.parseWebhookPayload(testPayload);

    console.log('Messages parsed:', parsed.messages.length === 2 ? '✅' : '❌');
    console.log('Statuses parsed:', parsed.statuses.length === 1 ? '✅' : '❌');
    console.log('Phone number ID extracted:', parsed.phoneNumberId === 'PHONE_NUMBER_ID' ? '✅' : '❌');
}

// Test message extraction utilities
function testMessageExtraction() {
    console.log('\nTesting message extraction utilities...');

    // Test text message extraction
    const textMessage: WebhookMessage = {
        id: 'TEXT_ID',
        from: '1234567890',
        timestamp: '1234567890',
        type: 'text',
        text: {
            body: 'Hello World!',
        },
    };

    const extractedText = client.webhook.extractTextMessage(textMessage);
    console.log('Text extraction:', extractedText === 'Hello World!' ? '✅' : '❌');

    // Test interactive message extraction
    const interactiveMessage: WebhookMessage = {
        id: 'INTERACTIVE_ID',
        from: '1234567890',
        timestamp: '1234567890',
        type: 'interactive',
        interactive: {
            type: 'button_reply',
            button_reply: {
                id: 'btn1',
                title: 'Button 1',
            },
        },
    };

    const interactiveResponse = client.webhook.extractInteractiveResponse(interactiveMessage);
    console.log('Interactive extraction:',
        interactiveResponse?.type === 'button' &&
            interactiveResponse?.id === 'btn1' ? '✅' : '❌');

    // Test reply message detection
    const replyMessage: WebhookMessage = {
        id: 'REPLY_ID',
        from: '1234567890',
        timestamp: '1234567890',
        type: 'text',
        text: {
            body: 'This is a reply',
        },
        context: {
            id: 'ORIGINAL_MESSAGE_ID',
        },
    };

    const isReply = client.webhook.isReplyMessage(replyMessage);
    const replyToId = client.webhook.getReplyToMessageId(replyMessage);
    console.log('Reply detection:', isReply && replyToId === 'ORIGINAL_MESSAGE_ID' ? '✅' : '❌');

    // Test forwarded message detection
    const forwardedMessage: WebhookMessage = {
        id: 'FORWARDED_ID',
        from: '1234567890',
        timestamp: '1234567890',
        type: 'text',
        text: {
            body: 'Forwarded message',
        },
        context: {
            forwarded: true,
        },
    };

    const isForwarded = client.webhook.isForwardedMessage(forwardedMessage);
    console.log('Forwarded detection:', isForwarded ? '✅' : '❌');
}

// Test webhook verification
function testWebhookVerification() {
    console.log('\nTesting webhook verification...');

    // Test valid verification
    const validVerification = client.webhook.createVerificationResponse({
        mode: 'subscribe',
        token: 'test-token',
        challenge: 'test-challenge',
        verifyToken: 'test-token',
    });

    console.log('Valid verification:', validVerification === 'test-challenge' ? '✅' : '❌');

    // Test invalid verification
    const invalidVerification = client.webhook.createVerificationResponse({
        mode: 'subscribe',
        token: 'wrong-token',
        challenge: 'test-challenge',
        verifyToken: 'test-token',
    });

    console.log('Invalid verification:', invalidVerification === null ? '✅' : '❌');
}

// Test status info extraction
function testStatusExtraction() {
    console.log('\nTesting status info extraction...');

    const status: WebhookMessageStatus = {
        id: 'MESSAGE_ID',
        status: 'delivered',
        timestamp: '1234567890',
        recipient_id: '1234567890',
        conversation: {
            id: 'CONVERSATION_ID',
            origin: {
                type: 'business_initiated',
            },
        },
        pricing: {
            billable: true,
            pricing_model: 'CBP',
            category: 'business_initiated',
        },
    };

    const statusInfo = client.webhook.getMessageStatusInfo(status);

    console.log('Status extraction:',
        statusInfo.messageId === 'MESSAGE_ID' &&
            statusInfo.status === 'delivered' &&
            statusInfo.conversationInfo?.origin === 'business_initiated' &&
            statusInfo.pricingInfo?.billable === true ? '✅' : '❌');
}

// Run all tests
export function runWebhookTests() {
    console.log('🧪 Running WhatsApp Webhook Tests\n');

    testWebhookValidation();
    testWebhookParsing();
    testMessageExtraction();
    testWebhookVerification();
    testStatusExtraction();

    console.log('\n✨ Webhook tests completed!');
}

// Export test functions for individual testing
export {
    testWebhookValidation,
    testWebhookParsing,
    testMessageExtraction,
    testWebhookVerification,
    testStatusExtraction,
};

// Run tests if this file is executed directly
if (require.main === module) {
    runWebhookTests();
} 