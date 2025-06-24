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
import { WhatsAppWebhookService } from './whatsapp-service';

// Environment variables for webhook configuration
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'your-verify-token-here';
const WEBHOOK_SECRET = process.env.WHATSAPP_WEBHOOK_SECRET || '';

// Initialize WhatsApp service
const whatsappService = new WhatsAppWebhookService();

/**
 * GET handler for webhook verification
 * WhatsApp sends a GET request to verify the webhook endpoint
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
    console.log("I have hit the webhook");
    try {
        const { searchParams } = new URL(request.url);
        const mode = searchParams.get('hub.mode');
        const token = searchParams.get('hub.verify_token');
        const challenge = searchParams.get('hub.challenge');

        const metadata = extractRequestMetadata(request);

        logWebhookEvent('INFO', 'Webhook verification request received', {
            mode,
            token: token ? '***HIDDEN***' : null,
            challenge: challenge ? '***HIDDEN***' : null,
            userAgent: metadata.userAgent,
            ip: metadata.ip
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

        logWebhookEvent('INFO', 'Webhook POST request received', {
            contentLength: body.length,
            hasSignature: !!signature,
            userAgent: metadata.userAgent,
            ip: metadata.ip,
            headers: Object.fromEntries(request.headers.entries())
        });

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

        logWebhookEvent('INFO', 'Webhook data processed successfully', {
            summary: {
                object: processedData.object,
                totalEntries: processedData.entries.length,
                totalMessages: processedData.totalMessages,
                totalStatuses: processedData.totalStatuses,
                businessAccounts: processedData.businessAccounts,
                phoneNumbers: processedData.phoneNumbers
            }
        });

        // Process webhook payload with WhatsApp service for auto-responses
        try {
            await whatsappService.processWebhookPayload(parsedBody);
            logWebhookEvent('INFO', 'WhatsApp service processing completed');
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
            logWebhookEvent('INFO', `Processing entry ${i + 1}/${processedData.entries.length}`, {
                entryId: entry.id,
                changesCount: entry.changes.length
            });

            // Log each change in detail
            for (let j = 0; j < entry.changes.length; j++) {
                const change = entry.changes[j];
                logWebhookEvent('INFO', `Change ${j + 1}: ${change.field}`, {
                    field: change.field,
                    value: change.value
                });

                // Log specific message details
                if (change.value?.messages) {
                    for (const message of change.value.messages) {
                        if (isWebhookMessage(message)) {
                            const messageInfo = extractMessageInfo(message);
                            logWebhookEvent('INFO', 'Received message', {
                                messageId: messageInfo.id,
                                from: messageInfo.from,
                                timestamp: messageInfo.timestamp,
                                type: messageInfo.type,
                                messagePreview: messageInfo.text?.substring(0, 100) || `${messageInfo.type} message`,
                                isReply: messageInfo.isReply,
                                replyToMessageId: messageInfo.replyToMessageId,
                                isForwarded: messageInfo.isForwarded,
                                mediaInfo: messageInfo.mediaInfo
                            });
                        }
                    }
                }

                // Log status updates
                if (change.value?.statuses) {
                    for (const status of change.value.statuses) {
                        if (isWebhookMessageStatus(status)) {
                            const statusInfo = extractStatusInfo(status);
                            logWebhookEvent('INFO', 'Message status update', {
                                messageId: statusInfo.messageId,
                                status: statusInfo.status,
                                timestamp: statusInfo.timestamp,
                                recipientId: statusInfo.recipientId,
                                conversationInfo: statusInfo.conversationInfo,
                                pricingInfo: statusInfo.pricingInfo
                            });
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