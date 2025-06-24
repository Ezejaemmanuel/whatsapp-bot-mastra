import { generateApi } from 'swagger-typescript-api';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Generate TypeScript API client from WhatsApp Cloud API OpenAPI specification
 */
async function generateTypeScriptApi() {
    try {
        console.log('🚀 Starting TypeScript API generation...');

        // Define file paths
        const openApiJsonPath = join(__dirname, '..', 'whatsapp-cloud-api-openapi.json');
        const outputDir = join(__dirname, '..', 'src', 'api');

        // Check if OpenAPI file exists
        if (!existsSync(openApiJsonPath)) {
            console.error('❌ OpenAPI JSON file not found. Please run the conversion script first:');
            console.error('   pnpm run convert:postman');
            process.exit(1);
        }

        console.log('📖 Reading OpenAPI specification...');
        console.log(`📁 Input file: ${openApiJsonPath}`);
        console.log(`📁 Output directory: ${outputDir}`);

        // Generate TypeScript API
        console.log('🔄 Generating TypeScript API client...');

        const { files } = await generateApi({
            name: 'WhatsAppCloudApi',
            input: openApiJsonPath,
            output: outputDir,

            // Configuration options
            generateClient: true,
            generateRouteTypes: true,
            generateResponses: true,
            generateUnionEnums: true,

            // HTTP client configuration
            httpClientType: 'fetch', // Use fetch API (modern browsers and Node.js 18+)
            defaultResponseAsSuccess: false,
            generateResponseBody: true,

            // TypeScript configuration
            singleHttpClient: true,
            cleanOutput: true,
            extractRequestParams: true,
            extractRequestBody: true,
            extractEnums: true,

            // Naming and structure
            moduleNameIndex: 1,
            moduleNameFirstTag: false,
            disableStrictSSL: false,
            disableProxy: false,

            // Code generation options
            sortTypes: true,
            sortRoutes: true,
            extractResponseError: true,
            extractResponseSuccess: true,

            // Additional options for better code generation
            prettier: {
                printWidth: 120,
                tabWidth: 2,
                trailingComma: 'es5',
                singleQuote: true,
            }
        });

        console.log('✅ TypeScript API generation completed successfully!');
        console.log(`📁 Generated files in: ${outputDir}`);

        // Display generated files
        if (files && files.length > 0) {
            console.log('📄 Generated files:');
            files.forEach((file, index) => {
                console.log(`   ${index + 1}. ${file.name || 'Generated file'}`);
            });
        }

        console.log('\n🎉 Your TypeScript API client is ready!');
        console.log('\n📝 Usage example:');
        console.log(`
import { WhatsAppCloudApi } from './src/api/WhatsAppCloudApi';

// Initialize the API client
const api = new WhatsAppCloudApi({
  baseUrl: 'https://graph.facebook.com',
  securityWorker: (securityData) => {
    // Add your access token here
    return {
      headers: {
        Authorization: \`Bearer \${securityData?.token || 'YOUR_ACCESS_TOKEN'}\`
      }
    };
  }
});

// Example: Send a message
const response = await api.sendMessage({
  messaging_product: 'whatsapp',
  to: 'PHONE_NUMBER',
  type: 'text',
  text: {
    body: 'Hello from WhatsApp Cloud API!'
  }
});
    `);

        console.log('📚 Next steps:');
        console.log('   1. Import the generated API client in your TypeScript code');
        console.log('   2. Configure authentication with your WhatsApp Business API token');
        console.log('   3. Start making type-safe API calls!');

    } catch (error) {
        console.error('❌ Error during TypeScript API generation:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

// Run the generation
generateTypeScriptApi(); 