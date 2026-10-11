import { createApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { pool } from './db/pool';
import { redis } from './config/redis';
import { startWorkers, stopWorkers } from './workers';

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(`🚀 PostSpritz API server listening on ${env.API_BASE_URL} [${env.NODE_ENV}]`);
  startWorkers();
});

const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}, initiating graceful shutdown...`);

  server.close(async () => {
    logger.info('HTTP server closed.');

    try {
      await stopWorkers();
      await pool.end();
      logger.info('PostgreSQL pool drained.');

      await redis.quit();
      logger.info('Redis client disconnected.');

      process.exit(0);
    } catch (err) {
      logger.error({ err }, 'Error during graceful shutdown');
      process.exit(1);
    }
  });

  // Force close after 10s if hung
  setTimeout(() => {
    logger.error('Shutdown timed out, forcefully exiting');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
