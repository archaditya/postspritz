import { publisherWorker } from './publisher.worker';
import { tokenRefreshWorker } from './token-refresh.worker';
import { notificationWorker } from './notification.worker';
import { cleanupWorker } from './cleanup.worker';
import { subscriptionWorker } from './subscription-expiry.worker';
import { postSchedulerWorker, postSchedulerQueue } from './post-scheduler.worker';
import { cleanupQueue, tokenRefreshQueue, subscriptionQueue } from '../config/bullmq';
import { logger } from '../config/logger';

export function startWorkers() {
  logger.info('Initializing background BullMQ workers...');

  publisherWorker.on('completed', (job) => {
    logger.debug({ jobId: job.id }, 'Publisher job finished successfully');
  });

  publisherWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err: err.message }, 'Publisher job failed');
  });

  postSchedulerWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err: err.message }, 'Post scheduler reconciliation job failed');
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

  subscriptionWorker.on('completed', (job, result) => {
    logger.info({ jobId: job.id, result }, 'Subscription expiry scan job completed successfully');
  });

  subscriptionWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err: err.message }, 'Subscription expiry scan job failed');
  });

  // Schedule 1-minute post reconciliation job
  postSchedulerQueue.add(
    'reconcile-scheduled-posts',
    {},
    {
      repeat: { pattern: '* * * * *' }, // Every minute
      jobId: 'cron_scheduled_posts_reconcile',
    }
  ).catch((err) => {
    logger.warn({ err }, 'Could not register cron_scheduled_posts_reconcile');
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

  // Schedule subscription package expiry every hour — transitions expired packages to Free Starter
  subscriptionQueue.add(
    'expire-subscriptions',
    {},
    {
      repeat: { pattern: '0 * * * *' }, // Every hour
      jobId: 'cron_subscription_expiry',
    }
  ).catch((err) => {
    logger.warn({ err }, 'Could not register cron_subscription_expiry');
  });

  logger.info('✅ All 6 background workers active (Publisher, PostScheduler, TokenRefresh, Notification, Cleanup/Retention, SubscriptionExpiry)');
}

export async function stopWorkers() {
  logger.info('Shutting down background workers...');
  await Promise.allSettled([
    publisherWorker.close(),
    postSchedulerWorker.close(),
    tokenRefreshWorker.close(),
    notificationWorker.close(),
    cleanupWorker.close(),
    subscriptionWorker.close(),
  ]);
  logger.info('Background workers closed.');
}
