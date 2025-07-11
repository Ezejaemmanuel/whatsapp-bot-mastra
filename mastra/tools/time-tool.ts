import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { logToolCall, logToolResult, logError, logToolError } from './utils';

export const getKenyaTimeTool = createTool({
    id: 'get_kenya_time',
    description: 'Get the current time, part of the day (morning, afternoon, evening), day of the week, and special greetings for holidays/weekends in Kenya (Africa/Nairobi timezone).',
    inputSchema: z.object({}), // No parameters needed
    execute: async ({ }) => {
        const startTime = Date.now();
        const toolId = 'get_kenya_time';
        logToolCall(toolId, {});

        try {
            const now = new Date();
            const timeZone = 'Africa/Nairobi';

            const timeString = now.toLocaleTimeString('en-US', { timeZone, hour12: false, hour: '2-digit', minute: '2-digit' });
            const hour = parseInt(timeString.split(':')[0], 10);

            let partOfDay;
            if (hour >= 0 && hour < 12) {
                partOfDay = 'morning';
            } else if (hour >= 12 && hour < 16) {
                partOfDay = 'afternoon';
            } else {
                partOfDay = 'evening';
            }

            const dayOfWeek = now.toLocaleDateString('en-US', { timeZone, weekday: 'long' });

            let specialGreeting = null;
            if (dayOfWeek === 'Saturday' || dayOfWeek === 'Sunday') {
                specialGreeting = 'Happy weekend!';
            }
            if (dayOfWeek === 'Sunday') {
                specialGreeting = 'Happy Sunday!';
            }
            if (dayOfWeek === 'Monday') {
                specialGreeting = 'Happy new week!';
            }

            const result = {
                success: true,
                time: now.toLocaleTimeString('en-GB', { timeZone }),
                partOfDay, // 'morning', 'afternoon', 'evening'
                dayOfWeek, // 'Monday', 'Tuesday', etc.
                specialGreeting, // 'Happy weekend!', 'Happy Sunday!', 'Happy new week!' or null
            };

            const executionTime = Date.now() - startTime;
            logToolResult(toolId, result, executionTime);
            return result;
        } catch (error) {
            const executionTime = Date.now() - startTime;
            logError('Failed to get Kenya time', error as Error, { operation: toolId });
            logToolError(toolId, error as Error, executionTime, {});
            throw new Error(`Failed to get Kenya time: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    },
}); 