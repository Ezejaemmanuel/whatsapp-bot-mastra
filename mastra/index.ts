import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { whatsappAgent } from './agents/whatsapp-agent';

export const mastra = new Mastra({
  agents: {
    whatsappAgent, // Enhanced KhalidWid Exchange Bot with full functionality
  },

  logger: new PinoLogger({
    name: 'KhalidWid-Exchange-Mastra',
    level: 'info',
  }),
});
