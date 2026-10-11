import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@pushpost/shared-types';
import { AppError } from './errorHandler.middleware';

const ROLE_RANKS: Record<string, number> = {
  [UserRole.SUPERADMIN]: 100,
  [UserRole.ADMIN]: 50,
  [UserRole.USER]: 10
};

export const requireRole = (...allowedRoles: (UserRole | string)[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Unauthorized', 401));
    }

    const userRank = ROLE_RANKS[req.user.role] || 0;
    const minRequiredRank = Math.min(...allowedRoles.map(r => ROLE_RANKS[r] || 999));

    if (userRank >= minRequiredRank) {
      return next();
    }

    return next(new AppError('Forbidden: Insufficient permissions for this resource', 403));
  };
};
