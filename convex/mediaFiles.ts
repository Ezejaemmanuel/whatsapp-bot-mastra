import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";
import type { Id, Doc } from "./_generated/dataModel";
import { UploadStatusUnion, UploadStatus } from "./schemaUnions";

/**
 * Generates a short-lived upload URL for client-side uploads
 */
export const generateUploadUrl = mutation({
    args: {},
    handler: async (ctx) => {
        return await ctx.storage.generateUploadUrl();
    },
});

/**
 * Store file directly from buffer (for server-side uploads) - Complete Action
 * This function handles both file storage and metadata saving in one operation
 */
export const storeFileFromBuffer = action({
    args: {
        fileData: v.bytes(),
        fileName: v.string(),
        contentType: v.optional(v.string()),
        messageId: v.optional(v.id("messages")),
        whatsappMediaId: v.optional(v.string()),
        sha256: v.optional(v.string()),
        metadata: v.optional(v.any()),
    },
    handler: async (ctx, args): Promise<{
        _id: Id<"mediaFiles">;
        _creationTime: number;
        storageId: Id<"_storage">;
        messageId?: Id<"messages">;
        whatsappMediaId?: string;
        fileName: string;
        mimeType?: string;
        fileSize: number;
        sha256?: string;
        uploadStatus: UploadStatus;
        metadata?: any;
        storedUrl: string;
    } | null> => {
        try {
            // Check if file with this WhatsApp media ID already exists
            if (args.whatsappMediaId) {
                const existingFile = await ctx.runQuery(api.mediaFiles.getMediaFileByWhatsAppId, {
                    whatsappMediaId: args.whatsappMediaId
                });

                if (existingFile) {
                    console.log('File already exists with WhatsApp media ID:', args.whatsappMediaId);
                    // Return existing file with proper type structure
                    return {
                        _id: existingFile._id,
                        _creationTime: existingFile._creationTime,
                        storageId: existingFile.storageId!,
                        messageId: existingFile.messageId,
                        whatsappMediaId: existingFile.whatsappMediaId,
                        fileName: existingFile.fileName || args.fileName,
                        mimeType: existingFile.mimeType,
                        fileSize: existingFile.fileSize || 0,
                        sha256: existingFile.sha256,
                        uploadStatus: existingFile.uploadStatus || "uploaded" as UploadStatus,
                        metadata: existingFile.metadata,
                        storedUrl: existingFile.storedUrl || "",
                    };
                }
            }

            // Store the file in Convex storage
            const blob = new Blob([args.fileData], { type: args.contentType || "application/octet-stream" });
            const storageId = await ctx.storage.store(blob);

            // Get the file URL immediately
            const fileUrl = await ctx.storage.getUrl(storageId);

            if (!fileUrl) {
                throw new Error('Failed to get file URL from storage');
            }

            const status: UploadStatus = "uploaded";

            // Store metadata in database with the file URL
            const mediaFileId = await ctx.runMutation(api.mediaFiles.insertMediaFileRecord, {
                storageId,
                messageId: args.messageId,
                whatsappMediaId: args.whatsappMediaId,
                fileName: args.fileName,
                mimeType: args.contentType,
                fileSize: args.fileData.byteLength,
                sha256: args.sha256,
                uploadStatus: status,
                metadata: args.metadata,
                storedUrl: fileUrl, // Store the URL directly in the record
            });

            if (!mediaFileId) {
                // Clean up storage if database insert failed
                await ctx.storage.delete(storageId);
                return null;
            }

            // Return the complete record with URL
            return {
                _id: mediaFileId,
                _creationTime: Date.now(),
                storageId,
                messageId: args.messageId,
                whatsappMediaId: args.whatsappMediaId,
                fileName: args.fileName,
                mimeType: args.contentType,
                fileSize: args.fileData.byteLength,
                sha256: args.sha256,
                uploadStatus: status,
                metadata: args.metadata,
                storedUrl: fileUrl,
            };
        } catch (error) {
            console.error('Error in storeFileFromBuffer:', error);
            return null;
        }
    },
});

/**
 * Insert media file record - Public mutation (used by action above)
 */
export const insertMediaFileRecord = mutation({
    args: {
        storageId: v.id("_storage"),
        messageId: v.optional(v.id("messages")),
        whatsappMediaId: v.optional(v.string()),
        fileName: v.optional(v.string()),
        mimeType: v.optional(v.string()),
        fileSize: v.optional(v.number()),
        sha256: v.optional(v.string()),
        uploadStatus: v.optional(UploadStatusUnion),
        metadata: v.optional(v.any()),
        storedUrl: v.optional(v.string()), // Add storedUrl field
    },
    handler: async (ctx, args) => {
        const status: UploadStatus = args.uploadStatus || "uploaded";
        const mediaFileId = await ctx.db.insert("mediaFiles", {
            storageId: args.storageId,
            messageId: args.messageId,
            whatsappMediaId: args.whatsappMediaId,
            fileName: args.fileName,
            mimeType: args.mimeType,
            fileSize: args.fileSize,
            sha256: args.sha256,
            uploadStatus: status,
            metadata: args.metadata,
            storedUrl: args.storedUrl, // Store the URL in the database
        });

        return mediaFileId;
    },
});

