import { NextRequest, NextResponse } from 'next/server';
import {
    WebhookPayload,
    WebhookMessage,
    WebhookMessageStatus,
    isWebhookMessage,
    isWebhookMessageStatus
} from './types';
import {
    logWebhookEvent,
    verifyWebhookSignature,
    processWebhookData,
    extractMessageInfo,
    extractStatusInfo,
    safeJsonParse,
    createVerificationResponse,
    extractRequestMetadata,
    createErrorResponse,
    createSuccessResponse
} from './utils';
import { handleIncomingMessage, initializeWhatsAppService } from './whatsapp-service';
import { sendDebugMessage } from '@/mastra/tools/utils';

// Environment variables for webhook configuration
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'your-verify-token-here';
const WEBHOOK_SECRET = process.env.WHATSAPP_WEBHOOK_SECRET || '';

// Initialize WhatsApp service at module load
let whatsappServiceInitialized = false;
try {
    initializeWhatsAppService();
    whatsappServiceInitialized = true;
    logWebhookEvent('INFO', 'WhatsApp service initialized successfully at module load');
} catch (error) {
    logWebhookEvent('ERROR', 'Failed to initialize WhatsApp service at module load', {
        error: error instanceof Error ? error.message : 'Unknown initialization error'
    });
    // Don't throw here - we'll handle the uninitialized state in the request handlers
}

// Validate WhatsApp configuration on module load with detailed error reporting
try {
    // Basic validation - check if required environment variables are present
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;

    const missingVars: string[] = [];

    if (!accessToken) {
        missingVars.push('WHATSAPP_ACCESS_TOKEN');
    }
    if (!phoneNumberId) {
        missingVars.push('WHATSAPP_PHONE_NUMBER_ID');
    }
    if (!businessAccountId) {
        missingVars.push('WHATSAPP_BUSINESS_ACCOUNT_ID');
    }

    if (missingVars.length > 0) {
        const errorMessage = `Missing required environment variables: ${missingVars.join(', ')}`;
        logWebhookEvent('ERROR', 'WhatsApp environment configuration validation failed', {
            missingVariables: missingVars,
            configurationStatus: 'incomplete',
            requiredVariables: ['WHATSAPP_ACCESS_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID', 'WHATSAPP_BUSINESS_ACCOUNT_ID'],
            setupInstructions: 'Please check your .env.local file and ensure all required WhatsApp API credentials are configured'
        });
        throw new Error(errorMessage);
    }

    // Validate token format (basic check)
    if (accessToken && !accessToken.startsWith('EAA')) {
        logWebhookEvent('WARN', 'WhatsApp access token format warning', {
            tokenPrefix: accessToken.substring(0, 3),
            expectedPrefix: 'EAA',
            message: 'WhatsApp access tokens typically start with "EAA"'
        });
    }

} catch (error) {
    logWebhookEvent('ERROR', 'WhatsApp environment configuration validation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        configurationStatus: 'failed',
        troubleshooting: {
            step1: 'Check if .env.local file exists in project root',
            step2: 'Verify all required environment variables are set',
            step3: 'Ensure WhatsApp Business API credentials are valid',
            step4: 'Restart the development server after configuration changes'
        }
    });
    // Don't throw here as it would prevent the module from loading
    // The error will be caught when the service is actually used
}

