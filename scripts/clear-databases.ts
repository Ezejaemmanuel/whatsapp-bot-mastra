import { Redis } from '@upstash/redis';
import { Index } from '@upstash/vector';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const UPSTASH_VECTOR_REST_URL = process.env.UPSTASH_VECTOR_REST_URL;
const UPSTASH_VECTOR_REST_TOKEN = process.env.UPSTASH_VECTOR_REST_TOKEN;

/**
 * Script to clear all data from both Redis and Vector databases
 * Use with caution - this will permanently delete all stored data!
 */
async function clearAllDatabases(): Promise<void> {
    try {
        console.log('🚀 Starting database cleanup process...');

        // Validate environment variables
        if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
            throw new Error('❌ UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables are required');
        }

        if (!UPSTASH_VECTOR_REST_URL || !UPSTASH_VECTOR_REST_TOKEN) {
            throw new Error('❌ UPSTASH_VECTOR_REST_URL and UPSTASH_VECTOR_REST_TOKEN environment variables are required');
        }

        console.log('✅ Environment variables validated');

        // Initialize Redis client directly
        console.log('📡 Connecting to Redis...');
        const redis = new Redis({
            url: UPSTASH_REDIS_REST_URL,
            token: UPSTASH_REDIS_REST_TOKEN,
        });

        // Initialize Vector client directly
        console.log('🔍 Connecting to Vector database...');
        const vector = new Index({
            url: UPSTASH_VECTOR_REST_URL,
            token: UPSTASH_VECTOR_REST_TOKEN,
        });

        // Clear Redis data
        console.log('🧹 Clearing Redis data...');
        try {
            // Get all keys first to show what we're deleting
            const allKeys = await redis.keys('*');
            console.log(`📊 Found ${allKeys.length} keys in Redis`);

            if (allKeys.length > 0) {
                console.log('🗑️ Sample keys to be deleted:', allKeys.slice(0, 5));

                // Clear all data using FLUSHALL command
                await redis.flushall();
                console.log('✅ Redis data cleared successfully');
            } else {
                console.log('ℹ️ Redis database is already empty');
            }
        } catch (error) {
            console.error('❌ Error clearing Redis data:', error);
            throw error;
        }

        // Clear Vector database
        console.log('🧹 Clearing Vector database...');
        try {
            // Get vector stats first
            const info = await vector.info();
            console.log('📊 Vector database stats:', info);

            // Reset/clear the vector database
            await vector.reset();
            console.log('✅ Vector database cleared successfully');
        } catch (error) {
            console.error('❌ Error clearing Vector database:', error);
            console.log('ℹ️ This might be normal if no vector data exists yet');
        }

        console.log('🎉 All databases cleared successfully!');
        console.log('⚠️  All conversation history, memory, and embeddings have been deleted.');

    } catch (error) {
        console.error('💥 Failed to clear databases:', error);
        process.exit(1);
    }
}

/**
 * Main execution with confirmation prompt
 */
async function main(): Promise<void> {
    const args = process.argv.slice(2);
    const forceFlag = args.includes('--force') || args.includes('-f');

    if (!forceFlag) {
        console.log('⚠️  WARNING: This will permanently delete ALL data from Redis and Vector databases!');
        console.log('📋 This includes:');
        console.log('   - All conversation history');
        console.log('   - All memory data');
        console.log('   - All vector embeddings');
        console.log('   - All cached data');
        console.log('');
        console.log('💡 To proceed, run this script with --force flag:');
        console.log('   pnpm tsx scripts/clear-databases.ts --force');
        console.log('');
        process.exit(0);
    }

    console.log('🔥 Force flag detected - proceeding with database cleanup...');
    await clearAllDatabases();
}

// Execute the script when run directly (ES modules)
const isRunningDirectly = import.meta.url === `file://${process.argv[1]}` ||
    process.argv[1]?.includes('clear-databases.ts');

if (isRunningDirectly) {
    main().catch((error) => {
        console.error('💥 Script execution failed:', error);
        process.exit(1);
    });
}

export { clearAllDatabases }; 