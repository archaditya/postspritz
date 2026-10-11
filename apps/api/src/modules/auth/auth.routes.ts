import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validateRequest } from '../../middlewares/validate.middleware';
import { authenticate } from '../../middlewares/auth.middleware';
import { authLimiter } from '../../middlewares/rateLimiter.middleware';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  verifyEmailSchema,
  fcmTokenSchema,
  googleAuthSchema
} from './auth.schemas';

const router = Router();
const controller = new AuthController();

// Public routes with rate limiting
router.post('/register', authLimiter, validateRequest(registerSchema), controller.register);
router.post('/login', authLimiter, validateRequest(loginSchema), controller.login);
router.post('/google', authLimiter, validateRequest(googleAuthSchema), controller.googleAuth);
router.post('/forgot-password', authLimiter, validateRequest(forgotPasswordSchema), controller.forgotPassword);
router.post('/reset-password', authLimiter, validateRequest(resetPasswordSchema), controller.resetPassword);
router.post('/verify-email', validateRequest(verifyEmailSchema), controller.verifyEmail);

// Protected routes (Dual Auth: Bearer JWT or Session Cookie)
router.get('/me', authenticate, controller.me);
router.post('/refresh', authenticate, controller.refresh);
router.post('/logout', authenticate, controller.logout);
router.post('/change-password', authenticate, validateRequest(changePasswordSchema), controller.changePassword);

// Device FCM Push Token Management
router.post('/fcm-token', authenticate, validateRequest(fcmTokenSchema), controller.registerFcmToken);
router.delete('/fcm-token', authenticate, controller.removeFcmToken);

export const authRoutes = router;
