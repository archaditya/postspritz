import { SocialPlatform, AccountType } from '@pushpost/shared-types';

export interface TokenSet {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number; // seconds
  scopes: string[];
}

export interface SocialProfile {
  platformUserId: string;
  username?: string;
  displayName: string;
  avatarUrl?: string;
  accountType: AccountType;
  metadata?: Record<string, any>;
}

export interface PublishContent {
  text: string;
  mediaUrls?: string[];
  linkUrl?: string;
  options?: Record<string, any>;
}

export interface PublishResult {
  platformPostId: string;
  platformPostUrl?: string;
  rawResponse?: any;
}

export interface SocialProvider {
  readonly platform: SocialPlatform;

  // OAuth Authentication
  getAuthUrl(state: string): string;
  exchangeCode(code: string, codeVerifier?: string): Promise<TokenSet>;
  refreshToken(refreshToken: string): Promise<TokenSet>;

  // User Profile
  getUserProfile(accessToken: string): Promise<SocialProfile>;

  // Publishing
  publishPost(accessToken: string, targetAccountId: string, content: PublishContent): Promise<PublishResult>;
  deletePost(accessToken: string, platformPostId: string): Promise<void>;
}
