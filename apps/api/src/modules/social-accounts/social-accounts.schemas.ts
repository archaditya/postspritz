import { z } from 'zod';

export const connectAccountCallbackSchema = z.object({
  code: z.string().min(1, 'Authorization code is required'),
  state: z.string().min(1, 'OAuth state is required'),
  codeVerifier: z.string().optional()
});

export const platformParamSchema = z.object({
  platform: z.enum(['linkedin', 'facebook', 'instagram', 'threads', 'x', 'reddit'])
});

export const accountIdParamSchema = z.object({
  id: z.string().uuid('Valid account UUID required')
});

export const listAccountsQuerySchema = z.object({
  page: z.string().optional().default('1').transform((val) => Math.max(1, parseInt(val, 10) || 1)),
  limit: z.string().optional().default('50').transform((val) => Math.min(100, Math.max(1, parseInt(val, 10) || 50))),
  search: z.string().trim().optional(),
  platform: z.enum(['linkedin', 'facebook', 'instagram', 'threads', 'x', 'reddit']).optional(),
  status: z.enum(['connected', 'expired', 'revoked']).optional()
});
