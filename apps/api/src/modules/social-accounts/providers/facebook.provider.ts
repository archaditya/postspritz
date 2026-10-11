import { SocialPlatform, AccountType } from '@pushpost/shared-types';
import { SocialProvider, TokenSet, SocialProfile, PublishContent, PublishResult } from './provider.interface';
import { env } from '../../../config/env';
import { logger } from '../../../config/logger';

const META_GRAPH = 'https://graph.facebook.com/v20.0';

export class FacebookProvider implements SocialProvider {
  readonly platform = SocialPlatform.FACEBOOK;

  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: env.FACEBOOK_APP_ID,
      redirect_uri: env.FACEBOOK_REDIRECT_URI,
      state,
      scope: 'email,pages_show_list,pages_read_engagement,pages_manage_posts,pages_manage_metadata,public_profile',
      response_type: 'code'
    });
    return `https://www.facebook.com/v20.0/dialog/oauth?${params.toString()}`;
  }

  /**
   * Exchange authorization code for a short-lived user token,
   * then immediately upgrade to a long-lived user token (~60 days),
   * then fetch the user's managed Pages and pick the first one,
   * returning the Page access token (never-expiring when derived from
   * a long-lived user token).
   */
  async exchangeCode(code: string): Promise<TokenSet> {
    // Step 1: Exchange code → short-lived user token
    const shortParams = new URLSearchParams({
      client_id: env.FACEBOOK_APP_ID,
      client_secret: env.FACEBOOK_APP_SECRET,
      redirect_uri: env.FACEBOOK_REDIRECT_URI,
      code
    });

    const shortRes = await fetch(`${META_GRAPH}/oauth/access_token?${shortParams.toString()}`);
    const shortData = await shortRes.json();

    if (shortData.error) {
      throw new Error(`Facebook OAuth error: ${shortData.error.message}`);
    }

    // Step 2: Exchange short-lived → long-lived user token (~60 days)
    const longParams = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: env.FACEBOOK_APP_ID,
      client_secret: env.FACEBOOK_APP_SECRET,
      fb_exchange_token: shortData.access_token
    });

    const longRes = await fetch(`${META_GRAPH}/oauth/access_token?${longParams.toString()}`);
    const longData = await longRes.json();

    if (longData.error) {
      throw new Error(`Facebook long-lived token exchange error: ${longData.error.message}`);
    }

    const longLivedUserToken = longData.access_token;
    const expiresIn = longData.expires_in || 5184000; // ~60 days

    // Step 3: Fetch user's Pages → get Page Access Tokens
    // A Page token derived from a long-lived user token is "permanent" (never expires unless user revokes).
    const pagesRes = await fetch(
      `${META_GRAPH}/me/accounts?fields=id,name,access_token,picture{url}&access_token=${longLivedUserToken}`
    );
    const pagesData = await pagesRes.json();

    if (!pagesData.data || pagesData.data.length === 0) {
      // No Pages — return the user token (limited: can't post to Pages)
      logger.warn('No Facebook Pages found for user, returning user-level token');
      return {
        accessToken: longLivedUserToken,
        expiresIn,
        scopes: ['pages_manage_posts', 'pages_show_list']
      };
    }

    // Use the first Page's token. Store long-lived user token as refreshToken
    // so the token-refresh worker can re-derive page tokens before expiry.
    const firstPage = pagesData.data[0];
    return {
      accessToken: firstPage.access_token, // Page access token (permanent while user token is valid)
      refreshToken: longLivedUserToken, // Store for 60-day refresh cycle
      expiresIn: expiresIn, // ~60 days — triggers token-refresh worker
      scopes: ['pages_manage_posts', 'pages_show_list', 'pages_read_engagement']
    };
  }

  /**
   * Refresh pipeline: long-lived user token → new long-lived user token →
   * re-fetch Page tokens. The worker calls this before the 60-day expiry.
   */
  async refreshToken(refreshToken: string): Promise<TokenSet> {
    // Step 1: Exchange current long-lived user token for a new one
    const params = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: env.FACEBOOK_APP_ID,
      client_secret: env.FACEBOOK_APP_SECRET,
      fb_exchange_token: refreshToken
    });

    const res = await fetch(`${META_GRAPH}/oauth/access_token?${params.toString()}`);
    const data = await res.json();

    if (data.error) {
      throw new Error(`Facebook token refresh error: ${data.error.message}`);
    }

    const newUserToken = data.access_token;
    const expiresIn = data.expires_in || 5184000;

    // Step 2: Re-fetch Page tokens using the refreshed user token
    const pagesRes = await fetch(
      `${META_GRAPH}/me/accounts?fields=id,name,access_token&access_token=${newUserToken}`
    );
    const pagesData = await pagesRes.json();

    if (!pagesData.data || pagesData.data.length === 0) {
      // No pages found — return user token as fallback
      return {
        accessToken: newUserToken,
        refreshToken: newUserToken,
        expiresIn,
        scopes: ['pages_manage_posts', 'pages_show_list']
      };
    }

    const firstPage = pagesData.data[0];
    return {
      accessToken: firstPage.access_token,
      refreshToken: newUserToken,
      expiresIn,
      scopes: ['pages_manage_posts', 'pages_show_list']
    };
  }

  /**
   * Fetch the Page profile using the Page access token.
   * The accessToken here is already a Page token from exchangeCode().
   */
  async getUserProfile(accessToken: string): Promise<SocialProfile> {
    // First try as page token → /me returns the Page itself
    const res = await fetch(`${META_GRAPH}/me?fields=id,name,picture{url},category&access_token=${accessToken}`);
    const data = await res.json();

    if (data.error) {
      throw new Error(`Facebook profile fetch error: ${data.error.message}`);
    }

    return {
      platformUserId: data.id,
      displayName: data.name,
      avatarUrl: data.picture?.data?.url,
      accountType: AccountType.PAGE,
      metadata: { category: data.category }
    };
  }

  /**
   * Publish to a Facebook Page. The accessToken is a Page access token,
   * and targetAccountId is the Page ID (same as platformUserId).
   */
  async publishPost(accessToken: string, targetAccountId: string, content: PublishContent): Promise<PublishResult> {
    const mediaUrl = content.mediaUrls?.[0];

    try {
      if (mediaUrl) {
        // Photo post
        const res = await fetch(`${META_GRAPH}/${targetAccountId}/photos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: mediaUrl,
            caption: content.text,
            access_token: accessToken
          })
        });

        const data = await res.json();
        if (data.error) throw new Error(data.error.message);

        const postId = data.post_id || data.id;
        return {
          platformPostId: postId,
          platformPostUrl: `https://facebook.com/${postId}`,
          rawResponse: data
        };
      }

      // Text / link post
      const body: Record<string, string> = {
        message: content.text,
        access_token: accessToken
      };
      if (content.linkUrl) body.link = content.linkUrl;

      const res = await fetch(`${META_GRAPH}/${targetAccountId}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error.message);

      return {
        platformPostId: data.id,
        platformPostUrl: `https://facebook.com/${data.id}`,
        rawResponse: data
      };
    } catch (err: any) {
      throw new Error(`Facebook publish failed: ${err.message}`);
    }
  }

  async deletePost(accessToken: string, platformPostId: string): Promise<void> {
    const res = await fetch(`${META_GRAPH}/${platformPostId}?access_token=${accessToken}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (data.error) throw new Error(`Facebook delete failed: ${data.error.message}`);
  }
}
