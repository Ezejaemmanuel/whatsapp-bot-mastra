import { api } from "../../../convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";
import { Doc, Id } from "../../../convex/_generated/dataModel";
import crypto from "crypto";
import sharp from "sharp";
import sharpPhash from "sharp-phash";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export interface DuplicateCheckResult {
    isDuplicate: boolean;
    duplicateType?: 'exact' | 'similar';
    originalImageHash?: Doc<"imageHashes"> | ImageHashWithDistance;
    confidence?: number;
    hammingDistance?: number;
}

interface ImageHashWithDistance extends Doc<"imageHashes"> {
    hammingDistance: number;
}

/**
 * Generate SHA-256 cryptographic hash from image buffer
 */
function generateCryptographicHash(imageBuffer: Buffer): string {
    return crypto.createHash('sha256').update(imageBuffer).digest('hex');
}

/**
 * Generate perceptual hash from image buffer using sharp-phash
 */
async function generatePerceptualHash(imageBuffer: Buffer): Promise<string> {
    try {
        // Convert image to standard format for consistent hashing
        const processedBuffer = await sharp(imageBuffer)
            .resize(256, 256, { fit: 'inside' })
            .grayscale()
            .jpeg({ quality: 90 })
            .toBuffer();
        
        return await sharpPhash(processedBuffer);
    } catch (error) {
        console.error('Error generating perceptual hash:', error);
        throw new Error('Failed to generate perceptual hash');
    }
}

/**
 * Check for image duplicates using dual hash approach (cryptographic + perceptual)
 * This function implements the sequential strategy for maximum accuracy and efficiency
 */
export async function checkImageDuplicateAndStore(
    imageBuffer: Buffer,
    imageUrl: string,
    transactionId?: string,
    paymentReference?: string,
    userId?: Id<"users">,
    messageId?: Id<"messages">,
    maxHammingDistance: number = 5
): Promise<DuplicateCheckResult> {
    try {
        console.log('Starting dual hash duplicate detection...');
        
        // Step 1: Generate cryptographic hash (fast)
        const cryptographicHash = generateCryptographicHash(imageBuffer);
        console.log('Generated cryptographic hash:', cryptographicHash.substring(0, 16) + '...');
        
        // Step 2: Check for exact duplicate using cryptographic hash
        const exactDuplicate = await convex.query(api.imageHashes.findByCryptoHash, {
            cryptographicHash
        });
        
        if (exactDuplicate) {
            console.log('Exact duplicate found via cryptographic hash');
            return {
                isDuplicate: true,
                duplicateType: 'exact',
                originalImageHash: exactDuplicate,
                confidence: 1.0, // 100% confidence for exact matches
                hammingDistance: 0
            };
        }
        
        console.log('No exact duplicate found, generating perceptual hash...');
        
        // Step 3: Generate perceptual hash (only if no exact duplicate found)
        const perceptualHash = await generatePerceptualHash(imageBuffer);
        console.log('Generated perceptual hash:', perceptualHash);
        
        // Step 4: Check for similar duplicates using perceptual hash
        const similarDuplicates = await convex.query(api.imageHashes.findSimilarPerceptualHashes, {
            perceptualHash,
            maxHammingDistance
        });
        
        if (similarDuplicates && similarDuplicates.length > 0) {
            const bestMatch = similarDuplicates[0]; // Already sorted by similarity
            const confidence = Math.max(0, 1 - (bestMatch.hammingDistance / maxHammingDistance));
            
            console.log(`Similar duplicate found with Hamming distance: ${bestMatch.hammingDistance}`);
            return {
                isDuplicate: true,
                duplicateType: 'similar',
                originalImageHash: bestMatch,
                confidence,
                hammingDistance: bestMatch.hammingDistance
            };
        }
        
        console.log('No duplicates found, storing new hashes...');
        
        // Step 5: Store both hashes if no duplicates found
        const newHashRecord = await convex.mutation(api.imageHashes.storeDualHashes, {
            cryptographicHash,
            perceptualHash,
            imageUrl,
            transactionId,
            paymentReference,
            userId,
            messageId,
            metadata: {
                imageSize: imageBuffer.length,
                detectionMethod: 'dual-hash',
                hammingThreshold: maxHammingDistance
            }
        });
        
        console.log('Successfully stored new image hashes:', newHashRecord);
        
        return {
            isDuplicate: false
        };
        
    } catch (error) {
        console.error('Error in dual hash duplicate detection:', error);
        throw new Error(`Duplicate detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Utility function to get confidence score description
 */
export function getConfidenceDescription(confidence: number): string {
    if (confidence >= 0.95) return 'Very High';
    if (confidence >= 0.85) return 'High';
    if (confidence >= 0.70) return 'Medium';
    if (confidence >= 0.50) return 'Low';
    return 'Very Low';
}

/**
 * Utility function to validate image buffer
 */
export function validateImageBuffer(buffer: Buffer): boolean {
    if (!buffer || buffer.length === 0) {
        return false;
    }
    
    // Check for common image file signatures
    const signatures = {
        jpeg: [0xFF, 0xD8, 0xFF],
        png: [0x89, 0x50, 0x4E, 0x47],
        gif: [0x47, 0x49, 0x46],
        webp: [0x52, 0x49, 0x46, 0x46]
    };
    
    for (const [format, signature] of Object.entries(signatures)) {
        if (signature.every((byte, index) => buffer[index] === byte)) {
            return true;
        }
    }
    
    return false;
}