import { WebhookMessageStatus } from './types';
import { logSuccess, logError, extractStatusInfo } from './utils';

/**
 * Handle message sent status
 */
export async function handleMessageSent(statusInfo: ReturnType<typeof extractStatusInfo>): Promise<void> {
    logSuccess('Message sent successfully', {
        messageId: statusInfo.messageId,
        recipientId: statusInfo.recipientId,
        timestamp: statusInfo.timestamp,
        operation: 'handleMessageSent'
    });
}

/**
 * Handle message delivered status
 */
export async function handleMessageDelivered(statusInfo: ReturnType<typeof extractStatusInfo>): Promise<void> {
    logSuccess('Message delivered', {
        messageId: statusInfo.messageId,
        recipientId: statusInfo.recipientId,
        timestamp: statusInfo.timestamp,
        operation: 'handleMessageDelivered'
    });
}

/**
 * Handle message read status
 */
export async function handleMessageRead(statusInfo: ReturnType<typeof extractStatusInfo>): Promise<void> {
    logSuccess('Message read by recipient', {
        messageId: statusInfo.messageId,
        recipientId: statusInfo.recipientId,
        timestamp: statusInfo.timestamp,
        operation: 'handleMessageRead'
    });
}

/**
 * Handle message failed status
 */
export async function handleMessageFailed(statusInfo: ReturnType<typeof extractStatusInfo>): Promise<void> {
    logError('Message delivery failed', 'Message failed to deliver', {
        messageId: statusInfo.messageId,
        recipientId: statusInfo.recipientId,
        timestamp: statusInfo.timestamp,
        operation: 'handleMessageFailed',
        requiresAttention: true
    });
}

/**
 * Process message status update
 */
export async function processStatusUpdate(status: WebhookMessageStatus): Promise<void> {
    try {
        const statusInfo = extractStatusInfo(status);

        logSuccess('Processing status update', {
            messageId: statusInfo.messageId,
            status: statusInfo.status,
            recipientId: statusInfo.recipientId,
            timestamp: statusInfo.timestamp,
            conversationInfo: statusInfo.conversationInfo,
            pricingInfo: statusInfo.pricingInfo
        });

        // Handle different status types
        switch (statusInfo.status) {
            case 'sent':
                await handleMessageSent(statusInfo);
                break;
            case 'delivered':
                await handleMessageDelivered(statusInfo);
                break;
            case 'read':
                await handleMessageRead(statusInfo);
                break;
            case 'failed':
                await handleMessageFailed(statusInfo);
                break;
        }
    } catch (error) {
        logError('Error processing status update', error as Error, {
            statusId: status.id,
            recipientId: status.recipient_id,
            operation: 'processStatusUpdate'
        });
    }
} 