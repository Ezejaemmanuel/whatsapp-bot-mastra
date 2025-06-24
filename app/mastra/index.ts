import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { whatsappAgent } from './agents/whatsapp-agent';

export const mastra = new Mastra({
  agents: {
    whatsappAgent,
  },

  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
});
