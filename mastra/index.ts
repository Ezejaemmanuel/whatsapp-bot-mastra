import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { whatsappAgent } from './agents/whatsapp-agent';
import { whatsappAgentSimple } from './agents/whatsapp-agent-simple';

export const mastra = new Mastra({
  agents: {
    whatsappAgent,
    whatsappAgentSimple, // Use the simple agent
  },

  logger: new PinoLogger({
    name: 'Mastra',
    level: 'debug',
  }),
});
