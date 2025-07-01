import { NextRequest, NextResponse } from 'next/server';
import { mastra } from '@/mastra';
import { RuntimeContext } from '@mastra/core/runtime-context';

export async function POST(request: NextRequest) {
    try {
        const { message } = await request.json();

        if (!message || typeof message !== 'string') {
            return NextResponse.json(
                { error: 'Message is required and must be a string' },
                { status: 400 }
            );
        }

        // Get the WhatsApp agent from Mastra
        const agent = mastra.getAgent('whatsappAgent');

        if (!agent) {
            return NextResponse.json(
                { error: 'WhatsApp agent not found' },
                { status: 500 }
            );
        }

        // Generate response using the agent
        const response = await agent.generate(message, {
            runtimeContext: new RuntimeContext<{
                userId: string;
                conversationId: string;
                phoneNumber: string;
            }>(),
        });

        return NextResponse.json({
            message: response.text,
            success: true
        });

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
        // Get the WhatsApp agent from Mastra
        const agent = mastra.getAgent('whatsappAgent');

        if (!agent) {
            return NextResponse.json(
                { error: 'WhatsApp agent not found' },
                { status: 500 }
            );
        }

        // Generate response using the agent
        const response = await agent.generate(message);

        return NextResponse.json({
            message: response.text,
            success: true
        });

    } catch (error) {
        console.error('Chat API error:', error);
        return NextResponse.json(
            { error: 'Failed to generate response' },
            { status: 500 }
        );
    }
} 