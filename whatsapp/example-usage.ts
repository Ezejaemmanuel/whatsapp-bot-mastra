import WhatsAppCloudApiClient, {
    WebhookMessage,
    WebhookMessageStatus,
    WebhookError
} from './whatsapp-client';
import { PHONE_NUMBER_ID, TEST_WHATSAPP_NUMBER, WABA_ID } from '../constant';

/**
 * Example usage of the WhatsApp Cloud API Client
 * 
 * This file demonstrates how to use the properly structured WhatsApp client
 * with organized endpoint classifications.
 */

// Example 1: Initialize client with access token from environment variable
const client1 = new WhatsAppCloudApiClient();

// Example 2: Initialize client with custom configuration
const client2 = new WhatsAppCloudApiClient({
    accessToken: 'your-access-token-here',
    version: 'v21.0', // Optional, defaults to v21.0
    baseUrl: 'https://graph.facebook.com', // Optional, defaults to Meta's Graph API
});

// Example phone number ID and recipient
const recipientNumber = TEST_WHATSAPP_NUMBER;
const wabaId = WABA_ID;

/**
 * Example functions demonstrating various message types
 */
export async function sendTextMessageExample() {
    try {
        const response = await client1.messages.sendText({
            to: recipientNumber,
            text: 'Hello from WhatsApp Cloud API!',
            previewUrl: true, // Optional: show URL previews
        });

        console.log('Text message sent:', response.data);
        return response;
    } catch (error) {
        console.error('Error sending text message:', error);
        throw error;
    }
}

export async function sendReplyMessageExample() {
    try {
        const response = await client1.messages.sendReply({
            to: recipientNumber,
            text: 'This is a reply to your message',
            replyToMessageId: 'MESSAGE_ID_TO_REPLY_TO',
        });

        console.log('Reply message sent:', response.data);
        return response;
    } catch (error) {
        console.error('Error sending reply message:', error);
        throw error;
    }
}

export async function sendImageMessageExample() {
    try {
        // Send image by URL
        const response1 = await client1.messages.sendImageByUrl({
            to: recipientNumber,
            imageUrl: 'https://example.com/image.jpg',
            caption: 'Check out this image!',
        });

        // Send image by media ID (after uploading)
        const response2 = await client1.messages.sendImageById({
            to: recipientNumber,
            mediaId: 'UPLOADED_MEDIA_ID',
            caption: 'Image from uploaded media',
        });

        console.log('Image messages sent:', { response1: response1.data, response2: response2.data });
        return { response1, response2 };
    } catch (error) {
        console.error('Error sending image messages:', error);
        throw error;
    }
}

export async function sendTemplateMessageExample() {
    try {
        const response = await client1.messages.sendTemplate({
            
            to: recipientNumber,
            templateName: 'hello_world',
            languageCode: 'en_US',
            components: [
                {
                    type: 'body',
                    parameters: [
                        {
                            type: 'text',
                            text: 'John Doe',
                        },
                    ],
                },
            ],
        });

        console.log('Template message sent:', response.data);
        return response;
    } catch (error) {
        console.error('Error sending template message:', error);
        throw error;
    }
}

export async function sendDocumentMessageExample() {
    try {
        const response = await client1.messages.sendDocumentByUrl({
            
            to: recipientNumber,
            documentUrl: 'https://example.com/document.pdf',
            filename: 'important-document.pdf',
            caption: 'Please review this document',
        });

        console.log('Document message sent:', response.data);
        return response;
    } catch (error) {
        console.error('Error sending document message:', error);
        throw error;
    }
}

export async function sendLocationMessageExample() {
    try {
        const response = await client1.messages.sendLocation({
            
            to: recipientNumber,
            latitude: 37.7749,
            longitude: -122.4194,
            name: 'San Francisco',
            address: 'San Francisco, CA, USA',
        });

        console.log('Location message sent:', response.data);
        return response;
    } catch (error) {
        console.error('Error sending location message:', error);
        throw error;
    }
}

export async function sendContactMessageExample() {
    try {
        const response = await client1.messages.sendContact({
            
            to: recipientNumber,
            contacts: [
                {
                    name: {
                        formatted_name: 'John Doe',
                        first_name: 'John',
                        last_name: 'Doe',
                    },
                    phones: [
                        {
                            phone: '+1234567890',
                            type: 'WORK',
                        },
                    ],
                    emails: [
                        {
                            email: 'john.doe@example.com',
                            type: 'WORK',
                        },
                    ],
                },
            ],
        });

        console.log('Contact message sent:', response.data);
        return response;
    } catch (error) {
        console.error('Error sending contact message:', error);
        throw error;
    }
}

