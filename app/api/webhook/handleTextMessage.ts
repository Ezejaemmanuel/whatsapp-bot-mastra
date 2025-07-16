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
} from './response-sender';
import {
    formatErrorForTestMode,
    sendErrorResponse
} from './error-handler';


/**
 * Handle text messages with enhanced exchange bot logic
 */
export async function handleTextMessage(
    whatsappClient: WhatsAppCloudApiClient,
    databaseService: DatabaseService,
    messageInfo: ReturnType<typeof extractMessageInfo>,
    conversationId: Id<"conversations">
): Promise<void> {
    try {
        logInfo('Processing text message with KhalidWid Exchange Agent', {
            messageId: messageInfo.id,
            from: messageInfo.from,
            text: messageInfo.text,
            conversationId,
            operation: 'handleTextMessage'
        });

        // Increment unread count
        await databaseService.incrementUnreadCount(conversationId);

        // Get message text for processing
        const messageText = messageInfo.text?.trim() || '';

        let response: string;

        try {
            // Get user and conversation for proper memory context
            const user = await databaseService.getOrCreateUser(messageInfo.from);
            const userName = user.profileName || user.phoneNumber || messageInfo.from;
            const conversation = await databaseService.getOrCreateConversation(user._id, userName);

            // Create runtime context with memory context for tools
            const runtimeContext = new RuntimeContext<{
                userId: string;
                conversationId: string;
                phoneNumber: string;
            }>();
            runtimeContext.set('userId', user._id);
            runtimeContext.set('conversationId', conversation._id);
            runtimeContext.set('phoneNumber', messageInfo.from);

            const agent = mastra.getAgent('whatsappAgent');
            // Use the enhanced WhatsApp Exchange Agent to generate a response
            let agentResponse;
            const maxRetries = 3;
            for (let i = 0; i < maxRetries; i++) {
                agentResponse = await agent.generate(
                    [
                        {
                            role: 'user' as const,
                            content: messageText || 'Hello',
                        },
                    ],
                    {
                        temperature: HANDLE_TEXT_AGENT_TEMPRETURE,
                        memory: {
                            thread: `whatsapp-${messageInfo.from}`,
                            resource: messageInfo.from,
                        },
                        runtimeContext,
                    }
                );

                if (agentResponse?.text) {
                    break; // Exit loop if response is not empty
                }

                logWarning(`Agent generated an empty response on attempt ${i + 1}`, {
                    messageId: messageInfo.id,
                    from: messageInfo.from,
                    threadId: `whatsapp-${messageInfo.from}`,
                    operation: 'handleTextMessage',
                });

                if (i < maxRetries - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000)); // wait 1s before retrying
                }
            }

            if (agentResponse?.text) {
                response = agentResponse.text;
            } else {
                const emptyResponseError = new Error(`Agent returned an empty response after ${maxRetries} attempts.`);
                logWarning('Agent generated an empty response after multiple retries', {
                    messageId: messageInfo.id,
                    from: messageInfo.from,
                    threadId: `whatsapp-${messageInfo.from}`,
                    operation: 'handleTextMessage',
                });
                response = formatErrorForTestMode(emptyResponseError, {
                    operation: 'handleTextMessage',
                    messageId: messageInfo.id,
                    from: messageInfo.from,
                    errorType: 'agent_empty_response',
                });
                if (!TEST_MODE) {
                    response = "I apologize, but I couldn't process your message at the moment. Please try again.";
                }
            }

            logInfo('Generated exchange agent response', {
                messageId: messageInfo.id,
                from: messageInfo.from,
                responseLength: response.length,
                threadId: `whatsapp-${messageInfo.from}`,
                hasToolCalls: agentResponse?.toolCalls && agentResponse?.toolCalls.length > 0,
                toolCallsCount: agentResponse?.toolCalls?.length || 0,
                messageTextLength: messageText.length,
                operation: 'handleTextMessage',
            });

        } catch (agentError) {
            const agentErrorMessage = agentError instanceof Error ? agentError.message : 'Unknown agent error';

            logError('Exchange agent failed to process text message', agentError as Error, {
                messageId: messageInfo.id,
                from: messageInfo.from,
                text: messageText,
                threadId: `whatsapp-${messageInfo.from}`,
                agentErrorMessage,
                operation: 'handleTextMessage',
                fallbackUsed: true,
                errorDetails: {
                    name: agentError instanceof Error ? agentError.name : 'Unknown',
                    message: agentErrorMessage,
                    isGeminiContentError: agentErrorMessage.includes('contents.parts must not be empty')
                }
            });

            // Fallback response when agent fails - use test mode formatting if enabled
            response = formatErrorForTestMode(agentError, {
                operation: 'handleTextMessage',
                messageId: messageInfo.id,
                from: messageInfo.from,
                messageText: messageText.substring(0, 100),
                threadId: `whatsapp-${messageInfo.from}`,
                errorType: 'agent_error'
            });

            // If not in test mode, use friendly fallback
            if (!TEST_MODE) {
                response = 'I apologize, but I encountered an issue processing your message. Please try again in a moment, or contact support if the problem persists.';
            }
        }

        // Send response to user and store in database
        await sendAndStoreTextReply(
            whatsappClient,
            databaseService,
            messageInfo.from,
            response,
            conversationId,
            messageInfo.id
        );

        // Log successful processing
        logSuccess('Text message processed successfully with exchange agent', {
            messageId: messageInfo.id,
            from: messageInfo.from,
            responseLength: response.length,
            operation: 'handleTextMessage'
        });

    } catch (error) {
        logError('Error in text message handling (non-agent error)', error as Error, {
            messageId: messageInfo.id,
            from: messageInfo.from,
            text: messageInfo.text,
            conversationId,
            operation: 'handleTextMessage',
            errorType: 'non_agent_error'
        });

        // This catch block handles non-agent errors (database, network, etc.)
        let systemErrorResponse = formatErrorForTestMode(error, {
            operation: 'handleTextMessage',
            messageId: messageInfo.id,
            from: messageInfo.from,
            messageText: messageInfo.text?.substring(0, 100),
            conversationId,
            errorType: 'system_error'
        });

        // If not in test mode, use friendly fallback
        if (!TEST_MODE) {
            systemErrorResponse = 'I apologize, but I encountered a system issue. Please try again in a moment.';
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
                operation: 'handleTextMessage'
            });
            // Use the error response system as final fallback
            await sendErrorResponse(
                whatsappClient,
                messageInfo.from,
                'I apologize, but I\'m experiencing technical difficulties. Please try again later.',
                fallbackError
            );
        }
    }
}
