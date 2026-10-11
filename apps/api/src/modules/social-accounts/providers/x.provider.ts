import { SocialPlatform, AccountType } from '@pushpost/shared-types';
import { SocialProvider, TokenSet, SocialProfile, PublishContent, PublishResult } from './provider.interface';
import { env } from '../../../config/env';

export class XProvider implements SocialProvider {
  readonly platform = SocialPlatform.X;

  getAuthUrl(state: string, codeChallenge?: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: env.X_CLIENT_ID || 'mock_x_client',
      redirect_uri: env.X_REDIRECT_URI,
      scope: 'tweet.read tweet.write users.read offline.access',
      state,
      code_challenge: codeChallenge || 'challenge',
      code_challenge_method: 'plain'
    });
    return `https://twitter.com/i/oauth2/authorize?${params.toString()}`;
  }

  async exchangeCode(code: string, codeVerifier?: string): Promise<TokenSet> {
    const credentials = Buffer.from(`${env.X_CLIENT_ID}:${env.X_CLIENT_SECRET}`).toString('base64');
    const params = new URLSearchParams({
      code,
      grant_type: 'authorization_code',
      redirect_uri: env.X_REDIRECT_URI,
      code_verifier: codeVerifier || 'challenge'
    });

    const res = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${credentials}`
      },
      body: params.toString()
    });

    const data = await res.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      scopes: data.scope ? data.scope.split(' ') : ['tweet.read', 'tweet.write']
    };
  }

  async refreshToken(refreshToken: string): Promise<TokenSet> {
    const credentials = Buffer.from(`${env.X_CLIENT_ID}:${env.X_CLIENT_SECRET}`).toString('base64');
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    });

    const res = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${credentials}`
      },
      body: params.toString()
    });

    const data = await res.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      expiresIn: data.expires_in,
      scopes: data.scope ? data.scope.split(' ') : ['tweet.read', 'tweet.write']
    };
  }

  async getUserProfile(accessToken: string): Promise<SocialProfile> {
    const res = await fetch('https://api.twitter.com/2/users/me?user.fields=profile_image_url,username', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const data = await res.json();

    return {
      platformUserId: data.data.id,
      username: `@${data.data.username}`,
      displayName: data.data.name,
      avatarUrl: data.data.profile_image_url,
      accountType: AccountType.PROFILE
    };
  }

  async publishPost(accessToken: string, _targetAccountId: string, content: PublishContent): Promise<PublishResult> {
    const body: any = {
      text: content.text
    };

    const res = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    const tweetId = data.data?.id || 'unknown';

    return {
      platformPostId: tweetId,
      platformPostUrl: `https://x.com/i/status/${tweetId}`,
      rawResponse: data
    };
  }

  async deletePost(accessToken: string, platformPostId: string): Promise<void> {
    await fetch(`https://api.twitter.com/2/tweets/${platformPostId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` }
    });
  }
}
