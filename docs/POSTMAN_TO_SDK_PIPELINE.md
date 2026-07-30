# Converting Any Postman Collection Into an SDK

This document describes a **generic pipeline** to turn **any Postman collection** into a **type-safe TypeScript SDK** (or another language, by swapping Step 2). It is written so an LLM or developer can understand, replicate, or adapt the process for any API.

---

## 1. Overview: The Three-Step Pipeline

```
Postman Collection (JSON)  →  OpenAPI Spec (JSON/YAML)  →  TypeScript API Client  →  Optional wrapper
     (input)                        (intermediate)              (generated)              (hand-written)
```

| Step | Input | Output | Tool / Script |
|------|--------|--------|----------------|
| 1 | Any `*.postman_collection.json` | `*-openapi.json`, `*-openapi.yaml` | `@scalar/postman-to-openapi` |
| 2 | OpenAPI JSON from Step 1 | `Api.ts` + types (e.g. in `src/api/`) | `swagger-typescript-api` (or another OpenAPI codegen) |
| 3 | Generated `Api.ts` | Your wrapper class (e.g. `MyApiClient.ts`) | Hand-written |

- **Step 1** is the same for every Postman collection: one conversion script, parameterized by input/output paths.
- **Step 2** produces the “raw” SDK: one method per API operation, full TypeScript types. You can replace this step with another generator (e.g. OpenAPI Generator for Python/Go) to get an SDK in a different language.
- **Step 3** is optional: a hand-written wrapper that adds config (base URL, API key, tokens), auth, and convenience methods tailored to your app.

The **SDK** in the narrow sense is the **generated client** (Step 2). The **product** your app uses is that client plus any **wrapper** (Step 3) you add.

---

## 2. Step 1: Postman Collection → OpenAPI

### Purpose

Postman collections describe requests (URL, method, headers, body, examples) but are not a standard contract for code generation. OpenAPI (Swagger) is. Converting to OpenAPI gives:

- A single, standard API contract (JSON or YAML).
- Paths, methods, parameters, request/response schemas, and descriptions.
- Compatibility with code generators (TypeScript, Python, Go, etc.) and docs tools (Swagger UI, Redoc).

### Implementation (Generic)

- **Library:** `@scalar/postman-to-openapi` — function: `convert(postmanCollection)` returns an OpenAPI 3.x object.
- **Script:** A small Node script that:
  1. Reads the Postman collection from disk (e.g. `path/to/YourCollection.postman_collection.json`).
  2. Calls `convert(postmanCollection)`.
  3. Writes the result as JSON and optionally YAML (using `js-yaml`).

**Generic script shape (ES modules):**

```javascript
import { convert } from '@scalar/postman-to-openapi';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const POSTMAN_COLLECTION_PATH = join(__dirname, '..', 'path', 'to', 'YourCollection.postman_collection.json');
const OPENAPI_JSON_PATH       = join(__dirname, '..', 'output', 'your-api-openapi.json');
const OPENAPI_YAML_PATH       = join(__dirname, '..', 'output', 'your-api-openapi.yaml');

const postmanCollection = JSON.parse(readFileSync(POSTMAN_COLLECTION_PATH, 'utf8'));
const openApiSpec = await convert(postmanCollection);

writeFileSync(OPENAPI_JSON_PATH, JSON.stringify(openApiSpec, null, 2));

const yaml = await import('js-yaml');
writeFileSync(OPENAPI_YAML_PATH, yaml.dump(openApiSpec, { indent: 2, lineWidth: 120, noRefs: true }));
```

**Run:** e.g. `node scripts/convert-postman-to-openapi.js` or `pnpm run convert:postman` (wire the script in `package.json`).

**Postman collection structure (relevant parts):**

- `info`: name, description, schema URL (e.g. `https://schema.getpostman.com/json/collection/v2.1.0/collection.json`).
- `item`: array of folders and/or requests. Each request has:
  - `name`, `request.method`, `request.url` (may use variables like `{{baseUrl}}`, `{{apiKey}}`, `{{id}}`),
  - `request.header`, `request.body`, `request.description`,
  - `response`: optional example responses (status, headers, body).

The converter maps these to OpenAPI **paths**, **operations**, **parameters**, **requestBody**, **responses**, and **description** text. Postman variables typically become path/query/header parameters or server variables in OpenAPI.

---

## 3. Step 2: OpenAPI → TypeScript API Client

