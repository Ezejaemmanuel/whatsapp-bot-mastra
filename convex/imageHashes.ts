import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// Type definitions for image hash operations
type ImageHashRecord = Doc<"imageHashes">;

interface ImageHashWithDistance extends ImageHashRecord {
    hammingDistance: number;
}

/**
 * Store dual hashes (cryptographic + perceptual) for an image
 */
export const storeDualHashes = mutation({
    args: {
        cryptographicHash: v.string(),
        perceptualHash: v.string(),
        imageUrl: v.string(),
        transactionId: v.optional(v.string()),
        paymentReference: v.optional(v.string()),
        userId: v.optional(v.id("users")),
        messageId: v.optional(v.id("messages")),
        metadata: v.optional(v.object({
              imageSize: v.optional(v.number()),
              originalFilename: v.optional(v.string()),
              mimeType: v.optional(v.string()),
              processingTime: v.optional(v.number()),
              detectionMethod: v.optional(v.string()),
              hammingThreshold: v.optional(v.number()),
          })),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("imageHashes", {
            ...args,
            createdAt: Date.now(),
        });
    },
});

/**
 * Find image hash by cryptographic hash (exact duplicate detection)
 */
export const findByCryptoHash = query({
    args: {
        cryptographicHash: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("imageHashes")
            .withIndex("by_cryptographic_hash", (q) => 
                q.eq("cryptographicHash", args.cryptographicHash)
            )
            .first();
    },
});

/**
 * Calculate Hamming distance between two perceptual hashes
 */
function calculateHammingDistance(hash1: string, hash2: string): number {
    if (hash1.length !== hash2.length) {
        throw new Error("Hash lengths must be equal");
    }
    
    let distance = 0;
    for (let i = 0; i < hash1.length; i++) {
        if (hash1[i] !== hash2[i]) {
            distance++;
        }
    }
    return distance;
}

/**
 * Find similar perceptual hashes within a given Hamming distance threshold
 */
export const findSimilarPerceptualHashes = query({
    args: {
        perceptualHash: v.string(),
        maxHammingDistance: v.number(),
    },
    handler: async (ctx, { perceptualHash, maxHammingDistance }) => {
        
        // Get all perceptual hashes from the database
        const allHashes = await ctx.db.query("imageHashes").collect();
        
        // Filter by Hamming distance
        const similarHashes = allHashes.filter((hashRecord: ImageHashRecord) => {
            try {
                const distance = calculateHammingDistance(
                    perceptualHash,
                    hashRecord.perceptualHash
                );
                return distance <= maxHammingDistance && distance > 0; // Exclude exact matches (distance 0)
            } catch (error) {
                console.error('Error calculating Hamming distance:', error);
                return false;
            }
        });
        
        // Sort by similarity (lower distance = more similar)
        return similarHashes
            .map((hashRecord: ImageHashRecord): ImageHashWithDistance => ({
                ...hashRecord,
                hammingDistance: calculateHammingDistance(
                    perceptualHash,
                    hashRecord.perceptualHash
                )
            }))
            .sort((a: ImageHashWithDistance, b: ImageHashWithDistance) => a.hammingDistance - b.hammingDistance);
    },
});

/**
 * Helper query to get all perceptual hashes (used by findSimilarPerceptualHashes)
 */
export const getAllPerceptualHashes = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db
            .query("imageHashes")
            .collect();
    },
});

/**
 * Get image hashes by IDs
 */
export const getByIds = query({
    args: {
        ids: v.array(v.id("imageHashes")),
    },
    handler: async (ctx, args) => {
        const results = [];
        for (const id of args.ids) {
            const hash = await ctx.db.get(id);
            if (hash) {
                results.push(hash);
            }
        }
        return results;
    },
});

/**
 * Delete image hash by ID
 */
export const deleteById = mutation({
    args: {
        id: v.id("imageHashes"),
    },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});