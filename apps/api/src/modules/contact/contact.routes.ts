import { Router } from 'express';
import { ContactController } from './contact.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';
import { createRateLimiter } from '../../middlewares/rateLimiter.middleware';

const router = Router();
const controller = new ContactController();

// Rate limiter for contact form submissions: max 10 per 15 mins per IP
const contactRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  prefix: 'rl:contact:',
});

// Public submission
router.post('/', contactRateLimiter, controller.submit);

// Admin view inquiries
router.get('/', authenticate, requireRole('superadmin', 'admin'), controller.list);

export const contactRoutes = router;
