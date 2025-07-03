import { WHATSAPP_TEST_MODE } from '@/constant';
import { WhatsAppClientService } from '@/whatsapp/whatsapp-client-service';

/**
 * Send debug message via WhatsApp when TEST_MODE is enabled
 */
export async function sendDebugMessage(phoneNumber: string, title: string, data: any): Promise<void> {
    if (!WHATSAPP_TEST_MODE) return;

    try {
        // Get singleton client instance
        const clientService = WhatsAppClientService.getInstance();
        const client = clientService.getClient();

        // Format debug message
        const debugMessage = `🔧 DEBUG - ${title}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏰ Time: ${new Date().toISOString()}
📱 Tool: Exchange Tools

📊 Data:
${typeof data === 'string' ? data : JSON.stringify(data, null, 2)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ This is a DEBUG message - only shown in TEST_MODE`;

        // Split long messages if needed (WhatsApp has character limits)
        const maxLength = 4000;
        if (debugMessage.length > maxLength) {
            const chunks = [];
            for (let i = 0; i < debugMessage.length; i += maxLength) {
                chunks.push(debugMessage.slice(i, i + maxLength));
            }

            for (let i = 0; i < chunks.length; i++) {
                const chunkMessage = `${chunks[i]}${i < chunks.length - 1 ? '\n\n📄 (Continued in next message...)' : ''}`;
                await client.messages.sendText({
                    to: phoneNumber,
                    text: chunkMessage
                });

                // Small delay between chunks
                if (i < chunks.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
        } else {
            await client.messages.sendText({
                to: phoneNumber,
                text: debugMessage
            });
        }

        console.log(`📱 DEBUG message sent to ${phoneNumber}: ${title}`);
    } catch (error) {
        console.error('❌ Failed to send debug message:', error);
        // Don't throw - debug messaging shouldn't break the main flow
    }
}

/**
 * Validation helper to check if a string is a valid Convex document ID
 */
export function isValidConvexId(id: string): boolean {
    // Convex IDs are typically 16+ characters long and contain alphanumeric characters
    return /^[a-zA-Z0-9]{16,}$/.test(id);
}

/**
 * Enhanced logging utility for exchange tools with detailed tool call tracking
 */
export function logExchangeEvent(
    level: 'INFO' | 'ERROR' | 'WARN' | 'SUCCESS',
    message: string,
    data?: Record<string, any>
): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        level,
        source: 'Exchange Tools',
        message,
        ...data
    };

    const levelEmoji = {
        'INFO': '📋',
        'ERROR': '❌',
        'WARN': '⚠️',
        'SUCCESS': '✅'
    };

    console.log(`[${timestamp}] ${levelEmoji[level] || '📋'} [${level}] Exchange Tools: ${message}`);

    if (data && Object.keys(data).length > 0) {
        console.log('📊 Tool Data:', JSON.stringify(data, null, 2));
    }
}

export function logToolCall(toolId: string, parameters: any): void {
    logExchangeEvent('INFO', `🚀 TOOL CALL STARTED: ${toolId}`, {
        toolId,
        parameters: JSON.stringify(parameters, null, 2),
        callStartTime: new Date().toISOString()
    });
}

export function logToolResult(toolId: string, result: any, executionTimeMs: number): void {
    logExchangeEvent('SUCCESS', `✅ TOOL CALL COMPLETED: ${toolId}`, {
        toolId,
        result: JSON.stringify(result, null, 2),
        executionTimeMs,
        callEndTime: new Date().toISOString()
    });
}

export function logToolError(toolId: string, error: Error, executionTimeMs: number, parameters?: any): void {
    logExchangeEvent('ERROR', `❌ TOOL CALL FAILED: ${toolId}`, {
        toolId,
        error: error.message,
        stack: error.stack,
        parameters: parameters ? JSON.stringify(parameters, null, 2) : undefined,
        executionTimeMs,
        callEndTime: new Date().toISOString()
    });
}

export function logSuccess(message: string, data?: Record<string, any>): void {
    logExchangeEvent('SUCCESS', message, data);
}

export function logError(message: string, error?: Error | string, data?: Record<string, any>): void {
    const errorData = {
        ...data,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
    };
    logExchangeEvent('ERROR', message, errorData);
}

export function logInfo(message: string, data?: Record<string, any>): void {
    logExchangeEvent('INFO', message, data);
}