export async function sendReactionExample() {
    try {
        // Send a reaction
        const response1 = await client1.messages.sendReaction({
            
            to: recipientNumber,
            messageId: 'MESSAGE_ID_TO_REACT_TO',
            emoji: '👍',
        });

        // Remove a reaction
        const response2 = await client1.messages.removeReaction({
            
            to: recipientNumber,
            messageId: 'MESSAGE_ID_TO_REMOVE_REACTION_FROM',
        });

        console.log('Reaction sent and removed:', { sent: response1.data, removed: response2.data });
        return { response1, response2 };
    } catch (error) {
        console.error('Error with reactions:', error);
        throw error;
    }
}

export async function markMessageAsReadExample() {
    try {
        const response = await client1.messages.markAsRead({
            
            messageId: 'MESSAGE_ID_TO_MARK_AS_READ',
        });

        console.log('Message marked as read:', response.data);
        return response;
    } catch (error) {
        console.error('Error marking message as read:', error);
        throw error;
    }
}

export async function sendVideoMessageExample() {
    try {
        // Send video by URL
        const response1 = await client1.messages.sendVideoByUrl({
            
            to: recipientNumber,
            videoUrl: 'https://example.com/video.mp4',
            caption: 'Check out this video!',
        });

        // Send video by media ID
        const response2 = await client1.messages.sendVideoById({
            
            to: recipientNumber,
            mediaId: 'UPLOADED_VIDEO_MEDIA_ID',
            caption: 'Video from uploaded media',
        });

        console.log('Video messages sent:', { response1: response1.data, response2: response2.data });
        return { response1, response2 };
    } catch (error) {
        console.error('Error sending video messages:', error);
        throw error;
    }
}

export async function sendReplyMessagesExample() {
    try {
        // Reply to text with image
        const response1 = await client1.messages.sendReplyToImageByUrl({
            
            to: recipientNumber,
            imageUrl: 'https://example.com/reply-image.jpg',
            caption: 'This is a reply with an image',
            replyToMessageId: 'MESSAGE_ID_TO_REPLY_TO',
        });

        // Reply to message with video
        const response2 = await client1.messages.sendReplyToVideoById({
            
            to: recipientNumber,
            mediaId: 'VIDEO_MEDIA_ID',
            caption: 'Video reply',
            replyToMessageId: 'MESSAGE_ID_TO_REPLY_TO',
        });

        // Reply with location
        const response3 = await client1.messages.sendReplyToLocation({
            
            to: recipientNumber,
            latitude: 40.7128,
            longitude: -74.0060,
            name: 'New York City',
            address: 'New York, NY, USA',
            replyToMessageId: 'MESSAGE_ID_TO_REPLY_TO',
        });

        console.log('Reply messages sent:', {
            imageReply: response1.data,
            videoReply: response2.data,
            locationReply: response3.data
        });
        return { response1, response2, response3 };
    } catch (error) {
        console.error('Error sending reply messages:', error);
        throw error;
    }
}

export async function sendTemplateMessagesExample() {
    try {
        // Send text template
        const response1 = await client1.messages.sendMessageTemplateText({
            
            to: recipientNumber,
            templateName: 'welcome_message',
            languageCode: 'en_US',
            bodyParameters: [
                { type: 'text', text: 'John Doe' },
                { type: 'text', text: 'Premium' },
            ],
            headerParameters: [
                { type: 'text', text: 'Welcome!' },
            ],
        });

        // Send media template
        const response2 = await client1.messages.sendMessageTemplateMedia({
            
            to: recipientNumber,
            templateName: 'product_showcase',
            languageCode: 'en_US',
            headerMediaType: 'image',
            headerMediaUrl: 'https://example.com/product.jpg',
            bodyParameters: [
                { type: 'text', text: 'Special Offer' },
                { type: 'text', text: '50% OFF' },
            ],
        });

        // Send interactive template
        const response3 = await client1.messages.sendMessageTemplateInteractive({
            
            to: recipientNumber,
            templateName: 'quick_survey',
            languageCode: 'en_US',
            bodyParameters: [
                { type: 'text', text: 'Customer Survey' },
            ],
            buttonParameters: [
                { type: 'payload', payload: 'YES_SATISFIED' },
                { type: 'payload', payload: 'NO_NOT_SATISFIED' },
            ],
        });

        console.log('Template messages sent:', {
            textTemplate: response1.data,
            mediaTemplate: response2.data,
            interactiveTemplate: response3.data
        });
        return { response1, response2, response3 };
    } catch (error) {
        console.error('Error sending template messages:', error);
        throw error;
    }
}

