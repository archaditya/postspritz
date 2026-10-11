import { Request, Response, NextFunction } from 'express';
import { authService } from '../../container';
import { firebaseService } from '../../services/firebase.service';
import { ApiResponse } from '../../utils/apiResponse';

export class AuthController {
  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.register(req.body);

      // Populate Redis session
      if (req.session) {
        (req.session as any).userId = result.user.id;
        (req.session as any).role = result.user.role;
        (req.session as any).email = result.user.email;
        (req.session as any).name = result.user.name;
      }

      // Automatically register FCM token if sent during registration
      if (req.body.fcmToken) {
        await firebaseService.registerDeviceToken(
          result.user.id,
          req.body.fcmToken,
          req.body.deviceType || 'web',
          req.headers['user-agent']
        );
      }

      ApiResponse.created(res, result, 'Account registered successfully');
    } catch (err) {
      next(err);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.login(req.body);

      // Populate Redis session
      if (req.session) {
        (req.session as any).userId = result.user.id;
        (req.session as any).role = result.user.role;
        (req.session as any).email = result.user.email;
        (req.session as any).name = result.user.name;
      }

      // Automatically register FCM token if sent during login
      if (req.body.fcmToken) {
        await firebaseService.registerDeviceToken(
          result.user.id,
          req.body.fcmToken,
          req.body.deviceType || 'web',
          req.headers['user-agent']
        );
      }

      ApiResponse.success(res, result, 'Logged in successfully');
    } catch (err) {
      next(err);
    }
  };

  googleAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { idToken, fcmToken, deviceType } = req.body;
      const result = await authService.googleLogin(idToken);

      // Populate Redis session
      if (req.session) {
        (req.session as any).userId = result.user.id;
        (req.session as any).role = result.user.role;
        (req.session as any).email = result.user.email;
        (req.session as any).name = result.user.name;
      }

      // Automatically register FCM token if sent during Google auth
      if (fcmToken) {
        await firebaseService.registerDeviceToken(
          result.user.id,
          fcmToken,
          deviceType || 'web',
          req.headers['user-agent']
        );
      }

      ApiResponse.success(res, result, 'Authenticated with Google successfully');
    } catch (err) {
      next(err);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const fcmToken = req.body?.fcmToken;

      // Clean up FCM token(s) on logout
      if (fcmToken) {
        await firebaseService.removeDeviceToken(fcmToken, userId);
      } else if (userId) {
        // Remove device tokens associated with this user
        await firebaseService.removeDeviceToken('', userId);
      }

      if (req.session) {
        req.session.destroy((err) => {
          if (err) {
            return next(err);
          }
          res.clearCookie('sid');
          ApiResponse.success(res, { success: true }, 'Logged out successfully');
        });
      } else {
        ApiResponse.success(res, { success: true }, 'Logged out successfully');
      }
    } catch (err) {
      next(err);
    }
  };

  registerFcmToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { fcmToken, deviceType } = req.body;
      await firebaseService.registerDeviceToken(
        userId,
        fcmToken,
        deviceType || 'web',
        req.headers['user-agent']
      );
      ApiResponse.success(res, { registered: true }, 'Device FCM token registered successfully');
    } catch (err) {
      next(err);
    }
  };

  removeFcmToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const fcmToken = req.body?.fcmToken || (req.query?.fcmToken as string);
      if (fcmToken) {
        await firebaseService.removeDeviceToken(fcmToken, userId);
      }
      ApiResponse.success(res, { removed: true }, 'Device FCM token removed successfully');
    } catch (err) {
      next(err);
    }
  };

  me = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await authService.getCurrentUser(req.user!.id);
      ApiResponse.success(res, user, 'Authenticated user session retrieved');
    } catch (err) {
      next(err);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await authService.getCurrentUser(req.user!.id);
      const accessToken = authService.generateAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        name: user.name
      });
      ApiResponse.success(res, { accessToken }, 'Access token refreshed');
    } catch (err) {
      next(err);
    }
  };

  forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.forgotPassword(req.body.email);
      ApiResponse.success(res, result, 'Password reset instruction dispatched');
    } catch (err) {
      next(err);
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.resetPassword(req.body);
      ApiResponse.success(res, result, 'Password reset completed successfully');
    } catch (err) {
      next(err);
    }
  };

  verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.verifyEmail(req.body.token);
      ApiResponse.success(res, result, 'Email verification confirmed');
    } catch (err) {
      next(err);
    }
  };

  changePassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.changePassword(
        req.user!.id,
        req.body.currentPassword,
        req.body.newPassword
      );
      ApiResponse.success(res, result, 'Password changed successfully');
    } catch (err) {
      next(err);
    }
  };
}
