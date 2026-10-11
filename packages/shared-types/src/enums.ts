export enum UserRole {
  SUPERADMIN = 'superadmin',
  ADMIN = 'admin',
  USER = 'user'
}

export enum UserStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  SUSPENDED = 'suspended',
  DEACTIVATED = 'deactivated'
}

export enum SocialPlatform {
  LINKEDIN = 'linkedin',
  FACEBOOK = 'facebook',
  INSTAGRAM = 'instagram',
  THREADS = 'threads',
  X = 'x',
  REDDIT = 'reddit'
}

export enum AccountType {
  PROFILE = 'profile',
  PAGE = 'page',
  GROUP = 'group',
  SUBREDDIT = 'subreddit'
}

export enum AccountStatus {
  CONNECTED = 'connected',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
  ERROR = 'error'
}

export enum PostStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  PUBLISHING = 'publishing',
  PUBLISHED = 'published',
  PARTIALLY_PUBLISHED = 'partially_published',
  FAILED = 'failed'
}

export enum PostTargetStatus {
  PENDING = 'pending',
  PUBLISHING = 'publishing',
  PUBLISHED = 'published',
  FAILED = 'failed',
  SKIPPED = 'skipped'
}

export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
  CAROUSEL = 'carousel',
  DOCUMENT = 'document'
}

export enum MediaStatus {
  UPLOADING = 'uploading',
  UPLOADED = 'uploaded',
  PROCESSING = 'processing',
  READY = 'ready',
  FAILED = 'failed'
}

export enum NotificationType {
  POST_PUBLISHED = 'post_published',
  POST_FAILED = 'post_failed',
  ACCOUNT_EXPIRED = 'account_expired',
  ACCOUNT_CONNECTED = 'account_connected',
  USAGE_LIMIT_WARNING = 'usage_limit_warning',
  BILLING_REMINDER = 'billing_reminder',
  SYSTEM_ANNOUNCEMENT = 'system_announcement'
}

export enum SubscriptionStatus {
  TRIALING = 'trialing',
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired'
}

export enum BillingCycle {
  MONTHLY = 'monthly',
  YEARLY = 'yearly'
}

export enum PaymentGateway {
  CASHFREE = 'cashfree',
  RAZORPAY = 'razorpay'
}
