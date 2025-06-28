import { NextRequest, NextResponse } from 'next/server';
import { mastra } from '@/mastra';
import { validateAndSanitizeContent } from '@/mastra/agents/whatsapp-agent';

export async function POST(request: NextRequest) {
    try {
        const { message } = await request.json();

        if (!message || typeof message !== 'string') {
            return NextResponse.json(
                { error: 'Message is required and must be a string' },
                { status: 400 }
            );
        }

        // ✅ CRITICAL: Validate and sanitize content to prevent Gemini "contents.parts must not be empty" error
        const sanitizedMessage = validateAndSanitizeContent(message);

        // Get the WhatsApp agent from Mastra
        const agent = mastra.getAgent('whatsappAgent');

        if (!agent) {
            return NextResponse.json(
                { error: 'WhatsApp agent not found' },
                { status: 500 }
            );
        }

        // ✅ CRITICAL: Additional validation before sending to agent
        if (!sanitizedMessage || sanitizedMessage.trim().length === 0) {
            return NextResponse.json(
                { error: 'Message content is empty after validation' },
                { status: 400 }
            );
        }

        // Generate response using the agent with validated content
        const response = await agent.generate([
            {
                role: 'user' as const,
                content: sanitizedMessage,
            }
        ]);

        // ✅ CRITICAL: Validate agent response
        const responseText = response.text?.trim();
        const finalResponse = responseText && responseText.length > 0
            ? responseText
            : 'I apologize, but I couldn\'t process your message at the moment. Please try again.';

        return NextResponse.json({
            message: finalResponse,
            success: true
        });

    } catch (error) {
        console.error('Chat API error:', error);

        // Enhanced error handling for Gemini content errors
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const isGeminiContentError = errorMessage.includes('contents.parts must not be empty') ||
            errorMessage.includes('GenerateContentRequest.contents');

        if (isGeminiContentError) {
            return NextResponse.json(
                { error: 'Message format issue. Please rephrase your message and try again.' },
                { status: 400 }
            );
        }

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
        // ✅ CRITICAL: Validate and sanitize content to prevent Gemini "contents.parts must not be empty" error
        const sanitizedMessage = validateAndSanitizeContent(message);

        // Get the WhatsApp agent from Mastra
        const agent = mastra.getAgent('whatsappAgent');

        if (!agent) {
            return NextResponse.json(
                { error: 'WhatsApp agent not found' },
                { status: 500 }
            );
        }

        // ✅ CRITICAL: Additional validation before sending to agent
        if (!sanitizedMessage || sanitizedMessage.trim().length === 0) {
            return NextResponse.json(
                { error: 'Message content is empty after validation' },
                { status: 400 }
            );
        }

        // Generate response using the agent with validated content
        const response = await agent.generate([
            {
                role: 'user' as const,
                content: sanitizedMessage,
            }
        ]);

        // ✅ CRITICAL: Validate agent response
        const responseText = response.text?.trim();
        const finalResponse = responseText && responseText.length > 0
            ? responseText
            : 'I apologize, but I couldn\'t process your message at the moment. Please try again.';

        return NextResponse.json({
            message: finalResponse,
            success: true
        });

    } catch (error) {
        console.error('Chat API error:', error);

        // Enhanced error handling for Gemini content errors
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const isGeminiContentError = errorMessage.includes('contents.parts must not be empty') ||
            errorMessage.includes('GenerateContentRequest.contents');

        if (isGeminiContentError) {
            return NextResponse.json(
                { error: 'Message format issue. Please rephrase your message and try again.' },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to generate response' },
            { status: 500 }
        );
    }
} 