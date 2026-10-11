import { S3Client } from '@aws-sdk/client-s3';
import { env } from './env';
import { logger } from './logger';

const isR2Configured = Boolean(env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY);

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: isR2Configured
    ? `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
    : env.S3_ENDPOINT,
  credentials: {
    accessKeyId: isR2Configured ? env.R2_ACCESS_KEY_ID : env.S3_ACCESS_KEY,
    secretAccessKey: isR2Configured ? env.R2_SECRET_ACCESS_KEY : env.S3_SECRET_KEY,
  },
});

export const r2Config = {
  isConfigured: isR2Configured,
  bucketName: env.R2_BUCKET_NAME || env.S3_BUCKET || 'postspritz-media',
  publicUrl: env.R2_PUBLIC_URL || '',
};

if (isR2Configured) {
  logger.info({ bucket: r2Config.bucketName }, 'Cloudflare R2 client initialized successfully');
} else {
  logger.warn('Cloudflare R2 credentials not fully set; operating in local storage compatibility mode');
}
