import { Worker, Job } from 'bullmq';
import { redis } from '../config/redis';
import { logger } from '../config/logger';
import { query } from '../db/pool';
import { decryptToken } from '../utils/crypto.utils';
import { socialAccountsService, billingService } from '../container';
import { notificationQueue } from '../config/bullmq';
import { PostStatus, SocialPlatform } from '@pushpost/shared-types';

export const publisherWorker = new Worker(
  'publisher-queue',
  async (job: Job) => {
    const { postId } = job.data;
    logger.info({ jobId: job.id, postId }, 'Publisher worker picked up post job');

    // 1. Fetch post and pending/failed targets
    const postRes = await query('SELECT * FROM posts WHERE id = $1 AND deleted_at IS NULL LIMIT 1', [postId]);
    const post = postRes.rows[0];
    if (!post) {
      logger.warn({ postId }, 'Post not found or soft deleted, aborting job');
      return;
    }

    // Update status to publishing
    await query(`UPDATE posts SET status = 'publishing', updated_at = NOW() WHERE id = $1`, [postId]);

    const targetsRes = await query(
      `SELECT pt.*, sa.platform, sa.platform_user_id, sa.access_token_enc, sa.refresh_token_enc, sa.token_expires_at
       FROM post_targets pt
       JOIN social_accounts sa ON sa.id = pt.social_account_id
       WHERE pt.post_id = $1 AND pt.status IN ('pending', 'failed') AND pt.deleted_at IS NULL AND sa.deleted_at IS NULL`,
      [postId]
    );

    const targets = targetsRes.rows;
    if (targets.length === 0) {
      logger.info({ postId }, 'No pending targets to publish');
      return;
    }

    const hasUrl = /https?:\/\/[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}\b/i.test(post.content);

    // 2. Publish across targets in parallel
    const results = await Promise.allSettled(
      targets.map(async (target) => {
        try {
          // If X (Twitter), enforce fuel wallet debit first
          if (target.platform === SocialPlatform.X) {
            try {
              await billingService.deductWalletForXPost(post.user_id, post.id, hasUrl);
            } catch (walletErr: any) {
              logger.warn({ targetId: target.id, err: walletErr.message }, 'X fuel wallet debit failed');
              throw new Error(`Insufficient wallet balance for X posting: ${walletErr.message}`);
            }
          }

          const provider = socialAccountsService.getProvider(target.platform);
          let accessToken = decryptToken(target.access_token_enc);

          // Check if token expired
          if (target.token_expires_at && new Date(target.token_expires_at).getTime() <= Date.now()) {
            if (target.refresh_token_enc) {
              const refreshToken = decryptToken(target.refresh_token_enc);
              const refreshed = await provider.refreshToken(refreshToken);
              accessToken = refreshed.accessToken;
            }
          }

          // Fetch media URLs if any
          let mediaUrls: string[] = [];
          if (post.media_ids && post.media_ids.length > 0) {
            const mediaRes = await query(
              'SELECT storage_url FROM media WHERE id = ANY($1) AND deleted_at IS NULL',
              [post.media_ids]
            );
            mediaUrls = mediaRes.rows.map(r => r.storage_url);
          }

          // Call vendor API with Circuit Breaker
          const publishResult = await provider.publishPost(
            accessToken,
            target.platform_user_id,
            {
              text: post.content,
              mediaUrls
            }
          );

          // Mark target as published
          await query(
            `UPDATE post_targets SET
              status = 'published',
              platform_post_id = $1,
              platform_post_url = $2,
              published_at = NOW(),
              error_message = NULL,
              updated_at = NOW()
             WHERE id = $3`,
            [publishResult.platformPostId, publishResult.platformPostUrl || null, target.id]
          );

          return { targetId: target.id, platform: target.platform, success: true };
        } catch (targetErr: any) {
          logger.error({ targetId: target.id, err: targetErr.message }, 'Failed publishing to target');

          await query(
            `UPDATE post_targets SET
              status = 'failed',
              error_message = $1,
              retry_count = retry_count + 1,
              updated_at = NOW()
             WHERE id = $2`,
            [targetErr.message || 'Unknown provider error', target.id]
          );

          throw targetErr;
        }
      })
    );

    // 3. Compute final post status
    const allTargetsRes = await query('SELECT status FROM post_targets WHERE post_id = $1 AND deleted_at IS NULL', [postId]);
    const statuses = allTargetsRes.rows.map(r => r.status);

    const hasPublished = statuses.some(s => s === 'published');
    const hasFailed = statuses.some(s => s === 'failed');

    let finalPostStatus = PostStatus.PUBLISHED;
    if (hasPublished && hasFailed) {
      finalPostStatus = PostStatus.PARTIALLY_PUBLISHED;
    } else if (!hasPublished && hasFailed) {
      finalPostStatus = PostStatus.FAILED;
    }

    await query(
      `UPDATE posts SET status = $1, published_at = CASE WHEN $1 = 'published' THEN NOW() ELSE published_at END, updated_at = NOW() WHERE id = $2`,
      [finalPostStatus, postId]
    );

    // 4. Enqueue notification
    await notificationQueue.add('post-outcome', {
      userId: post.user_id,
      postId: post.id,
      status: finalPostStatus
    });

    logger.info({ postId, finalStatus: finalPostStatus }, 'Publisher worker completed job');
  },
  {
    connection: redis,
    concurrency: 10 // Handle up to 10 posts concurrently
  }
);
