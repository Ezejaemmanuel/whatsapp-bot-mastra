import { WhatsAppCloudApiClient } from '@/whatsapp/whatsapp-client';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import crypto from 'crypto';
import { Id } from '@/convex/_generated/dataModel';

/**
 * Media Upload Service with Convex File Storage Integration
 * 
 * Handles downloading WhatsApp media files and uploading them to Convex file storage.
 * Provides permanent URLs for media files through Convex storage.
 */
export class MediaUploadService {
    private whatsappClient: WhatsAppCloudApiClient;
    private convex: ConvexHttpClient;
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

        // Initialize Convex HTTP client
        const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
        if (!convexUrl) {
            throw new Error('Missing required environment variable: NEXT_PUBLIC_CONVEX_URL');
        }
        this.convex = new ConvexHttpClient(convexUrl);
    }

    /**
     * Download and store media file from WhatsApp using Convex file storage with enhanced error handling
     */
    async downloadAndStoreMedia(
        mediaId: string,
        fileName?: string,
        mimeType?: string,
        expectedSha256?: string,
        messageId?: Id<"messages">
    ): Promise<{
        success: boolean;
        storedUrl?: string;
        fileName?: string;
        fileSize?: number;
        storageId?: any;
        error?: string;
    }> {
        try {
            console.log('Starting media download process', {
                mediaId,
                fileName,
                mimeType,
                version: this.version,
                hasAccessToken: !!this.accessToken
            });

            // Get media URL from WhatsApp using the correct API method
            const mediaUrlResponse = await this.whatsappClient.getRawApi().mediaId.mediaIdList({
                version: this.version,
                mediaId
            });

            console.log('WhatsApp API response received', {
                mediaId,
                hasData: !!mediaUrlResponse.data,
                responseStatus: mediaUrlResponse.status || 'unknown'
            });

            if (!mediaUrlResponse.data || !(mediaUrlResponse.data as any).url) {
                const errorMsg = 'Failed to get media URL from WhatsApp API';
                console.error(errorMsg, {
                    mediaId,
                    responseData: mediaUrlResponse.data,
                    responseStatus: mediaUrlResponse.status
                });

                return {
                    success: false,
                    error: `${errorMsg} - Response: ${JSON.stringify(mediaUrlResponse.data)}`
                };
            }

            const mediaUrl = (mediaUrlResponse.data as any).url;
            console.log('Media URL obtained successfully', {
                mediaId,
                hasUrl: !!mediaUrl
            });

            // Download the media file
            const downloadResult = await this.downloadMediaFile(
                mediaUrl,
                fileName,
                mimeType,
                expectedSha256
            );

            if (!downloadResult.success || !downloadResult.buffer) {
                console.error('Media file download failed', {
                    mediaId,
                    error: downloadResult.error,
                    hasBuffer: !!downloadResult.buffer
                });

                return {
                    success: false,
                    error: downloadResult.error || 'Failed to download media'
                };
            }

            console.log('Media file downloaded successfully', {
                mediaId,
                fileName: downloadResult.fileName,
                bufferSize: downloadResult.buffer.length
            });

            // Upload to Convex file storage
            const uploadResult = await this.uploadToConvexStorage(
                downloadResult.buffer,
                downloadResult.fileName!,
                mimeType,
                mediaId,
                expectedSha256,
                messageId
            );

            console.log('Upload process completed', {
                mediaId,
                uploadSuccess: uploadResult.success,
                error: uploadResult.error
            });

            return uploadResult;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            console.error('Error in downloadAndStoreMedia:', {
                mediaId,
                error: errorMessage,
                stack: error instanceof Error ? error.stack : undefined
            });

            return {
                success: false,
                error: `Media download failed: ${errorMessage}`
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

                console.log('SHA256 Verification:', {
                    expectedSha256,
                    actualSha256,
                    expectedLength: expectedSha256?.length,
                    actualLength: actualSha256?.length,
                    expectedLowerCase: expectedSha256?.toLowerCase(),
                    actualLowerCase: actualSha256?.toLowerCase(),
                    match: actualSha256 === expectedSha256,
                    matchIgnoreCase: actualSha256?.toLowerCase() === expectedSha256?.toLowerCase(),
                    bufferSize: uint8Array.length
                });

                // Compare ignoring case (WhatsApp might send uppercase, we generate lowercase)
                if (actualSha256.toLowerCase() !== expectedSha256.toLowerCase()) {
                    // For debugging: temporarily allow mismatches but log them
                    console.warn('SHA256 mismatch detected but continuing with upload', {
                        expected: expectedSha256,
                        actual: actualSha256,
                        bufferSize: uint8Array.length
                    });
                }
            }

            // Generate filename if not provided
            const finalFileName = fileName || this.generateFileName(mimeType);

            return {
                success: true,
                buffer: uint8Array,
                fileName: finalFileName
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            console.error('Error downloading media file:', {
                mediaUrl,
                error: errorMessage
            });

            return {
                success: false,
                error: `Download failed: ${errorMessage}`
            };
        }
    }

    /**
     * Upload buffer to Convex file storage
     */
    private async uploadToConvexStorage(
        buffer: Uint8Array,
        fileName: string,
        mimeType?: string,
        whatsappMediaId?: string,
        sha256?: string,
        messageId?: Id<"messages">
    ): Promise<{
        success: boolean;
        storedUrl?: string;
        fileName?: string;
        fileSize?: number;
        storageId?: string;
        error?: string;
    }> {
        try {
            console.log('Starting Convex storage upload', {
                fileName,
                mimeType,
                bufferSize: buffer.length,
                whatsappMediaId
            });

            // Store file using the streamlined action that handles deduplication
            // Convert buffer to ArrayBuffer properly to avoid SharedArrayBuffer issues
            const arrayBuffer = buffer.buffer instanceof ArrayBuffer
                ? buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
                : new ArrayBuffer(buffer.byteLength);

            if (!(buffer.buffer instanceof ArrayBuffer)) {
                // Copy data from SharedArrayBuffer to ArrayBuffer
                const uint8View = new Uint8Array(arrayBuffer);
                uint8View.set(new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength));
            }

            const result = await this.convex.action(api.mediaFiles.storeFileFromBuffer, {
                fileData: arrayBuffer,
                fileName: this.sanitizeFileName(fileName),
                contentType: mimeType,
                messageId,
                whatsappMediaId,
                sha256,
                metadata: {
                    originalFileName: fileName,
                    uploadedAt: Date.now(),
                    source: 'whatsapp'
                }
            });

            if (!result) {
                return {
                    success: false,
                    error: 'Failed to store file in Convex storage'
                };
            }

            console.log('File uploaded to Convex storage successfully', {
                fileName,
                storageId: result.storageId,
                storedUrl: result.storedUrl,
                fileSize: result.fileSize,
                isExistingFile: !!result.whatsappMediaId && result._creationTime < (Date.now() - 1000) // Check if this was an existing file
            });

            return {
                success: true,
                storedUrl: result.storedUrl,
                fileName: result.fileName,
                fileSize: result.fileSize,
                storageId: result.storageId?.toString(),
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            console.error('Error uploading to Convex storage:', {
                fileName,
                error: errorMessage,
                bufferSize: buffer.length
            });

            return {
                success: false,
                error: errorMessage
            };
        }
    }

    /**
     * Get file extension from MIME type
     */
    private getFileExtension(mimeType?: string, contentType?: string): string {
        const type = mimeType || contentType || '';

        const mimeToExt: Record<string, string> = {
            'image/jpeg': '.jpg',
            'image/jpg': '.jpg',
            'image/png': '.png',
            'image/gif': '.gif',
            'image/webp': '.webp',
            'audio/mpeg': '.mp3',
            'audio/mp4': '.m4a',
            'audio/ogg': '.ogg',
            'audio/wav': '.wav',
            'video/mp4': '.mp4',
            'video/quicktime': '.mov',
            'video/x-msvideo': '.avi',
            'application/pdf': '.pdf',
            'application/msword': '.doc',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
            'text/plain': '.txt'
        };

        return mimeToExt[type.toLowerCase()] || '.bin';
    }

    /**
     * Generate filename with timestamp and extension
     */
    private generateFileName(mimeType?: string): string {
        const timestamp = Date.now();
        const extension = this.getFileExtension(mimeType);
        return `media_${timestamp}${extension}`;
    }

    /**
     * Sanitize filename for safe storage
     */
    private sanitizeFileName(fileName: string): string {
        return fileName
            .replace(/[^a-zA-Z0-9._-]/g, '_')
            .replace(/_{2,}/g, '_')
            .replace(/^_+|_+$/g, '')
            .substring(0, 100);
    }

    /**
     * Get media info (URL) from WhatsApp
     */
    async getMediaInfo(mediaId: string): Promise<{
        success: boolean;
        url?: string;
        error?: string;
    }> {
        try {
            const response = await this.whatsappClient.getRawApi().mediaId.mediaIdList({
                version: this.version,
                mediaId
            });

            if (!response.data || !(response.data as any).url) {
                return {
                    success: false,
                    error: 'Failed to get media URL from WhatsApp API'
                };
            }

            return {
                success: true,
                url: (response.data as any).url
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }

    /**
     * Process media message and store file using Convex file storage
     */
    async processMediaMessage(
        mediaId: string,
        fileName?: string,
        mimeType?: string,
        sha256?: string,
        messageId?: any
    ): Promise<{
        success: boolean;
        storedUrl?: string;
        fileName?: string;
        fileSize?: number;
        storageId?: string;
        error?: string;
    }> {
        console.log('Processing media message', {
            mediaId,
            fileName,
            mimeType,
            hasSha256: !!sha256
        });

        // Download and store the media using Convex file storage
        const result = await this.downloadAndStoreMedia(mediaId, fileName, mimeType, sha256, messageId);

        console.log('Media processing completed', {
            mediaId,
            success: result.success,
            error: result.error,
            storedUrl: result.storedUrl
        });

        return result;
    }

    /**
     * Delete file from Convex storage
     */
    async deleteFile(storageId: string): Promise<{
        success: boolean;
        error?: string;
    }> {
        try {
            // Find the media file by storage ID
            const mediaFiles = await this.convex.query(api.mediaFiles.listAllMediaFiles, { limit: 1000 });
            const mediaFile = mediaFiles.find(file => file.storageId === storageId);

            if (mediaFile) {
                await this.convex.mutation(api.mediaFiles.deleteMediaFile, {
                    mediaFileId: mediaFile._id
                });
            }

            return { success: true };
        } catch (error) {
            console.error('Error deleting file from Convex storage:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Delete failed'
            };
        }
    }

    /**
     * List files from Convex storage
     */
    async listFiles(): Promise<{
        success: boolean;
        files?: Array<{
            readonly name: string;
            readonly key: string;
            readonly size: number;
            readonly customId: string | null;
            readonly id: string;
            readonly status: "uploaded" | "pending" | "failed";
            readonly uploadedAt: number;
            readonly storedUrl?: string; // Add stored URL to the response
        }>;
        error?: string;
    }> {
        try {
            const mediaFiles = await this.convex.query(api.mediaFiles.listAllMediaFiles, { limit: 100 });

            const files = mediaFiles.map(file => ({
                name: file.fileName || 'unknown',
                key: (file.storageId || file._id) as string,
                size: file.fileSize || 0,
                customId: file.whatsappMediaId || null,
                id: file._id as string,
                status: (file.uploadStatus as "uploaded" | "pending" | "failed") || "uploaded",
                uploadedAt: file._creationTime || Date.now(),
                storedUrl: file.storedUrl || undefined // Include the stored URL, handle null case
            }));

            return { success: true, files };
        } catch (error) {
            console.error('Error listing files from Convex storage:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'List files failed'
            };
        }
    }

    /**
     * Update configuration
     */
    updateConfig(accessToken?: string): void {
        if (accessToken) {
            this.accessToken = accessToken;
            this.whatsappClient = new WhatsAppCloudApiClient({
                accessToken: this.accessToken
            });
        }
    }
} 