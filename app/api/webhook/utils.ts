import crypto from 'crypto';
import { NextResponse } from 'next/server';
import {
    WebhookPayload,
    WebhookLogData,
    ProcessedWebhookData,
    ProcessedWebhookEntry,
    ProcessedWebhookChange,
    WebhookMessage,
    WebhookMessageStatus,
    isWebhookPayload,
    isWebhookMessage,
    isWebhookMessageStatus
} from './types';

/**
 * Enhanced logging utility for webhook events with flexible data logging
 * Supports logging any additional properties and provides success/failure indicators
 */
export function logWebhookEvent(
    level: 'INFO' | 'ERROR' | 'WARN' | 'SUCCESS',
    message: string,
    data?: Partial<WebhookLogData> & Record<string, any>
): void {
    const timestamp = new Date().toISOString();

    // Create the log entry with flexible data structure
    const logEntry = {
        timestamp,
        level,
        source: 'WhatsApp Webhook',
        message,
        ...data
    };

    // Enhanced console output with better formatting
    const levelEmoji = {
        'INFO': '📋',
        'ERROR': '❌',
        'WARN': '⚠️',
        'SUCCESS': '✅'
    };

    console.log(`[${timestamp}] ${levelEmoji[level] || '📋'} [${level}] WhatsApp Webhook: ${message}`);

    if (data && Object.keys(data).length > 0) {
        console.log('📊 Event Data:', JSON.stringify(data, null, 2));
    }

    // Log to file or external service in production (placeholder for future enhancement)
    if (process.env.NODE_ENV === 'production') {
        // TODO: Implement file logging or external logging service
        // logToFile(logEntry);
        // logToExternalService(logEntry);
    }
}

/**
 * Specialized logging function for successful operations
 */
export function logSuccess(message: string, data?: Record<string, any>): void {
    logWebhookEvent('SUCCESS', message, data);
}

/**
 * Specialized logging function for errors with stack trace
 */
export function logError(message: string, error?: Error | string, data?: Record<string, any>): void {
    const errorData = {
        ...data,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
    };
    logWebhookEvent('ERROR', message, errorData);
}

/**
 * Specialized logging function for warnings
 */
export function logWarning(message: string, data?: Record<string, any>): void {
    logWebhookEvent('WARN', message, data);
}

/**
 * Specialized logging function for info with processing time
 */
export function logInfo(message: string, data?: Record<string, any>, startTime?: number): void {
    const infoData = {
        ...data,
        processingTimeMs: startTime ? Date.now() - startTime : undefined
    };
    logWebhookEvent('INFO', message, infoData);
}

/**
 * Verify webhook signature for security
 */
export function verifyWebhookSignature(
    payload: string,
    signature: string,
    webhookSecret: string
): boolean {
    if (!webhookSecret || !signature) {
        return false;
    }

    try {
        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(payload)
            .digest('hex');

        const providedSignature = signature.replace('sha256=', '');
        return crypto.timingSafeEqual(
            Buffer.from(expectedSignature, 'hex'),
            Buffer.from(providedSignature, 'hex')
        );
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logWebhookEvent('ERROR', 'Signature verification failed', { error: errorMessage });
        return false;
    }
}

/**
 * Process incoming webhook data and extract relevant information
 */
export function processWebhookData(body: unknown): ProcessedWebhookData {
    const processedData: ProcessedWebhookData = {
        object: '',
        entries: [],
        totalMessages: 0,
        totalStatuses: 0,
        businessAccounts: [],
        phoneNumbers: []
    };

    // Validate webhook payload
    if (!isWebhookPayload(body)) {
        logWebhookEvent('WARN', 'Invalid webhook payload structure');
        return processedData;
    }

    processedData.object = body.object;
    const businessAccountsSet = new Set<string>();
    const phoneNumbersSet = new Set<string>();

    for (const entry of body.entry) {
        const entryData: ProcessedWebhookEntry = {
            id: entry.id,
            changes: []
        };

        businessAccountsSet.add(entry.id);

        for (const change of entry.changes) {
            const changeData: ProcessedWebhookChange = {
                field: change.field,
                value: change.value
            };

            // Count messages and statuses
            if (change.value) {
                if (change.value.messages) {
                    processedData.totalMessages += change.value.messages.length;
                }
                if (change.value.statuses) {
                    processedData.totalStatuses += change.value.statuses.length;
                }
                if (change.value.metadata?.phone_number_id) {
                    phoneNumbersSet.add(change.value.metadata.phone_number_id);
                }
            }

            entryData.changes.push(changeData);
        }

        processedData.entries.push(entryData);
    }

    // Convert Sets to Arrays
    processedData.businessAccounts = Array.from(businessAccountsSet);
    processedData.phoneNumbers = Array.from(phoneNumbersSet);

    return processedData;
}

/**
 * Extract text content from a webhook message
 */
export function extractMessageText(message: WebhookMessage): string | null {
    if (!isWebhookMessage(message)) {
        return null;
    }

    switch (message.type) {
        case 'text':
            return message.text?.body || null;
        case 'image':
        case 'video':
        case 'document':
            return message.image?.caption || message.video?.caption || message.document?.caption || null;
        case 'location':
            return message.location?.name || message.location?.address || 'Location shared';
        case 'contacts':
            return message.contacts?.[0]?.name?.formatted_name || 'Contact shared';
        case 'interactive':
            if (message.interactive?.button_reply) {
                return message.interactive.button_reply.title;
            }
            if (message.interactive?.list_reply) {
                return message.interactive.list_reply.title;
            }
            return 'Interactive message';
        case 'button':
            return message.button?.text || 'Button pressed';
        case 'system':
            return message.system?.body || 'System message';
        default:
            return `${message.type} message`;
    }
}

