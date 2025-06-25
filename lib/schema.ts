import { Id } from "../convex/_generated/dataModel";

/**
 * Convex Schema Types for WhatsApp Bot
 * 
 * These types are inferred from the Convex schema and replace the previous Drizzle types.
 */

// Base document type with Convex ID and timestamps
export interface BaseDocument {
    _id: Id<any>;
    _creationTime: number;
}

// User types
export interface User extends BaseDocument {
    _id: Id<"users">;
    whatsappId: string;
    phoneNumber?: string;
    profileName?: string;
    isBlocked?: boolean;
    metadata?: any;
}

export interface NewUser {
    whatsappId: string;
    phoneNumber?: string;
    profileName?: string;
    isBlocked?: boolean;
    metadata?: any;
}

// Conversation types
export interface Conversation extends BaseDocument {
    _id: Id<"conversations">;
    userId: Id<"users">;
    whatsappConversationId?: string;
    status?: string;
    lastMessageAt?: number;
    metadata?: any;
}

export interface NewConversation {
    userId: Id<"users">;
    whatsappConversationId?: string;
    status?: string;
    lastMessageAt?: number;
    metadata?: any;
}

// Message types
export interface Message extends BaseDocument {
    _id: Id<"messages">;
    conversationId: Id<"conversations">;
    whatsappMessageId?: string;
    direction: string;
    messageType: string;
    content?: string;
    mediaUrl?: string;
    mediaType?: string;
    fileName?: string;
    caption?: string;
    location?: any;
    contacts?: any;
    interactive?: any;
    context?: any;
    status?: string;
    timestamp: number;
    metadata?: any;
    error?: string;
}

export interface NewMessage {
    conversationId: Id<"conversations">;
    whatsappMessageId?: string;
    direction: string;
    messageType: string;
    content?: string;
    mediaUrl?: string;
    mediaType?: string;
    fileName?: string;
    caption?: string;
    location?: any;
    contacts?: any;
    interactive?: any;
    context?: any;
    status?: string;
    timestamp: number;
    metadata?: any;
    error?: string;
}

// MediaFile types
export interface MediaFile extends BaseDocument {
    _id: Id<"mediaFiles">;
    messageId?: Id<"messages">;
    whatsappMediaId?: string;
    storedUrl?: string;
    fileName?: string;
    mimeType?: string;
    fileSize?: number;
    sha256?: string;
    uploadStatus?: string;
    metadata?: any;
}

export interface NewMediaFile {
    messageId?: Id<"messages">;
    whatsappMediaId?: string;
    storedUrl?: string;
    fileName?: string;
    mimeType?: string;
    fileSize?: number;
    sha256?: string;
    uploadStatus?: string;
    metadata?: any;
}

// MessageStatus types
export interface MessageStatus extends BaseDocument {
    _id: Id<"messageStatuses">;
    messageId: Id<"messages">;
    status: string;
    timestamp: number;
    recipientId?: string;
    conversationInfo?: any;
    pricingInfo?: any;
    error?: any;
}

export interface NewMessageStatus {
    messageId: Id<"messages">;
    status: string;
    timestamp: number;
    recipientId?: string;
    conversationInfo?: any;
    pricingInfo?: any;
    error?: any;
}

// WebhookLog types
export interface WebhookLog extends BaseDocument {
    _id: Id<"webhookLogs">;
    level: string;
    source?: string;
    message?: string;
    data?: any;
    timestamp: number;
    processingTimeMs?: number;
    error?: string;
    stack?: string;
}

export interface NewWebhookLog {
    level: string;
    source?: string;
    message?: string;
    data?: any;
    timestamp?: number;
    processingTimeMs?: number;
    error?: string;
    stack?: string;
} 