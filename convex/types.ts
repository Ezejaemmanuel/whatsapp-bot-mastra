/**
 * Type definitions for schema unions
 */

export type TransactionStatus =
    | "pending"
    | "paid"
    | "verified"
    | "completed"
    | "failed"
    | "cancelled";

export type ConversationStatus =
    | "active"
    | "archived"
    | "closed";

export type MessageDirection =
    | "inbound"
    | "outbound";

export type SenderRole =
    | "user"
    | "bot"
    | "admin";

export type MessageType =
    | "text"
    | "image"
    | "audio"
    | "video"
    | "document"
    | "location"
    | "contact"
    | "system";

export type MessageStatus =
    | "sent"
    | "delivered"
    | "read"
    | "failed";

export type UploadStatus =
    | "pending"
    | "uploaded"
    | "failed"; 


export type InCharge =
    | "bot"
    | "admin";