/**
 * GET handler for webhook verification
 * WhatsApp sends a GET request to verify the webhook endpoint
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
    console.log("I have hit the webhook");
    console.log("I have hit the webhook");
    try {
        const { searchParams } = new URL(request.url);
        const mode = searchParams.get('hub.mode');
        const token = searchParams.get('hub.verify_token');
        const challenge = searchParams.get('hub.challenge');

        const metadata = extractRequestMetadata(request);

        logWebhookEvent('INFO', 'Webhook verification request received', {
            mode,
            // token: token ? '***HIDDEN***' : null,
        });

        // Create verification response
        const verificationResult = createVerificationResponse(mode, token, challenge, VERIFY_TOKEN);

        if (verificationResult.success && verificationResult.response) {
            logWebhookEvent('INFO', 'Webhook verification successful');
            return new NextResponse(verificationResult.response, { status: 200 });
        } else {
            logWebhookEvent('WARN', 'Webhook verification failed', {
                expectedMode: 'subscribe',
                receivedMode: mode,
                tokenMatch: token === VERIFY_TOKEN,
                error: verificationResult.error
            });
            return new NextResponse('Forbidden', { status: 403 });
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorStack = error instanceof Error ? error.stack : undefined;

        logWebhookEvent('ERROR', 'Error during webhook verification', {
            error: errorMessage,
            stack: errorStack
        });
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

/**
 * POST handler for webhook events
 * WhatsApp sends POST requests with message and status updates
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const startTime = Date.now();
        const body = await request.text();
        const signature = request.headers.get('x-hub-signature-256') || '';
        const metadata = extractRequestMetadata(request);

        // Check if WhatsApp service is initialized
        if (!whatsappServiceInitialized) {
            logWebhookEvent('ERROR', 'WhatsApp service is not initialized', {
                error: 'Service initialization failed during module load'
            });
            return createErrorResponse('Service Not Initialized', 500);
        }

        // Verify webhook signature if secret is configured
        if (WEBHOOK_SECRET && !verifyWebhookSignature(body, signature, WEBHOOK_SECRET)) {
            logWebhookEvent('ERROR', 'Webhook signature verification failed');
            return createErrorResponse('Unauthorized', 401);
        }

        // Parse the webhook payload
        const parsedBody = safeJsonParse<WebhookPayload>(body);
        if (!parsedBody) {
            logWebhookEvent('ERROR', 'Failed to parse webhook payload', {
                rawBody: body.substring(0, 500) // Log first 500 chars for debugging
            });
            return createErrorResponse('Bad Request - Invalid JSON', 400);
        }

        // Process and log the webhook data
        const processedData = processWebhookData(parsedBody);

        // logWebhookEvent('INFO', 'Webhook data processed successfully', {
        //     summary: {
        //         object: processedData.object,
        //         totalEntries: processedData.entries.length,
        //         totalMessages: processedData.totalMessages,
        //         totalStatuses: processedData.totalStatuses,
        //         businessAccounts: processedData.businessAccounts,
        //         phoneNumbers: processedData.phoneNumbers
        //     }
        // });

        // Process webhook payload with WhatsApp service for auto-responses
        try {

            // Process each entry and change individually
            for (const entry of parsedBody.entry) {
                for (const change of entry.changes) {
                    try {
                        // Case 1: Handle new incoming messages
                        if (change.value.messages && change.value.messages.length > 0) {
                            // Find the most recent message based on timestamp
                            const latestMessage = change.value.messages.reduce((latest, current) => {
                                const latestTimestamp = parseInt(latest.timestamp, 10);
                                const currentTimestamp = parseInt(current.timestamp, 10);
                                return currentTimestamp > latestTimestamp ? current : latest;
                            });

                            await sendDebugMessage(latestMessage.from, 'DEBUG: New message received', {
                                message: latestMessage
                            });

                            // Get contact name from the webhook contacts array
                            let contactName: string | undefined;
                            if (change.value.contacts && change.value.contacts.length > 0) {
                                const contact = change.value.contacts.find(c => c.wa_id === latestMessage.from);
                                contactName = contact?.profile?.name;
                            }

                            // Process only the latest message with contact name
                            await handleIncomingMessage(latestMessage, contactName);
                        }
                        // Case 2: Handle message status updates
                        else if (change.value.statuses && change.value.statuses.length > 0) {
                            for (const status of change.value.statuses) {
                                await sendDebugMessage(status.recipient_id, `DEBUG: Status update received: ${status.status}`, {
                                    status: status
                                });

                                // Explicitly ignore 'sent', 'delivered', 'read', and 'failed' statuses to prevent loops
                                if (['sent', 'delivered', 'read', 'failed'].includes(status.status)) {
                                    logWebhookEvent('INFO', `Ignoring status update: ${status.status}`, {
                                        messageId: status.id,
                                        recipient: status.recipient_id,
                                        status: status.status
                                    });
                                } else {
                                    // Log any other unexpected status types for observability
                                    logWebhookEvent('WARN', `Received unhandled status type: ${status.status}`, {
                                        messageId: status.id,
                                        fullStatus: status
                                    });
                                }
                            }
                        }
                        // Case 3: Handle errors reported by the webhook
                        else if (change.value.errors) {
                            for (const error of change.value.errors) {
                                logWebhookEvent('ERROR', 'Webhook error received', {
                                    errorCode: error.code,
                                    errorTitle: error.title,
                                    errorMessage: error.message,
                                    errorDetails: error.error_data?.details
                                });
                            }
                        }
                    } catch (changeError) {
                        logWebhookEvent('ERROR', 'Error processing a single webhook change', {
                            error: changeError instanceof Error ? changeError.message : 'Unknown error',
                            stack: changeError instanceof Error ? changeError.stack : undefined,
                            changeValue: change.value
                        });
                        // Continue to the next change in the loop
                    }
                }
            }

            logWebhookEvent('INFO', 'Overall webhook processing completed');
        } catch (serviceError) {
            const serviceErrorMessage = serviceError instanceof Error ? serviceError.message : 'Unknown service error';
            logWebhookEvent('WARN', 'WhatsApp service processing failed', {
                error: serviceErrorMessage
            });
            // Continue processing even if service fails
        }

        // Log detailed information about each entry
        for (let i = 0; i < processedData.entries.length; i++) {
            const entry = processedData.entries[i];
            // logWebhookEvent('INFO', `Processing entry ${i + 1}/${processedData.entries.length}`, {
            //     entryId: entry.id,
            //     changesCount: entry.changes.length
            // });

            // Log each change in detail
            for (let j = 0; j < entry.changes.length; j++) {
                const change = entry.changes[j];
                // logWebhookEvent('INFO', `Change ${j + 1}: ${change.field}`, {
                //     field: change.field,
                //     value: change.value
                // });

                // Log specific message details
                if (change.value?.messages) {
                    for (const message of change.value.messages) {
                        if (isWebhookMessage(message)) {
                            const messageInfo = extractMessageInfo(message);

                            // Get contact name from the webhook contacts array
                            let contactName: string | undefined;
                            if (change.value.contacts && change.value.contacts.length > 0) {
                                const contact = change.value.contacts.find(c => c.wa_id === messageInfo.from);
                                contactName = contact?.profile?.name;
                            }

                            // logWebhookEvent('INFO', 'Received message', {
                            //     messageId: messageInfo.id,
                            //     from: messageInfo.from,
                            //     timestamp: messageInfo.timestamp,
                            //     type: messageInfo.type,
                            //     messagePreview: messageInfo.text?.substring(0, 100) || `${messageInfo.type} message`,
                            //     isReply: messageInfo.isReply,
                            //     replyToMessageId: messageInfo.replyToMessageId,
                            //     isForwarded: messageInfo.isForwarded,
                            //     mediaInfo: messageInfo.mediaInfo
                            // });
                        }
                    }
                }

                // Log status updates
                if (change.value?.statuses) {
                    for (const status of change.value.statuses) {
                        if (isWebhookMessageStatus(status)) {
                            const statusInfo = extractStatusInfo(status);
                            // logWebhookEvent('INFO', 'Message status update', {
                            //     messageId: statusInfo.messageId,
                            //     status: statusInfo.status,
                            //     timestamp: statusInfo.timestamp,
                            //     recipientId: statusInfo.recipientId,
                            //     conversationInfo: statusInfo.conversationInfo,
                            //     pricingInfo: statusInfo.pricingInfo
                            // });
                        }
                    }
                }

                // Log errors if present
                if (change.value?.errors) {
                    for (const error of change.value.errors) {
                        logWebhookEvent('ERROR', 'Webhook error received', {
                            errorCode: error.code,
                            errorTitle: error.title,
                            errorMessage: error.message,
                            errorDetails: error.error_data?.details
                        });
                    }
                }
            }
        }

        const processingTime = Date.now() - startTime;
        logWebhookEvent('INFO', 'Webhook processing completed', {
            processingTimeMs: processingTime,
            status: 'success'
        });

        // Return success response
        return createSuccessResponse();

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorStack = error instanceof Error ? error.stack : undefined;

        logWebhookEvent('ERROR', 'Unexpected error processing webhook', {
            error: errorMessage,
            stack: errorStack
        });

        return createErrorResponse('Internal Server Error', 500);
    }
}

/**
 * Handle unsupported HTTP methods
 */
export async function PUT(): Promise<NextResponse> {
    logWebhookEvent('WARN', 'Unsupported method: PUT');
    return new NextResponse('Method Not Allowed', { status: 405 });
}

export async function DELETE(): Promise<NextResponse> {
    logWebhookEvent('WARN', 'Unsupported method: DELETE');
    return new NextResponse('Method Not Allowed', { status: 405 });
}

export async function PATCH(): Promise<NextResponse> {
    logWebhookEvent('WARN', 'Unsupported method: PATCH');
    return new NextResponse('Method Not Allowed', { status: 405 });
} 