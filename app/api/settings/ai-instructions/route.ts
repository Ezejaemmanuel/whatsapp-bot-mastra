import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { WHATSAPP_AGENT_INSTRUCTIONS } from '@/mastra/agents/agent-instructions';
import { PROMPT_KEY } from '@/constant';

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// GET: Return the current AI instructions
export async function GET() {
    try {
        const value = await redis.get(PROMPT_KEY);
        return NextResponse.json({
            instructions: typeof value === 'string' && value.trim().length > 0 ? value : WHATSAPP_AGENT_INSTRUCTIONS,
        });
    } catch (e) {
        return NextResponse.json({ error: 'Failed to fetch instructions.' }, { status: 500 });
    }
}

// POST: Update the AI instructions
export async function POST(req: NextRequest) {
    try {
        const { instructions } = await req.json();
        if (typeof instructions !== 'string' || instructions.trim().length === 0) {
            return NextResponse.json({ error: 'Instructions must be a non-empty string.' }, { status: 400 });
        }
        await redis.set(PROMPT_KEY, instructions);
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: 'Failed to update instructions.' }, { status: 500 });
    }
} 