import {
  UserRole,
  UserStatus,
  SocialPlatform,
  AccountType,
  AccountStatus,
  PostStatus,
  PostTargetStatus,
  MediaStatus,
  NotificationType,
  SubscriptionStatus,
  BillingCycle,
  PaymentGateway
} from './enums';

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  email_verified: boolean;
  email_verified_at: string | null;
  role: UserRole;
  status: UserStatus;
  preferences: UserPreferences;
  notification_settings: NotificationSettings;
  ai_config: AIConfig;
  usage: UserUsage;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  enabled_platforms?: SocialPlatform[];
  paid_platforms_consent?: Record<string, boolean>;
  theme?: 'dark' | 'light' | 'system';
  timezone?: string;
  [key: string]: any;
}

export interface NotificationSettings {
  email_on_publish: boolean;
  email_on_failure: boolean;
  push_enabled: boolean;
}

export interface AIConfig {
  provider: 'platform' | 'byok';
  byok_provider?: 'gemini' | 'openai';
  api_key_enc?: string | null;
}

export interface UserUsage {
  posts_this_month: number;
  ai_generations_this_month: number;
  ai_images_this_month: number;
  reset_at: string | null;
}

export interface SocialAccount {
  id: string;
  user_id: string;
  platform: SocialPlatform;
  platform_user_id: string;
  platform_username: string | null;
  account_type: AccountType;
  account_name: string;
  avatar_url: string | null;
  scopes: string[];
  status: AccountStatus;
  token_expires_at: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  content: string;
  status: PostStatus;
  scheduled_at: string | null;
  published_at: string | null;
  media_ids: string[];
  ai_generated: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface PostTarget {
  id: string;
  post_id: string;
  social_account_id: string;
  platform: SocialPlatform;
  status: PostTargetStatus;
  platform_post_id: string | null;
  platform_post_url: string | null;
  error_message: string | null;
  retry_count: number;
  cost_incurred: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Media {
  id: string;
  user_id: string;
  post_id: string | null;
  original_filename: string;
  mime_type: string;
  file_size_bytes: number;
  storage_key: string;
  storage_url: string;
  width?: number;
  height?: number;
  duration_seconds?: number;
  thumbnail_url?: string;
  status: MediaStatus;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  action_url: string | null;
  action_label: string | null;
  channels: string[];
  read: boolean;
  read_at: string | null;
  resource_type?: string;
  resource_id?: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface Plan {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  price_monthly_paise: number;
  price_yearly_paise: number;
  currency: string;
  max_social_accounts: number;
  max_posts_per_month: number;
  max_scheduled_posts: number;
  max_ai_generations: number;
  max_ai_images: number;
  max_media_storage_mb: number;
  features: PlanFeatures;
  gateway_plan_id: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PlanFeatures {
  ai_content_generation: boolean;
  ai_image_generation: boolean;
  analytics: boolean;
  team_collaboration: boolean;
  custom_ai_provider: boolean;
  priority_support: boolean;
  api_access: boolean;
  bulk_scheduling: boolean;
  content_calendar: boolean;
  paid_platforms?: Record<string, {
    enabled: boolean;
    cost_per_post: number;
    cost_with_url: number;
  }>;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  payment_gateway: PaymentGateway;
  gateway_subscription_id: string;
  gateway_customer_id: string | null;
  status: SubscriptionStatus;
  billing_cycle: BillingCycle;
  current_period_start: string;
  current_period_end: string;
  trial_start: string | null;
  trial_end: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}
