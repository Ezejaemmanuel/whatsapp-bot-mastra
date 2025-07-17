import inquirer from 'inquirer';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { Redis } from '@upstash/redis';
import { PROMPT_KEY } from '../constant';
import { config as dotenvConfig } from 'dotenv';

// Load environment variables from .env if present
dotenvConfig();

// Helper to resolve project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..', '..');

// Path to agent-instructions.ts
const AGENT_INSTRUCTIONS_PATH = join(__dirname, 'mastra', 'agents', 'agent-instructions.ts');

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Helper to extract the WHATSAPP_AGENT_INSTRUCTIONS string from agent-instructions.ts
async function getAgentInstructionsFromFile(): Promise<string> {
    const file = await readFile(AGENT_INSTRUCTIONS_PATH, 'utf8');
    const match = file.match(/export const WHATSAPP_AGENT_INSTRUCTIONS = `([\s\S]*?)`;/);
    if (!match) throw new Error('Could not find WHATSAPP_AGENT_INSTRUCTIONS in agent-instructions.ts');
    return match[1];
}

// Helper to update the WHATSAPP_AGENT_INSTRUCTIONS string in agent-instructions.ts
async function setAgentInstructionsInFile(newInstructions: string): Promise<void> {
    const file = await readFile(AGENT_INSTRUCTIONS_PATH, 'utf8');
    const updated = file.replace(
        /export const WHATSAPP_AGENT_INSTRUCTIONS = `([\s\S]*?)`;/,
        `export const WHATSAPP_AGENT_INSTRUCTIONS = \`${newInstructions}\`;`
    );
    await writeFile(AGENT_INSTRUCTIONS_PATH, updated, 'utf8');
}

async function main() {
    // Prompt user for action
    const { action } = await inquirer.prompt([
        {
            type: 'list',
            name: 'action',
            message: 'What do you want to do?',
            choices: [
                { name: 'Update agent-instructions.ts with data from Redis', value: 'redis-to-file' },
                { name: 'Update Redis with data from agent-instructions.ts', value: 'file-to-redis' },
            ],
        },
    ]);

    if (action === 'redis-to-file') {
        // Get from Redis, update file
        const redisValue = await redis.get(PROMPT_KEY);
        if (!redisValue || typeof redisValue !== 'string') {
            console.error('No valid instructions found in Redis.');
            process.exit(1);
        }
        await setAgentInstructionsInFile(redisValue);
        console.log('agent-instructions.ts updated with data from Redis.');
    } else if (action === 'file-to-redis') {
        // Get from file, update Redis
        const fileValue = await getAgentInstructionsFromFile();
        await redis.set(PROMPT_KEY, fileValue);
        console.log('Redis updated with data from agent-instructions.ts.');
    }
}

main().catch((err) => {
    console.error('Error:', err);
    process.exit(1);
}); 