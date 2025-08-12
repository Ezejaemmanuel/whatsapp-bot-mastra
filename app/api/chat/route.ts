import { NextRequest, NextResponse } from 'next/server';
import { fetchAction, fetchQuery, fetchMutation } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

export async function POST(request: NextRequest) {
    try {
        const { message } = await request.json();

        if (!message || typeof message !== 'string') {
            return NextResponse.json(
                { error: 'Message is required and must be a string' },
                { status: 400 }
            );
        }

        const user = await fetchMutation(api.users.getOrCreateUser, { whatsappId: 'web-demo' });
        if (!user) {
            return NextResponse.json({ error: 'Failed to init user' }, { status: 500 });
        }
        const existing = await fetchQuery(api.conversations.getConversationByUserId, { userId: user._id as Id<'users'> });
        let conversationId: Id<'conversations'>;
        if (existing?._id) {
            conversationId = existing._id as Id<'conversations'>;
        } else {
            const created = await fetchMutation(api.conversations.getOrCreateConversation, { userId: user._id as Id<'users'>, userName: user.profileName || 'Web Demo' });
            if (!created) {
                return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
            }
            conversationId = created._id;
        }

        const result = await fetchAction(api.ai.generateReply, {
            userId: user._id as Id<'users'>,
            conversationId,
            prompt: message,
        });

        return NextResponse.json({ message: result.text, success: true });

    } catch (error) {
        console.error('Chat API error:', error);
        return NextResponse.json(
            { error: 'Failed to generate response' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const message = searchParams.get('message');

    if (!message) {
        return NextResponse.json(
            { error: 'Message parameter is required' },
            { status: 400 }
        );
    }

    try {
        const user = await fetchMutation(api.users.getOrCreateUser, { whatsappId: 'web-demo' });
        if (!user) {
            return NextResponse.json({ error: 'Failed to init user' }, { status: 500 });
        }
        const existing = await fetchQuery(api.conversations.getConversationByUserId, { userId: user._id as Id<'users'> });
        let conversationId: Id<'conversations'>;
        if (existing?._id) {
            conversationId = existing._id as Id<'conversations'>;
        } else {
            const created = await fetchMutation(api.conversations.getOrCreateConversation, { userId: user._id as Id<'users'>, userName: user.profileName || 'Web Demo' });
            if (!created) {
                return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
            }
            conversationId = created._id;
        }

        const result = await fetchAction(api.ai.generateReply, {
            userId: user._id as Id<'users'>,
            conversationId,
            prompt: message,
        });

        return NextResponse.json({ message: result.text, success: true });

    } catch (error) {
        console.error('Chat API error:', error);
        return NextResponse.json(
            { error: 'Failed to generate response' },
            { status: 500 }
        );
    }
} 