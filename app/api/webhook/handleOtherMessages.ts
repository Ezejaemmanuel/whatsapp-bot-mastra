import { WebhookMessage } from './types';
import { DatabaseService } from '@/lib/database-service';
import { MediaUploadService } from '@/lib/media-upload-service';
import { WhatsAppCloudApiClient } from '@/whatsapp/whatsapp-client';
import { Id } from '@/convex/_generated/dataModel';
import { mastra } from '@/mastra';
import { RuntimeContext } from '@mastra/core/runtime-context';
import { TEST_MODE } from '@/constant';
import { HANDLE_IMAGE_AGENT_TEMPRETURE, HANDLE_TEXT_AGENT_TEMPRETURE } from '@/mastra/agents/agent-instructions';
import {
    logInfo,
    logError,
    logSuccess,
    logWarning,
    extractMessageInfo,
} from './utils';
import {
    sendAndStoreTextReply,
    markMessageAsRead
} from './response-sender';
import {
    formatErrorForTestMode,
    sendErrorResponse
} from './error-handler';


/**
 * Handle location messages
 */
export async function handleLocationMessage(
    whatsappClient: WhatsAppCloudApiClient,
    databaseService: DatabaseService,
    messageInfo: ReturnType<typeof extractMessageInfo>,
    conversationId: Id<"conversations">
): Promise<void> {
    try {
        logInfo('Processing location message', {
            messageId: messageInfo.id,
            from: messageInfo.from,
            conversationId,
            operation: 'handleLocationMessage'
        });

        // Increment unread count
        await databaseService.incrementUnreadCount(conversationId);

        // Prepare a simple text reply for location messages
        const responseText = 'Thank you for sharing your location. How can I assist you with it?';

        await sendAndStoreTextReply(
            whatsappClient,
            databaseService,
            messageInfo.from,
            responseText,
            conversationId,
            messageInfo.id
        );
    } catch (error) {
        logError('Error in location message handling (non-agent error)', error as Error, {
            messageId: messageInfo.id,
            from: messageInfo.from,
            operation: 'handleLocationMessage',
            errorType: 'non_agent_error'
        });

        // This catch block handles non-agent errors (database, network, etc.)
        let systemErrorResponse = formatErrorForTestMode(error, {
            operation: 'handleLocationMessage',
            messageId: messageInfo.id,
            from: messageInfo.from,
            errorType: 'system_error'
        });

        // If not in test mode, use friendly fallback
        if (!TEST_MODE) {
            systemErrorResponse = 'I had trouble processing your location due to a system issue. Please try again in a moment.';
        }

        try {
            await sendAndStoreTextReply(
                whatsappClient,
                databaseService,
                messageInfo.from,
                systemErrorResponse,
                conversationId,
                messageInfo.id
            );
        } catch (fallbackError) {
            logError('Failed to send system error response', fallbackError as Error, {
                messageId: messageInfo.id,
                from: messageInfo.from,
                operation: 'handleLocationMessage'
            });
            // Use the error response system as final fallback
            await sendErrorResponse(
                whatsappClient,
                messageInfo.from,
                'I\'m experiencing technical difficulties with location processing. Please try again later.',
                fallbackError
            );
        }
    }
}

/**
 * Handle contact messages
 */
export async function handleContactMessage(
    whatsappClient: WhatsAppCloudApiClient,
    databaseService: DatabaseService,
    messageInfo: ReturnType<typeof extractMessageInfo>,
    conversationId: Id<"conversations">
): Promise<void> {
    try {
        logInfo('Processing contact message', {
            messageId: messageInfo.id,
            from: messageInfo.from,
            conversationId,
            operation: 'handleContactMessage'
        });

        // Increment unread count
        await databaseService.incrementUnreadCount(conversationId);

        // Prepare a simple text reply for contact messages
        const responseText = 'Thank you for sharing the contact. I will review it shortly.';

        await sendAndStoreTextReply(
            whatsappClient,
            databaseService,
            messageInfo.from,
            responseText,
            conversationId,
            messageInfo.id
        );
    } catch (error) {
        logError('Error in contact message handling (non-agent error)', error as Error, {
            messageId: messageInfo.id,
            from: messageInfo.from,
            operation: 'handleContactMessage',
            errorType: 'non_agent_error'
        });

        // This catch block handles non-agent errors (database, network, etc.)
        let systemErrorResponse = formatErrorForTestMode(error, {
            operation: 'handleContactMessage',
            messageId: messageInfo.id,
            from: messageInfo.from,
            errorType: 'system_error'
        });

        // If not in test mode, use friendly fallback
        if (!TEST_MODE) {
            systemErrorResponse = 'I had trouble processing your contact due to a system issue. Please try again in a moment.';
        }

        try {
            await sendAndStoreTextReply(
                whatsappClient,
                databaseService,
                messageInfo.from,
                systemErrorResponse,
                conversationId,
                messageInfo.id
            );
        } catch (fallbackError) {
            logError('Failed to send system error response', fallbackError as Error, {
                messageId: messageInfo.id,
                from: messageInfo.from,
                operation: 'handleContactMessage'
            });
            // Use the error response system as final fallback
            await sendErrorResponse(
                whatsappClient,
                messageInfo.from,
                'I\'m experiencing technical difficulties with contact processing. Please try again later.',
                fallbackError
            );
        }
    }
} 