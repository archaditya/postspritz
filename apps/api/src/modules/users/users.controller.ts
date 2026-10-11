import { Request, Response, NextFunction } from 'express';
import { usersService, dataRetentionService, auditLogService } from '../../container';
import { ApiResponse } from '../../utils/apiResponse';

export class UsersController {
  getMe = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profile = await usersService.getProfile(req.user!.id);
      ApiResponse.success(res, profile, 'User profile retrieved successfully');
    } catch (err) {
      next(err);
    }
  };

  getAuditLogs = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const search = (req.query.search as string) || undefined;
      const action = (req.query.action as string) || undefined;
      const startDate = (req.query.startDate as string) || undefined;
      const endDate = (req.query.endDate as string) || undefined;

      const result = await auditLogService.getUserLogs(req.user!.id, {
        page,
        limit,
        search,
        action,
        startDate,
        endDate
      });

      ApiResponse.paginated(
        res,
        result.logs,
        result.total,
        result.page,
        result.limit,
        'User security audit logs retrieved successfully'
      );
    } catch (err) {
      next(err);
    }
  };

  updateMe = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updated = await usersService.updateProfile(req.user!.id, req.body);
      ApiResponse.success(res, updated, 'Profile updated successfully');
    } catch (err) {
      next(err);
    }
  };

  updatePassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await usersService.updatePassword(
        req.user!.id,
        req.body.currentPassword,
        req.body.newPassword
      );
      ApiResponse.success(res, result, 'Password updated successfully');
    } catch (err) {
      next(err);
    }
  };

  updateNotifications = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updated = await usersService.updateNotifications(req.user!.id, req.body);
      ApiResponse.success(res, updated, 'Notification settings updated');
    } catch (err) {
      next(err);
    }
  };

  updatePlatformSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updated = await usersService.updatePlatformSettings(req.user!.id, req.body);
      ApiResponse.success(res, updated, 'Platform preferences saved');
    } catch (err) {
      next(err);
    }
  };

  updateAiConfig = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updated = await usersService.updateAiConfig(req.user!.id, req.body);
      ApiResponse.success(res, updated, 'AI configuration updated');
    } catch (err) {
      next(err);
    }
  };

  deleteAccount = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await dataRetentionService.softDeleteUser(req.user!.id);
      ApiResponse.success(res, result, 'Account soft-deleted with 30-day retention backoff');
    } catch (err) {
      next(err);
    }
  };
}
