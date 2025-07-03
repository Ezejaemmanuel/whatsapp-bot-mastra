/**
 * WhatsApp Webhook Service - Functional API
 * 
 * This module provides a clean, functional interface for handling WhatsApp webhook events.
 * The service has been refactored from a class-based approach to a modular, functional approach.
 */

// Main service functions
export {
    initializeWhatsAppService,
    getServiceInstance,
    handleIncomingMessage,
    handleStatusUpdate,
    sendTextMessage,
    sendTemplate,
    markAsRead,
    handleWebhookPayload,
    getWhatsAppClient,
    updateServiceConfig
} from './whatsapp-service';

// Individual module functions for advanced usage
export {
    initializeWebhookService,
    processIncomingMessage,
    processWebhookPayload,
    WebhookServiceConfig,
    WebhookServiceInstance
} from './webhook-processor';

export {
    processStatusUpdate,
    handleMessageSent,
    handleMessageDelivered,
    handleMessageRead,
    handleMessageFailed
} from './status-handlers';

export {
    sendTextReply,
    sendTemplateMessage,
    markMessageAsRead,
    storeOutgoingMessage,
    sendAndStoreTextReply
} from './response-sender';

export {
    formatErrorForTestMode,
    sendErrorResponse
} from './error-handler';

export {
    handleTextMessage,
    handleMediaMessage,
    handleLocationMessage,
    handleContactMessage
} from './message-handlers';

export {
    isMediaMessage,
    getMediaInfo,
    processAndStoreMediaSafely,
    processImageAnalysis,
    generateImageAgentContent
} from './media-processor';

// Types and utilities
export * from './types';
export * from './utils'; 