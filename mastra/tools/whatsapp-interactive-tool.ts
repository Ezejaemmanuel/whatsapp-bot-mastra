import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

/**
 * Tool for the agent to send interactive button messages
 */
export const sendInteractiveButtonsTool = createTool({
    id: 'send_interactive_buttons',
    description: 'Send interactive button message to WhatsApp user. Use this when you want to give users 2-3 clear options to choose from.',
    inputSchema: z.object({
        bodyText: z.string().describe('Main message body text'),
        buttons: z.array(z.object({
            id: z.string().describe('Button ID for tracking clicks'),
            title: z.string().max(20).describe('Button text (max 20 chars)')
        })).min(1).max(3).describe('Array of buttons (1-3 buttons)'),
        headerText: z.string().optional().describe('Optional header text'),
        footerText: z.string().optional().describe('Optional footer text'),
    }),
    execute: async ({ context }) => {
        // Return the data that the WhatsApp service will use to send the message
        return {
            success: true,
            action: 'SEND_INTERACTIVE_BUTTONS',
            data: {
                bodyText: context.bodyText,
                buttons: context.buttons,
                headerText: context.headerText,
                footerText: context.footerText,
            }
        };
    },
});

/**
 * Tool for the agent to send interactive list messages
 */
export const sendInteractiveListTool = createTool({
    id: 'send_interactive_list',
    description: 'Send interactive list message to WhatsApp user. Use this when you have 4+ options for users to choose from.',
    inputSchema: z.object({
        bodyText: z.string().describe('Main message body text'),
        buttonText: z.string().describe('Button text to open the list'),
        sections: z.array(z.object({
            title: z.string().describe('Section title'),
            rows: z.array(z.object({
                id: z.string().describe('Row ID for tracking selection'),
                title: z.string().max(24).describe('Row title (max 24 chars)'),
                description: z.string().max(72).optional().describe('Row description (max 72 chars)')
            })).min(1).max(10).describe('Rows in this section (1-10 per section)')
        })).min(1).max(10).describe('Sections in the list (1-10 sections)'),
        headerText: z.string().optional().describe('Optional header text'),
        footerText: z.string().optional().describe('Optional footer text'),
    }),
    execute: async ({ context }) => {
        // Return the data that the WhatsApp service will use to send the message
        return {
            success: true,
            action: 'SEND_INTERACTIVE_LIST',
            data: {
                bodyText: context.bodyText,
                buttonText: context.buttonText,
                sections: context.sections,
                headerText: context.headerText,
                footerText: context.footerText,
            }
        };
    },
});

