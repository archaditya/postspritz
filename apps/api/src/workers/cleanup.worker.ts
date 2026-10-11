import { Worker, Job } from 'bullmq';
import { redis } from '../config/redis';
import { logger } from '../config/logger';
import { DataRetentionService } from '../services/data-retention.service';

export const cleanupWorker = new Worker(
  'cleanup-queue',
  async (job: Job) => {
    logger.info({ jobId: job.id, jobName: job.name }, 'Processing data retention backoff cleanup job');
    const retentionDays = job.data?.retentionDays || 30;
    const stats = await DataRetentionService.getInstance().purgeExpiredSoftDeletedRecords(retentionDays);
    return stats;
  },
  {
    connection: redis,
    concurrency: 1, // Sequential retention prune to avoid lock contention
  }
);
