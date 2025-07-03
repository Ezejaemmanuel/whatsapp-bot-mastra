import { WhatsAppCloudApiClient } from '@/whatsapp/whatsapp-client';
import { TEST_MODE, WHATSAPP_TEST_MODE } from '@/constant';
import { logInfo, logError } from './utils';

/**
 * Format error details for test mode
 */
export function formatErrorForTestMode(error: unknown, context: Record<string, any> = {}): string {
    if (!TEST_MODE) {
        return 'I apologize, but I encountered an issue. Please try again in a moment.';
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorName = error instanceof Error ? error.name : 'Unknown Error';
    const errorStack = error instanceof Error ? error.stack : 'No stack trace available';

    return `🔧 TEST MODE - ERROR DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❌ ERROR: ${errorName}
📝 MESSAGE: ${errorMessage}

📍 CONTEXT:
${Object.entries(context).map(([key, value]) => `• ${key}: ${JSON.stringify(value)}`).join('\n')}

🔍 STACK TRACE:
${errorStack}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ This detailed error is only shown in TEST_MODE`;
}

/**
 * Send error response to user with comprehensive error details in test mode
 */
export async function sendErrorResponse(
    whatsappClient: WhatsAppCloudApiClient,
    to: string,
    friendlyMessage: string,
    error?: unknown
): Promise<void> {
    try {
        let messageToSend = friendlyMessage;

        // In test mode, include detailed error information
        if (WHATSAPP_TEST_MODE && error) {
            const errorDetails = formatErrorForTestMode(error, {
                operation: 'sendErrorResponse',
                to,
                friendlyMessage
            });
            messageToSend = errorDetails;
        }

        await whatsappClient.messages.sendText({
            to,
            text: messageToSend
        });

        logInfo('Error response sent successfully', {
            to,
            messageLength: messageToSend.length,
            isTestMode: WHATSAPP_TEST_MODE,
            hasErrorDetails: WHATSAPP_TEST_MODE && !!error,
            operation: 'sendErrorResponse'
        });
    } catch (sendError) {
        logError('Failed to send error response', sendError as Error, {
            to,
            messageLength: friendlyMessage.length,
            originalError: error instanceof Error ? error.message : String(error),
            operation: 'sendErrorResponse'
        });
    }
} 