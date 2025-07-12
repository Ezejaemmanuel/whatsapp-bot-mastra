import { NextResponse } from 'next/server';
import { fetchMutation, fetchQuery } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { initializeWhatsAppService, sendTextMessage, sendImageMessage } from '@/app/api/webhook/whatsapp-service';

export async function POST(request: Request) {
    try {
        const { conversationId, senderRole, senderName, messageType, content, storageId, mediaType, caption } = await request.json();

        if (!conversationId || !senderRole || !messageType) {
            return NextResponse.json({ error: 'Missing required message parameters' }, { status: 400 });
        }

        let mediaUrlToStore = null;

        // If a storageId is provided, get the URL from Convex
        if (messageType === 'image' && storageId) {
            const url = await fetchQuery(api.mediaFiles.getFileUrl, { storageId: storageId as Id<"_storage"> });
            if (!url) {
                return NextResponse.json({ error: 'Could not retrieve file URL from storage' }, { status: 500 });
            }
            mediaUrlToStore = url;
        }

        // 1. Store the outgoing message in Convex
        await fetchMutation(api.messages.storeOutgoingMessage, {
            conversationId: conversationId as Id<"conversations">,
            senderRole,
            senderName,
            messageType,
            content,
            mediaUrl: mediaUrlToStore || undefined,
            mediaType: mediaType,
            caption,
        });

        // 2. Get user's WhatsApp ID
        const conversation = await fetchQuery(api.conversations.getConversationById, {
            conversationId: conversationId as Id<"conversations">
        });
        if (!conversation) {
            return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
        }

        const user = await fetchQuery(api.users.getUserById, { userId: conversation.userId });
        if (!user) {
            return NextResponse.json({ error: 'User not found for conversation' }, { status: 404 });
        }

        // 3. Send the message via WhatsApp
        initializeWhatsAppService();
        if (messageType === 'image' && mediaUrlToStore) {
            await sendImageMessage(user.whatsappId, mediaUrlToStore, caption);
        } else if (messageType === 'text' && content) {
            await sendTextMessage(user.whatsappId, content);
        } else if (caption) { // Handle cases where there might be only a caption
            await sendTextMessage(user.whatsappId, caption);
        }

        return NextResponse.json({ success: true, message: 'Message sent.' }, { status: 200 });

    } catch (error) {
        console.error('Error sending message:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: 'Failed to send message', details: errorMessage }, { status: 500 });
    }
} 