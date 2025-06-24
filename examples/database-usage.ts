import { DatabaseService } from '../lib/database-service';

/**
 * Example usage of the DatabaseService
 * 
 * This file demonstrates how to use the database service to query
 * and manipulate WhatsApp conversation data.
 */

async function exampleUsage() {
    const dbService = new DatabaseService();

    try {
        console.log('🔍 Database Service Examples\n');

        // 1. Get or create a user
        console.log('1. Creating/Getting a user...');
        const user = await dbService.getOrCreateUser(
            '1234567890', // WhatsApp ID
            'John Doe',   // Profile name
            '+1234567890' // Phone number
        );
        console.log('User:', user);
        console.log('');

        // 2. Get or create a conversation
        console.log('2. Creating/Getting a conversation...');
        const conversation = await dbService.getOrCreateConversation(user.id);
        console.log('Conversation:', conversation);
        console.log('');

        // 3. Get conversation history
        console.log('3. Getting conversation history...');
        const messages = await dbService.getConversationHistory(conversation.id, 10);
        console.log(`Found ${messages.length} messages in conversation`);
        messages.forEach((message, index) => {
            console.log(`Message ${index + 1}:`, {
                id: message.id,
                direction: message.direction,
                type: message.messageType,
                content: message.content?.substring(0, 50) + (message.content && message.content.length > 50 ? '...' : ''),
                timestamp: message.timestamp
            });
        });
        console.log('');

        // 4. Get user conversations
        console.log('4. Getting user conversations...');
        const userConversations = await dbService.getUserConversations(user.id);
        console.log(`User has ${userConversations.length} conversations`);
        userConversations.forEach((conv, index) => {
            console.log(`Conversation ${index + 1}:`, {
                id: conv.id,
                status: conv.status,
                lastMessageAt: conv.lastMessageAt,
                createdAt: conv.createdAt
            });
        });
        console.log('');

        // 5. Store a sample outgoing message
        console.log('5. Storing a sample outgoing message...');
        const outgoingMessage = await dbService.storeOutgoingMessage(
            user.whatsappId,
            'text',
            'Hello! This is a test message from the bot.',
            conversation.id
        );
        console.log('Stored message:', {
            id: outgoingMessage.id,
            content: outgoingMessage.content,
            direction: outgoingMessage.direction,
            timestamp: outgoingMessage.timestamp
        });
        console.log('');

        // 6. Log a webhook event
        console.log('6. Logging a webhook event...');
        const logEntry = await dbService.logWebhookEvent(
            'INFO',
            'Example webhook event logged',
            { example: true, timestamp: new Date().toISOString() },
            'DatabaseUsageExample'
        );
        console.log('Log entry:', {
            id: logEntry.id,
            level: logEntry.level,
            message: logEntry.message,
            timestamp: logEntry.timestamp
        });
        console.log('');

        console.log('✅ All examples completed successfully!');

    } catch (error) {
        console.error('❌ Error in database examples:', error);
    }
}

// Advanced query examples
async function advancedQueries() {
    console.log('\n🚀 Advanced Database Queries\n');

    const dbService = new DatabaseService();

    try {
        // Example: Find all media messages in the last 24 hours
        console.log('Finding recent media messages...');
        // Note: This would require custom SQL queries with Drizzle
        // For now, we'll show how to get recent messages and filter

        // You can extend the DatabaseService with custom methods like:
        /*
        async getRecentMediaMessages(hours: number = 24): Promise<Message[]> {
            const cutoffTime = new Date(Date.now() - (hours * 60 * 60 * 1000));
            return await database
                .select()
                .from(messages)
                .where(and(
                    gte(messages.timestamp, cutoffTime),
                    inArray(messages.messageType, ['image', 'audio', 'video', 'document'])
                ))
                .orderBy(desc(messages.timestamp));
        }
        */

        console.log('💡 Tip: Extend the DatabaseService class with custom query methods for your specific needs!');

    } catch (error) {
        console.error('❌ Error in advanced queries:', error);
    }
}

// Run examples if this file is executed directly
if (require.main === module) {
    console.log('Running database usage examples...\n');

    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
        console.error('❌ DATABASE_URL environment variable is not set');
        console.log('Please set your DATABASE_URL and try again.');
        process.exit(1);
    }

    exampleUsage()
        .then(() => advancedQueries())
        .then(() => {
            console.log('\n🎉 All examples completed!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Examples failed:', error);
            process.exit(1);
        });
}

export { exampleUsage, advancedQueries }; 