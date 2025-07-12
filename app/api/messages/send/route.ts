import { NextResponse } from 'next/server';
import { fetchMutation, fetchQuery } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { initializeWhatsAppService, sendTextMessage } from '@/app/api/webhook/whatsapp-service';

export async function POST(request: Request) {
    try {
        const { conversationId, senderRole, senderName, messageType, content, mediaUrl, caption } = await request.json();

        if (!conversationId || !senderRole || !messageType) {
            return NextResponse.json({ error: 'Missing required message parameters' }, { status: 400 });
        }

        // 1. Store the outgoing message in Convex
        await fetchMutation(api.messages.storeOutgoingMessage, {
            conversationId: conversationId as Id<"conversations">,
            senderRole,
            senderName,
            messageType,
            content,
            mediaUrl,
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
        // TODO: Handle media messages (images, etc.)
        initializeWhatsAppService();
        await sendTextMessage(user.whatsappId, content || caption || 'You received a new message.');

        return NextResponse.json({ success: true, message: 'Message sent.' }, { status: 200 });

    } catch (error) {
        console.error('Error sending message:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: 'Failed to send message', details: errorMessage }, { status: 500 });
    }
} 