### Purpose

Generate a **type-safe TypeScript client** that:

- Exposes one function per API operation.
- Uses TypeScript interfaces for request/response and query/path params.
- Uses a single HTTP client (e.g. `fetch`) and a pluggable auth mechanism (e.g. Bearer token, API key header).

### Implementation (Generic)

- **Library:** `swagger-typescript-api` — function: `generateApi(options)`.
- **Script:** A Node script that:
  1. Checks that the OpenAPI JSON from Step 1 exists.
  2. Calls `generateApi()` with input path (OpenAPI JSON), output directory, and options.
  3. The generator writes an `Api` class, `HttpClient`, and type definitions.

**Generic script shape:**

```javascript
import { generateApi } from 'swagger-typescript-api';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

const OPENAPI_JSON_PATH = join(__dirname, '..', 'output', 'your-api-openapi.json');
const OUTPUT_DIR        = join(__dirname, '..', 'src', 'api');

if (!existsSync(OPENAPI_JSON_PATH)) {
  console.error('OpenAPI file not found. Run the Postman→OpenAPI conversion first.');
  process.exit(1);
}

const { files } = await generateApi({
  name: 'Api',                    // or e.g. 'MyServiceApi'
  input: OPENAPI_JSON_PATH,
  output: OUTPUT_DIR,

  generateClient: true,
  generateRouteTypes: true,
  generateResponses: true,
  generateUnionEnums: true,

  httpClientType: 'fetch',
  singleHttpClient: true,
  extractRequestParams: true,
  extractRequestBody: true,
  extractEnums: true,

  extractResponseError: true,
  extractResponseSuccess: true,
  generateResponseBody: true,
  defaultResponseAsSuccess: false,

  sortTypes: true,
  sortRoutes: true,

  prettier: { printWidth: 120, tabWidth: 2, trailingComma: 'es5', singleQuote: true },
});
```

**Run:** e.g. `node scripts/generate-typescript-api.js` or `pnpm run generate:api`.

**Important options:**

- `generateClient`, `generateRouteTypes`, `generateResponses` — control what is generated.
- `httpClientType: 'fetch'` — use the Fetch API (Node 18+ and browsers).
- `singleHttpClient: true` — one shared HTTP client instance.
- `extractRequestParams`, `extractRequestBody`, `extractEnums` — derive TypeScript types from the OpenAPI schema.
- Auth is **not** defined in the generator; the generated client accepts an HTTP client that you configure (e.g. with a `securityWorker` that adds headers). You wire auth in your wrapper or where you instantiate the client.

The **generated code** is the “raw” SDK: it knows paths, methods, and types but not your env vars or app-specific defaults. You can use it as-is or wrap it (Step 3).

---

## 4. Step 3: Wrapper Around the Generated Client (Optional)

### Purpose

The generated `Api` is low-level: each method maps to one OpenAPI operation and may require passing many parameters (base path, IDs, version, etc.). A wrapper can:

- Read **config** from constructor args and/or environment (e.g. `BASE_URL`, `API_KEY`, `ACCESS_TOKEN`).
- Build **one shared** `HttpClient` with auth (e.g. `Authorization: Bearer <token>`, `X-Api-Key: <key>`).
- Instantiate the **generated `Api`** once and pass this HTTP client.
- Expose **higher-level groupings** or convenience methods that fill in default parameters from config.
- Export **domain types** (e.g. webhook payloads, DTOs) for type-safe usage elsewhere.

### Implementation (Generic)

- **File:** e.g. `src/client/MyApiClient.ts` (or any path you choose).
- **Pattern:**
  - Your wrapper class holds `private api: Api<SecurityData>` and `private config: Config`.
  - Constructor: resolve config (env + constructor args), create `HttpClient` with a `securityWorker` (or equivalent) that injects auth headers, then `this.api = new Api(httpClient)`.
  - Public API: methods that call `this.api.someOperation(...)` with the right arguments, and/or grouped properties (e.g. `client.resources.foo()`) that delegate to the generated methods.
  - Optionally: `getRawApi()` to expose the generated `Api` for advanced use; `updateToken()` or similar if auth can change at runtime.

**Generic wrapper structure (conceptually):**

```text
MyApiClient
├── private api: Api<SecurityData>     // generated in Step 2
├── private config: { baseUrl, apiKey or accessToken, ... }
├── constructor(config?)               // merge with process.env
├── HttpClient created with securityWorker that adds auth headers
├── Public methods or grouped endpoints that call api.*
├── getRawApi() → Api                  // optional
└── updateAuth(...)                    // optional
```

