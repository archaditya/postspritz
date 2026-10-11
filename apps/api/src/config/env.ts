import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env from root or current directory
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('4000').transform(Number),
  API_BASE_URL: z.string().default('http://localhost:4000'),
  WEB_BASE_URL: z.string().default('http://localhost:3000'),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),

  // Database
  DATABASE_URL: z.string().default('postgresql://postspritz:password@localhost:5432/postspritz'),
  DATABASE_POOL_MIN: z.string().default('2').transform(Number),
  DATABASE_POOL_MAX: z.string().default('20').transform(Number),

  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // Auth & Security
  SESSION_SECRET: z.string().min(16).default('development_super_secret_session_key_12345'),
  SESSION_MAX_AGE: z.string().default('86400000').transform(Number),
  JWT_SECRET: z.string().min(16).default('development_super_secret_jwt_key_12345'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  TOKEN_ENCRYPTION_KEY: z.string().length(64).default('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'),

  // Cloudflare R2 Storage (S3-compatible)
  R2_ACCOUNT_ID: z.string().optional().default(''),
  R2_ACCESS_KEY_ID: z.string().optional().default(''),
  R2_SECRET_ACCESS_KEY: z.string().optional().default(''),
  R2_BUCKET_NAME: z.string().default('postspritz-media'),
  R2_PUBLIC_URL: z.string().optional().default(''),
  S3_ENDPOINT: z.string().default('http://localhost:9000'),
  S3_ACCESS_KEY: z.string().default('minioadmin'),
  S3_SECRET_KEY: z.string().default('minioadmin'),
  S3_BUCKET: z.string().default('postspritz-media'),
  S3_REGION: z.string().default('auto'),

  // Firebase Admin Console / FCM
  FIREBASE_PROJECT_ID: z.string().optional().default(''),
  FIREBASE_CLIENT_EMAIL: z.string().optional().default(''),
  FIREBASE_PRIVATE_KEY: z.string().optional().default(''),

  // Brevo Email
  BREVO_API_KEY: z.string().optional().default(''),
  BREVO_SENDER_EMAIL: z.string().default('noreply@postspritz.com'),
  BREVO_SENDER_NAME: z.string().default('PostSpritz'),

  // Gateway Default
  BILLING_GATEWAY_DEFAULT: z.enum(['cashfree', 'razorpay']).default('cashfree'),

  // AI Service
  AI_SERVICE_URL: z.string().default('http://localhost:8000'),

  // Meta Developer App (shared app credentials — NOT per-user tokens)
  META_APP_ID: z.string().default(''),
  META_APP_SECRET: z.string().default(''),

  // Social OAuth Providers (use META_APP_ID/SECRET as fallback for FB/IG/Threads)
  FACEBOOK_APP_ID: z.string().default('').transform(v => v || process.env.META_APP_ID || ''),
  FACEBOOK_APP_SECRET: z.string().default('').transform(v => v || process.env.META_APP_SECRET || ''),
  FACEBOOK_REDIRECT_URI: z.string().default('http://localhost:3000/api/social-accounts/facebook/callback'),

  INSTAGRAM_REDIRECT_URI: z.string().default('http://localhost:3000/api/social-accounts/instagram/callback'),

  LINKEDIN_CLIENT_ID: z.string().default('').transform(v => v || process.env.LCID || ''),
  LINKEDIN_CLIENT_SECRET: z.string().default('').transform(v => v || process.env.LCS || ''),
  LINKEDIN_REDIRECT_URI: z.string().default('http://localhost:3000/api/social-accounts/linkedin/callback'),

  REDDIT_CLIENT_ID: z.string().default(''),
  REDDIT_CLIENT_SECRET: z.string().default(''),
  REDDIT_REDIRECT_URI: z.string().default('http://localhost:3000/api/social-accounts/reddit/callback'),

  THREADS_APP_ID: z.string().default('').transform(v => v || process.env.META_APP_ID || ''),
  THREADS_APP_SECRET: z.string().default('').transform(v => v || process.env.META_APP_SECRET || ''),
  THREADS_REDIRECT_URI: z.string().default('http://localhost:3000/api/social-accounts/threads/callback'),

  X_CLIENT_ID: z.string().default('').transform(v => v || process.env.X_API_KEY || ''),
  X_CLIENT_SECRET: z.string().default('').transform(v => v || process.env.X_API_SECRET || ''),
  X_REDIRECT_URI: z.string().default('http://localhost:3000/api/social-accounts/x/callback')

});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment configuration:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
