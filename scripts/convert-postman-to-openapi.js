import { convert } from '@scalar/postman-to-openapi';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Convert WhatsApp Cloud API Postman collection to OpenAPI specification
 */
async function convertPostmanToOpenApiSpec() {
    try {
        console.log('🚀 Starting Postman to OpenAPI conversion...');

        // Define file paths
        const postmanCollectionPath = join(__dirname, '..', 'WhatsApp-Cloud-API.postman_collection.json');
        const openApiOutputPath = join(__dirname, '..', 'whatsapp-cloud-api-openapi.json');
        const openApiYamlOutputPath = join(__dirname, '..', 'whatsapp-cloud-api-openapi.yaml');

        // Read the Postman collection
        console.log('📖 Reading Postman collection...');
        const postmanCollection = JSON.parse(readFileSync(postmanCollectionPath, 'utf8'));

        // Convert to OpenAPI
        console.log('🔄 Converting to OpenAPI format...');
        const openApiSpec = await convert(postmanCollection);

        // Write JSON output
        console.log('💾 Writing OpenAPI JSON specification...');
        writeFileSync(openApiOutputPath, JSON.stringify(openApiSpec, null, 2));

        // Convert to YAML format as well
        console.log('💾 Writing OpenAPI YAML specification...');
        const yaml = await import('js-yaml');
        const yamlContent = yaml.dump(openApiSpec, {
            indent: 2,
            lineWidth: 120,
            noRefs: true
        });
        writeFileSync(openApiYamlOutputPath, yamlContent);

        console.log('✅ Conversion completed successfully!');
        console.log(`📄 JSON output: ${openApiOutputPath}`);
        console.log(`📄 YAML output: ${openApiYamlOutputPath}`);

        // Display some stats
        const endpoints = Object.keys(openApiSpec.paths || {}).length;
        const methods = Object.values(openApiSpec.paths || {})
            .reduce((acc, path) => acc + Object.keys(path).length, 0);

        console.log(`📊 Conversion Stats:`);
        console.log(`   - Total endpoints: ${endpoints}`);
        console.log(`   - Total operations: ${methods}`);
        console.log(`   - API version: ${openApiSpec.info?.version || 'N/A'}`);

    } catch (error) {
        console.error('❌ Error during conversion:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

// Run the conversion
convertPostmanToOpenApiSpec(); 