import { createServer } from 'node:http';

import { createApp } from './app';
import { getEnv } from './lib/env';
import { logger } from './lib/logger';
import { disconnectPrisma } from './lib/prisma';

const env = getEnv();
const app = createApp();
const server = createServer(app);

let shuttingDown = false;

function shutdown(signal: string): void {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;
  logger.info({ signal }, 'Shutdown initiated');

  server.close((closeErr) => {
    if (closeErr) {
      logger.error({ err: closeErr }, 'Error closing HTTP server');
      process.exit(1);
    }
    void disconnectPrisma()
      .then(() => {
        logger.info('Shutdown complete');
        process.exit(0);
      })
      .catch((err: unknown) => {
        logger.error({ err }, 'Error during Prisma disconnect');
        process.exit(1);
      });
  });

  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10_000).unref();
}

const host = process.env['HOST'] ?? '0.0.0.0';
server.listen(env.PORT, host, () => {
  logger.info({ port: env.PORT, host }, 'HTTP server listening');
});

process.on('SIGINT', () => {
  shutdown('SIGINT');
});
process.on('SIGTERM', () => {
  shutdown('SIGTERM');
});
