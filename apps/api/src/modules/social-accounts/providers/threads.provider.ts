import { SocialPlatform, AccountType } from '@pushpost/shared-types';
import { SocialProvider, TokenSet, SocialProfile, PublishContent, PublishResult } from './provider.interface';
import { env } from '../../../config/env';
import { logger } from '../../../config/logger';

const THREADS_GRAPH = 'https://graph.threads.net';

/**
 * Threads API uses its own OAuth flow (separate from Facebook Login).
 * Auth URL → threads.net/oauth/authorize
 * Token exchange → graph.threads.net/oauth/access_token
 * Short-lived token → exchange for long-lived (~60 days) via graph.threads.net/access_token
 * Refresh before expiry via graph.threads.net/refresh_access_token
 */
export class ThreadsProvider implements SocialProvider {
  readonly platform = SocialPlatform.THREADS;

  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: env.THREADS_APP_ID,
      redirect_uri: env.THREADS_REDIRECT_URI,
      scope: 'threads_basic,threads_content_publish',
      response_type: 'code',
      state
    });
    return `https://threads.net/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange code → short-lived token → long-lived token (~60 days).
   * Threads has a dedicated long-lived exchange endpoint.
   */
  async exchangeCode(code: string): Promise<TokenSet> {
    // Step 1: Code → short-lived token
    const shortParams = new URLSearchParams({
      client_id: env.THREADS_APP_ID,
      client_secret: env.THREADS_APP_SECRET,
      grant_type: 'authorization_code',
      redirect_uri: env.THREADS_REDIRECT_URI,
      code
    });

    const shortRes = await fetch(`${THREADS_GRAPH}/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: shortParams.toString()
    });

    const shortData = await shortRes.json();
    if (shortData.error) {
      throw new Error(`Threads OAuth error: ${shortData.error?.message || JSON.stringify(shortData)}`);
    }

    // Step 2: Short-lived → long-lived token (~60 days)
    const longParams = new URLSearchParams({
      grant_type: 'th_exchange_token',
      client_secret: env.THREADS_APP_SECRET,
      access_token: shortData.access_token
    });

    const longRes = await fetch(`${THREADS_GRAPH}/access_token?${longParams.toString()}`);
    const longData = await longRes.json();

    if (longData.error) {
      // Fallback: use the short-lived token if long-lived exchange fails
      logger.warn({ error: longData.error }, 'Threads long-lived token exchange failed, using short-lived token');
      return {
        accessToken: shortData.access_token,
        expiresIn: 3600, // ~1 hour
        scopes: ['threads_basic', 'threads_content_publish']
      };
    }

    return {
      accessToken: longData.access_token,
      expiresIn: longData.expires_in || 5184000, // ~60 days
      scopes: ['threads_basic', 'threads_content_publish']
    };
  }

  /**
   * Refresh a long-lived Threads token before it expires.
   * Threads uses grant_type=th_refresh_token.
   * Can only refresh tokens that are at least 24hrs old and not expired.
   */
  async refreshToken(refreshToken: string): Promise<TokenSet> {
    const params = new URLSearchParams({
      grant_type: 'th_refresh_token',
      access_token: refreshToken
    });

    const res = await fetch(`${THREADS_GRAPH}/refresh_access_token?${params.toString()}`);
    const data = await res.json();

    if (data.error) {
      throw new Error(`Threads token refresh error: ${data.error?.message || JSON.stringify(data)}`);
    }

    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in || 5184000,
      scopes: ['threads_basic', 'threads_content_publish']
    };
  }

  async getUserProfile(accessToken: string): Promise<SocialProfile> {
    const res = await fetch(
      `${THREADS_GRAPH}/v1.0/me?fields=id,username,threads_profile_picture_url&access_token=${accessToken}`
    );
    const data = await res.json();

    if (data.error) {
      throw new Error(`Threads profile fetch error: ${data.error?.message || JSON.stringify(data)}`);
    }

    return {
      platformUserId: data.id,
      username: data.username ? `@${data.username}` : undefined,
      displayName: data.username || 'Threads User',
      avatarUrl: data.threads_profile_picture_url,
      accountType: AccountType.PROFILE
    };
  }

  /**
   * Threads Container Model:
   * Step 1 → create container (TEXT, IMAGE, or VIDEO)
   * Step 2 → publish container
   */
  async publishPost(accessToken: string, targetAccountId: string, content: PublishContent): Promise<PublishResult> {
    const mediaUrl = content.mediaUrls?.[0];

    // Step 1: Create container
    const containerBody: Record<string, string> = {
      text: content.text,
      access_token: accessToken
    };

    if (mediaUrl) {
      containerBody.media_type = 'IMAGE';
      containerBody.image_url = mediaUrl;
    } else {
      containerBody.media_type = 'TEXT';
    }

    const containerRes = await fetch(`${THREADS_GRAPH}/v1.0/${targetAccountId}/threads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(containerBody).toString()
    });
    const containerData = await containerRes.json();

    if (containerData.error) {
      throw new Error(`Threads container error: ${containerData.error?.message || JSON.stringify(containerData)}`);
    }

    const creationId = containerData.id;
    if (!creationId) {
      throw new Error(`Threads container returned no ID: ${JSON.stringify(containerData)}`);
    }

    // Step 2: Publish container
    const publishRes = await fetch(`${THREADS_GRAPH}/v1.0/${targetAccountId}/threads_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        creation_id: creationId,
        access_token: accessToken
      }).toString()
    });
    const publishData = await publishRes.json();

    if (publishData.error) {
      throw new Error(`Threads publish error: ${publishData.error?.message || JSON.stringify(publishData)}`);
    }

    const threadPostId = publishData.id || creationId;
    return {
      platformPostId: threadPostId,
      platformPostUrl: `https://www.threads.net/post/${threadPostId}`,
      rawResponse: publishData
    };
  }

  async deletePost(_accessToken: string, _platformPostId: string): Promise<void> {
    // Threads API does not support post deletion
    logger.warn('Threads does not support post deletion via API');
  }
}
