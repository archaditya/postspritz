import { UserRole } from '@pushpost/shared-types';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole | string;
        name?: string | null;
      };
    }
    interface SessionData {
      userId?: string;
      role?: string;
      email?: string;
    }
  }
}
