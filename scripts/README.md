# Postman to OpenAPI Conversion Script

This directory contains a script to convert the WhatsApp Cloud API Postman collection to OpenAPI 3.1.0 specification format.

## Overview

The script uses the `@scalar/postman-to-openapi` package to convert the `WhatsApp-Cloud-API.postman_collection.json` file into both JSON and YAML OpenAPI specifications.

## Generated Files

### Postman to OpenAPI Conversion

When you run the conversion script, it will generate:

- `whatsapp-cloud-api-openapi.json` - OpenAPI specification in JSON format
- `whatsapp-cloud-api-openapi.yaml` - OpenAPI specification in YAML format

### TypeScript API Generation

When you run the TypeScript generation script, it will generate:

- `src/api/Api.ts` - Complete TypeScript API client with all endpoints and types
- `src/whatsapp-client-example.ts` - Example usage and wrapper class

## Usage

### Convert Postman Collection to OpenAPI

#### Using npm script (recommended)

```bash
pnpm run convert:postman
```

#### Direct execution

```bash
node scripts/convert-postman-to-openapi.js
```

### Generate TypeScript API Client

After converting to OpenAPI, generate the TypeScript API client:

#### Using npm script (recommended)

```bash
pnpm run generate:api
```

#### Direct execution

```bash
node scripts/generate-typescript-api.js
```

## Output

The script provides detailed output including:

- Conversion progress indicators
- File paths for generated outputs  
- Statistics about the converted API:
  - Total endpoints
  - Total operations
  - API version

## Example Output

```
🚀 Starting Postman to OpenAPI conversion...
📖 Reading Postman collection...
🔄 Converting to OpenAPI format...
💾 Writing OpenAPI JSON specification...
💾 Writing OpenAPI YAML specification...
✅ Conversion completed successfully!
📄 JSON output: /path/to/whatsapp-cloud-api-openapi.json
📄 YAML output: /path/to/whatsapp-cloud-api-openapi.yaml
📊 Conversion Stats:
   - Total endpoints: 36
   - Total operations: 56
   - API version: 1.0.0
```

## Generated OpenAPI Specification Features

The converted OpenAPI specification includes:

- **OpenAPI 3.1.0 format** - Latest OpenAPI specification version
- **Complete endpoint documentation** - All 36 endpoints with 56 operations
- **Request/Response schemas** - Detailed parameter and response definitions
- **Authentication information** - Bearer token authentication setup
- **Server configuration** - Meta Graph API server (https://graph.facebook.com)
- **Tags and organization** - Endpoints grouped by functionality
- **Examples and descriptions** - Sample requests and detailed descriptions

## Generated TypeScript API Features

The generated TypeScript API client includes:

- **Type-safe API methods** - Full TypeScript support with interfaces and types
- **Automatic authentication** - Built-in bearer token handling
- **HTTP client abstraction** - Uses modern fetch API
- **Request/Response types** - Strongly typed request parameters and responses
- **Error handling** - Proper error types and handling
- **Modular structure** - Organized by API endpoints (wabaId, phoneNumberId, etc.)
- **Documentation** - JSDoc comments for all methods and types
- **Example wrapper class** - Ready-to-use client with common operations

## Dependencies

The scripts require the following packages (automatically installed):

### Postman to OpenAPI Conversion
- `@scalar/postman-to-openapi` - Main conversion library
- `js-yaml` - YAML output generation
- `@types/js-yaml` - TypeScript types for js-yaml

### TypeScript API Generation
- `swagger-typescript-api` - TypeScript API client generator

## Notes

- The script uses ES6 modules (type: "module" in package.json)
- Both JSON and YAML formats are generated for maximum compatibility
- The original Postman collection description and metadata are preserved
- All endpoint examples and documentation are converted to OpenAPI format

## Troubleshooting

If you encounter any issues:

1. Ensure all dependencies are installed: `pnpm install`
2. Verify the Postman collection file exists in the root directory
3. Check that Node.js supports ES6 modules (Node.js 14+)
4. Ensure write permissions for the output directory 