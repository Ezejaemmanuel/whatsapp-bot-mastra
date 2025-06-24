import { MediaUploadService } from '@/lib/media-upload-service';

/**
 * Example usage of MediaUploadService with UploadThing
 */
async function exampleMediaUpload() {
    // Initialize the service
    const mediaService = new MediaUploadService();

    // Example 1: Process a WhatsApp media message
    console.log('Processing WhatsApp media...');

    const mediaId = 'example_media_id_123';
    const fileName = 'whatsapp_image.jpg';
    const mimeType = 'image/jpeg';
    const sha256 = 'example_sha256_hash';

    const result = await mediaService.processMediaMessage(
        mediaId,
        fileName,
        mimeType,
        sha256
    );

    if (result.success) {
        console.log('✅ Media uploaded successfully!');
        console.log('📁 File name:', result.fileName);
        console.log('🔗 CDN URL:', result.storedUrl);
        console.log('📏 File size:', result.fileSize, 'bytes');

        // The storedUrl is now a permanent UploadThing CDN URL like:
        // https://uploadthing-prod.s3.us-west-2.amazonaws.com/abc123.jpg

    } else {
        console.error('❌ Media upload failed:', result.error);
    }

    // Example 2: Get media info from WhatsApp
    console.log('\nGetting media info...');

    const mediaInfo = await mediaService.getMediaInfo(mediaId);

    if (mediaInfo.success) {
        console.log('📋 Media URL from WhatsApp:', mediaInfo.url);
    } else {
        console.error('❌ Failed to get media info:', mediaInfo.error);
    }

    // Example 3: List all uploaded files
    console.log('\nListing uploaded files...');

    const filesList = await mediaService.listFiles();

    if (filesList.success && filesList.files) {
        console.log('📂 Total files:', filesList.files.length);
        filesList.files.forEach((file, index) => {
            console.log(`${index + 1}. ${file.name} (${file.size} bytes) - Status: ${file.status}`);
        });
    } else {
        console.error('❌ Failed to list files:', filesList.error);
    }

    // Example 4: Delete a file (using file key)
    console.log('\nDeleting a file...');

    const fileKey = 'example_file_key_to_delete';
    const deleteResult = await mediaService.deleteFile(fileKey);

    if (deleteResult.success) {
        console.log('🗑️ File deleted successfully');
    } else {
        console.error('❌ Failed to delete file:', deleteResult.error);
    }
}

/**
 * Example of handling WhatsApp webhook media messages
 */
async function handleWhatsAppMediaWebhook(webhookData: any) {
    const mediaService = new MediaUploadService();

    // Extract media information from webhook
    const message = webhookData.entry[0].changes[0].value.messages[0];

    if (message.type === 'image') {
        const { id: mediaId, mime_type: mimeType, sha256 } = message.image;

        const result = await mediaService.processMediaMessage(
            mediaId,
            `whatsapp_image_${Date.now()}.jpg`,
            mimeType,
            sha256
        );

        if (result.success) {
            console.log('Image uploaded to UploadThing:', result.storedUrl);

            // Store the CDN URL in your database
            // await saveMediaToDatabase({
            //     whatsapp_media_id: mediaId,
            //     cdn_url: result.storedUrl,
            //     file_name: result.fileName,
            //     file_size: result.fileSize,
            //     mime_type: mimeType
            // });

            return result.storedUrl;
        }
    }

    // Handle other media types (video, audio, document)
    if (message.type === 'video') {
        const { id: mediaId, mime_type: mimeType, sha256 } = message.video;
        // Process video...
    }

    if (message.type === 'audio') {
        const { id: mediaId, mime_type: mimeType, sha256 } = message.audio;
        // Process audio...
    }

    if (message.type === 'document') {
        const { id: mediaId, mime_type: mimeType, sha256, filename } = message.document;
        // Process document...
    }
}

/**
 * Key Benefits of UploadThing Integration:
 * 
 * 1. 🌐 CDN URLs: Files are served from a global CDN for fast access
 * 2. 🔒 Security: Built-in file validation and security scanning
 * 3. 📱 No Server Load: Your server doesn't serve files anymore
 * 4. 🚀 Scalability: No local storage management needed
 * 5. 🔄 Reliability: Files are stored redundantly in the cloud
 * 6. 📊 Analytics: Built-in upload analytics and monitoring
 * 7. 🎨 Optimization: Automatic image optimization and resizing
 * 8. 💾 Storage: No disk space concerns on your server
 */

// Export the example functions
export { exampleMediaUpload, handleWhatsAppMediaWebhook }; 