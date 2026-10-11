import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  fullName: z.string().min(2).max(100).optional(),
  avatar_url: z.string().url().optional().nullable(),
  profileImageUrl: z.string().url().optional().nullable(),
  bio: z.string().max(500).optional(),
  company: z.string().max(100).optional(),
  phone: z.string().max(30).optional(),
  timezone: z.string().max(50).optional(),
  billing_address: z.record(z.any()).optional(),
  gst_number: z.string().max(30).optional()
});

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters')
});

export const updateNotificationSettingsSchema = z.object({
  email_on_publish: z.boolean().optional(),
  email_on_failure: z.boolean().optional(),
  push_enabled: z.boolean().optional()
});

export const updatePlatformSettingsSchema = z.object({
  enabled_platforms: z.array(z.enum(['linkedin', 'facebook', 'instagram', 'threads', 'x', 'reddit'])).optional(),
  paid_platforms_consent: z.record(z.boolean()).optional()
});

export const updateAiConfigSchema = z.object({
  provider: z.enum(['platform', 'byok']),
  byok_provider: z.enum(['gemini', 'openai']).optional(),
  api_key: z.string().optional()
});

export const auditLogsQuerySchema = z.object({
  page: z.string().optional().default('1').transform((val) => Math.max(1, parseInt(val, 10) || 1)),
  limit: z.string().optional().default('20').transform((val) => Math.min(100, Math.max(1, parseInt(val, 10) || 20))),
  search: z.string().trim().optional(),
  action: z.string().trim().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
});
