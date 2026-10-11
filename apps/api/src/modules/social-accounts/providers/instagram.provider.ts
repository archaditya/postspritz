import { SocialPlatform, AccountType } from '@pushpost/shared-types';
import { SocialProvider, TokenSet, SocialProfile, PublishContent, PublishResult } from './provider.interface';
import { env } from '../../../config/env';
import { logger } from '../../../config/logger';

const META_GRAPH = 'https://graph.facebook.com/v20.0';

/**
 * Instagram publishing uses the Meta Graph API (not the Instagram Basic Display API).
 * OAuth goes through Facebook Login → user grants instagram_content_publish permission →
 * we discover the linked Instagram Business/Creator account from their Facebook Pages.
 *
 * The access token stored is the PAGE access token (derived from a long-lived user token),
 * and the platformUserId is the Instagram Business Account ID.
 */
export class InstagramProvider implements SocialProvider {
  readonly platform = SocialPlatform.INSTAGRAM;

  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: env.FACEBOOK_APP_ID,
      redirect_uri: env.INSTAGRAM_REDIRECT_URI,
      state,
      scope: 'instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement',
      response_type: 'code'
    });
    return `https://www.facebook.com/v20.0/dialog/oauth?${params.toString()}`;
  }

  /**
   * Exchange code → short-lived → long-lived user token → fetch Pages → find
   * the linked instagram_business_account → return the Page access token
   * (used for IG publishing).
   */
  async exchangeCode(code: string): Promise<TokenSet> {
    // Step 1: Code → short-lived user token
    const shortParams = new URLSearchParams({
      client_id: env.FACEBOOK_APP_ID,
      client_secret: env.FACEBOOK_APP_SECRET,
      redirect_uri: env.INSTAGRAM_REDIRECT_URI,
      code
    });

    const shortRes = await fetch(`${META_GRAPH}/oauth/access_token?${shortParams.toString()}`);
    const shortData = await shortRes.json();
    if (shortData.error) throw new Error(`IG OAuth error: ${shortData.error.message}`);

    // Step 2: Short-lived → long-lived user token
    const longParams = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: env.FACEBOOK_APP_ID,
      client_secret: env.FACEBOOK_APP_SECRET,
      fb_exchange_token: shortData.access_token
    });

    const longRes = await fetch(`${META_GRAPH}/oauth/access_token?${longParams.toString()}`);
    const longData = await longRes.json();
    if (longData.error) throw new Error(`IG long-lived token error: ${longData.error.message}`);

    const longLivedUserToken = longData.access_token;

    // Step 3: Fetch Pages with linked IG business accounts
    const pagesRes = await fetch(
      `${META_GRAPH}/me/accounts?fields=id,name,access_token,instagram_business_account{id,username,profile_picture_url}&access_token=${longLivedUserToken}`
    );
    const pagesData = await pagesRes.json();

    // Find first page with an IG business account linked
    const pageWithIg = pagesData.data?.find((p: any) => p.instagram_business_account);
    if (!pageWithIg) {
      throw new Error(
        'No Instagram Professional Account linked to any of your Facebook Pages. ' +
        'Please convert your Instagram account to a Business or Creator account and link it to a Facebook Page.'
      );
    }

    // Return the Page access token — this is what we use for IG content publishing
    return {
      accessToken: pageWithIg.access_token,
      refreshToken: longLivedUserToken, // Keep long-lived user token for refresh
      scopes: ['instagram_content_publish', 'instagram_basic', 'pages_show_list']
    };
  }

  async refreshToken(refreshToken: string): Promise<TokenSet> {
    // Refresh the long-lived user token, then re-fetch page token
    const params = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: env.FACEBOOK_APP_ID,
      client_secret: env.FACEBOOK_APP_SECRET,
      fb_exchange_token: refreshToken
    });

    const res = await fetch(`${META_GRAPH}/oauth/access_token?${params.toString()}`);
    const data = await res.json();
    if (data.error) throw new Error(`IG token refresh error: ${data.error.message}`);

    const newUserToken = data.access_token;

    // Re-fetch page token with IG account
    const pagesRes = await fetch(
      `${META_GRAPH}/me/accounts?fields=id,access_token,instagram_business_account{id}&access_token=${newUserToken}`
    );
    const pagesData = await pagesRes.json();
    const pageWithIg = pagesData.data?.find((p: any) => p.instagram_business_account);

    if (!pageWithIg) {
      throw new Error('Instagram account no longer linked to any Facebook Page during refresh.');
    }

    return {
      accessToken: pageWithIg.access_token,
      refreshToken: newUserToken,
      expiresIn: data.expires_in || 5184000,
      scopes: ['instagram_content_publish', 'instagram_basic']
    };
  }

  /**
   * Fetch the Instagram Business Account profile.
   * The accessToken is the Page token; we query /me/accounts to find the IG account.
   */
  async getUserProfile(accessToken: string): Promise<SocialProfile> {
    // accessToken is a Page token — get the page's linked IG account
    const pagesRes = await fetch(
      `${META_GRAPH}/me/accounts?fields=name,instagram_business_account{id,username,profile_picture_url}&access_token=${accessToken}`
    );
    const pagesData = await pagesRes.json();

    // If this is a Page token, /me/accounts returns just that page
    const pageWithIg = pagesData.data?.find((p: any) => p.instagram_business_account);
    if (!pageWithIg?.instagram_business_account) {
      throw new Error('No Instagram Professional Account linked to your Facebook Page.');
    }

    const ig = pageWithIg.instagram_business_account;
    return {
      platformUserId: ig.id, // This is the IG Business Account ID
      username: ig.username ? `@${ig.username}` : undefined,
      displayName: ig.username || 'Instagram Account',
      avatarUrl: ig.profile_picture_url,
      accountType: AccountType.PROFILE
    };
  }

  /**
   * Instagram Container Model: Step 1 → create media container, Step 2 → publish it.
   * accessToken = Page access token, targetAccountId = IG Business Account ID.
   */
  async publishPost(accessToken: string, targetAccountId: string, content: PublishContent): Promise<PublishResult> {
    const mediaUrl = content.mediaUrls?.[0];
    if (!mediaUrl) {
      throw new Error('Instagram publishing requires at least one public image or video URL.');
    }

    // Step 1: Create container
    const containerRes = await fetch(`${META_GRAPH}/${targetAccountId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: mediaUrl,
        caption: content.text || '',
        access_token: accessToken
      })
    });
    const containerData = await containerRes.json();

    if (containerData.error) {
      throw new Error(`IG container creation failed: ${containerData.error.message}`);
    }

    const creationId = containerData.id;
    if (!creationId) {
      throw new Error(`IG container creation returned no ID: ${JSON.stringify(containerData)}`);
    }

    // Brief pause for Meta's crawler to process the image
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Step 2: Publish container
    const publishRes = await fetch(`${META_GRAPH}/${targetAccountId}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: creationId,
        access_token: accessToken
      })
    });
    const publishData = await publishRes.json();

    if (publishData.error) {
      throw new Error(`IG publish failed: ${publishData.error.message}`);
    }

    const igMediaId = publishData.id || creationId;
    return {
      platformPostId: igMediaId,
      platformPostUrl: `https://www.instagram.com/p/${igMediaId}`,
      rawResponse: publishData
    };
  }

  async deletePost(_accessToken: string, _platformPostId: string): Promise<void> {
    // Instagram Graph API does not support post deletion via API
    logger.warn('Instagram does not support post deletion via API');
  }
}
