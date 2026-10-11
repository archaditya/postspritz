import { Worker, Job } from 'bullmq';
import { redis } from '../config/redis';
import { logger } from '../config/logger';
import { query } from '../db/pool';
import { decryptToken, encryptToken } from '../utils/crypto.utils';
import { socialAccountsService } from '../container';
import { notificationQueue } from '../config/bullmq';

/**
 * Token Refresh Worker — runs on cron (every 6 hours).
 * 
 * Scans social_accounts for tokens expiring within the next 48 hours and
 * calls the platform-specific refreshToken() method which handles:
 * 
 * - Facebook: long-lived user token → new long-lived user token → re-derive page token
 * - Instagram: same as Facebook (uses FB Page tokens for IG publishing)
 * - Threads: th_refresh_token grant → new long-lived token
 * - LinkedIn: standard OAuth2 refresh_token grant
 * - X (Twitter): OAuth 2.0 PKCE refresh
 * 
 * If refresh fails, marks the account as 'expired' and notifies the user
 * to reconnect via the dashboard.
 */
export const tokenRefreshWorker = new Worker(
  'token-refresh-queue',
  async (job: Job) => {
    logger.info('Token refresh worker scanning for expiring social account tokens...');

    // Find accounts expiring in the next 48 hours with a refresh token
    // OR accounts that have been connected for >50 days without token_expires_at
    // (catches FB page tokens that don't set expiry but depend on user token)
    const res = await query(
      `SELECT * FROM social_accounts
       WHERE status = 'connected'
         AND deleted_at IS NULL
         AND refresh_token_enc IS NOT NULL
         AND (
           (token_expires_at IS NOT NULL AND token_expires_at <= NOW() + INTERVAL '48 hours')
           OR
           (token_expires_at IS NULL AND updated_at <= NOW() - INTERVAL '50 days')
         )`
    );

    const expiringAccounts = res.rows;
    logger.info({ count: expiringAccounts.length }, 'Expiring social accounts found');

    let refreshed = 0;
    let failed = 0;

    for (const acc of expiringAccounts) {
      try {
        const provider = socialAccountsService.getProvider(acc.platform);
        const refreshToken = decryptToken(acc.refresh_token_enc);
        const newTokenSet = await provider.refreshToken(refreshToken);

        const newAccessTokenEnc = encryptToken(newTokenSet.accessToken);
        const newRefreshTokenEnc = newTokenSet.refreshToken
          ? encryptToken(newTokenSet.refreshToken)
          : acc.refresh_token_enc; // Keep existing refresh token if provider didn't return a new one
        const newExpiresAt = newTokenSet.expiresIn
          ? new Date(Date.now() + newTokenSet.expiresIn * 1000)
          : null;

        await query(
          `UPDATE social_accounts SET
            access_token_enc = $1,
            refresh_token_enc = $2,
            token_expires_at = $3,
            status = 'connected',
            error_message = NULL,
            updated_at = NOW()
           WHERE id = $4 AND deleted_at IS NULL`,
          [newAccessTokenEnc, newRefreshTokenEnc, newExpiresAt, acc.id]
        );

        refreshed++;
        logger.info(
          { accountId: acc.id, platform: acc.platform, userId: acc.user_id },
          'Successfully refreshed social account token'
        );
      } catch (err: any) {
        failed++;
        logger.error(
          { accountId: acc.id, platform: acc.platform, err: err.message },
          'Failed refreshing social account token, marking expired'
        );

        await query(
          `UPDATE social_accounts SET
            status = 'expired',
            error_message = $1,
            updated_at = NOW()
           WHERE id = $2 AND deleted_at IS NULL`,
          [err.message || 'Token refresh failed', acc.id]
        );

        // Notify user about expired account so they reconnect from dashboard
        await notificationQueue.add('account-expired', {
          userId: acc.user_id,
          platform: acc.platform,
          accountName: acc.account_name,
          errorMessage: err.message
        });
      }
    }

    logger.info({ refreshed, failed, total: expiringAccounts.length }, 'Token refresh cycle complete');
    return { refreshed, failed, total: expiringAccounts.length };
  },
  {
    connection: redis,
    concurrency: 1
  }
);
