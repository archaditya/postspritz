import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import session from 'express-session';
import RedisStore from 'connect-redis';
import pinoHttp from 'pino-http';

import { env } from './config/env';
import { logger } from './config/logger';
import { redis } from './config/redis';
import { pool } from './db/pool';
import { requestIdMiddleware } from './middlewares/requestId.middleware';
import { errorHandler } from './middlewares/errorHandler.middleware';
import { createRateLimiter } from './middlewares/rateLimiter.middleware';
import { authRoutes } from './modules/auth/auth.routes';
import { usersRoutes } from './modules/users/users.routes';
import { socialAccountsRoutes } from './modules/social-accounts/social-accounts.routes';
import { postsRoutes } from './modules/posts/posts.routes';
import { billingRoutes } from './modules/billing/billing.routes';
import { mediaRoutes } from './modules/media/media.routes';
import { notificationsRoutes } from './modules/notifications/notifications.routes';
import { aiContentRoutes } from './modules/ai-content/ai-content.routes';
import { analyticsRoutes } from './modules/analytics/analytics.routes';
import { adminRoutes } from './modules/admin/admin.routes';
import { apiKeysRoutes } from './modules/api-keys/api-keys.routes';
import { contactRoutes } from './modules/contact/contact.routes';

export const createApp = () => {
  const app = express();

  // 1. Security Headers
  app.use(helmet());

  // 2. Correlation ID
  app.use(requestIdMiddleware);

  // 3. CORS
  app.use(cors({
    origin: env.CORS_ORIGINS.split(',').map(s => s.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id']
  }));

  // 4. Request Logging
  app.use(pinoHttp({
    logger,
    customProps: (req) => ({
      reqId: req.headers['x-request-id']
    })
  }));

  // 5. Body Parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // 6. Redis Session
  const redisStore = new RedisStore({
    client: redis,
    prefix: 'sess:'
  });

  app.use(session({
    store: redisStore,
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    name: 'sid',
    cookie: {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: env.SESSION_MAX_AGE
    }
  }));

  // 7. Global API Rate Limiter
  app.use('/api', createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 300,
    prefix: 'rl:api:'
  }));

  // 8. Health checks
  app.get('/health', (_req, res) => {
    res.json({
      status: 'healthy',
      service: 'postspritz-api',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  app.get('/health/deep', async (_req, res) => {
    try {
      const dbCheck = await pool.query('SELECT 1 as ok');
      const redisCheck = await redis.ping();

      res.json({
        status: 'healthy',
        database: dbCheck.rows[0]?.ok === 1 ? 'connected' : 'unhealthy',
        redis: redisCheck === 'PONG' ? 'connected' : 'unhealthy',
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      res.status(503).json({
        status: 'unhealthy',
        error: err.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // 9. API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/social-accounts', socialAccountsRoutes);
  app.use('/api/posts', postsRoutes);
  app.use('/api/billing', billingRoutes);
  app.use('/api/media', mediaRoutes);
  app.use('/api/notifications', notificationsRoutes);
  app.use('/api/ai-content', aiContentRoutes);
  app.use('/api/ai', aiContentRoutes); // Alias for frontend useAI
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/api-keys', apiKeysRoutes);
  app.use('/api/contact', contactRoutes);

  // 10. Global Error Handler
  app.use(errorHandler);

  return app;
};
