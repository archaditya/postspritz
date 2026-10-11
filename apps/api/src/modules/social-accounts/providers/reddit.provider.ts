import { SocialPlatform, AccountType } from '@pushpost/shared-types';
import { SocialProvider, TokenSet, SocialProfile, PublishContent, PublishResult } from './provider.interface';
import { env } from '../../../config/env';

export class RedditProvider implements SocialProvider {
  readonly platform = SocialPlatform.REDDIT;

  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: env.REDDIT_CLIENT_ID || 'mock_reddit_client',
      response_type: 'code',
      state,
      redirect_uri: env.REDDIT_REDIRECT_URI,
      duration: 'permanent',
      scope: 'identity submit read mysubreddits'
    });
    return `https://www.reddit.com/api/v1/authorize?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<TokenSet> {
    const credentials = Buffer.from(`${env.REDDIT_CLIENT_ID}:${env.REDDIT_CLIENT_SECRET}`).toString('base64');
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: env.REDDIT_REDIRECT_URI
    });

    const res = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${credentials}`,
        'User-Agent': 'PostSpritz/1.0.0'
      },
      body: params.toString()
    });

    const data = await res.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      scopes: data.scope ? data.scope.split(' ') : ['identity', 'submit']
    };
  }

  async refreshToken(refreshToken: string): Promise<TokenSet> {
    const credentials = Buffer.from(`${env.REDDIT_CLIENT_ID}:${env.REDDIT_CLIENT_SECRET}`).toString('base64');
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    });

    const res = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${credentials}`,
        'User-Agent': 'PostSpritz/1.0.0'
      },
      body: params.toString()
    });

    const data = await res.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      expiresIn: data.expires_in,
      scopes: data.scope ? data.scope.split(' ') : ['identity', 'submit']
    };
  }

  async getUserProfile(accessToken: string): Promise<SocialProfile> {
    const res = await fetch('https://oauth.reddit.com/api/v1/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'PostSpritz/1.0.0'
      }
    });
    const data = await res.json();

    return {
      platformUserId: data.id,
      username: `u/${data.name}`,
      displayName: data.name,
      avatarUrl: data.icon_img,
      accountType: AccountType.PROFILE
    };
  }

  async publishPost(accessToken: string, _targetAccountId: string, content: PublishContent): Promise<PublishResult> {
    const subreddit = content.options?.subreddit || 'test';
    const title = content.options?.title || content.text.slice(0, 80);

    const params = new URLSearchParams({
      sr: subreddit,
      kind: content.linkUrl ? 'link' : 'self',
      title,
      text: content.text,
      url: content.linkUrl || '',
      api_type: 'json'
    });

    const res = await fetch('https://oauth.reddit.com/api/submit', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'PostSpritz/1.0.0',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    const data = await res.json();
    const postData = data.json?.data;
    const postId = postData?.id || postData?.name || 'unknown';

    return {
      platformPostId: postId,
      platformPostUrl: postData?.url || `https://reddit.com${postData?.permalink || ''}`,
      rawResponse: data
    };
  }

  async deletePost(accessToken: string, platformPostId: string): Promise<void> {
    const params = new URLSearchParams({ id: platformPostId });
    await fetch('https://oauth.reddit.com/api/del', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'PostSpritz/1.0.0',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });
  }
}
