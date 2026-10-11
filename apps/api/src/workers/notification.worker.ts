import { Worker, Job } from 'bullmq';
import { redis } from '../config/redis';
import { logger } from '../config/logger';
import { query } from '../db/pool';
import { emailService } from '../services/email.service';
import { firebaseService } from '../services/firebase.service';
import { NotificationType } from '@pushpost/shared-types';

export const notificationWorker = new Worker(
  'notification-queue',
  async (job: Job) => {
    const { name, data } = job;
    logger.info({ jobName: name, data }, 'Processing notification job');

    if (name === 'post-outcome') {
      const { userId, postId, status } = data;

      const userRes = await query('SELECT email, name, notification_settings FROM users WHERE id = $1', [userId]);
      const user = userRes.rows[0];
      if (!user) return;

      const isSuccess = status === 'published';
      const type = isSuccess ? NotificationType.POST_PUBLISHED : NotificationType.POST_FAILED;
      const title = isSuccess ? 'Post Published Successfully! 🎉' : 'Post Publishing Failed ⚠️';
      const body = isSuccess
        ? 'Your post was successfully delivered to all selected social channels.'
        : 'One or more social platforms failed to publish your post. Check the dashboard to retry.';

      // 1. Insert in-app notification
      const notifRes = await query(
        `INSERT INTO notifications (
          user_id, type, title, body, action_url, action_label, resource_type, resource_id
        ) VALUES ($1, $2, $3, $4, $5, $6, 'post', $7)
        RETURNING *`,
        [userId, type, title, body, `/dashboard/posts`, 'View Post', postId]
      );
      const notif = notifRes.rows[0];

      // 2. Real-time broadcast via Redis Pub/Sub for SSE clients
      await redis.publish(`notifications:${userId}`, JSON.stringify(notif));

      // 3. Firebase Cloud Messaging (FCM) Push to user's registered devices
      await firebaseService.sendPushNotification(userId, {
        title,
        body,
        clickUrl: '/dashboard/posts',
        data: { postId, type }
      });

      // 4. Email dispatch (if user preferences allow)
      const notifSettings = user.notification_settings || {};
      if (isSuccess && notifSettings.email_on_publish !== false) {
        await emailService.sendEmail(
          user.email,
          title,
          `<p>Hello ${user.name || 'there'},</p><p>${body}</p><p><a href="/dashboard/posts">View in Dashboard</a></p>`
        );
      } else if (!isSuccess && notifSettings.email_on_failure !== false) {
        await emailService.sendEmail(
          user.email,
          title,
          `<p>Hello ${user.name || 'there'},</p><p>${body}</p><p><a href="/dashboard/posts">Retry in Dashboard</a></p>`
        );
      }
    } else if (name === 'account-expired') {
      const { userId, platform, accountName } = data;
      const userRes = await query('SELECT email, name FROM users WHERE id = $1', [userId]);
      const user = userRes.rows[0];
      if (!user) return;

      const title = `Action Required: ${platform.toUpperCase()} Account Expired`;
      const body = `Your connected ${platform} account (${accountName}) has expired. Please reconnect to resume publishing.`;

      const notifRes = await query(
        `INSERT INTO notifications (
          user_id, type, title, body, action_url, action_label, resource_type
        ) VALUES ($1, $2, $3, $4, '/dashboard/accounts', 'Reconnect Account', 'social_account')
        RETURNING *`,
        [userId, NotificationType.ACCOUNT_EXPIRED, title, body]
      );

      await redis.publish(`notifications:${userId}`, JSON.stringify(notifRes.rows[0]));

      // Firebase Push notification
      await firebaseService.sendPushNotification(userId, {
        title,
        body,
        clickUrl: '/dashboard/accounts',
        data: { platform }
      });

      await emailService.sendEmail(
        user.email,
        title,
        `<p>${body}</p><p><a href="/dashboard/accounts">Reconnect in Dashboard</a></p>`
      );
    }
  },
  {
    connection: redis,
    concurrency: 5
  }
);
