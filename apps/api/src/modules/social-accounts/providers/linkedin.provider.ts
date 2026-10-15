import { SocialPlatform, AccountType } from '@pushpost/shared-types';
import { SocialProvider, TokenSet, SocialProfile, PublishContent, PublishResult } from './provider.interface';
import { env } from '../../../config/env';
import { logger } from '../../../config/logger';

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
    const authorUrn = `urn:li:person:${targetAccountId}`;
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'X-Restli-Protocol-Version': '2.0.0',
      'Content-Type': 'application/json'
    };

    let mediaCategory = 'NONE';
    let mediaItem: any = undefined;

    if (content.mediaUrls && content.mediaUrls.length > 0) {
      try {
        const imageUrl = content.mediaUrls[0];
        // 1. Register image upload
        const regRes = await fetch('https://api.linkedin.com/v2/assets?action=registerUpload', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            registerUploadRequest: {
              recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
              owner: authorUrn,
              serviceRelationships: [
                {
                  relationshipType: 'OWNER',
                  identifier: 'urn:li:userGeneratedContent'
                }
              ]
            }
          })
        });
        const regData = await regRes.json();
        const uploadUrl = regData.value?.uploadMechanism?.['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest']?.uploadUrl;
        const assetUrn = regData.value?.asset;

        if (uploadUrl && assetUrn) {
          // 2. Fetch media binary stream
          const imgBlob = await fetch(imageUrl).then(r => r.arrayBuffer());

          // 3. Upload binary to LinkedIn upload URL
          await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'image/png'
            },
            body: imgBlob
          });

          mediaCategory = 'IMAGE';
          mediaItem = [{ status: 'READY', media: assetUrn }];
        }
      } catch (err: any) {
        logger.warn({ err: err?.message }, 'LinkedIn image upload skipped or failed, falling back to text post');
      }
    }

    const body: any = {
      author: authorUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: content.text
          },
          shareMediaCategory: mediaCategory,
          ...(mediaItem ? { media: mediaItem } : {})
        }
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
      }
    };

    const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    const data = await res.json();
    if (!res.ok) {
      const errMsg = data.message || data.error?.message || `LinkedIn API returned ${res.status}`;
      throw new Error(errMsg);
    }

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
