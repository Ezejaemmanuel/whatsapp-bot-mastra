import { WhatsAppCloudApiClient } from '@/whatsapp/whatsapp-client';
import { WebhookMessage, WebhookMessageStatus, WebhookPayload } from './types';
import { logInfo, logError, logWarning } from './utils';
import {
    initializeWebhookService,
    processIncomingMessage,
    processWebhookPayload,
    WebhookServiceConfig,
    WebhookServiceInstance
} from './webhook-processor';
import { processStatusUpdate } from './status-handlers';
import {
    sendTextReply,
    sendTemplateMessage,
    markMessageAsRead
} from './response-sender';



/**
 * WhatsApp Webhook Service - Functional Implementation
 * 
 * This service provides a functional approach to handling WhatsApp webhook events.
 * It's broken down into smaller, focused modules for better maintainability.
 * All functions now handle errors gracefully to ensure HTTP 200 responses.
 */

// Service state
let serviceInstance: WebhookServiceInstance | null = null;

/**
 * Initialize the WhatsApp webhook service
 */
export function initializeWhatsAppService(config: WebhookServiceConfig = {}): WebhookServiceInstance {
    if (!serviceInstance) {
        serviceInstance = initializeWebhookService(config);
    }
    return serviceInstance;
}

/**
 * Get the current service instance
 */
export function getServiceInstance(): WebhookServiceInstance {
    if (!serviceInstance) {
        throw new Error('WhatsApp service not initialized. Call initializeWhatsAppService() first.');
    }
    return serviceInstance;
}

/**
 * Process incoming webhook message
 * Now catches all errors internally to ensure HTTP 200 response
 */
export async function handleIncomingMessage(
    message: WebhookMessage,
    contactName?: string
): Promise<void> {
    try {
        const { whatsappClient, databaseService, mediaUploadService } = getServiceInstance();
        await processIncomingMessage(whatsappClient, databaseService, mediaUploadService, message, contactName);
    } catch (error) {
        logError('Error in handleIncomingMessage', error as Error, {
            messageId: message.id,
            from: message.from,
            messageType: message.type,
            operation: 'handleIncomingMessage'
        });
        // Don't throw - let the main route return HTTP 200
    }
}

/**
 * Process message status update
 * Now catches all errors internally to ensure HTTP 200 response
 */
export async function handleStatusUpdate(status: WebhookMessageStatus): Promise<void> {
    try {
        await processStatusUpdate(status);
    } catch (error) {
        logError('Error in handleStatusUpdate', error as Error, {
            statusId: status.id,
            status: status.status,
            recipientId: status.recipient_id,
            operation: 'handleStatusUpdate'
        });
        // Don't throw - let the main route return HTTP 200
    }
}

/**
 * Send a text reply to a message
 * Now catches all errors internally to ensure HTTP 200 response
 */
export async function sendTextMessage(
    to: string,
    text: string,
    replyToMessageId?: string
): Promise<void> {
    try {
        const { whatsappClient } = getServiceInstance();
        await sendTextReply(whatsappClient, to, text, replyToMessageId);
    } catch (error) {
        logError('Error in sendTextMessage', error as Error, {
            to,
            textLength: text.length,
            replyToMessageId,
            operation: 'sendTextMessage'
        });
        // Don't throw - let the main route return HTTP 200
    }
}

/**
 * Send a template message
 * Now catches all errors internally to ensure HTTP 200 response
 */
export async function sendTemplate(
    to: string,
    templateName: string,
    languageCode: string,
    components?: any[]
): Promise<void> {
    try {
        const { whatsappClient } = getServiceInstance();
        await sendTemplateMessage(whatsappClient, to, templateName, languageCode, components);
    } catch (error) {
        logError('Error in sendTemplate', error as Error, {
            to,
            templateName,
            languageCode,
            componentsCount: components?.length || 0,
            operation: 'sendTemplate'
        });
        // Don't throw - let the main route return HTTP 200
    }
}

/**
 * Mark message as read
 * Now catches all errors internally to ensure HTTP 200 response
 */
export async function markAsRead(messageId: string): Promise<void> {
    try {
        const { whatsappClient, phoneNumberId } = getServiceInstance();
        await markMessageAsRead(whatsappClient, messageId, phoneNumberId);
    } catch (error) {
        logError('Error in markAsRead', error as Error, {
            messageId,
            operation: 'markAsRead'
        });
        // Don't throw - let the main route return HTTP 200
    }
}

/**
 * Process complete webhook payload
 * Now catches all errors internally to ensure HTTP 200 response
 */
export async function handleWebhookPayload(payload: WebhookPayload): Promise<void> {
    try {
        const { whatsappClient, databaseService, mediaUploadService } = getServiceInstance();
        await processWebhookPayload(whatsappClient, databaseService, mediaUploadService, payload);
    } catch (error) {
        logError('Error in handleWebhookPayload', error as Error, {
            payloadObject: payload.object,
            entryCount: payload.entry?.length || 0,
            operation: 'handleWebhookPayload'
        });
        // Don't throw - let the main route return HTTP 200
    }
}

/**
 * Get the underlying WhatsApp client for advanced operations
 * Now catches initialization errors gracefully
 */
export function getWhatsAppClient(): WhatsAppCloudApiClient | null {
    try {
        const { whatsappClient } = getServiceInstance();
        return whatsappClient;
    } catch (error) {
        logError('Error getting WhatsApp client', error as Error, {
            operation: 'getWhatsAppClient'
        });
        return null; // Return null instead of throwing
    }
}

/**
 * Update service configuration
 * Now catches all errors internally to ensure HTTP 200 response
 */
export function updateServiceConfig(accessToken?: string, phoneNumberId?: string): void {
    try {
        const instance = getServiceInstance();
        if (accessToken || phoneNumberId) {
            instance.clientService.updateConfig(accessToken, phoneNumberId);
            instance.whatsappClient = instance.clientService.getClient();
            if (phoneNumberId) {
                instance.phoneNumberId = phoneNumberId;
            }
        }
    } catch (error) {
        logError('Error updating service config', error as Error, {
            hasAccessToken: !!accessToken,
            hasPhoneNumberId: !!phoneNumberId,
            operation: 'updateServiceConfig'
        });
        // Don't throw - let the main route return HTTP 200
    }
}

