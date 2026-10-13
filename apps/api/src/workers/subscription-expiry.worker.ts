import { Worker, Job } from 'bullmq';
import { redis } from '../config/redis';
import { logger } from '../config/logger';
import { query } from '../db/pool';
import { notificationQueue } from '../config/bullmq';
import { SubscriptionStatus } from '@pushpost/shared-types';

export interface ExpiredSubscriptionDetail {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  plan_name: string;
  plan_display_name: string;
  current_period_end: string;
}

export async function processExpiredSubscriptions(): Promise<{
  expiredCount: number;
  expiredSubscriptions: ExpiredSubscriptionDetail[];
}> {
  logger.info('Subscription Expiry Worker: Scanning for active subscriptions past their period end date...');

  // 1. Find all active or trialing subscriptions whose current_period_end has passed
  const res = await query(
    `SELECT s.id, s.user_id, s.plan_id, s.billing_cycle, s.current_period_end,
            p.name as plan_name, p.display_name as plan_display_name,
            u.email as user_email, u.name as user_name
     FROM subscriptions s
     JOIN plans p ON p.id = s.plan_id
     JOIN users u ON u.id = s.user_id
     WHERE s.status IN ('active', 'trialing')
       AND s.current_period_end IS NOT NULL
       AND s.current_period_end <= NOW()
       AND s.deleted_at IS NULL`
  );

  const expiredList: ExpiredSubscriptionDetail[] = res.rows;
  logger.info({ count: expiredList.length }, 'Found expired subscriptions to process');

  if (expiredList.length === 0) {
    return { expiredCount: 0, expiredSubscriptions: [] };
  }

  const processed: ExpiredSubscriptionDetail[] = [];

  for (const sub of expiredList) {
    try {
      // 2. Mark subscription as expired
      await query(
        `UPDATE subscriptions
         SET status = $1, updated_at = NOW()
         WHERE id = $2`,
        [SubscriptionStatus.EXPIRED, sub.id]
      );

      // 3. Log audit event
      await query(
        `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, metadata)
         VALUES ($1, 'SUBSCRIPTION_EXPIRED', 'USER_SUBSCRIPTION', $2, $3)`,
        [
          sub.user_id,
          sub.id,
          JSON.stringify({
            expired_plan: sub.plan_name,
            plan_display_name: sub.plan_display_name,
            period_end: sub.current_period_end,
            user_email: sub.user_email
          })
        ]
      );

      // 4. Queue user alert notification
      await notificationQueue.add('subscription-expired', {
        userId: sub.user_id,
        planDisplayName: sub.plan_display_name,
        userEmail: sub.user_email
      }).catch((err) => {
        logger.warn({ err, subId: sub.id }, 'Failed to enqueue subscription-expired notification');
      });

      processed.push(sub);
      logger.info(
        { userId: sub.user_id, subscriptionId: sub.id, plan: sub.plan_name },
        `Successfully expired subscription for user ${sub.user_email}`
      );
    } catch (err: any) {
      logger.error(
        { err: err.message, subscriptionId: sub.id, userId: sub.user_id },
        'Failed to transition subscription to expired status'
      );
    }
  }

  return {
    expiredCount: processed.length,
    expiredSubscriptions: processed
  };
}

export const subscriptionWorker = new Worker(
  'subscription-queue',
  async (job: Job) => {
    logger.info({ jobId: job.id, jobName: job.name }, 'Subscription worker processing job');
    return processExpiredSubscriptions();
  },
  {
    connection: redis,
    concurrency: 1 // Sequential execution to prevent lock contention
  }
);