/**
 * Get media file by ID
 */
export const getMediaFileById = query({
    args: { id: v.id("mediaFiles") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

/**
 * Store media file (for compatibility with database service)
 */
export const storeMediaFile = mutation({
    args: {
        messageId: v.optional(v.id("messages")),
        whatsappMediaId: v.optional(v.string()),
        fileName: v.optional(v.string()),
        mimeType: v.optional(v.string()),
        fileSize: v.optional(v.number()),
        sha256: v.optional(v.string()),
        uploadStatus: v.optional(UploadStatusUnion),
        storageId: v.optional(v.id("_storage")),
        storedUrl: v.optional(v.string()), // Add storedUrl field
    },
    handler: async (ctx, args) => {
        const status: UploadStatus = args.uploadStatus || "uploaded";
        const mediaFileId = await ctx.db.insert("mediaFiles", {
            messageId: args.messageId,
            whatsappMediaId: args.whatsappMediaId,
            fileName: args.fileName,
            mimeType: args.mimeType,
            fileSize: args.fileSize,
            sha256: args.sha256,
            uploadStatus: status,
            storageId: args.storageId,
            storedUrl: args.storedUrl, // Store the URL in the database
        });

        return await ctx.db.get(mediaFileId);
    },
});

/**
 * Get file URL from storage ID
 */
export const getFileUrl = query({
    args: { storageId: v.id("_storage") },
    handler: async (ctx, args) => {
        return await ctx.storage.getUrl(args.storageId);
    },
});

/**
 * Get media files by message ID
 */
export const getMediaFilesByMessageId = query({
    args: { messageId: v.id("messages") },
    handler: async (ctx, args) => {
        const mediaFiles = await ctx.db
            .query("mediaFiles")
            .withIndex("by_message_id", (q) => q.eq("messageId", args.messageId))
            .collect();

        // Return files with stored URLs (no need to fetch URLs again if already stored)
        const mediaFilesWithUrls = await Promise.all(
            mediaFiles.map(async (file) => {
                if (file.storedUrl) {
                    return file; // URL already stored in database
                } else if (file.storageId) {
                    // Fallback: get URL from storage if not stored in database
                    const storedUrl = await ctx.storage.getUrl(file.storageId);
                    return { ...file, storedUrl };
                }
                return file;
            })
        );

        return mediaFilesWithUrls;
    },
});

/**
 * Get media file by WhatsApp media ID
 */
export const getMediaFileByWhatsAppId = query({
    args: { whatsappMediaId: v.string() },
    handler: async (ctx, args) => {
        const mediaFile = await ctx.db
            .query("mediaFiles")
            .withIndex("by_whatsapp_media_id", (q) => q.eq("whatsappMediaId", args.whatsappMediaId))
            .first();

        if (!mediaFile) {
            return null;
        }

        // Return file with stored URL (no need to fetch URL again if already stored)
        if (mediaFile.storedUrl) {
            return mediaFile; // URL already stored in database
        } else if (mediaFile.storageId) {
            // Fallback: get URL from storage if not stored in database
            const storedUrl = await ctx.storage.getUrl(mediaFile.storageId);
            return { ...mediaFile, storedUrl };
        }

        return mediaFile;
    },
});

/**
 * Delete file from storage and database
 */
export const deleteMediaFile = mutation({
    args: { mediaFileId: v.id("mediaFiles") },
    handler: async (ctx, args) => {
        const mediaFile = await ctx.db.get(args.mediaFileId);

        if (mediaFile?.storageId) {
            // Delete from storage
            await ctx.storage.delete(mediaFile.storageId);
        }

        // Delete from database
        await ctx.db.delete(args.mediaFileId);

        return { success: true };
    },
});

/**
 * List all files in storage with metadata
 */
export const listAllMediaFiles = query({
    args: { limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        const limit = args.limit || 100;
        const mediaFiles = await ctx.db.query("mediaFiles").take(limit);

        // Return files with stored URLs (no need to fetch URLs again if already stored)
        const filesWithDetails = await Promise.all(
            mediaFiles.map(async (file) => {
                if (file.storedUrl) {
                    return { ...file, storageMetadata: null }; // URL already stored in database
                } else if (file.storageId) {
                    // Fallback: get URL from storage if not stored in database
                    const storedUrl = await ctx.storage.getUrl(file.storageId);
                    const metadata = await ctx.db.system.get(file.storageId);
                    return { ...file, storedUrl, storageMetadata: metadata };
                }
                return file;
            })
        );

        return filesWithDetails;
    },
}); 