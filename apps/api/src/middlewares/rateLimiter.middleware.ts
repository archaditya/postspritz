import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { redis } from '../config/redis';

export const createRateLimiter = (options: {
  windowMs?: number;
  max?: number;
  message?: string;
  prefix?: string;
}) => {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000, // 15 mins default
    max: options.max || 100, // Limit each IP
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: options.message || 'Too many requests from this IP, please try again later.'
    },
    store: new RedisStore({
      // @ts-expect-error Redis client compatible sendCommand
      sendCommand: (...args: string[]) => redis.call(args[0], ...args.slice(1)),
      prefix: options.prefix || 'rl:global:'
    })
  });
};

export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20, // 20 requests per 15 min for auth endpoints
  message: 'Too many authentication attempts, please try again later.',
  prefix: 'rl:auth:'
});
