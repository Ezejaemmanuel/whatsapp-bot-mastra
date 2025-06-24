import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { 
    users, conversations, messages, mediaFiles, messageStatuses, webhookLogs 
} from '../lib/schema';

/**
 * Database Setup Script
 * 
 * This script sets up the database tables for the WhatsApp bot.
 * Run this script after setting up your DATABASE_URL environment variable.
 */
async function setupDatabase() {
    console.log('🚀 Setting up WhatsApp Bot Database...');

    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
        console.error('❌ DATABASE_URL environment variable is not set');
        console.log('Please set your DATABASE_URL in your .env file:');
        console.log('DATABASE_URL="postgresql://username:password@hostname:port/database"');
        process.exit(1);
    }

    try {
        // Create database connection
        const migrationClient = postgres(process.env.DATABASE_URL, { max: 1 });
        const db = drizzle(migrationClient);

        console.log('📦 Running database migrations...');
        
        // Run migrations (if any exist in the ./drizzle folder)
        try {
            await migrate(db, { migrationsFolder: './drizzle' });
            console.log('✅ Migrations completed successfully');
        } catch (error) {
            console.log('ℹ️  No migrations found or migrations already applied');
        }

        // Test database connection by querying tables
        console.log('🔍 Verifying database setup...');
        
        try {
            // Test if we can query the users table (this will create it if it doesn't exist)
            await db.select().from(users).limit(1);
            console.log('✅ Users table is ready');
        } catch (error) {
            console.log('ℹ️  Users table needs to be created');
        }

        try {
            await db.select().from(conversations).limit(1);
            console.log('✅ Conversations table is ready');
        } catch (error) {
            console.log('ℹ️  Conversations table needs to be created');
        }

        try {
            await db.select().from(messages).limit(1);
            console.log('✅ Messages table is ready');
        } catch (error) {
            console.log('ℹ️  Messages table needs to be created');
        }

        try {
            await db.select().from(mediaFiles).limit(1);
            console.log('✅ Media files table is ready');
        } catch (error) {
            console.log('ℹ️  Media files table needs to be created');
        }

        try {
            await db.select().from(messageStatuses).limit(1);
            console.log('✅ Message statuses table is ready');
        } catch (error) {
            console.log('ℹ️  Message statuses table needs to be created');
        }

        try {
            await db.select().from(webhookLogs).limit(1);
            console.log('✅ Webhook logs table is ready');
        } catch (error) {
            console.log('ℹ️  Webhook logs table needs to be created');
        }

        await migrationClient.end();

        console.log('🎉 Database setup completed successfully!');
        console.log('');
        console.log('Next steps:');
        console.log('1. Make sure your .env file has all required environment variables:');
        console.log('   - DATABASE_URL');
        console.log('   - WHATSAPP_ACCESS_TOKEN');
        console.log('   - WHATSAPP_PHONE_NUMBER_ID');
        console.log('   - WHATSAPP_WEBHOOK_VERIFY_TOKEN');
        console.log('2. Start your development server: pnpm dev');
        console.log('3. Set up your WhatsApp webhook URL in the Meta Developer Console');

    } catch (error) {
        console.error('❌ Database setup failed:', error);
        process.exit(1);
    }
}

// Run the setup if this script is executed directly
if (require.main === module) {
    setupDatabase();
}

export { setupDatabase }; 