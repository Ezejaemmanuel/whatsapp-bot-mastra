import { NextResponse } from 'next/server';
import { fetchMutation, fetchQuery } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { InCharge } from '@/convex/schemaUnions';
import { initializeWhatsAppService, sendTextMessage } from '@/app/api/webhook/whatsapp-service';

export async function POST(request: Request) {
    try {
        const { conversationId, inCharge, isFirstAdminMessage } = await request.json();

        if (!conversationId || !inCharge) {
            return NextResponse.json({ error: 'Missing conversationId or inCharge status' }, { status: 400 });
        }

        // 1. Update the conversation's inCharge status in Convex
        await fetchMutation(api.conversations.setInCharge, {
            conversationId: conversationId as Id<"conversations">,
            inCharge: inCharge as InCharge,
        });

        // 2. Determine the notification message
        let notificationMessage: string;
        if (isFirstAdminMessage) {
            notificationMessage = "👋 A customer care agent has joined the chat.";
        } else {
            notificationMessage =
                inCharge === "admin"
                    ? "💬 You are now connected with a customer care agent."
                    : "🤖 You are now chatting with our smart assistant.";
        }

        // 3. Get user's WhatsApp ID
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

        // 4. Store the system message in the database
        await fetchMutation(api.messages.storeOutgoingMessage, {
            conversationId: conversationId as Id<"conversations">,
            senderRole: inCharge as InCharge,
            senderName: inCharge === 'admin' ? 'Customer Care' : 'Smart Assistant',
            messageType: 'system',
            content: notificationMessage,
        });

        // 5. Send the notification via WhatsApp
        initializeWhatsAppService();
        await sendTextMessage(user.whatsappId, notificationMessage);

        return NextResponse.json({ success: true, message: 'Status updated and notification sent.' }, { status: 200 });

    } catch (error) {
        console.error('Error updating in-charge status:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: 'Failed to update status', details: errorMessage }, { status: 500 });
    }
} 