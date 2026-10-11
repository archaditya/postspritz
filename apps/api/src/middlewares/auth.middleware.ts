import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from './errorHandler.middleware';
import { query } from '../db/pool';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  name?: string | null;
}

export const authenticate = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    // 1. Check Bearer JWT Header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
        req.user = {
          id: decoded.userId,
          email: decoded.email,
          role: decoded.role,
          name: decoded.name
        };
        return next();
      } catch (jwtErr) {
        throw new AppError('Invalid or expired authentication token', 401);
      }
    }

    // 2. Check Redis Session Cookie
    if (req.session && (req.session as any).userId) {
      const sessionUser = req.session as any;
      req.user = {
        id: sessionUser.userId,
        email: sessionUser.email,
        role: sessionUser.role,
        name: sessionUser.name
      };
      return next();
    }

    throw new AppError('Authentication required. Please login or provide a bearer token.', 401);
  } catch (err) {
    next(err);
  }
};
