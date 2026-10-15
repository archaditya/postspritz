import { PostsRepository } from './posts.repository';
import { SocialAccountsRepository } from '../social-accounts/social-accounts.repository';
import { UsersRepository } from '../users/users.repository';
import { PostStatus, SocialPlatform } from '@pushpost/shared-types';
import { AppError } from '../../middlewares/errorHandler.middleware';
import { logger } from '../../config/logger';
import { publisherQueue } from '../../config/bullmq';
import { query } from '../../db/pool';
import { AuditLogService } from '../../services/audit-log.service';

export class PostsService {
  private postsRepo: PostsRepository;
  private socialRepo: SocialAccountsRepository;
  private usersRepo: UsersRepository;

  constructor() {
    this.postsRepo = new PostsRepository();
    this.socialRepo = new SocialAccountsRepository();
    this.usersRepo = new UsersRepository();
  }

  detectUrls(text: string): boolean {
    const urlRegex = /https?:\/\/[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}\b/i;
    return urlRegex.test(text);
  }

  estimateCost(content: string, platform: string) {
    if (platform === 'x') {
      const hasUrl = this.detectUrls(content);
      const cost = hasUrl ? 0.20 : 0.015;
      return {
        platform: 'x',
        is_paid: true,
        has_url: hasUrl,
        estimated_cost_usd: cost,
        message: hasUrl
          ? 'X charges $0.20 per tweet containing URLs/links (passed through directly).'
          : 'X charges $0.015 per basic text tweet.'
      };
    }

    return {
      platform,
      is_paid: false,
      has_url: this.detectUrls(content),
      estimated_cost_usd: 0,
      message: 'Publishing on this platform is free under PostSpritz.'
    };
  }

  async createPost(userId: string, input: {
    content: string;
    targetAccountIds: string[];
    scheduledAt?: string | null;
    mediaIds?: string[];
    aiGenerated?: boolean;
    aiMetadata?: any;
  }) {
    // 1. Verify user accounts
    const userAccounts = await this.socialRepo.findByUserId(userId);
    const validAccountsMap = new Map(userAccounts.map(a => [a.id, a]));

    const targetAccounts = input.targetAccountIds.map(id => {
      const acc = validAccountsMap.get(id);
      if (!acc) {
        throw new AppError(`Target social account ${id} is not connected or does not belong to you`, 400);
      }
      return acc;
    });

    // 2. Validate Free Tier Quota Guardrail & Paid Platforms
    const userProfile = await this.usersRepo.getProfile(userId);
    const isExempt = userProfile?.role === 'superadmin' || userProfile?.role === 'admin';
    const maxPostsAllowed = userProfile?.max_posts_per_month ?? 30;
    const currentPostsCount = Number(userProfile?.usage?.posts_this_month ?? 0);

    if (!isExempt && currentPostsCount >= maxPostsAllowed) {
      throw new AppError(
        `Free Starter monthly limit reached (${maxPostsAllowed} posts). You have dispatched ${currentPostsCount} posts this month. Upgrades to Pro are coming soon!`,
        403
      );
    }

    const hasUrl = this.detectUrls(input.content);
    const paidConsent = userProfile?.preferences?.platform_settings?.paid_platforms_consent || {};

    const targetPayloads = targetAccounts.map(acc => {
      let costIncurred = 0;
      if (acc.platform === SocialPlatform.X) {
        if (userProfile?.plan_name === 'free' && !isExempt) {
          throw new AppError(
            'X (Twitter) publishing is reserved for Pro and Enterprise subscribers due to direct API pass-through fees. Please upgrade your plan in Billing.',
            403
          );
        }
        if (!paidConsent.x) {
          throw new AppError('You have selected X (Twitter) which incurs a pass-through fee ($0.015 / $0.20 with URLs). Please enable X in Settings -> Connected Platforms to confirm cost consent.', 402);
        }
        costIncurred = hasUrl ? 0.20 : 0.015;
      }
      return {
        socialAccountId: acc.id,
        platform: acc.platform,
        costIncurred
      };
    });

    // 3. Determine initial status & schedule
    const scheduledDate = input.scheduledAt ? new Date(input.scheduledAt) : null;
    let initialStatus = PostStatus.PUBLISHING;

    if (scheduledDate) {
      if (scheduledDate.getTime() <= Date.now()) {
        throw new AppError('Scheduled time must be in the future', 400);
      }
      initialStatus = PostStatus.SCHEDULED;
    }

    // 4. Create Post & Targets
    const post = await this.postsRepo.createPost({
      userId,
      content: input.content,
      status: initialStatus,
      scheduledAt: scheduledDate,
      mediaIds: input.mediaIds,
      aiGenerated: input.aiGenerated,
      aiMetadata: input.aiMetadata
    });

    const targets = await this.postsRepo.createPostTargets(
      targetPayloads.map(t => ({
        postId: post.id,
        socialAccountId: t.socialAccountId,
        platform: t.platform,
        costIncurred: t.costIncurred
      }))
    );

    // 5. Increment usage counter
    await query(
      `UPDATE users
       SET usage = jsonb_set(
         COALESCE(usage, '{"posts_this_month": 0, "ai_generations_this_month": 0}'::jsonb),
         '{posts_this_month}',
         to_jsonb(COALESCE((usage->>'posts_this_month')::int, 0) + 1)
       ),
       updated_at = NOW()
       WHERE id = $1`,
      [userId]
    );

    // 6. Enqueue to BullMQ Publisher Queue
    if (scheduledDate) {
      const delayMs = Math.max(0, scheduledDate.getTime() - Date.now());
      await publisherQueue.add(
        'publish-post',
        { postId: post.id },
        { delay: delayMs, jobId: `sched_${post.id}` }
      );
      logger.info({ postId: post.id, delayMs, scheduledAt: scheduledDate.toISOString() }, 'Scheduled post registered in BullMQ delayed queue');
    } else {
      await publisherQueue.add(
        'publish-post',
        { postId: post.id },
        { jobId: `pub_${post.id}_${Date.now()}` }
      );
      logger.info({ postId: post.id }, 'Immediate post registered in BullMQ dispatcher queue');
    }

    // 7. Record System Audit Log
    await AuditLogService.getInstance().log({
      userId,
      action: scheduledDate ? 'POST_SCHEDULED' : 'POST_DISPATCHED',
      entity: 'posts',
      entityId: post.id,
      details: {
        contentPreview: input.content.slice(0, 100),
        targetCount: targets.length,
        scheduledAt: scheduledDate ? scheduledDate.toISOString() : null,
      },
      status: 'success'
    });

    logger.info({ postId: post.id, userId, status: initialStatus, postCount: currentPostsCount + 1 }, 'Post created and queued successfully');

    return {
      ...post,
      targets
    };
  }

