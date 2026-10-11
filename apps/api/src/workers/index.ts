import { publisherWorker } from './publisher.worker';
import { tokenRefreshWorker } from './token-refresh.worker';
import { notificationWorker } from './notification.worker';
import { cleanupWorker } from './cleanup.worker';
import { cleanupQueue, tokenRefreshQueue } from '../config/bullmq';
import { logger } from '../config/logger';

export function startWorkers() {
  logger.info('Initializing background BullMQ workers...');

  publisherWorker.on('completed', (job) => {
    logger.debug({ jobId: job.id }, 'Publisher job finished successfully');
  });

  publisherWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err: err.message }, 'Publisher job failed');
  });

  tokenRefreshWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err: err.message }, 'Token refresh job failed');
  });

  notificationWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err: err.message }, 'Notification job failed');
  });

  cleanupWorker.on('completed', (job, result) => {
    logger.info({ jobId: job.id, result }, 'Retention cleanup job completed successfully');
  });

  cleanupWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err: err.message }, 'Retention cleanup job failed');
  });

  // Schedule daily data retention backoff purge job (midnight UTC)
  cleanupQueue.add(
    'daily-retention-purge',
    { retentionDays: 30 },
    {
      repeat: { pattern: '0 0 * * *' },
      jobId: 'cron_daily_retention_purge',
    }
  ).catch((err) => {
    logger.warn({ err }, 'Could not register cron_daily_retention_purge');
  });

  // Schedule token refresh every 6 hours — scans for tokens expiring within 48hrs
  // FB/IG long-lived tokens are ~60 days, Threads ~60 days, LinkedIn ~60 days
  tokenRefreshQueue.add(
    'refresh-expiring-tokens',
    {},
    {
      repeat: { pattern: '0 */6 * * *' }, // Every 6 hours
      jobId: 'cron_token_refresh',
    }
  ).catch((err) => {
    logger.warn({ err }, 'Could not register cron_token_refresh');
  });

  logger.info('✅ All 4 background workers active (Publisher, TokenRefresh, Notification, Cleanup/Retention)');
}

export async function stopWorkers() {
  logger.info('Shutting down background workers...');
  await Promise.allSettled([
    publisherWorker.close(),
    tokenRefreshWorker.close(),
    notificationWorker.close(),
    cleanupWorker.close(),
  ]);
  logger.info('Background workers closed.');
}