You can also add a **singleton or factory** (e.g. `MyApiClientService.getInstance()`) that builds the wrapper with credentials from env or a config store.

---

## 5. Generic File Map

Use this as a reference when replicating the pipeline for any project. Replace placeholders with your actual names.

| Role | Generic path / placeholder |
|------|-----------------------------|
| Postman collection (source) | `path/to/<CollectionName>.postman_collection.json` |
| Conversion script (Step 1) | `scripts/convert-postman-to-openapi.js` |
| OpenAPI output (JSON) | `<output-dir>/<api-name>-openapi.json` |
| OpenAPI output (YAML) | `<output-dir>/<api-name>-openapi.yaml` |
| Generation script (Step 2) | `scripts/generate-typescript-api.js` |
| Generated API + types | `src/api/Api.ts` (or `<output-dir>/Api.ts`) |
| Wrapper (Step 3, optional) | `src/client/<YourClient>.ts` or any path you choose |
| Config / singleton (optional) | `src/client/<YourClient>Service.ts` or similar |

Ensure the Step 2 script writes to a directory that your wrapper (or app) can import from (e.g. `import { Api } from './api/Api'`).

---

## 6. Dependencies

- **Step 1 (Postman → OpenAPI):** `@scalar/postman-to-openapi`, `js-yaml` (and `@types/js-yaml` if using TypeScript).
- **Step 2 (OpenAPI → TypeScript):** `swagger-typescript-api`.

All run in Node. If the conversion/generation scripts use `import`, set `"type": "module"` in `package.json` or use `.mjs` and ES module syntax.

---

## 7. Parameterizing for Any Collection

To support **any** Postman collection with one pipeline:

1. **Step 1 script:** Make paths configurable (env vars, CLI args, or a small config file), e.g.:
   - `POSTMAN_COLLECTION_PATH` (input),
   - `OPENAPI_JSON_PATH`, `OPENAPI_YAML_PATH` (outputs).
2. **Step 2 script:** Make these configurable:
   - `OPENAPI_JSON_PATH` (input),
   - `OUTPUT_DIR` (where `Api.ts` and types are written),
   - optionally `API_NAME` or module name for the generated class.
3. **Step 3:** Hand-written per project; the wrapper imports the generated `Api` from whatever `OUTPUT_DIR` you chose.

Example `package.json` scripts:

```json
"convert:postman": "node scripts/convert-postman-to-openapi.js",
"generate:api": "node scripts/generate-typescript-api.js"
```

Run in order: first `convert:postman`, then `generate:api`.

---

## 8. Using the Same Pipeline for Another Language

The pipeline is **language-agnostic** up to Step 2:

- **Step 1** is unchanged: any Postman collection → OpenAPI JSON/YAML.
- **Step 2** can be replaced with any OpenAPI-based code generator, for example:
  - **Python:** `openapi-generator-cli generate -i your-api-openapi.json -g python -o ./sdk-python`
  - **Go:** `openapi-generator-cli generate -i your-api-openapi.json -g go -o ./sdk-go`
  - **Java, C#, Rust, etc.:** same idea with the appropriate generator and flags.

The generic flow remains: **Postman → OpenAPI → generated SDK**. Only the “codegen” step and the optional wrapper are specific to the target language and project.

---

## 9. Quick Command Reference (Generic)

```bash
# 1. Postman → OpenAPI (configure paths in the script or via env)
pnpm run convert:postman   # or: node scripts/convert-postman-to-openapi.js

# 2. OpenAPI → TypeScript API (ensure Step 1 has been run)
pnpm run generate:api      # or: node scripts/generate-typescript-api.js
```

After that, use the generated `Api` directly or via your own wrapper class.

---

## 10. Summary for Another LLM

- **Source of truth:** The Postman collection. OpenAPI is derived and used for code generation and tooling.
- **SDK (narrow):** The generated client (Step 2) — e.g. `Api` + types from `swagger-typescript-api`.
- **Product (optional):** That client plus a hand-written wrapper (Step 3) for config, auth, and convenience.
- **Order:** Run Step 1, then Step 2; Step 3 is optional and project-specific.
- **Generic:** The same pipeline works for any Postman collection; only paths, names, and optional wrapper logic change.
