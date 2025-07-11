import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { fetchQuery } from "convex/nextjs";
import { api } from "../../convex/_generated/api";
import { logToolCall, logToolResult, logToolError } from './utils';

/**
 * Tool to get the admin's current online status
 */
export const getAdminStatusTool = createTool({
    id: 'get_admin_status',
    description: "Get the admin's current online status. It checks for manual overrides and recurring schedules.",
    inputSchema: z.object({}), // No parameters accepted
    execute: async () => {
        const startTime = Date.now();
        const toolId = 'get_admin_status';

        logToolCall(toolId, {});

        try {
            const adminStatus = await fetchQuery(api.adminStatus.getAdminStatus, {});
            const executionTime = Date.now() - startTime;

            let resultMessage = "Admin is currently online.";
            if (adminStatus.isInactive) {
                if (adminStatus.reason === 'manual_override') {
                    resultMessage = "The admin is currently offline. You can still proceed with your transaction, and it will be processed shortly.";
                } else if (adminStatus.reason === 'recurring_schedule' && 'activeTime' in adminStatus && adminStatus.activeTime) {
                    resultMessage = `The admin is currently offline and will be back at ${adminStatus.activeTime} (Kenyan time). You can proceed with the transaction, and it will be processed then.`;
                } else if (adminStatus.reason === 'recurring_schedule') {
                    resultMessage = `The admin is currently offline due to a schedule. You can proceed with the transaction, and it will be processed when the admin is back online.`;
                }
            }

            const result = {
                success: true,
                isInactive: adminStatus.isInactive,
                reason: adminStatus.reason,
                activeTime: ('activeTime' in adminStatus && adminStatus.activeTime) ? adminStatus.activeTime : null,
                message: resultMessage,
            };

            logToolResult(toolId, result, executionTime);
            return result;

        } catch (error) {
            const executionTime = Date.now() - startTime;
            logToolError(toolId, error as Error, executionTime, {});
            throw new Error(`Failed to get admin status: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    },
}); 