import { WhatsAppCloudApiClient } from '@/whatsapp/whatsapp-client';
import { UTApi } from "uploadthing/server";
import crypto from 'crypto';

/**
 * Media Upload Service with UploadThing Integration
 * 
 * Handles downloading WhatsApp media files and uploading them to UploadThing cloud storage.
 * Provides permanent CDN URLs for media files.
 */
export class MediaUploadService {
    private whatsappClient: WhatsAppCloudApiClient;
    private utapi: UTApi;
    private accessToken: string;
    private version: string;

    constructor(accessToken?: string) {
        const envAccessToken = process.env.WHATSAPP_ACCESS_TOKEN;

        if (!accessToken && !envAccessToken) {
            throw new Error('Missing required environment variable: WHATSAPP_ACCESS_TOKEN (WhatsApp Business API access token from Meta Business)');
        }

        this.accessToken = accessToken || envAccessToken || '';
        this.version = process.env.WHATSAPP_API_VERSION || 'v23.0';
        this.whatsappClient = new WhatsAppCloudApiClient({
            accessToken: this.accessToken
        });

        // Initialize UploadThing API
        this.utapi = new UTApi({
            token: process.env.UPLOADTHING_TOKEN,
        });
    }

    /**
     * Download and store media file from WhatsApp using UploadThing
     */
    async downloadAndStoreMedia(
        mediaId: string,
        fileName?: string,
        mimeType?: string,
        expectedSha256?: string
    ): Promise<{
        success: boolean;
        storedUrl?: string;
        fileName?: string;
        fileSize?: number;
        error?: string;
    }> {
        try {
            // Get media URL from WhatsApp using the correct API method
            const mediaUrlResponse = await this.whatsappClient.getRawApi().mediaId.mediaIdList({
                version: this.version,
                mediaId
            });

            if (!mediaUrlResponse.data || !(mediaUrlResponse.data as any).url) {
                return {
                    success: false,
                    error: 'Failed to get media URL from WhatsApp'
                };
            }

            const mediaUrl = (mediaUrlResponse.data as any).url;

            // Download the media file
            const downloadResult = await this.downloadMediaFile(
                mediaUrl,
                fileName,
                mimeType,
                expectedSha256
            );

            if (!downloadResult.success || !downloadResult.buffer) {
                return {
                    success: false,
                    error: downloadResult.error || 'Failed to download media'
                };
            }

            // Upload to UploadThing
            const uploadResult = await this.uploadToUploadThing(
                downloadResult.buffer,
                downloadResult.fileName!,
                mimeType
            );

            return uploadResult;
        } catch (error) {
            console.error('Error in downloadAndStoreMedia:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }

    /**
     * Download media file from URL and return buffer
     */
    private async downloadMediaFile(
        mediaUrl: string,
        fileName?: string,
        mimeType?: string,
        expectedSha256?: string
    ): Promise<{
        success: boolean;
        buffer?: Uint8Array;
        fileName?: string;
        error?: string;
    }> {
        try {
            // Add access token to the request headers
            const response = await fetch(mediaUrl, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            if (!response.ok) {
                return {
                    success: false,
                    error: `Failed to download media: ${response.status} ${response.statusText}`
                };
            }

            const buffer = await response.arrayBuffer();
            const uint8Array = new Uint8Array(buffer);

            // Verify SHA256 if provided
            if (expectedSha256) {
                const hash = crypto.createHash('sha256');
                hash.update(uint8Array);
                const actualSha256 = hash.digest('hex');

                if (actualSha256 !== expectedSha256) {
                    return {
                        success: false,
                        error: 'File integrity check failed: SHA256 mismatch'
                    };
                }
            }

            // Generate filename if not provided
            const timestamp = Date.now();
            const extension = this.getFileExtension(mimeType, response.headers.get('content-type') || undefined);
            const finalFileName = fileName || `whatsapp_media_${timestamp}${extension}`;

            // Sanitize filename
            const sanitizedFileName = this.sanitizeFileName(finalFileName);

            return {
                success: true,
                buffer: uint8Array,
                fileName: sanitizedFileName
            };
        } catch (error) {
            console.error('Error downloading media file:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Download failed'
            };
        }
    }

    /**
     * Upload buffer to UploadThing
     */
    private async uploadToUploadThing(
        buffer: Uint8Array,
        fileName: string,
        mimeType?: string
    ): Promise<{
        success: boolean;
        storedUrl?: string;
        fileName?: string;
        fileSize?: number;
        error?: string;
    }> {
        try {
            // Create a File object from the buffer
            const file = new File([buffer], fileName, {
                type: mimeType || 'application/octet-stream'
            });

            // Upload to UploadThing
            const uploadResult = await this.utapi.uploadFiles([file]);

            if (uploadResult[0]?.data) {
                const uploadedFile = uploadResult[0].data;
                return {
                    success: true,
                    storedUrl: uploadedFile.url,
                    fileName: uploadedFile.name,
                    fileSize: uploadedFile.size
                };
            } else {
                return {
                    success: false,
                    error: uploadResult[0]?.error?.message || 'Upload to UploadThing failed'
                };
            }
        } catch (error) {
            console.error('Error uploading to UploadThing:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'UploadThing upload failed'
            };
        }
    }

    /**
     * Get file extension from MIME type
     */
    private getFileExtension(mimeType?: string, contentType?: string): string {
        const type = mimeType || contentType || '';

        const mimeMap: Record<string, string> = {
            'image/jpeg': '.jpg',
            'image/jpg': '.jpg',
            'image/png': '.png',
            'image/gif': '.gif',
            'image/webp': '.webp',
            'audio/mpeg': '.mp3',
            'audio/mp3': '.mp3',
            'audio/mp4': '.m4a',
            'audio/aac': '.aac',
            'audio/ogg': '.ogg',
            'audio/wav': '.wav',
            'video/mp4': '.mp4',
            'video/mpeg': '.mpeg',
            'video/quicktime': '.mov',
            'video/webm': '.webm',
            'application/pdf': '.pdf',
            'application/msword': '.doc',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
            'application/vnd.ms-excel': '.xls',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
            'text/plain': '.txt',
            'text/csv': '.csv'
        };

        return mimeMap[type.toLowerCase()] || '.bin';
    }

    /**
     * Sanitize filename to prevent directory traversal and invalid characters
     */
    private sanitizeFileName(fileName: string): string {
        // Remove directory traversal attempts
        let sanitized = fileName.replace(/[\/\\]/g, '_');

        // Remove invalid characters for most file systems
        sanitized = sanitized.replace(/[<>:"|?*]/g, '_');

        // Ensure filename is not empty and has reasonable length
        if (!sanitized || sanitized.length === 0) {
            sanitized = `file_${Date.now()}`;
        }

        if (sanitized.length > 255) {
            const extension = sanitized.substring(sanitized.lastIndexOf('.'));
            const name = sanitized.substring(0, sanitized.lastIndexOf('.'));
            sanitized = name.substring(0, 255 - extension.length) + extension;
        }

        return sanitized;
    }

    /**
     * Get media information from WhatsApp
     */
    async getMediaInfo(mediaId: string): Promise<{
        success: boolean;
        url?: string;
        error?: string;
    }> {
        try {
            const mediaUrlResponse = await this.whatsappClient.getRawApi().mediaId.mediaIdList({
                version: this.version,
                mediaId
            });

            return {
                success: true,
                url: (mediaUrlResponse.data as any).url
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get media info'
            };
        }
    }

    /**
     * Process media message and store file using UploadThing
     */
    async processMediaMessage(
        mediaId: string,
        fileName?: string,
        mimeType?: string,
        sha256?: string
    ): Promise<{
        success: boolean;
        storedUrl?: string;
        fileName?: string;
        fileSize?: number;
        error?: string;
    }> {
        try {
            // Generate a unique filename with media ID
            const uniqueFileName = `${mediaId}_${fileName || 'media'}`;

            // Download and store the media using UploadThing
            const downloadResult = await this.downloadAndStoreMedia(
                mediaId,
                uniqueFileName,
                mimeType,
                sha256
            );

            return downloadResult;
        } catch (error) {
            console.error('Error processing media message:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Media processing failed'
            };
        }
    }

    /**
     * Delete file from UploadThing
     */
    async deleteFile(fileKey: string): Promise<{
        success: boolean;
        error?: string;
    }> {
        try {
            await this.utapi.deleteFiles([fileKey]);
            return { success: true };
        } catch (error) {
            console.error('Error deleting file from UploadThing:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'File deletion failed'
            };
        }
    }

    /**
     * List uploaded files
     */
    async listFiles(): Promise<{
        success: boolean;
        files?: readonly {
            readonly name: string;
            readonly key: string;
            readonly size: number;
            readonly customId: string | null;
            readonly id: string;
            readonly status: "Deletion Pending" | "Failed" | "Uploaded" | "Uploading";
            readonly uploadedAt: number;
        }[];
        error?: string;
    }> {
        try {
            const files = await this.utapi.listFiles();
            return {
                success: true,
                files: files.files
            };
        } catch (error) {
            console.error('Error listing files from UploadThing:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to list files'
            };
        }
    }

    /**
     * Update configuration
     */
    updateConfig(accessToken?: string): void {
        if (accessToken) {
            this.accessToken = accessToken;
            this.whatsappClient.updateAccessToken(this.accessToken);
        }
    }
} 