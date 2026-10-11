import { Router } from 'express';
import { AnalyticsController } from './analytics.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();
const controller = new AnalyticsController();

router.use(authenticate);

router.get('/overview', controller.getOverview);
router.get('/performance', controller.getRecentPerformance);

export const analyticsRoutes = router;
