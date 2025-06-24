/**
 * Environment Configuration Utility
 * 
 * Validates and provides environment variables with proper error handling.
 * Throws descriptive errors when required environment variables are missing.
 */

/**
 * Get required environment variable with validation
 */
function getRequiredEnvVar(name: string, description?: string): string {
    const value = process.env[name];

    if (!value || value.trim() === '') {
        const errorMessage = description
            ? `Missing required environment variable: ${name} (${description})`
            : `Missing required environment variable: ${name}`;

        throw new Error(errorMessage);
    }

    return value.trim();
}

/**
 * Get optional environment variable with default value
 */
function getOptionalEnvVar(name: string, defaultValue: string): string {
    const value = process.env[name];
    return value && value.trim() !== '' ? value.trim() : defaultValue;
}

// WhatsApp Configuration
export const WHATSAPP_CONFIG = {
    // Required environment variables
    get ACCESS_TOKEN(): string {
        return getRequiredEnvVar(
            'WHATSAPP_ACCESS_TOKEN',
            'WhatsApp Business API access token from Meta Business'
        );
    },

    get PHONE_NUMBER_ID(): string {
        return getRequiredEnvVar(
            'WHATSAPP_PHONE_NUMBER_ID',
            'WhatsApp Business phone number ID from Meta Business'
        );
    },

    get BUSINESS_ACCOUNT_ID(): string {
        return getRequiredEnvVar(
            'WHATSAPP_BUSINESS_ACCOUNT_ID',
            'WhatsApp Business Account ID (WABA ID) from Meta Business'
        );
    },

    get TEST_NUMBER(): string {
        return getRequiredEnvVar(
            'WHATSAPP_TEST_NUMBER',
            'Test phone number for WhatsApp messages (e.g., +1234567890)'
        );
    },

    // Optional environment variables with defaults
    get API_VERSION(): string {
        return getOptionalEnvVar('WHATSAPP_API_VERSION', 'v23.0');
    },

    get BASE_URL(): string {
        return getOptionalEnvVar('WHATSAPP_BASE_URL', 'https://graph.facebook.com');
    }
};

// Legacy constants for backward compatibility (deprecated)
export const TEST_WHATSAPP_NUMBER = WHATSAPP_CONFIG.TEST_NUMBER;
export const PHONE_NUMBER_ID = WHATSAPP_CONFIG.PHONE_NUMBER_ID;
export const WABA_ID = WHATSAPP_CONFIG.BUSINESS_ACCOUNT_ID;
export const WHATSAPP_API_VERSION = WHATSAPP_CONFIG.API_VERSION;

/**
 * Validate all required WhatsApp environment variables
 * Call this function at application startup to ensure all required vars are present
 */
export function validateWhatsAppConfig(): void {
    try {
        // Access all required properties to trigger validation
        const accessToken = WHATSAPP_CONFIG.ACCESS_TOKEN;
        const phoneNumberId = WHATSAPP_CONFIG.PHONE_NUMBER_ID;
        const businessAccountId = WHATSAPP_CONFIG.BUSINESS_ACCOUNT_ID;
        const testNumber = WHATSAPP_CONFIG.TEST_NUMBER;

        // Verify all values are present (additional safety check)
        if (!accessToken || !phoneNumberId || !businessAccountId || !testNumber) {
            throw new Error('One or more required environment variables are empty');
        }

        console.log('✅ All required WhatsApp environment variables are configured');
    } catch (error) {
        console.error('❌ WhatsApp environment configuration error:', error instanceof Error ? error.message : error);
        throw error;
    }
}

/**
 * Get environment configuration summary (without sensitive values)
 */
export function getConfigSummary(): Record<string, string> {
    const summary: Record<string, string> = {
        WHATSAPP_API_VERSION: WHATSAPP_CONFIG.API_VERSION,
        WHATSAPP_BASE_URL: WHATSAPP_CONFIG.BASE_URL,
    };

    // Safely check if required vars are configured without exposing values
    try {
        const phoneNumberId = WHATSAPP_CONFIG.PHONE_NUMBER_ID;
        summary.WHATSAPP_PHONE_NUMBER_ID = phoneNumberId ? '***configured***' : 'missing';
    } catch {
        summary.WHATSAPP_PHONE_NUMBER_ID = 'missing';
    }

    try {
        const businessAccountId = WHATSAPP_CONFIG.BUSINESS_ACCOUNT_ID;
        summary.WHATSAPP_BUSINESS_ACCOUNT_ID = businessAccountId ? '***configured***' : 'missing';
    } catch {
        summary.WHATSAPP_BUSINESS_ACCOUNT_ID = 'missing';
    }

    try {
        const accessToken = WHATSAPP_CONFIG.ACCESS_TOKEN;
        summary.WHATSAPP_ACCESS_TOKEN = accessToken ? '***configured***' : 'missing';
    } catch {
        summary.WHATSAPP_ACCESS_TOKEN = 'missing';
    }

    try {
        const testNumber = WHATSAPP_CONFIG.TEST_NUMBER;
        summary.WHATSAPP_TEST_NUMBER = testNumber ? '***configured***' : 'missing';
    } catch {
        summary.WHATSAPP_TEST_NUMBER = 'missing';
    }

    return summary;
} 