import { Queue, QueueEvents } from 'bullmq';
import { redis } from './redis';

const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 5000 // 5s, 10s, 20s
  },
  removeOnComplete: {
    count: 1000,
    age: 24 * 3600 // keep 24h
  },
  removeOnFail: {
    count: 5000,
    age: 7 * 24 * 3600 // keep 7 days
  }
};

export const publisherQueue = new Queue('publisher-queue', {
  connection: redis,
  defaultJobOptions
});

export const notificationQueue = new Queue('notification-queue', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 3000 }
  }
});

export const tokenRefreshQueue = new Queue('token-refresh-queue', {
  connection: redis,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'fixed', delay: 60000 }
  }
});

export const analyticsQueue = new Queue('analytics-queue', {
  connection: redis,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'fixed', delay: 10000 }
  }
});

export const cleanupQueue = new Queue('cleanup-queue', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 60000 }
  }
});
