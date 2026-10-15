import { Worker, Job, Queue } from 'bullmq';
import { redis } from '../config/redis';
import { logger } from '../config/logger';
import { query } from '../db/pool';
import { publisherQueue } from '../config/bullmq';

export const postSchedulerQueue = new Queue('post-scheduler-queue', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 }
  }
});

/**
 * Worker responsible for periodic reconciliation of scheduled posts.
 * Catches any posts whose scheduled_at timestamp has arrived or passed,
 * ensuring zero dropped posts across server reboots, worker restarts, or Redis flush events.
 */
export const postSchedulerWorker = new Worker(
  'post-scheduler-queue',
  async (job: Job) => {
    logger.debug({ jobId: job.id }, 'Scanning for overdue scheduled posts...');

    try {
      // Find up to 50 scheduled posts that are due for publication
      const overdueRes = await query(
        `SELECT id, user_id, scheduled_at
         FROM posts
         WHERE status = 'scheduled'
           AND scheduled_at <= NOW()
           AND deleted_at IS NULL
         ORDER BY scheduled_at ASC
         LIMIT 50`
      );

      const overduePosts = overdueRes.rows;

      if (overduePosts.length === 0) {
        return { dispatchedCount: 0 };
      }

      logger.info({ count: overduePosts.length }, 'Found overdue scheduled posts to dispatch');

      let dispatchedCount = 0;
      for (const p of overduePosts) {
        // Optimistically update to 'publishing' so concurrent scheduler instances don't duplicate
        const updateRes = await query(
          `UPDATE posts
           SET status = 'publishing', updated_at = NOW()
           WHERE id = $1 AND status = 'scheduled'`,
          [p.id]
        );

        if (updateRes.rowCount && updateRes.rowCount > 0) {
          await publisherQueue.add(
            'publish-post',
            { postId: p.id },
            { jobId: `sched_reconcile_${p.id}_${Date.now()}` }
          );
          dispatchedCount++;
        }
      }

      logger.info({ dispatchedCount }, 'Successfully dispatched overdue scheduled posts');
      return { dispatchedCount };
    } catch (err: any) {
      logger.error({ err: err.message }, 'Error in postSchedulerWorker reconciliation job');
      throw err;
    }
  },
  {
    connection: redis,
    concurrency: 1
  }
);
