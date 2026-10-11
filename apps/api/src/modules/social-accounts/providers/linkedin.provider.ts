import { SocialPlatform, AccountType } from '@pushpost/shared-types';
import { SocialProvider, TokenSet, SocialProfile, PublishContent, PublishResult } from './provider.interface';
import { env } from '../../../config/env';

export class LinkedInProvider implements SocialProvider {
  readonly platform = SocialPlatform.LINKEDIN;

  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: env.LINKEDIN_CLIENT_ID || 'mock_linkedin_client',
      redirect_uri: env.LINKEDIN_REDIRECT_URI,
      state,
      scope: 'openid profile email w_member_social'
    });
    return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<TokenSet> {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: env.LINKEDIN_CLIENT_ID || '',
      client_secret: env.LINKEDIN_CLIENT_SECRET || '',
      redirect_uri: env.LINKEDIN_REDIRECT_URI
    });

    const res = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });

    const data = await res.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      scopes: data.scope ? data.scope.split(' ') : ['w_member_social']
    };
  }

  async refreshToken(refreshToken: string): Promise<TokenSet> {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: env.LINKEDIN_CLIENT_ID || '',
      client_secret: env.LINKEDIN_CLIENT_SECRET || ''
    });

    const res = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });

    const data = await res.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      expiresIn: data.expires_in,
      scopes: data.scope ? data.scope.split(' ') : ['w_member_social']
    };
  }

  async getUserProfile(accessToken: string): Promise<SocialProfile> {
    const res = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const data = await res.json();

    return {
      platformUserId: data.sub,
      username: data.email,
      displayName: data.name || `${data.given_name || ''} ${data.family_name || ''}`.trim(),
      avatarUrl: data.picture,
      accountType: AccountType.PROFILE
    };
  }

  async publishPost(accessToken: string, targetAccountId: string, content: PublishContent): Promise<PublishResult> {
    const body: any = {
      author: `urn:li:person:${targetAccountId}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: content.text
          },
          shareMediaCategory: 'NONE'
        }
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
      }
    };

    const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    const platformPostId = data.id || res.headers.get('x-restli-id') || 'unknown';

    return {
      platformPostId,
      platformPostUrl: `https://www.linkedin.com/feed/update/${platformPostId}`,
      rawResponse: data
    };
  }

  async deletePost(accessToken: string, platformPostId: string): Promise<void> {
    await fetch(`https://api.linkedin.com/v2/ugcPosts/${encodeURIComponent(platformPostId)}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0'
      }
    });
  }
}
