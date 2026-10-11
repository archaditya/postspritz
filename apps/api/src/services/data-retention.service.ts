import { query, withTransaction } from '../db/pool';
import { logger } from '../config/logger';
import { AuditLogService } from './audit-log.service';

export class DataRetentionService {
  private static instance: DataRetentionService;

  private constructor() {}

  public static getInstance(): DataRetentionService {
    if (!DataRetentionService.instance) {
      DataRetentionService.instance = new DataRetentionService();
    }
    return DataRetentionService.instance;
  }

  /**
   * Cascading Soft Delete for User and all associated downstream resources.
   */
  async softDeleteUser(userId: string): Promise<{ success: boolean; message: string }> {
    return withTransaction(async (client) => {
      logger.info({ userId }, 'Initiating cascading soft delete for user');

      // 1. Mark user soft deleted
      await client.query(
        `UPDATE users SET deleted_at = NOW(), status = 'deactivated', updated_at = NOW() WHERE id = $1`,
        [userId]
      );

      // 2. Cascade soft delete to social accounts
      await client.query(
        `UPDATE social_accounts SET deleted_at = NOW(), status = 'revoked', updated_at = NOW() WHERE user_id = $1 AND deleted_at IS NULL`,
        [userId]
      );

      // 3. Cascade soft delete to posts & targets
      await client.query(
        `UPDATE posts SET deleted_at = NOW(), updated_at = NOW() WHERE user_id = $1 AND deleted_at IS NULL`,
        [userId]
      );

      await client.query(
        `UPDATE post_targets SET deleted_at = NOW(), updated_at = NOW()
         WHERE post_id IN (SELECT id FROM posts WHERE user_id = $1) AND deleted_at IS NULL`,
        [userId]
      );

      // 4. Cascade soft delete to media assets
      await client.query(
        `UPDATE media SET deleted_at = NOW(), updated_at = NOW() WHERE user_id = $1 AND deleted_at IS NULL`,
        [userId]
      );

      // 5. Cancel and soft delete active subscriptions
      await client.query(
        `UPDATE subscriptions SET deleted_at = NOW(), status = 'cancelled', cancelled_at = NOW(), cancel_reason = 'user_soft_delete', updated_at = NOW()
         WHERE user_id = $1 AND deleted_at IS NULL`,
        [userId]
      );

      // 6. Record audit log entry
      await AuditLogService.getInstance().log({
        userId,
        action: 'user.soft_delete_cascaded',
        resourceType: 'user',
        resourceId: userId,
        details: { retention_days: 30 }
      });

      logger.info({ userId }, 'Cascading soft delete completed successfully');
      return { success: true, message: 'User and associated assets have been soft deleted with 30-day retention backoff.' };
    });
  }

  /**
   * Soft Delete for a specific Post and its targets.
   */
  async softDeletePost(postId: string, userId: string): Promise<boolean> {
    return withTransaction(async (client) => {
      const res = await client.query(
        `UPDATE posts SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL RETURNING id`,
        [postId, userId]
      );

      if (res.rowCount === 0) return false;

      await client.query(
        `UPDATE post_targets SET deleted_at = NOW(), updated_at = NOW() WHERE post_id = $1 AND deleted_at IS NULL`,
        [postId]
      );

      await AuditLogService.getInstance().log({
        userId,
        action: 'post.soft_deleted',
        resourceType: 'post',
        resourceId: postId
      });

      logger.info({ postId, userId }, 'Post and post targets soft deleted');
      return true;
    });
  }

  /**
   * Background Cleanup Job:
   * 1. Hard-deletes soft-deleted records whose deleted_at exceeds 30 days.
   * 2. Purges system audit logs & AI generation logs older than 30 days.
   */
  async purgeExpiredSoftDeletedRecords(retentionDays = 30): Promise<{
    purgedUsers: number;
    purgedPosts: number;
    purgedMedia: number;
    purgedAccounts: number;
    purgedAuditLogs: number;
    purgedAiLogs: number;
  }> {
    // 1. Purge entities in database transaction
    const entityStats = await withTransaction(async (client) => {
      logger.info({ retentionDays }, 'Starting automated data retention backoff purge');

      // Purge expired post targets & posts
      await client.query(
        `DELETE FROM post_targets WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - ($1 || ' days')::INTERVAL`,
        [retentionDays]
      );

      const postPurgeRes = await client.query(
        `DELETE FROM posts WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - ($1 || ' days')::INTERVAL RETURNING id`,
        [retentionDays]
      );

      // Purge expired media
      const mediaPurgeRes = await client.query(
        `DELETE FROM media WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - ($1 || ' days')::INTERVAL RETURNING id, storage_key`,
        [retentionDays]
      );

      // Purge expired social accounts
      const accountsPurgeRes = await client.query(
        `DELETE FROM social_accounts WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - ($1 || ' days')::INTERVAL RETURNING id`,
        [retentionDays]
      );

      // Purge expired subscriptions
      const subscriptionsPurgeRes = await client.query(
        `DELETE FROM subscriptions WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - ($1 || ' days')::INTERVAL RETURNING id`,
        [retentionDays]
      );

      // Purge expired users
      const usersPurgeRes = await client.query(
        `DELETE FROM users WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - ($1 || ' days')::INTERVAL RETURNING id`,
        [retentionDays]
      );

      return {
        purgedUsers: usersPurgeRes.rowCount || 0,
        purgedPosts: postPurgeRes.rowCount || 0,
        purgedMedia: mediaPurgeRes.rowCount || 0,
        purgedAccounts: accountsPurgeRes.rowCount || 0,
        purgedSubscriptions: subscriptionsPurgeRes.rowCount || 0,
      };
    });

    // 2. Purge rolling logs older than 30 days
    const logStats = await AuditLogService.getInstance().purgeOldLogs(retentionDays);

    const overallStats = {
      ...entityStats,
      ...logStats
    };

    logger.info(overallStats, 'Daily 30-day retention backoff purge and log rotation finished');
    return overallStats;
  }
}
