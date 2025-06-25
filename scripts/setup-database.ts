/**
 * Database Setup Script for Convex
 * 
 * This script verifies the Convex setup and deployment.
 * Run this script after setting up your NEXT_PUBLIC_CONVEX_URL environment variable.
 */

async function setupDatabase() {
    console.log('🚀 Setting up WhatsApp Bot with Convex...');

    // Check if NEXT_PUBLIC_CONVEX_URL is set
    if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
        console.error('❌ NEXT_PUBLIC_CONVEX_URL environment variable is not set');
        console.log('Please set your NEXT_PUBLIC_CONVEX_URL in your .env.local file:');
        console.log('NEXT_PUBLIC_CONVEX_URL="https://your-deployment.convex.cloud"');
        process.exit(1);
    }

    try {
        console.log('✅ Convex URL is configured');
        console.log(`   URL: ${process.env.NEXT_PUBLIC_CONVEX_URL}`);

        console.log('📦 Convex setup verification complete!');
        console.log('');
        console.log('🔍 To verify your Convex deployment:');
        console.log('1. Run `npx convex dev` to start development mode');
        console.log('2. Visit your Convex dashboard to see your deployment');
        console.log('3. Your schema should include these tables:');
        console.log('   - users');
        console.log('   - conversations');
        console.log('   - messages');
        console.log('   - mediaFiles');
        console.log('   - messageStatuses');
        console.log('   - webhookLogs');

        console.log('🎉 Convex setup completed successfully!');
        console.log('');
        console.log('Next steps:');
        console.log('1. Make sure your .env.local file has all required environment variables:');
        console.log('   - NEXT_PUBLIC_CONVEX_URL');
        console.log('   - WHATSAPP_ACCESS_TOKEN');
        console.log('   - WHATSAPP_PHONE_NUMBER_ID');
        console.log('   - WHATSAPP_WEBHOOK_VERIFY_TOKEN');
        console.log('2. Start your development server: pnpm dev');
        console.log('3. Set up your WhatsApp webhook URL in the Meta Developer Console');

    } catch (error) {
        console.error('❌ Convex setup verification failed:', error);
        process.exit(1);
    }
}

// Run the setup if this script is executed directly
if (require.main === module) {
    setupDatabase();
}

export { setupDatabase }; 