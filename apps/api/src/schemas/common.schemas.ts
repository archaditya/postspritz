import { z } from 'zod';

/**
 * Common Parameter & Query Validation Schemas
 * Implements "Zero-Trust Input" validation principles.
 */

// Strict RFC 4122 UUID v4 Parameter Schema
export const idParamSchema = z.object({
  id: z.string().uuid({ message: 'Resource ID must be a valid RFC 4122 UUID v4' })
});

// Platform Path Parameter Schema
export const platformParamSchema = z.object({
  platform: z.enum(['x', 'linkedin', 'facebook', 'instagram', 'threads', 'reddit'], {
    errorMap: () => ({ message: 'Unsupported social platform identifier' })
  })
});

// Universal Pagination & Sorting Query Schema
export const paginationQuerySchema = z.object({
  page: z.string().optional().default('1').transform((val) => Math.max(1, parseInt(val, 10) || 1)),
  limit: z.string().optional().default('20').transform((val) => Math.min(100, Math.max(1, parseInt(val, 10) || 20))),
  search: z.string().trim().max(200, 'Search query cannot exceed 200 characters').optional(),
  sortBy: z.string().trim().max(50).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
});

// Sanitized Non-Empty String (rejects whitespace-only or script tags)
export const safeText = (maxLen = 50000) =>
  z.string()
    .trim()
    .min(1, 'Field cannot be empty or whitespace only')
    .max(maxLen, `Field exceeds maximum allowed length of ${maxLen} characters`)
    .refine((val) => !/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(val), {
      message: 'Malicious script tags detected in input'
    });