/**
 * Extract media information from a webhook message
 */
export function extractMediaInfo(message: WebhookMessage): {
    id?: string;
    mimeType?: string;
    caption?: string;
    filename?: string;
} | null {
    if (!isWebhookMessage(message)) {
        return null;
    }

    const mediaTypes = ['image', 'audio', 'video', 'document', 'sticker'] as const;

    for (const mediaType of mediaTypes) {
        const mediaObj = message[mediaType];
        if (mediaObj) {
            return {
                id: mediaObj.id,
                mimeType: mediaObj.mime_type,
                caption: mediaObj.caption,
                filename: mediaType === 'document' ? (mediaObj as any).filename : undefined
            };
        }
    }

    return null;
}

/**
 * Check if a message is a reply to another message
 */
export function isReplyMessage(message: WebhookMessage): boolean {
    return !!(message.context?.id);
}

/**
 * Get the ID of the message being replied to
 */
export function getReplyToMessageId(message: WebhookMessage): string | null {
    return message.context?.id || null;
}

/**
 * Check if a message is forwarded
 */
export function isForwardedMessage(message: WebhookMessage): boolean {
    return !!(message.context?.forwarded);
}

/**
 * Check if a message is frequently forwarded
 */
export function isFrequentlyForwardedMessage(message: WebhookMessage): boolean {
    return !!(message.context?.frequently_forwarded);
}

/**
 * Extract comprehensive message information
 */
export function extractMessageInfo(message: WebhookMessage): {
    id: string;
    from: string;
    timestamp: string;
    type: string;
    text: string | null;
    mediaInfo: ReturnType<typeof extractMediaInfo>;
    isReply: boolean;
    replyToMessageId: string | null;
    isForwarded: boolean;
    isFrequentlyForwarded: boolean;
} {
    return {
        id: message.id,
        from: message.from,
        timestamp: message.timestamp,
        type: message.type,
        text: extractMessageText(message),
        mediaInfo: extractMediaInfo(message),
        isReply: isReplyMessage(message),
        replyToMessageId: getReplyToMessageId(message),
        isForwarded: isForwardedMessage(message),
        isFrequentlyForwarded: isFrequentlyForwardedMessage(message)
    };
}

/**
 * Extract comprehensive status information
 */
export function extractStatusInfo(status: WebhookMessageStatus): {
    messageId: string;
    status: string;
    timestamp: string;
    recipientId: string;
    conversationInfo?: {
        id: string;
        origin: string;
        expirationTimestamp?: string;
    };
    pricingInfo?: {
        billable: boolean;
        pricingModel: string;
        category: string;
    };
} {
    const result = {
        messageId: status.id,
        status: status.status,
        timestamp: status.timestamp,
        recipientId: status.recipient_id
    };

    if (status.conversation) {
        (result as any).conversationInfo = {
            id: status.conversation.id,
            origin: status.conversation.origin.type,
            expirationTimestamp: status.conversation.expiration_timestamp
        };
    }

    if (status.pricing) {
        (result as any).pricingInfo = {
            billable: status.pricing.billable,
            pricingModel: status.pricing.pricing_model,
            category: status.pricing.category
        };
    }

    return result;
}

/**
 * Safe JSON parsing with error handling
 */
export function safeJsonParse<T = unknown>(jsonString: string): T | null {
    try {
        return JSON.parse(jsonString) as T;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown parsing error';
        logWebhookEvent('ERROR', 'Failed to parse JSON', { error: errorMessage });
        return null;
    }
}

/**
 * Create a webhook verification response
 */
export function createVerificationResponse(
    mode: string | null,
    token: string | null,
    challenge: string | null,
    verifyToken: string
): { success: boolean; response?: string; error?: string } {
    if (mode === 'subscribe' && token === verifyToken && challenge) {
        return { success: true, response: challenge };
    }

    return {
        success: false,
        error: `Verification failed - mode: ${mode}, token match: ${token === verifyToken}`
    };
}

/**
 * Extract request metadata for logging
 */
export function extractRequestMetadata(request: Request): {
    userAgent: string | null;
    ip: string | null;
    contentType: string | null;
    contentLength: number;
    hasSignature: boolean;
} {
    const headers = request.headers;

    return {
        userAgent: headers.get('user-agent'),
        ip: headers.get('x-forwarded-for') || headers.get('x-real-ip'),
        contentType: headers.get('content-type'),
        contentLength: parseInt(headers.get('content-length') || '0', 10),
        hasSignature: !!headers.get('x-hub-signature-256')
    };
}

/**
 * Create error response with proper typing
 */
export function createErrorResponse(
    message: string,
    statusCode: number = 500,
    details?: any
): NextResponse {
    logWebhookEvent('ERROR', message, { statusCode, details });

    return new NextResponse(message, {
        status: statusCode,
        headers: {
            'Content-Type': 'text/plain'
        }
    });
}

/**
 * Create success response
 */
export function createSuccessResponse(message: string = 'OK'): NextResponse {
    return new NextResponse(message, {
        status: 200,
        headers: {
            'Content-Type': 'text/plain'
        }
    });
} 