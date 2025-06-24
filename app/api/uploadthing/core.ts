import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();

// Fake auth function - you can replace this with your actual auth logic
const auth = (req: Request) => ({ id: "whatsapp-bot" });

// FileRouter for WhatsApp media uploads
export const ourFileRouter = {
    // Define FileRoute for WhatsApp media (images, videos, audio, documents)
    whatsappMediaUploader: f({
        image: {
            maxFileSize: "8MB",
            maxFileCount: 1,
        },
        video: {
            maxFileSize: "16MB",
            maxFileCount: 1,
        },
        audio: {
            maxFileSize: "16MB",
            maxFileCount: 1,
        },
        pdf: {
            maxFileSize: "4MB",
            maxFileCount: 1,
        },
        text: {
            maxFileSize: "64KB",
            maxFileCount: 1,
        },
        blob: {
            maxFileSize: "16MB",
            maxFileCount: 1,
        },
    })
        .middleware(async ({ req }) => {
            // This code runs on your server before upload
            const user = await auth(req);

            // If you throw, the user will not be able to upload
            if (!user) throw new UploadThingError("Unauthorized");

            // Whatever is returned here is accessible in onUploadComplete as `metadata`
            return {
                userId: user.id,
                source: "whatsapp-bot",
                uploadedAt: new Date().toISOString()
            };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            // This code RUNS ON YOUR SERVER after upload
            console.log("WhatsApp media upload complete for userId:", metadata.userId);
            console.log("File URL:", file.ufsUrl);
            console.log("File name:", file.name);
            console.log("File size:", file.size);

            // Return data to be sent to the client
            return {
                uploadedBy: metadata.userId,
                fileUrl: file.ufsUrl,
                fileName: file.name,
                fileSize: file.size,
                uploadedAt: metadata.uploadedAt
            };
        }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;