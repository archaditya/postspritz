import crypto from 'crypto';
import { SocialPlatform } from '@pushpost/shared-types';
import { SocialAccountsRepository } from './social-accounts.repository';
import { SocialProvider } from './providers/provider.interface';
import { LinkedInProvider } from './providers/linkedin.provider';
import { FacebookProvider } from './providers/facebook.provider';
import { InstagramProvider } from './providers/instagram.provider';
import { ThreadsProvider } from './providers/threads.provider';
import { XProvider } from './providers/x.provider';
import { RedditProvider } from './providers/reddit.provider';
import { encryptToken, decryptToken } from '../../utils/crypto.utils';
import { redis } from '../../config/redis';
import { AppError } from '../../middlewares/errorHandler.middleware';
import { logger } from '../../config/logger';
import { query } from '../../db/pool';

export class SocialAccountsService {
  private repo: SocialAccountsRepository;
  private providers: Map<SocialPlatform, SocialProvider>;

  constructor() {
    this.repo = new SocialAccountsRepository();
    this.providers = new Map<SocialPlatform, SocialProvider>([
      [SocialPlatform.LINKEDIN, new LinkedInProvider()],
      [SocialPlatform.FACEBOOK, new FacebookProvider()],
      [SocialPlatform.INSTAGRAM, new InstagramProvider()],
      [SocialPlatform.THREADS, new ThreadsProvider()],
      [SocialPlatform.X, new XProvider()],
      [SocialPlatform.REDDIT, new RedditProvider()]
    ]);
  }

  getProvider(platform: SocialPlatform): SocialProvider {
    const provider = this.providers.get(platform);
    if (!provider) {
      throw new AppError(`Unsupported social platform: ${platform}`, 400);
    }
    return provider;
  }

  async getAuthUrl(platform: SocialPlatform, userId: string): Promise<string> {
    const provider = this.getProvider(platform);
    const state = crypto.randomBytes(24).toString('hex');

    // Cache state in Redis for 10 minutes to verify on callback
    await redis.set(`oauth:state:${state}`, JSON.stringify({ userId, platform }), 'EX', 600);

    return provider.getAuthUrl(state);
  }

  async handleCallback(code: string, state: string, codeVerifier?: string) {
    const cached = await redis.get(`oauth:state:${state}`);
    if (!cached) {
      throw new AppError('Invalid or expired OAuth state parameter', 400);
    }
    const { userId, platform } = JSON.parse(cached);
    await redis.del(`oauth:state:${state}`);

    const provider = this.getProvider(platform);
    const tokenSet = await provider.exchangeCode(code, codeVerifier);
    const profile = await provider.getUserProfile(tokenSet.accessToken);

    // Free Tier Quota Guardrail: Enforce max connected social channels (default 2 on Starter)
    const existingAccounts = await this.repo.findByUserId(userId);
    const isAlreadyConnected = existingAccounts.some(
      a => a.platform === platform && a.platform_user_id === profile.platformUserId
    );

    if (!isAlreadyConnected) {
      const userRes = await query(
        `SELECT u.role, p.max_social_accounts
         FROM users u
         LEFT JOIN subscriptions s ON s.user_id = u.id AND s.status = 'active'
         LEFT JOIN plans p ON p.id = s.plan_id
         WHERE u.id = $1`,
        [userId]
      );
      const userRow = userRes.rows[0];
      const isExempt = userRow?.role === 'superadmin' || userRow?.role === 'admin';
      const maxAccountsAllowed = userRow?.max_social_accounts ?? 2;

      if (!isExempt && existingAccounts.length >= maxAccountsAllowed) {
        throw new AppError(
          `Free Starter limit reached: You can connect up to ${maxAccountsAllowed} social channels. Connecting unlimited channels will be available in Pro (coming soon)!`,
          403
        );
      }
    }

    const accessTokenEnc = encryptToken(tokenSet.accessToken);
    const refreshTokenEnc = tokenSet.refreshToken ? encryptToken(tokenSet.refreshToken) : null;
    const tokenExpiresAt = tokenSet.expiresIn ? new Date(Date.now() + tokenSet.expiresIn * 1000) : null;

    const account = await this.repo.upsertAccount({
      userId,
      platform,
      platformUserId: profile.platformUserId,
      platformUsername: profile.username,
      accountType: profile.accountType,
      accountName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      accessTokenEnc,
      refreshTokenEnc,
      tokenExpiresAt,
      scopes: tokenSet.scopes,
      metadata: profile.metadata
    });

    logger.info({ userId, platform, accountId: account.id }, 'Social account connected successfully');
    return account;
  }

  async listAccounts(userId: string, query?: { page?: number; limit?: number; search?: string; platform?: string; status?: string }) {
    if (query?.page || query?.limit || query?.search || query?.platform || query?.status) {
      return this.repo.findWithFilter({
        userId,
        page: query.page,
        limit: query.limit,
        search: query.search,
        platform: query.platform,
        status: query.status
      });
    }
    const accounts = await this.repo.findByUserId(userId);
    return { accounts, total: accounts.length, page: 1, limit: accounts.length };
  }

  async disconnectAccount(accountId: string, userId: string) {
    const account = await this.repo.findByIdAndUser(accountId, userId);
    if (!account) {
      throw new AppError('Social account not found', 404);
    }

    await this.repo.deleteAccount(accountId, userId);
    logger.info({ userId, accountId }, 'Social account disconnected');
    return { message: 'Social account disconnected successfully' };
  }
}
