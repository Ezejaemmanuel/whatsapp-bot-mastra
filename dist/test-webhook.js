"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runWebhookTests = runWebhookTests;
exports.testWebhookValidation = testWebhookValidation;
exports.testWebhookParsing = testWebhookParsing;
exports.testMessageExtraction = testMessageExtraction;
exports.testWebhookVerification = testWebhookVerification;
exports.testStatusExtraction = testStatusExtraction;
var whatsapp_client_1 = __importDefault(require("./whatsapp-client"));
/**
 * Test file to verify webhook functionality
 */
// Initialize client
var client = new whatsapp_client_1.default({
    accessToken: 'test-token',
});
// Test webhook payload validation
function testWebhookValidation() {
    console.log('Testing webhook payload validation...');
    // Valid payload
    var validPayload = {
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
    var isValid = client.webhook.isValidWebhookPayload(validPayload);
    console.log('Valid payload test:', isValid ? '✅' : '❌');
    // Test invalid payload
    var invalidPayload = { object: 'invalid' };
    var isInvalid = client.webhook.isValidWebhookPayload(invalidPayload);
    console.log('Invalid payload test:', !isInvalid ? '✅' : '❌');
}
// Test webhook payload parsing
function testWebhookParsing() {
    console.log('\nTesting webhook payload parsing...');
    var testPayload = {
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
    var parsed = client.webhook.parseWebhookPayload(testPayload);
    console.log('Messages parsed:', parsed.messages.length === 2 ? '✅' : '❌');
    console.log('Statuses parsed:', parsed.statuses.length === 1 ? '✅' : '❌');
    console.log('Phone number ID extracted:', parsed.phoneNumberId === 'PHONE_NUMBER_ID' ? '✅' : '❌');
}
// Test message extraction utilities
function testMessageExtraction() {
    console.log('\nTesting message extraction utilities...');
    // Test text message extraction
    var textMessage = {
        id: 'TEXT_ID',
        from: '1234567890',
        timestamp: '1234567890',
        type: 'text',
        text: {
            body: 'Hello World!',
        },
    };
    var extractedText = client.webhook.extractTextMessage(textMessage);
    console.log('Text extraction:', extractedText === 'Hello World!' ? '✅' : '❌');
    // Test interactive message extraction
    var interactiveMessage = {
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
    var interactiveResponse = client.webhook.extractInteractiveResponse(interactiveMessage);
    console.log('Interactive extraction:', (interactiveResponse === null || interactiveResponse === void 0 ? void 0 : interactiveResponse.type) === 'button' &&
        (interactiveResponse === null || interactiveResponse === void 0 ? void 0 : interactiveResponse.id) === 'btn1' ? '✅' : '❌');
    // Test reply message detection
    var replyMessage = {
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
    var isReply = client.webhook.isReplyMessage(replyMessage);
    var replyToId = client.webhook.getReplyToMessageId(replyMessage);
    console.log('Reply detection:', isReply && replyToId === 'ORIGINAL_MESSAGE_ID' ? '✅' : '❌');
    // Test forwarded message detection
    var forwardedMessage = {
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
    var isForwarded = client.webhook.isForwardedMessage(forwardedMessage);
    console.log('Forwarded detection:', isForwarded ? '✅' : '❌');
}
// Test webhook verification
function testWebhookVerification() {
    console.log('\nTesting webhook verification...');
    // Test valid verification
    var validVerification = client.webhook.createVerificationResponse({
        mode: 'subscribe',
        token: 'test-token',
        challenge: 'test-challenge',
        verifyToken: 'test-token',
    });
    console.log('Valid verification:', validVerification === 'test-challenge' ? '✅' : '❌');
    // Test invalid verification
    var invalidVerification = client.webhook.createVerificationResponse({
        mode: 'subscribe',
        token: 'wrong-token',
        challenge: 'test-challenge',
        verifyToken: 'test-token',
    });
    console.log('Invalid verification:', invalidVerification === null ? '✅' : '❌');
}
// Test status info extraction
function testStatusExtraction() {
    var _a, _b;
    console.log('\nTesting status info extraction...');
    var status = {
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
    var statusInfo = client.webhook.getMessageStatusInfo(status);
    console.log('Status extraction:', statusInfo.messageId === 'MESSAGE_ID' &&
        statusInfo.status === 'delivered' &&
        ((_a = statusInfo.conversationInfo) === null || _a === void 0 ? void 0 : _a.origin) === 'business_initiated' &&
        ((_b = statusInfo.pricingInfo) === null || _b === void 0 ? void 0 : _b.billable) === true ? '✅' : '❌');
}
// Run all tests
function runWebhookTests() {
    console.log('🧪 Running WhatsApp Webhook Tests\n');
    testWebhookValidation();
    testWebhookParsing();
    testMessageExtraction();
    testWebhookVerification();
    testStatusExtraction();
    console.log('\n✨ Webhook tests completed!');
}
// Run tests if this file is executed directly
if (require.main === module) {
    runWebhookTests();
}
