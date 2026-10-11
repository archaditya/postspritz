import { z } from 'zod';

export const listNotificationsQuerySchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('20').transform(Number),
  unreadOnly: z.string().optional().transform(v => v === 'true')
});

export const notificationIdParamSchema = z.object({
  id: z.string().uuid('Valid notification ID required')
});
