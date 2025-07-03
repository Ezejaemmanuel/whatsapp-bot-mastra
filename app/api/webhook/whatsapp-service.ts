import { WhatsAppCloudApiClient } from '@/whatsapp/whatsapp-client';
import { WebhookMessage, WebhookMessageStatus, WebhookPayload } from './types';
import { logInfo } from './utils';
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
 */
export async function handleIncomingMessage(
    message: WebhookMessage,
    contactName?: string
): Promise<void> {
    const { whatsappClient, databaseService, mediaUploadService } = getServiceInstance();
    await processIncomingMessage(whatsappClient, databaseService, mediaUploadService, message, contactName);
}

/**
 * Process message status update
 */
export async function handleStatusUpdate(status: WebhookMessageStatus): Promise<void> {
    await processStatusUpdate(status);
}

/**
 * Send a text reply to a message
 */
export async function sendTextMessage(
    to: string,
    text: string,
    replyToMessageId?: string
): Promise<void> {
    const { whatsappClient } = getServiceInstance();
    await sendTextReply(whatsappClient, to, text, replyToMessageId);
}

/**
 * Send a template message
 */
export async function sendTemplate(
    to: string,
    templateName: string,
    languageCode: string,
    components?: any[]
): Promise<void> {
    const { whatsappClient } = getServiceInstance();
    await sendTemplateMessage(whatsappClient, to, templateName, languageCode, components);
}

/**
 * Mark message as read
 */
export async function markAsRead(messageId: string): Promise<void> {
    const { whatsappClient, phoneNumberId } = getServiceInstance();
    await markMessageAsRead(whatsappClient, messageId, phoneNumberId);
}

/**
 * Process complete webhook payload
 */
export async function handleWebhookPayload(payload: WebhookPayload): Promise<void> {
    const { whatsappClient, databaseService, mediaUploadService } = getServiceInstance();
    await processWebhookPayload(whatsappClient, databaseService, mediaUploadService, payload);
}

/**
 * Get the underlying WhatsApp client for advanced operations
 */
export function getWhatsAppClient(): WhatsAppCloudApiClient {
    const { whatsappClient } = getServiceInstance();
    return whatsappClient;
}

/**
 * Update service configuration
 */
export function updateServiceConfig(accessToken?: string, phoneNumberId?: string): void {
    const instance = getServiceInstance();
    if (accessToken || phoneNumberId) {
        instance.clientService.updateConfig(accessToken, phoneNumberId);
        instance.whatsappClient = instance.clientService.getClient();
        if (phoneNumberId) {
            instance.phoneNumberId = phoneNumberId;
        }
    }
}

