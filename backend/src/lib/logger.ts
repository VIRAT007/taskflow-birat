import pino from 'pino';

import { getEnv } from './env';

const env = getEnv();

export const logger = pino(
  env.NODE_ENV === 'development'
    ? {
        level: env.LOG_LEVEL,
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:standard' },
        },
      }
    : { level: env.LOG_LEVEL },
);
