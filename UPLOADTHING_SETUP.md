# UploadThing Integration Setup Guide

This guide explains how to set up and use UploadThing for handling WhatsApp media files in your bot.

## 🚀 What's Been Set Up

Your WhatsApp bot now uses **UploadThing** instead of local file storage for handling media files. This provides:

- ✅ **CDN URLs**: Files served from a global CDN for fast access
- ✅ **Cloud Storage**: No local disk space management needed
- ✅ **Security**: Built-in file validation and security scanning
- ✅ **Scalability**: Handles any volume of media files
- ✅ **Reliability**: Files stored redundantly in the cloud

## 📁 Files Modified/Created

### New Files:
- `app/api/uploadthing/core.ts` - UploadThing FileRouter configuration
- `app/api/uploadthing/route.ts` - Next.js API route handler
- `src/utils/uploadthing.ts` - UploadThing utility components
- `examples/media-upload-example.ts` - Usage examples

### Modified Files:
- `lib/media-upload-service.ts` - Updated to use UploadThing instead of local storage
- `app/api/webhook/whatsapp-service.ts` - Updated constructor and comments

### Removed Files:
- `app/api/uploads/[...filename]/route.ts` - No longer needed (files served from CDN)

## ⚙️ Environment Setup

### 1. Get Your UploadThing Token

1. Sign up at [https://uploadthing.com](https://uploadthing.com)
2. Create a new project
3. Get your token from the dashboard

### 2. Set Environment Variables

Add to your `.env.local` file:

```bash
# UploadThing Configuration
UPLOADTHING_TOKEN=your_uploadthing_token_here

# WhatsApp Configuration (if not already set)
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
```

## 🔧 How It Works

### Before (Local Storage):
```
WhatsApp Media → Download → Store Locally → Serve via Your Server
```

### Now (UploadThing):
```
WhatsApp Media → Download → Upload to UploadThing → Get Permanent CDN URL
```

## 📝 Usage Examples

### Basic Media Processing

```typescript
import { MediaUploadService } from '@/lib/media-upload-service';

const mediaService = new MediaUploadService();

// Process WhatsApp media
const result = await mediaService.processMediaMessage(
    'media_id_from_whatsapp',
    'image.jpg',
    'image/jpeg',
    'sha256_hash'
);

if (result.success) {
    console.log('CDN URL:', result.storedUrl);
    // Example: https://uploadthing-prod.s3.us-west-2.amazonaws.com/abc123.jpg
}
```

### In Webhook Handler

Your existing webhook code will automatically use UploadThing now. When a media message is received:

1. **Download**: Media is downloaded from WhatsApp
2. **Upload**: File is uploaded to UploadThing CDN
3. **Store**: CDN URL is stored in your database
4. **Access**: Files are accessed via permanent CDN URLs

## 🎛️ FileRouter Configuration

The UploadThing FileRouter (`app/api/uploadthing/core.ts`) is configured to handle:

- **Images**: Up to 4MB (JPEG, PNG, GIF, WebP)
- **Videos**: Up to 16MB (MP4, MOV, WebM)
- **Audio**: Up to 16MB (MP3, M4A, OGG, WAV)
- **Documents**: Up to 4MB (PDF)
- **Text Files**: Up to 64KB (TXT, CSV)
- **Other Files**: Up to 16MB (Generic blob)

## 🔍 File Management

### List Uploaded Files

```typescript
const filesList = await mediaService.listFiles();
if (filesList.success) {
    filesList.files?.forEach(file => {
        console.log(`${file.name} - ${file.size} bytes - Status: ${file.status}`);
    });
}
```

### Delete Files

```typescript
const deleteResult = await mediaService.deleteFile('file_key_here');
if (deleteResult.success) {
    console.log('File deleted successfully');
}
```

## 🗄️ Database Integration

Media files are automatically stored in your database with:

- `whatsapp_media_id`: Original WhatsApp media ID
- `stored_url`: **Permanent UploadThing CDN URL**
- `file_name`: Sanitized filename
- `mime_type`: File MIME type
- `file_size`: File size in bytes
- `sha256`: File hash for integrity

## 🚦 Error Handling

The service includes comprehensive error handling:

- **Download Failures**: WhatsApp API issues
- **Upload Failures**: UploadThing API issues
- **Validation Errors**: File size, type, or integrity issues
- **Network Errors**: Connection problems

All errors are logged and returned with descriptive messages.

## 🔒 Security Features

- **File Validation**: Automatic file type and size validation
- **SHA256 Verification**: File integrity checking
- **Filename Sanitization**: Prevents directory traversal attacks
- **Access Control**: Middleware-based authentication
- **Secure URLs**: CDN URLs with built-in security

## 📊 Benefits Over Local Storage

| Feature | Local Storage | UploadThing |
|---------|---------------|-------------|
| **Storage** | Limited by disk space | Unlimited cloud storage |
| **Performance** | Server bandwidth limited | Global CDN delivery |
| **Reliability** | Single point of failure | Redundant cloud storage |
| **Scalability** | Manual server scaling | Auto-scaling |
| **Maintenance** | File cleanup required | Automatic management |
| **URLs** | Server-dependent | Permanent CDN URLs |
| **Security** | Manual implementation | Built-in security |

## 🛠️ Troubleshooting

### Common Issues:

1. **"Unauthorized" Error**
   - Check your `UPLOADTHING_TOKEN` in environment variables
   - Verify token is valid in UploadThing dashboard

2. **"File Too Large" Error**
   - Check file size limits in `app/api/uploadthing/core.ts`
   - Adjust limits if needed

3. **"Upload Failed" Error**
   - Check network connection
   - Verify UploadThing service status
   - Check file format is supported

### Debug Mode:

Enable detailed logging by checking the console output when processing media files.

## 🔄 Migration Notes

- **No Data Loss**: Existing local files remain untouched
- **New Files**: All new media files will use UploadThing
- **Database**: CDN URLs are stored in the same database fields
- **Backward Compatibility**: Existing code continues to work

## 📞 Support

- **UploadThing Docs**: [https://docs.uploadthing.com](https://docs.uploadthing.com)
- **UploadThing Discord**: Available from their website
- **GitHub Issues**: For bot-specific issues

---

Your WhatsApp bot is now powered by UploadThing for reliable, scalable media handling! 🎉 