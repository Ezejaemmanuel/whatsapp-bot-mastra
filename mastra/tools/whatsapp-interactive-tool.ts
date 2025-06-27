import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

/**
 * Enhanced logging utility for WhatsApp interactive tools
 */
function logInteractiveEvent(
    level: 'INFO' | 'ERROR' | 'WARN' | 'SUCCESS',
    message: string,
    data?: Record<string, any>
): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        level,
        source: 'WhatsApp Interactive Tools',
        message,
        ...data
    };

    const levelEmoji = {
        'INFO': '📋',
        'ERROR': '❌',
        'WARN': '⚠️',
        'SUCCESS': '✅'
    };

    console.log(`[${timestamp}] ${levelEmoji[level] || '📋'} [${level}] WhatsApp Interactive Tools: ${message}`);

    if (data && Object.keys(data).length > 0) {
        console.log('📊 Interactive Data:', JSON.stringify(data, null, 2));
    }
}

function logSuccess(message: string, data?: Record<string, any>): void {
    logInteractiveEvent('SUCCESS', message, data);
}

function logError(message: string, error?: Error | string, data?: Record<string, any>): void {
    const errorData = {
        ...data,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
    };
    logInteractiveEvent('ERROR', message, errorData);
}

function logInfo(message: string, data?: Record<string, any>): void {
    logInteractiveEvent('INFO', message, data);
}

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
            title: z.string().describe('Button text (max 20 chars)')
        })).min(1).max(3).describe('Array of buttons (1-3 buttons)'),
        headerText: z.string().optional().describe('Optional header text'),
        footerText: z.string().optional().describe('Optional footer text'),
    }),
    execute: async ({ context }) => {
        const startTime = Date.now();

        logInfo('Creating interactive button message', {
            bodyTextLength: context.bodyText?.length || 0,
            buttonCount: context.buttons?.length || 0,
            hasHeaderText: !!context.headerText,
            hasFooterText: !!context.footerText,
            buttons: context.buttons?.map(btn => ({
                id: btn.id,
                titleLength: btn.title?.length || 0
            })) || [],
            operation: 'send_interactive_buttons'
        });

        try {
            // Validate inputs
            if (!context.bodyText || context.bodyText.trim().length === 0) {
                logError('Body text is required for interactive buttons', new Error('Missing body text'), {
                    operation: 'send_interactive_buttons',
                    errorType: 'validation_error'
                });
                throw new Error('Body text is required for interactive buttons');
            }

            if (!context.buttons || context.buttons.length === 0) {
                logError('At least one button is required', new Error('No buttons provided'), {
                    operation: 'send_interactive_buttons',
                    errorType: 'validation_error'
                });
                throw new Error('At least one button is required');
            }

            if (context.buttons.length > 3) {
                logError('Maximum 3 buttons allowed for interactive message', new Error('Too many buttons'), {
                    buttonCount: context.buttons.length,
                    operation: 'send_interactive_buttons',
                    errorType: 'validation_error'
                });
                throw new Error('Maximum 3 buttons allowed for interactive message');
            }

            // Validate button titles length
            const invalidButtons = context.buttons.filter(btn => !btn.title || btn.title.length > 20);
            if (invalidButtons.length > 0) {
                logError('Button titles must be 1-20 characters', new Error('Invalid button titles'), {
                    invalidButtonsCount: invalidButtons.length,
                    invalidButtons: invalidButtons.map(btn => ({
                        id: btn.id,
                        titleLength: btn.title?.length || 0
                    })),
                    operation: 'send_interactive_buttons',
                    errorType: 'validation_error'
                });
                throw new Error('Button titles must be 1-20 characters');
            }

            const executionTime = Date.now() - startTime;

            logSuccess('Interactive button message prepared successfully', {
                bodyTextLength: context.bodyText.length,
                buttonCount: context.buttons.length,
                hasHeaderText: !!context.headerText,
                hasFooterText: !!context.footerText,
                headerTextLength: context.headerText?.length || 0,
                footerTextLength: context.footerText?.length || 0,
                buttonDetails: context.buttons.map(btn => ({
                    id: btn.id,
                    titleLength: btn.title.length
                })),
                executionTimeMs: executionTime,
                operation: 'send_interactive_buttons'
            });

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
        } catch (error) {
            const executionTime = Date.now() - startTime;

            logError('Failed to create interactive button message', error as Error, {
                bodyTextLength: context.bodyText?.length || 0,
                buttonCount: context.buttons?.length || 0,
                executionTimeMs: executionTime,
                operation: 'send_interactive_buttons'
            });

            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create interactive button message'
            };
        }
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
                title: z.string().describe('Row title (max 24 chars)'),
                description: z.string().optional().describe('Row description (max 72 chars)')
            })).min(1).max(10).describe('Rows in this section (1-10 per section)')
        })).min(1).max(10).describe('Sections in the list (1-10 sections)'),
        headerText: z.string().optional().describe('Optional header text'),
        footerText: z.string().optional().describe('Optional footer text'),
    }),
    execute: async ({ context }) => {
        const startTime = Date.now();

        const totalRows = context.sections?.reduce((total, section) => total + (section.rows?.length || 0), 0) || 0;

        logInfo('Creating interactive list message', {
            bodyTextLength: context.bodyText?.length || 0,
            buttonTextLength: context.buttonText?.length || 0,
            sectionsCount: context.sections?.length || 0,
            totalRows: totalRows,
            hasHeaderText: !!context.headerText,
            hasFooterText: !!context.footerText,
            sectionsDetails: context.sections?.map(section => ({
                title: section.title,
                rowsCount: section.rows?.length || 0
            })) || [],
            operation: 'send_interactive_list'
        });

        try {
            // Validate inputs
            if (!context.bodyText || context.bodyText.trim().length === 0) {
                logError('Body text is required for interactive list', new Error('Missing body text'), {
                    operation: 'send_interactive_list',
                    errorType: 'validation_error'
                });
                throw new Error('Body text is required for interactive list');
            }

            if (!context.buttonText || context.buttonText.trim().length === 0) {
                logError('Button text is required for interactive list', new Error('Missing button text'), {
                    operation: 'send_interactive_list',
                    errorType: 'validation_error'
                });
                throw new Error('Button text is required for interactive list');
            }

            if (!context.sections || context.sections.length === 0) {
                logError('At least one section is required', new Error('No sections provided'), {
                    operation: 'send_interactive_list',
                    errorType: 'validation_error'
                });
                throw new Error('At least one section is required');
            }

            if (context.sections.length > 10) {
                logError('Maximum 10 sections allowed for interactive list', new Error('Too many sections'), {
                    sectionsCount: context.sections.length,
                    operation: 'send_interactive_list',
                    errorType: 'validation_error'
                });
                throw new Error('Maximum 10 sections allowed for interactive list');
            }

            // Validate sections and rows
            for (const [sectionIndex, section] of context.sections.entries()) {
                if (!section.title || section.title.trim().length === 0) {
                    logError(`Section ${sectionIndex + 1} title is required`, new Error('Missing section title'), {
                        sectionIndex,
                        operation: 'send_interactive_list',
                        errorType: 'validation_error'
                    });
                    throw new Error(`Section ${sectionIndex + 1} title is required`);
                }

                if (!section.rows || section.rows.length === 0) {
                    logError(`Section ${sectionIndex + 1} must have at least one row`, new Error('Missing section rows'), {
                        sectionIndex,
                        sectionTitle: section.title,
                        operation: 'send_interactive_list',
                        errorType: 'validation_error'
                    });
                    throw new Error(`Section ${sectionIndex + 1} must have at least one row`);
                }

                if (section.rows.length > 10) {
                    logError(`Section ${sectionIndex + 1} has too many rows (max 10)`, new Error('Too many rows'), {
                        sectionIndex,
                        sectionTitle: section.title,
                        rowsCount: section.rows.length,
                        operation: 'send_interactive_list',
                        errorType: 'validation_error'
                    });
                    throw new Error(`Section ${sectionIndex + 1} has too many rows (max 10)`);
                }

                // Validate row titles and descriptions
                for (const [rowIndex, row] of section.rows.entries()) {
                    if (!row.title || row.title.length > 24) {
                        logError(`Invalid row title in section ${sectionIndex + 1}, row ${rowIndex + 1}`, new Error('Invalid row title'), {
                            sectionIndex,
                            rowIndex,
                            titleLength: row.title?.length || 0,
                            operation: 'send_interactive_list',
                            errorType: 'validation_error'
                        });
                        throw new Error(`Row titles must be 1-24 characters (Section ${sectionIndex + 1}, Row ${rowIndex + 1})`);
                    }

                    if (row.description && row.description.length > 72) {
                        logError(`Row description too long in section ${sectionIndex + 1}, row ${rowIndex + 1}`, new Error('Description too long'), {
                            sectionIndex,
                            rowIndex,
                            descriptionLength: row.description.length,
                            operation: 'send_interactive_list',
                            errorType: 'validation_error'
                        });
                        throw new Error(`Row descriptions must be max 72 characters (Section ${sectionIndex + 1}, Row ${rowIndex + 1})`);
                    }
                }
            }

            const executionTime = Date.now() - startTime;

            logSuccess('Interactive list message prepared successfully', {
                bodyTextLength: context.bodyText.length,
                buttonTextLength: context.buttonText.length,
                sectionsCount: context.sections.length,
                totalRows: totalRows,
                hasHeaderText: !!context.headerText,
                hasFooterText: !!context.footerText,
                headerTextLength: context.headerText?.length || 0,
                footerTextLength: context.footerText?.length || 0,
                sectionsDetails: context.sections.map(section => ({
                    title: section.title,
                    rowsCount: section.rows.length,
                    hasDescriptions: section.rows.some(row => !!row.description)
                })),
                executionTimeMs: executionTime,
                operation: 'send_interactive_list'
            });

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
        } catch (error) {
            const executionTime = Date.now() - startTime;

            logError('Failed to create interactive list message', error as Error, {
                bodyTextLength: context.bodyText?.length || 0,
                buttonTextLength: context.buttonText?.length || 0,
                sectionsCount: context.sections?.length || 0,
                totalRows: totalRows,
                executionTimeMs: executionTime,
                operation: 'send_interactive_list'
            });

            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create interactive list message'
            };
        }
    },
});

