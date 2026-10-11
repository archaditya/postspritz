import { Router } from 'express';
import { SocialAccountsController } from './social-accounts.controller';
import { authenticate } from '../../middlewares/auth.middleware';

import { validateQuery } from '../../middlewares/validate.middleware';
import { listAccountsQuerySchema } from './social-accounts.schemas';

const router = Router();
const controller = new SocialAccountsController();

// OAuth initiation & listing require user authentication
router.get('/', authenticate, validateQuery(listAccountsQuerySchema), controller.list);
router.get('/:platform/auth-url', authenticate, controller.getAuthUrl);
router.delete('/:id', authenticate, controller.disconnect);

// Callback can be hit directly by OAuth vendor redirects or via POST
router.get('/:platform/callback', controller.callback);
router.post('/:platform/callback', authenticate, controller.callback);
router.get('/oauth/:platform/callback', controller.callback);
router.post('/oauth/:platform/callback', authenticate, controller.callback);

export const socialAccountsRoutes = router;
