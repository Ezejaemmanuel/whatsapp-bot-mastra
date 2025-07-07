import { WhatsAppCloudApiClient } from '@/whatsapp/whatsapp-client';
import { DatabaseService } from '@/lib/database-service';
import { Id } from '@/convex/_generated/dataModel';
import { logSuccess, logError, logInfo } from './utils';
import { MessageType } from '@/convex/schemaUnions';

/**
 * Send a text reply to a message
 */
export async function sendTextReply(
    whatsappClient: WhatsAppCloudApiClient,
    to: string,
    text: string,
    replyToMessageId?: string
): Promise<void> {
    try {
        if (replyToMessageId) {
            await whatsappClient.messages.sendReply({
                to,
                text,
                replyToMessageId
            });
        } else {
            await whatsappClient.messages.sendText({
                to,
                text
            });
        }

        logSuccess('Text message sent successfully', {
            to,
            textPreview: text.substring(0, 50),
            isReply: !!replyToMessageId,
            messageLength: text.length,
            operation: 'sendTextReply'
        });
    } catch (error) {
        logError('Failed to send text message', error as Error, {
            to,
            textPreview: text.substring(0, 50),
            messageLength: text.length,
            isReply: !!replyToMessageId,
            operation: 'sendTextReply'
        });
        throw error;
    }
}

/**
 * Send a template message
 */
export async function sendTemplateMessage(
    whatsappClient: WhatsAppCloudApiClient,
    to: string,
    templateName: string,
    languageCode: string,
    components?: any[]
): Promise<void> {
    try {
        await whatsappClient.messages.sendTemplate({
            to,
            templateName,
            languageCode,
            components
        });

        logSuccess('Template message sent successfully', {
            to,
            templateName,
            languageCode,
            hasComponents: !!components && components.length > 0,
            componentCount: components?.length || 0,
            operation: 'sendTemplateMessage'
        });
    } catch (error) {
        logError('Failed to send template message', error as Error, {
            to,
            templateName,
            languageCode,
            operation: 'sendTemplateMessage'
        });
        throw error;
    }
}

/**
 * Mark message as read with proper error handling
 */
export async function markMessageAsRead(
    whatsappClient: WhatsAppCloudApiClient,
    messageId: string,
    phoneNumberId: string
): Promise<void> {
    try {
        await whatsappClient.messages.markAsRead({
            messageId
        });

        logSuccess('Message marked as read successfully', {
            messageId,
            operation: 'markMessageAsRead'
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorDetails = error instanceof Error ? error.stack : undefined;

        logError('Failed to mark message as read', error as Error, {
            messageId,
            operation: 'markMessageAsRead',
            error: errorMessage,
            errorDetails,
            critical: false,
            phoneNumberId,
            clientConfigured: !!whatsappClient
        });

        // Don't throw error for read receipts as it's not critical
    }
}

/**
 * Store outgoing message in database
 */
export async function storeOutgoingMessage(
    databaseService: DatabaseService,
    to: string,
    messageType: MessageType,
    content: string,
    conversationId: Id<"conversations">,
    senderRole: 'bot' | 'admin',
    senderName: string,
    whatsappMessageId?: string,
    replyToMessageId?: string
): Promise<void> {
    try {
        await databaseService.storeOutgoingMessage(
            to,
            messageType,
            content,
            conversationId,
            senderRole,
            senderName,
            whatsappMessageId,
            replyToMessageId
        );

        logInfo('Outgoing message stored successfully', {
            to,
            messageType,
            contentLength: content.length,
            conversationId,
            operation: 'storeOutgoingMessage'
        });
    } catch (error) {
        logError('Failed to store outgoing message', error as Error, {
            to,
            messageType,
            contentLength: content.length,
            conversationId,
            operation: 'storeOutgoingMessage'
        });
        throw error;
    }
}

/**
 * Send text reply and store in database
 */
export async function sendAndStoreTextReply(
    whatsappClient: WhatsAppCloudApiClient,
    databaseService: DatabaseService,
    to: string,
    text: string,
    conversationId: Id<"conversations">,
    replyToMessageId?: string
): Promise<void> {
    // Send the message
    await sendTextReply(whatsappClient, to, text, replyToMessageId);

    // Store in database
    await storeOutgoingMessage(
        databaseService,
        to,
        'text',
        text,
        conversationId,
        'bot',
        'Bot',
        undefined,
        replyToMessageId
    );
} 