  async getPost(postId: string, userId: string) {
    const post = await this.postsRepo.getPostById(postId, userId);
    if (!post) {
      throw new AppError('Post not found', 404);
    }
    return post;
  }

  async listPosts(userId: string, params: any) {
    return this.postsRepo.listPosts({
      userId,
      page: params.page || 1,
      limit: params.limit || 20,
      status: params.status,
      platform: params.platform,
      search: params.search
    });
  }

  async deletePost(postId: string, userId: string) {
    const deleted = await this.postsRepo.deletePost(postId, userId);
    if (!deleted) {
      throw new AppError('Post not found', 404);
    }

    // Remove any pending delayed scheduled job from BullMQ
    try {
      const job = await publisherQueue.getJob(`sched_${postId}`);
      if (job) await job.remove();
    } catch (e) {
      // Ignore if not present
    }

    await AuditLogService.getInstance().log({
      userId,
      action: 'POST_DELETED',
      entity: 'posts',
      entityId: postId,
      status: 'success'
    });

    logger.info({ postId, userId }, 'Post deleted and cancelled from queue');
    return { message: 'Post deleted successfully' };
  }

  async publishNow(postId: string, userId: string) {
    const post = await this.postsRepo.getPostById(postId, userId);
    if (!post) {
      throw new AppError('Post not found', 404);
    }

    await publisherQueue.add('publish-post', { postId }, { jobId: `pub_${postId}_${Date.now()}` });
    logger.info({ postId }, 'Post enqueued for immediate publishing');

    return { message: 'Post has been queued for publishing' };
  }

  async retryFailed(postId: string, userId: string) {
    const post = await this.postsRepo.getPostById(postId, userId);
    if (!post) {
      throw new AppError('Post not found', 404);
    }

    await publisherQueue.add('retry-post', { postId }, { jobId: `retry_${postId}_${Date.now()}` });
    logger.info({ postId }, 'Failed targets enqueued for retry');

    return { message: 'Failed targets have been queued for retry' };
  }
}
