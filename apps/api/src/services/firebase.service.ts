import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getMessaging, Messaging } from 'firebase-admin/messaging';
import { getAuth, Auth } from 'firebase-admin/auth';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { query } from '../db/pool';

class FirebaseService {
  private app: App | null = null;
  private messaging: Messaging | null = null;
  private auth: Auth | null = null;
  private isInitialized = false;

  constructor() {
    this.initFirebase();
  }

  private initFirebase() {
    try {
      const existingApps = getApps();
      if (existingApps.length > 0) {
        this.app = existingApps[0];
        this.messaging = getMessaging(this.app);
        this.auth = getAuth(this.app);
        this.isInitialized = true;
        return;
      }

      // Check for local service account JSON files
      const possiblePaths = [
        path.resolve(process.cwd(), 'postspritz-media-firebase-adminsdk-fbsvc-9ec83b012e.json'),
        path.resolve(process.cwd(), '../../postspritz-media-firebase-adminsdk-fbsvc-9ec83b012e.json'),
        process.env.GOOGLE_APPLICATION_CREDENTIALS ? path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS) : null,
      ].filter(Boolean) as string[];

      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          const serviceAccount = JSON.parse(fs.readFileSync(p, 'utf8'));
          this.app = initializeApp({
            credential: cert(serviceAccount),
          });
          this.messaging = getMessaging(this.app);
          this.auth = getAuth(this.app);
          this.isInitialized = true;
          logger.info({ projectId: serviceAccount.project_id }, '🔥 Firebase Admin initialized from service account JSON');
          return;
        }
      }

      if (env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY) {
        const privateKey = env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
        this.app = initializeApp({
          credential: cert({
            projectId: env.FIREBASE_PROJECT_ID,
            clientEmail: env.FIREBASE_CLIENT_EMAIL,
            privateKey,
          }),
        });
        this.messaging = getMessaging(this.app);
        this.auth = getAuth(this.app);
        this.isInitialized = true;
        logger.info({ projectId: env.FIREBASE_PROJECT_ID }, '🔥 Firebase Admin initialized successfully');
      } else {
        logger.warn('Firebase Admin credentials not configured; FCM notifications will be skipped');
      }
    } catch (err: any) {
      logger.error({ err: err?.message }, 'Failed to initialize Firebase Admin');
    }
  }

  async verifyIdToken(idToken: string) {
    if (!this.auth) {
      throw new Error('Firebase Auth is not configured on the server');
    }
    return this.auth.verifyIdToken(idToken);
  }

  async registerDeviceToken(userId: string, fcmToken: string, deviceType = 'web', userAgent?: string): Promise<void> {
    if (!fcmToken || !userId) return;

    await query(
      `INSERT INTO user_fcm_tokens (user_id, fcm_token, device_type, user_agent, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (fcm_token) DO UPDATE SET
         user_id = EXCLUDED.user_id,
         device_type = EXCLUDED.device_type,
         user_agent = EXCLUDED.user_agent,
         updated_at = NOW()`,
      [userId, fcmToken, deviceType, userAgent || null]
    );

    logger.info({ userId, deviceType }, 'FCM device token registered');
  }

  async removeDeviceToken(fcmToken: string, userId?: string): Promise<void> {
    if (!fcmToken) return;

    if (userId) {
      await query(`DELETE FROM user_fcm_tokens WHERE fcm_token = $1 AND user_id = $2`, [fcmToken, userId]);
    } else {
      await query(`DELETE FROM user_fcm_tokens WHERE fcm_token = $1`, [fcmToken]);
    }

    logger.info({ fcmToken: `${fcmToken.slice(0, 10)}...`, userId }, 'FCM device token removed on logout');
  }

  async sendPushNotification(
    userId: string,
    notification: { title: string; body: string; data?: Record<string, string>; clickUrl?: string }
  ): Promise<void> {
    if (!this.isInitialized || !this.messaging) {
      logger.debug({ userId }, 'Firebase messaging not initialized; skipping FCM push');
      return;
    }

    const res = await query<{ fcm_token: string }>(
      `SELECT fcm_token FROM user_fcm_tokens WHERE user_id = $1`,
      [userId]
    );

    if (res.rows.length === 0) {
      logger.debug({ userId }, 'No active FCM tokens found for user');
      return;
    }

    const tokens = res.rows.map((r: { fcm_token: string }) => r.fcm_token);

    try {
      const response = await this.messaging.sendEachForMulticast({
        tokens,
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: {
          ...notification.data,
          click_action: notification.clickUrl || '/dashboard/notifications',
        },
        webpush: {
          fcmOptions: {
            link: notification.clickUrl || '/dashboard/notifications',
          },
        },
      });

      logger.info(
        { userId, successCount: response.successCount, failureCount: response.failureCount },
        'FCM push notification multicast dispatched'
      );

      // Clean up stale tokens
      const tokensToRemove: string[] = [];
      response.responses.forEach((resp: any, idx: number) => {
        if (!resp.success && resp.error) {
          const code = resp.error.code;
          if (
            code === 'messaging/registration-token-not-registered' ||
            code === 'messaging/invalid-registration-token'
          ) {
            tokensToRemove.push(tokens[idx]);
          }
        }
      });

      if (tokensToRemove.length > 0) {
        await query(
          `DELETE FROM user_fcm_tokens WHERE fcm_token = ANY($1::text[])`,
          [tokensToRemove]
        );
        logger.info({ count: tokensToRemove.length }, 'Cleaned up expired/unregistered FCM tokens');
      }
    } catch (err: any) {
      logger.error({ err: err?.message, userId }, 'Error sending FCM multicast notification');
    }
  }

  /**
   * Dispatches push notification to all registered FCM devices across the platform,
   * or to a provided subset of user IDs. Handles batching in chunks of 500 (FCM limit).
   */
  async sendBroadcastPush(
    notification: { title: string; body: string; data?: Record<string, string>; clickUrl?: string },
    targetUserIds?: string[]
  ): Promise<{ successCount: number; failureCount: number; totalTokens: number }> {
    if (!this.isInitialized || !this.messaging) {
      logger.debug('Firebase messaging not initialized; skipping broadcast push');
      return { successCount: 0, failureCount: 0, totalTokens: 0 };
    }

    let tokenRows: { fcm_token: string }[] = [];
    if (targetUserIds && targetUserIds.length > 0) {
      const res = await query<{ fcm_token: string }>(
        `SELECT DISTINCT fcm_token FROM user_fcm_tokens WHERE user_id = ANY($1::uuid[])`,
        [targetUserIds]
      );
      tokenRows = res.rows;
    } else {
      const res = await query<{ fcm_token: string }>(
        `SELECT DISTINCT fcm_token FROM user_fcm_tokens`
      );
      tokenRows = res.rows;
    }

    if (tokenRows.length === 0) {
      logger.info('No registered device tokens found for broadcast push');
      return { successCount: 0, failureCount: 0, totalTokens: 0 };
    }

    const allTokens = tokenRows.map((r) => r.fcm_token);
    let totalSuccess = 0;
    let totalFailure = 0;
    const tokensToRemove: string[] = [];

    // Chunk into batches of 500
    const chunkSize = 500;
    for (let i = 0; i < allTokens.length; i += chunkSize) {
      const batchTokens = allTokens.slice(i, i + chunkSize);
      try {
        const response = await this.messaging.sendEachForMulticast({
          tokens: batchTokens,
          notification: {
            title: notification.title,
            body: notification.body,
          },
          data: {
            ...notification.data,
            click_action: notification.clickUrl || '/dashboard',
          },
          webpush: {
            fcmOptions: {
              link: notification.clickUrl || '/dashboard',
            },
          },
        });

        totalSuccess += response.successCount;
        totalFailure += response.failureCount;

        response.responses.forEach((resp: any, idx: number) => {
          if (!resp.success && resp.error) {
            const code = resp.error.code;
            if (
              code === 'messaging/registration-token-not-registered' ||
              code === 'messaging/invalid-registration-token'
            ) {
              tokensToRemove.push(batchTokens[idx]);
            }
          }
        });
      } catch (err: any) {
        logger.error({ err: err?.message }, 'Batch broadcast push failed');
      }
    }

    if (tokensToRemove.length > 0) {
      await query(
        `DELETE FROM user_fcm_tokens WHERE fcm_token = ANY($1::text[])`,
        [tokensToRemove]
      );
      logger.info({ count: tokensToRemove.length }, 'Cleaned up stale tokens after broadcast');
    }

    logger.info(
      { totalTokens: allTokens.length, totalSuccess, totalFailure },
      'Broadcast push notification complete'
    );

    return { successCount: totalSuccess, failureCount: totalFailure, totalTokens: allTokens.length };
  }
}

export const firebaseService = new FirebaseService();
