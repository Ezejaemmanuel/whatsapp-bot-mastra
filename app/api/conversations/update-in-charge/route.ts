import { NextResponse } from 'next/server';
import { fetchMutation, fetchQuery } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { InCharge } from '@/convex/schemaUnions';

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

        // 2. If it's the first admin message, store a system message for context
        if (isFirstAdminMessage) {
            const notificationMessage = "👋 A customer care agent has joined the chat.";

            await fetchMutation(api.messages.storeOutgoingMessage, {
                conversationId: conversationId as Id<"conversations">,
                senderRole: 'admin',
                senderName: 'System',
                messageType: 'system',
                content: notificationMessage,
            });
        }


        return NextResponse.json({ success: true, message: 'Status updated successfully.' }, { status: 200 });

    } catch (error) {
        console.error('Error updating in-charge status:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: 'Failed to update status', details: errorMessage }, { status: 500 });
    }
} 