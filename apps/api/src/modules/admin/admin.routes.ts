import { Router } from 'express';
import { AdminController } from './admin.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';
import { UserRole } from '@pushpost/shared-types';

const router = Router();
const controller = new AdminController();

// Strictly superadmin and admin only
router.use(authenticate, requireRole(UserRole.SUPERADMIN, UserRole.ADMIN));

router.get('/stats', controller.getStats);
router.get('/users', controller.listUsers);
router.get('/users/:id', controller.getUserDetail);
router.patch('/users/:id/status', controller.updateStatus);
router.get('/system/queues', controller.getQueueStats);
router.get('/audit-logs', controller.getAuditLogs);
router.get('/plans', controller.getPlans);
router.post('/users/:id/assign-package', controller.assignPlan);
router.post('/system/trigger-expiry', controller.triggerSubscriptionExpiry);
router.post('/notifications/broadcast', controller.broadcastNotification);

// Daily Rotating Log Files Endpoints
router.get('/system/logs', controller.listLogs);
router.get('/system/logs/:filename/download', controller.downloadLog);
router.get('/system/logs/:filename/preview', controller.previewLog);

// Observability, LLM Call Tracing, and Complete Audit Log Endpoints
router.get('/observability/llm-calls', controller.getObservabilityLlmCalls);
router.get('/observability/audit-logs', controller.getObservabilityAuditLogs);
router.get('/observability/reliability', controller.getObservabilityReliability);

export const adminRoutes = router;
