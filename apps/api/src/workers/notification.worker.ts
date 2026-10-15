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
      try {
        await redis.publish(`notifications:${userId}`, JSON.stringify(notif));
      } catch (redisErr) {
        logger.warn({ err: (redisErr as any)?.message }, 'Redis pub/sub broadcast skipped');
      }

      let fcmSent = false;
      let emailSent = false;

      // 3. Firebase Cloud Messaging (FCM) Push to user's registered devices
      try {
        await firebaseService.sendPushNotification(userId, {
          title,
          body,
          clickUrl: '/dashboard/posts',
          data: { postId, type }
        });
        fcmSent = true;
      } catch (fcmErr: any) {
        logger.warn({ err: fcmErr.message, userId }, 'FCM push notification dispatch skipped or failed');
      }

      // 4. Email dispatch (if user preferences allow)
      const notifSettings = user.notification_settings || {};
      try {
        if (isSuccess && notifSettings.email_on_publish !== false) {
          await emailService.sendEmail(
            user.email,
            title,
            `<p>Hello ${user.name || 'there'},</p><p>${body}</p><p><a href="/dashboard/posts">View in Dashboard</a></p>`
          );
          emailSent = true;
        } else if (!isSuccess && notifSettings.email_on_failure !== false) {
          await emailService.sendEmail(
            user.email,
            title,
            `<p>Hello ${user.name || 'there'},</p><p>${body}</p><p><a href="/dashboard/posts">Retry in Dashboard</a></p>`
          );
          emailSent = true;
        }
      } catch (emailErr: any) {
        logger.warn({ err: emailErr.message, email: user.email }, 'Email notification dispatch skipped or failed');
      }

      // 5. Update delivery flags on notification record
      await query(
        `UPDATE notifications
         SET delivery_status = 'delivered', email_sent = $1, fcm_sent = $2
         WHERE id = $3`,
        [emailSent, fcmSent, notif.id]
      );
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
    } else if (name === 'subscription-expired') {
      const { userId, planDisplayName } = data;
      const userRes = await query('SELECT email, name FROM users WHERE id = $1', [userId]);
      const user = userRes.rows[0];
      if (!user) return;

      const title = 'Subscription Package Expired ⚠️';
      const body = `Your ${planDisplayName || 'subscription'} package period has completed. Your account is now operating on Free Starter limits.`;

      const notifRes = await query(
        `INSERT INTO notifications (
          user_id, type, title, body, action_url, action_label, resource_type
        ) VALUES ($1, $2, $3, $4, '/dashboard/billing', 'Renew Package', 'subscription')
        RETURNING *`,
        [userId, NotificationType.BILLING_REMINDER, title, body]
      );

      await redis.publish(`notifications:${userId}`, JSON.stringify(notifRes.rows[0]));

      await firebaseService.sendPushNotification(userId, {
        title,
        body,
        clickUrl: '/dashboard/billing',
        data: { type: 'subscription_expired' }
      });

      await emailService.sendEmail(
        user.email,
        title,
        `<p>Hello ${user.name || 'there'},</p><p>${body}</p><p><a href="/dashboard/billing">Manage Subscription</a></p>`
      );
    }
  },
  {
    connection: redis,
    concurrency: 5
  }
);