export async function sendInteractiveMessagesExample() {
    try {
        // Send reply button (can be used as reply or standalone)
        const response1 = await client1.messages.sendReplyButton({
            
            to: recipientNumber,
            bodyText: 'Please choose your preferred option:',
            headerText: 'Quick Selection',
            footerText: 'Select one option',
            buttons: [
                { id: 'option_a', title: 'Option A' },
                { id: 'option_b', title: 'Option B' },
                { id: 'option_c', title: 'Option C' },
            ],
            // replyToMessageId: 'MESSAGE_ID', // Optional: to make it a reply
        });

        // Send reply to list
        const response2 = await client1.messages.sendReplyToList({
            
            to: recipientNumber,
            bodyText: 'Here are your options:',
            buttonText: 'View Options',
            headerText: 'Service Selection',
            footerText: 'Choose the best option for you',
            replyToMessageId: 'MESSAGE_ID_TO_REPLY_TO',
            sections: [
                {
                    title: 'Basic Services',
                    rows: [
                        { id: 'basic_1', title: 'Basic Support', description: 'Standard customer support' },
                        { id: 'basic_2', title: 'Basic Plan', description: 'Entry-level service plan' },
                    ],
                },
                {
                    title: 'Premium Services',
                    rows: [
                        { id: 'premium_1', title: 'Premium Support', description: '24/7 priority support' },
                        { id: 'premium_2', title: 'Premium Plan', description: 'Full-featured service plan' },
                    ],
                },
            ],
        });

        console.log('Interactive messages sent:', {
            replyButton: response1.data,
            replyToList: response2.data
        });
        return { response1, response2 };
    } catch (error) {
        console.error('Error sending interactive messages:', error);
        throw error;
    }
}

export async function sendProductMessageExample() {
    try {
        const response = await client1.messages.sendSingleProductMessage({
            
            to: recipientNumber,
            bodyText: 'Check out this amazing product!',
            footerText: 'Limited time offer',
            catalogId: 'YOUR_CATALOG_ID',
            productRetailerId: 'PRODUCT_RETAILER_ID',
        });

        console.log('Product message sent:', response.data);
        return response;
    } catch (error) {
        console.error('Error sending product message:', error);
        throw error;
    }
}

/**
 * Complete example workflow
 */
export async function completeWorkflowExample() {
    try {
        console.log('🚀 Starting WhatsApp Cloud API workflow...');

        // 1. Send a welcome text message
        await sendTextMessageExample();

        // 2. Send an image with caption
        await sendImageMessageExample();

        // 3. Send a video message
        await sendVideoMessageExample();

        // 4. Send a template message
        await sendTemplateMessageExample();

        // 5. Send template messages (text, media, interactive)
        await sendTemplateMessagesExample();

        // 6. Send a document
        await sendDocumentMessageExample();

        // 7. Send location
        await sendLocationMessageExample();

        // 8. Send contact information
        await sendContactMessageExample();

        // 9. Send interactive messages
        await sendInteractiveMessagesExample();

        // 10. Send reply messages
        await sendReplyMessagesExample();

        // 11. Send product message
        await sendProductMessageExample();

        // 12. Send reactions
        await sendReactionExample();

        console.log('✅ Workflow completed successfully!');
    } catch (error) {
        console.error('❌ Workflow failed:', error);
        throw error;
    }
}

/**
 * WEBHOOK EXAMPLES
 */

export async function subscribeToWebhooks() {
    try {
        const response = await client2.webhook.subscribeToWaba({
            wabaId,
            overrideCallbackUri: 'https://your-domain.com/webhook',
            verifyToken: 'your-verify-token',
        });
        console.log('Subscribed to webhooks:', response);
    } catch (error) {
        console.error('Error subscribing to webhooks:', error);
    }
}

export async function getWebhookSubscriptions() {
    try {
        const response = await client2.webhook.getSubscriptions({
            wabaId,
        });
        console.log('Webhook subscriptions:', response);
    } catch (error) {
        console.error('Error getting webhook subscriptions:', error);
    }
}

/**
 * WEBHOOK HANDLER EXAMPLE
 * This shows how to create a complete webhook handler for Express.js
 */
