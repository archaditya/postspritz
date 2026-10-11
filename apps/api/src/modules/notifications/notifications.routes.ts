import { Router } from 'express';
import { NotificationsController } from './notifications.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();
const controller = new NotificationsController();

router.use(authenticate);

router.get('/', controller.list);
router.get('/unread-count', controller.unreadCount);
router.get('/stream', controller.stream);
router.post('/read-all', controller.markAllAsRead);
router.patch('/:id/read', controller.markAsRead);

export const notificationsRoutes = router;
