import { Request, Response, NextFunction } from 'express';
import { notificationsService } from '../../container';
import { createRedisClient } from '../../config/redis';
import { logger } from '../../config/logger';
import { ApiResponse } from '../../utils/apiResponse';

export class NotificationsController {
  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string || '1', 10);
      const limit = parseInt(req.query.limit as string || '20', 10);
      const unreadOnly = req.query.unreadOnly === 'true';

      const result = await notificationsService.list(req.user!.id, page, limit, unreadOnly);
      ApiResponse.paginated(
        res,
        result.notifications,
        result.total,
        result.page,
        result.limit,
        'Notifications retrieved successfully'
      );
    } catch (err) {
      next(err);
    }
  };

  markAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updated = await notificationsService.markAsRead(req.params.id, req.user!.id);
      ApiResponse.success(res, { updated }, 'Notification marked as read');
    } catch (err) {
      next(err);
    }
  };

  markAllAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await notificationsService.markAllAsRead(req.user!.id);
      ApiResponse.success(res, { success: true }, 'All notifications marked as read');
    } catch (err) {
      next(err);
    }
  };

  unreadCount = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const count = await notificationsService.getUnreadCount(req.user!.id);
      ApiResponse.success(res, { count }, 'Unread count retrieved');
    } catch (err) {
      next(err);
    }
  };

  stream = async (req: Request, res: Response) => {
    const userId = req.user!.id;

    // Set Server-Sent Events headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const channel = `notifications:${userId}`;
    const subscriber = createRedisClient();

    logger.debug({ userId }, 'Client connected to real-time notification SSE stream');

    await subscriber.subscribe(channel);
    subscriber.on('message', (ch, message) => {
      if (ch === channel) {
        res.write(`data: ${message}\n\n`);
      }
    });

    // Keep-alive heartbeat every 25s
    const heartbeat = setInterval(() => {
      res.write(': heartbeat\n\n');
    }, 25000);

    req.on('close', () => {
      clearInterval(heartbeat);
      subscriber.unsubscribe(channel).catch(() => {});
      subscriber.quit().catch(() => {});
      logger.debug({ userId }, 'Client disconnected from notification SSE stream');
    });
  };
}
