import { v } from "convex/values";

/**
 * Convex schema unions and corresponding TypeScript types
 */

/** Conversation status */
export const ConversationStatusUnion = v.union(
    v.literal("active"),
    v.literal("archived"),
    v.literal("closed")
);
export type ConversationStatus = "active" | "archived" | "closed";

/** Who's in charge of conversation */
export const InChargeUnion = v.union(
    v.literal("bot"),
    v.literal("admin")
);
export type InCharge = "bot" | "admin";

/** Message direction */
export const MessageDirectionUnion = v.union(
    v.literal("inbound"),
    v.literal("outbound")
);
export type MessageDirection = "inbound" | "outbound";

/** Message sender role */
export const SenderRoleUnion = v.union(
    v.literal("user"),
    v.literal("bot"),
    v.literal("admin")
);
export type SenderRole = "user" | "bot" | "admin";

/** Message type */
export const MessageTypeUnion = v.union(
    v.literal("text"),
    v.literal("image"),
    v.literal("audio"),
    v.literal("video"),
    v.literal("document"),
    v.literal("location"),
    v.literal("contact"),
    v.literal("system")
);
export type MessageType = "text" | "image" | "audio" | "video" | "document" | "location" | "contact" | "system";

/** Message status */
export const MessageStatusUnion = v.union(
    v.literal("sent"),
    v.literal("delivered"),
    v.literal("read"),
    v.literal("failed")
);
export type MessageStatus = "sent" | "delivered" | "read" | "failed";

/** Upload status */
export const UploadStatusUnion = v.union(
    v.literal("pending"),
    v.literal("uploaded"),
    v.literal("failed")
);
export type UploadStatus = "pending" | "uploaded" | "failed";

/** Transaction status */
export const TransactionStatusUnion = v.union(
    v.literal("pending"),
    v.literal("paid"),
    v.literal("verified"),
    v.literal("completed"),
    v.literal("failed"),
    v.literal("cancelled"),
    v.literal("image_sent_waiting_for_confirmation")
);
export type TransactionStatus = "pending" | "paid" | "verified" | "completed" | "failed" | "cancelled" | "image_sent_waiting_for_confirmation"; 