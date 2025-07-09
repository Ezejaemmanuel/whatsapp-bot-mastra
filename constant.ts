// export const TEST_WHATSAPP_NUMBER = "+2348124851372";
// export const PHONE_NUMBER_ID = "613072631899709";
// export const WABA_ID = "4033837806855483";

// export const WHATSAPP_API_VERSION = "v23.0";

/**
 * Test mode configuration
 * When true, detailed debugging information will be sent to WhatsApp messages for all tool operations
 * This includes:
 * - Tool execution start/completion timestamps
 * - All input parameters and processing steps
 * - Database query details and results
 * - AI model processing results (for image analysis)
 * - Complete OCR extraction results (raw text and structured data)
 * - Error details with stack traces
 * - Processing times and execution metadata
 * 
 * When false, user-friendly error messages will be sent instead and no debug info is shared
 * 
 * ⚠️ WARNING: In TEST_MODE, sensitive data like bank details and transaction info will be sent via WhatsApp
 * Only enable this for development/debugging purposes, never in production
 */
export const TEST_MODE = false; // Set to false in production



export const WHATSAPP_TEST_MODE = false;