export function createWebhookHandler() {
    return client2.webhook.createWebhookHandler({
        verifyToken: 'your-verify-token',
        appSecret: 'your-app-secret', // optional, for signature verification

        // Handle incoming messages
        onMessage: async (message: WebhookMessage) => {
            console.log('Received message:', message);

            // Extract text message
            const textMessage = client2.webhook.extractTextMessage(message);
            if (textMessage) {
                console.log('Text message received:', textMessage);

                // Echo the message back
                await client2.messages.sendText({
                    to: message.from,
                    text: `You said: ${textMessage}`,
                });
            }

            // Handle interactive responses
            const interactiveResponse = client2.webhook.extractInteractiveResponse(message);
            if (interactiveResponse) {
                console.log('Interactive response:', interactiveResponse);

                await client2.messages.sendText({
                    to: message.from,
                    text: `You selected: ${interactiveResponse.title}`,
                });
            }

            // Handle media messages
            const mediaInfo = client2.webhook.extractMediaInfo(message);
            if (mediaInfo) {
                console.log('Media received:', mediaInfo);

                await client2.messages.sendText({
                    to: message.from,
                    text: `Received ${message.type} media: ${mediaInfo.filename || 'No filename'}`,
                });
            }

            // Handle location messages
            const location = client2.webhook.extractLocation(message);
            if (location) {
                console.log('Location received:', location);

                await client2.messages.sendText({
                    to: message.from,
                    text: `Location received: ${location.latitude}, ${location.longitude}`,
                });
            }

            // Check if message is a reply
            if (client2.webhook.isReplyMessage(message)) {
                const replyToId = client2.webhook.getReplyToMessageId(message);
                console.log('This is a reply to message:', replyToId);
            }

            // Check if message was forwarded
            if (client2.webhook.isForwardedMessage(message)) {
                console.log('This message was forwarded');
            }
        },

        // Handle message status updates
        onStatus: async (status: WebhookMessageStatus) => {
            console.log('Message status update:', status);

            const statusInfo = client2.webhook.getMessageStatusInfo(status);
            console.log('Status info:', statusInfo);

            // Handle different status types
            switch (status.status) {
                case 'sent':
                    console.log(`Message ${status.id} was sent`);
                    break;
                case 'delivered':
                    console.log(`Message ${status.id} was delivered`);
                    break;
                case 'read':
                    console.log(`Message ${status.id} was read`);
                    break;
                case 'failed':
                    console.log(`Message ${status.id} failed to send`);
                    break;
            }
        },

        // Handle errors
        onError: async (error: WebhookError) => {
            console.error('Webhook error:', error);
        },
    });
}

/**
 * EXPRESS.JS WEBHOOK SETUP EXAMPLE
 */
/*
import express from 'express';

const app = express();
app.use(express.json());

// Create webhook handler
const webhookHandler = createWebhookHandler();

// Set up webhook endpoint
app.all('/webhook', webhookHandler);

// Start server
app.listen(3000, () => {
    console.log('Webhook server running on port 3000');
});
*/

/**
 * WEBHOOK PAYLOAD PARSING EXAMPLE
 */
export function parseWebhookPayloadExample() {
    // Example webhook payload from WhatsApp
    const examplePayload = {
        object: 'whatsapp_business_account',
        entry: [
            {
                id: 'WHATSAPP_BUSINESS_ACCOUNT_ID',
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

    // Validate payload
    if (client2.webhook.isValidWebhookPayload(examplePayload)) {
        console.log('Valid webhook payload');

        // Parse payload
        const parsed = client2.webhook.parseWebhookPayload(examplePayload);
        console.log('Parsed payload:', parsed);

        // Process messages
        parsed.messages.forEach((message) => {
            const textMessage = client2.webhook.extractTextMessage(message);
            if (textMessage) {
                console.log('Text message:', textMessage);
            }
        });
    } else {
        console.log('Invalid webhook payload');
    }
}

/**
 * WEBHOOK SIGNATURE VERIFICATION EXAMPLE
 */
export function verifyWebhookSignatureExample() {
    const payload = JSON.stringify({ test: 'data' });
    const signature = 'sha256=signature_hash_here';
    const appSecret = 'your-app-secret';

    const isValid = client2.webhook.verifyWebhookSignature({
        payload,
        signature,
        appSecret,
    });

    console.log('Signature valid:', isValid);
}

/**
 * WEBHOOK VERIFICATION EXAMPLE
 */
export function webhookVerificationExample() {
    const verificationResponse = client2.webhook.createVerificationResponse({
        mode: 'subscribe',
        token: 'received-token',
        challenge: 'challenge-string',
        verifyToken: 'your-verify-token',
    });

    if (verificationResponse) {
        console.log('Verification successful, challenge:', verificationResponse);
    } else {
        console.log('Verification failed');
    }
}

// Export the client instances for use in other modules
export { client1, client2 };
export default WhatsAppCloudApiClient; 