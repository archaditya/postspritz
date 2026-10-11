import { z } from 'zod';
import { PostStatus, SocialPlatform } from '@pushpost/shared-types';

export const createPostSchema = z.object({
  content: z.string().min(1, 'Post content cannot be empty').max(50000, 'Content exceeds 50,000 character limit'),
  targetAccountIds: z.array(z.string().uuid('Invalid social account ID')).min(1, 'At least one social target account must be selected'),
  scheduledAt: z.string().datetime('Scheduled date must be a valid ISO 8601 string').optional().nullable(),
  mediaIds: z.array(z.string().uuid()).optional(),
  aiGenerated: z.boolean().optional().default(false),
  aiMetadata: z.record(z.any()).optional()
});

export const updatePostSchema = z.object({
  content: z.string().min(1).max(50000).optional(),
  targetAccountIds: z.array(z.string().uuid()).optional(),
  scheduledAt: z.string().datetime().optional().nullable(),
  mediaIds: z.array(z.string().uuid()).optional()
});

export const listPostsQuerySchema = z.object({
  page: z.string().optional().default('1').transform((val) => Math.max(1, parseInt(val, 10) || 1)),
  limit: z.string().optional().default('20').transform((val) => Math.min(100, Math.max(1, parseInt(val, 10) || 20))),
  status: z.nativeEnum(PostStatus).optional(),
  platform: z.nativeEnum(SocialPlatform).optional(),
  search: z.string().trim().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  aiGenerated: z.enum(['true', 'false']).optional().transform((val) => val === 'true'),
  sortBy: z.enum(['created_at', 'scheduled_at', 'updated_at', 'published_at']).optional().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
});

export const estimateCostSchema = z.object({
  content: z.string().min(1, 'Content is required for cost estimation'),
  platform: z.enum(['x', 'linkedin', 'facebook', 'instagram', 'threads', 'reddit'])
});
