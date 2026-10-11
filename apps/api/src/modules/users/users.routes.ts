import { Router } from 'express';
import { UsersController } from './users.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { validateRequest, validateQuery } from '../../middlewares/validate.middleware';
import {
  updateProfileSchema,
  updatePasswordSchema,
  updateNotificationSettingsSchema,
  updatePlatformSettingsSchema,
  updateAiConfigSchema,
  auditLogsQuerySchema
} from './users.schemas';

const router = Router();
const controller = new UsersController();

router.use(authenticate); // All user profile endpoints require authentication

router.get('/me', controller.getMe);
router.get('/me/audit-logs', validateQuery(auditLogsQuerySchema), controller.getAuditLogs);
router.patch('/me', validateRequest(updateProfileSchema), controller.updateMe);
router.patch('/me/password', validateRequest(updatePasswordSchema), controller.updatePassword);
router.patch('/me/notifications', validateRequest(updateNotificationSettingsSchema), controller.updateNotifications);
router.patch('/me/platforms', validateRequest(updatePlatformSettingsSchema), controller.updatePlatformSettings);
router.patch('/me/ai-config', validateRequest(updateAiConfigSchema), controller.updateAiConfig);
router.delete('/me', controller.deleteAccount);

export const usersRoutes = router;
