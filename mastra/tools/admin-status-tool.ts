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

            const result = {
                isInactive: adminStatus.isInactive,
                reason: adminStatus.reason,
                activeTime: ('activeTime' in adminStatus && adminStatus.activeTime) ? adminStatus.activeTime : null
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