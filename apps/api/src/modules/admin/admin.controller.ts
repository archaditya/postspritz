import { Request, Response, NextFunction } from 'express';
import { AdminService } from './admin.service';
import { ApiResponse } from '../../utils/apiResponse';

export class AdminController {
  private service: AdminService;

  constructor() {
    this.service = new AdminService();
  }

  listUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string || '1', 10);
      const limit = parseInt(req.query.limit as string || '20', 10);
      const search = req.query.search as string | undefined;

      const result = await this.service.listUsers(page, limit, search);
      ApiResponse.paginated(
        res,
        result.users,
        result.total,
        result.page,
        result.limit,
        'Users list retrieved for admin console'
      );
    } catch (err) {
      next(err);
    }
  };

  getUserDetail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.getUserDetail(req.params.id);
      ApiResponse.success(res, result, 'User full detail and platform setups retrieved');
    } catch (err) {
      next(err);
    }
  };

  updateStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.updateUserStatus(req.params.id, req.body.status);
      ApiResponse.success(res, result, 'User account status updated');
    } catch (err) {
      next(err);
    }
  };

  getQueueStats = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await this.service.getQueueStats();
      ApiResponse.success(res, stats, 'BullMQ queue metrics retrieved');
    } catch (err) {
      next(err);
    }
  };

  getStats = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await this.service.getSystemStats();
      ApiResponse.success(res, stats, 'Platform telemetry and system stats retrieved');
    } catch (err) {
      next(err);
    }
  };

  broadcastNotification = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { title, body, type, targetRole, targetPlan, channel, actionUrl } = req.body;
      if (!title || !body) {
        return res.status(400).json({ success: false, message: 'Notification title and body are required' });
      }

      const result = await this.service.broadcastNotification({
        title,
        body,
        type,
        targetRole,
        targetPlan,
        channel,
        actionUrl
      });

      ApiResponse.success(res, result, 'Broadcast notifications dispatched successfully');
    } catch (err) {
      next(err);
    }
  };

  getAuditLogs = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string || '1', 10);
      const limit = parseInt(req.query.limit as string || '50', 10);

      const result = await this.service.getAuditLogs(page, limit);
      ApiResponse.paginated(
        res,
        result.logs,
        result.total,
        result.page,
        result.limit,
        'Platform security audit logs retrieved'
      );
    } catch (err) {
      next(err);
    }
  };

  getPlans = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const plans = await this.service.getPlans();
      ApiResponse.success(res, plans, 'Platform subscription plans and quota tiers retrieved');
    } catch (err) {
      next(err);
    }
  };

  assignPlan = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const adminUserId = (req as any).user.id;
      const targetUserId = req.params.id;
      const { plan, billingCycle } = req.body;

      if (!plan) {
        return res.status(400).json({ success: false, message: 'Plan name or ID is required' });
      }

      const result = await this.service.assignUserPlan({
        adminUserId,
        targetUserId,
        planNameOrId: plan,
        billingCycle: billingCycle || 'monthly'
      });

      ApiResponse.success(res, result, 'Package plan assigned to user successfully');
    } catch (err) {
      next(err);
    }
  };

  triggerSubscriptionExpiry = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.triggerSubscriptionExpiryCheck();
      ApiResponse.success(
        res,
        result,
        `Subscription expiry scan completed: ${result.expiredCount} expired packages transitioned to Free Starter`
      );
    } catch (err) {
      next(err);
    }
  };
}
