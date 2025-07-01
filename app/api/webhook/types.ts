/**
 * WhatsApp Webhook Types
 * 
 * Comprehensive TypeScript interfaces for WhatsApp Cloud API webhook payloads
 */

// Base webhook interfaces
export interface WebhookPayload {
    object: 'whatsapp_business_account';
    entry: WebhookEntry[];
}

export interface WebhookEntry {
    id: string;
    changes: WebhookChange[];
}

export interface WebhookChange {
    value: WebhookChangeValue;
    field: string;
}

export interface WebhookChangeValue {
    messaging_product: string;
    metadata: WebhookMetadata;
    contacts?: WebhookContact[];
    messages?: WebhookMessage[];
    statuses?: WebhookMessageStatus[];
    errors?: WebhookError[];
}

export interface WebhookMetadata {
    display_phone_number: string;
    phone_number_id: string;
}

// Contact interfaces
export interface WebhookContact {
    profile: {
        name: string;
    };
    wa_id: string;
}

// Message interfaces
export interface WebhookMessage {
    id: string;
    from: string;
    timestamp: string;
    type: WebhookMessageType;
    context?: WebhookMessageContext;
    text?: WebhookTextMessage;
    image?: WebhookMediaMessage;
    audio?: WebhookMediaMessage;
    video?: WebhookMediaMessage;
    document?: WebhookDocumentMessage;
    sticker?: WebhookMediaMessage;
    location?: WebhookLocationMessage;
    contacts?: WebhookContactMessage[];
    interactive?: WebhookInteractiveMessage;
    button?: WebhookButtonMessage;
    system?: WebhookSystemMessage;
    errors?: WebhookError[];
}

export type WebhookMessageType =
    | 'text'
    | 'image'
    | 'audio'
    | 'video'
    | 'document'
    | 'sticker'
    | 'location'
    | 'contacts'
    | 'interactive'
    | 'button'
    | 'system'
    | 'unknown';

export interface WebhookMessageContext {
    forwarded?: boolean;
    frequently_forwarded?: boolean;
    from?: string;
    id?: string;
}

export interface WebhookTextMessage {
    body: string;
}

export interface WebhookMediaMessage {
    id: string;
    mime_type: string;
    sha256: string;
    caption?: string;
}

export interface WebhookDocumentMessage extends WebhookMediaMessage {
    filename?: string;
}

export interface WebhookLocationMessage {
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
}

export interface WebhookContactMessage {
    name: {
        formatted_name: string;
        first_name?: string;
        last_name?: string;
    };
    phones?: Array<{
        phone: string;
        type?: string;
    }>;
    emails?: Array<{
        email: string;
        type?: string;
    }>;
}

export interface WebhookInteractiveMessage {
    type: 'button_reply' | 'list_reply';
    button_reply?: {
        id: string;
        title: string;
    };
    list_reply?: {
        id: string;
        title: string;
        description?: string;
    };
}

export interface WebhookButtonMessage {
    payload: string;
    text: string;
}

export interface WebhookSystemMessage {
    body: string;
    identity?: string;
    new_wa_id?: string;
    type: 'user_changed_number' | 'user_identity_changed';
    user?: string;
}

// Status interfaces
export interface WebhookMessageStatus {
    id: string;
    status: WebhookMessageStatusType;
    timestamp: string;
    recipient_id: string;
    conversation?: WebhookConversation;
    pricing?: WebhookPricing;
    errors?: WebhookError[];
}

export type WebhookMessageStatusType =
    | 'sent'
    | 'delivered'
    | 'read'
    | 'failed';

export interface WebhookConversation {
    id: string;
    expiration_timestamp?: string;
    origin: {
        type: 'business_initiated' | 'user_initiated';
    };
}

export interface WebhookPricing {
    billable: boolean;
    pricing_model: string;
    category: string;
}

// Error interfaces
export interface WebhookError {
    code: number;
    title: string;
    message?: string;
    error_data?: {
        details: string;
    };
}

// Processed data interfaces
export interface ProcessedWebhookData {
    object: string;
    entries: ProcessedWebhookEntry[];
    totalMessages: number;
    totalStatuses: number;
    businessAccounts: string[];
    phoneNumbers: string[];
}

export interface ProcessedWebhookEntry {
    id: string;
    changes: ProcessedWebhookChange[];
}

export interface ProcessedWebhookChange {
    field: string;
    value: WebhookChangeValue;
}



// Verification interfaces
export interface WebhookVerificationParams {
    mode: string | null;
    token: string | null;
    challenge: string | null;
}

// Error types for better error handling
export interface WebhookProcessingError extends Error {
    code?: string;
    statusCode?: number;
    details?: any;
}

// Type guards
export function isWebhookPayload(payload: any): payload is WebhookPayload {
    return (
        payload &&
        typeof payload === 'object' &&
        payload.object === 'whatsapp_business_account' &&
        Array.isArray(payload.entry)
    );
}

export function isWebhookMessage(obj: any): obj is WebhookMessage {
    return (
        obj &&
        typeof obj === 'object' &&
        typeof obj.id === 'string' &&
        typeof obj.from === 'string' &&
        typeof obj.timestamp === 'string' &&
        typeof obj.type === 'string'
    );
}

export function isWebhookMessageStatus(obj: any): obj is WebhookMessageStatus {
    return (
        obj &&
        typeof obj === 'object' &&
        typeof obj.id === 'string' &&
        typeof obj.status === 'string' &&
        typeof obj.timestamp === 'string' &&
        typeof obj.recipient_id === 'string'
    );
}

export function isWebhookError(obj: any): obj is WebhookError {
    return (
        obj &&
        typeof obj === 'object' &&
        typeof obj.code === 'number' &&
        typeof obj.title === 'string'
    );
} 