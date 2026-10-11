import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { AuthRepository } from './auth.repository';
import { AppError } from '../../middlewares/errorHandler.middleware';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { RegisterInput, LoginInput, ResetPasswordInput } from './auth.schemas';
import { JwtPayload } from '../../middlewares/auth.middleware';
import { firebaseService } from '../../services/firebase.service';
import { query } from '../../db/pool';

export class AuthService {
  private authRepo: AuthRepository;

  constructor() {
    this.authRepo = new AuthRepository();
  }

  async googleLogin(idToken: string) {
    const decoded = await firebaseService.verifyIdToken(idToken);
    const email = decoded.email;
    if (!email) {
      throw new AppError('Google account does not provide a valid email address', 400);
    }

    let user = await this.authRepo.findByEmail(email);
    if (!user) {
      user = await this.authRepo.createUser({
        email,
        name: decoded.name || email.split('@')[0],
        passwordHash: 'GOOGLE_OAUTH_ACCOUNT',
      });
      await query(`UPDATE users SET email_verified = TRUE, avatar_url = $1 WHERE id = $2`, [
        decoded.picture || null,
        user.id,
      ]);
      user.email_verified = true;
      user.avatar_url = decoded.picture || null;
    }

    if (user.status === 'suspended' || user.status === 'deactivated') {
      throw new AppError(`Your account is ${user.status}. Please contact support.`, 403);
    }

    const accessToken = this.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    logger.info({ userId: user.id, email: user.email }, 'User authenticated via Firebase Google OAuth');

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar_url: user.avatar_url || decoded.picture || null,
        email_verified: true,
      },
      accessToken,
    };
  }

  generateAccessToken(payload: JwtPayload): string {
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as any
    });
  }

  async register(input: RegisterInput) {
    const existing = await this.authRepo.findByEmail(input.email);
    if (existing) {
      throw new AppError('An account with this email already exists', 409);
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(input.password, salt);

    const emailVerifyToken = crypto.randomBytes(32).toString('hex');
    const emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = await this.authRepo.createUser({
      email: input.email,
      name: input.name,
      passwordHash,
      emailVerifyToken,
      emailVerifyExpires
    });

    const accessToken = this.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    });

    logger.info({ userId: user.id, email: user.email }, 'User registered successfully');

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar_url: user.avatar_url,
        email_verified: user.email_verified
      },
      accessToken,
      emailVerifyToken
    };
  }

  async login(input: LoginInput) {
    const user = await this.authRepo.findByEmail(input.email);
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    if (user.status === 'suspended' || user.status === 'deactivated') {
      throw new AppError(`Your account is ${user.status}. Please contact support.`, 403);
    }

    const isMatch = await bcrypt.compare(input.password, user.password_hash);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    const accessToken = this.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    });

    logger.info({ userId: user.id }, 'User logged in successfully');

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar_url: user.avatar_url,
        email_verified: user.email_verified
      },
      accessToken
    };
  }

  async forgotPassword(email: string) {
    const user = await this.authRepo.findByEmail(email);
    if (!user) {
      // Return success silently for security
      return { message: 'If an account exists with this email, a reset link has been sent.' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.authRepo.setResetToken(user.id, resetToken, resetExpires);
    logger.info({ userId: user.id }, 'Password reset token generated');

    return {
      message: 'If an account exists with this email, a reset link has been sent.',
      resetToken // In development, token returned for easier local testing
    };
  }

  async resetPassword(input: ResetPasswordInput) {
    const user = await this.authRepo.findByResetToken(input.token);
    if (!user) {
      throw new AppError('Invalid or expired password reset token', 400);
    }

    const salt = await bcrypt.genSalt(12);
    const newHash = await bcrypt.hash(input.newPassword, salt);

    await this.authRepo.updatePassword(user.id, newHash);
    logger.info({ userId: user.id }, 'Password updated successfully');

    return { message: 'Password has been reset successfully. You can now login.' };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.authRepo.findWithPasswordById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    if (!user.password_hash) {
      throw new AppError('Account is authenticated via OAuth provider. Password cannot be changed.', 400);
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      throw new AppError('Current password is incorrect', 400);
    }

    const salt = await bcrypt.genSalt(12);
    const newHash = await bcrypt.hash(newPassword, salt);

    await this.authRepo.updatePassword(userId, newHash);
    logger.info({ userId }, 'User changed password successfully');

    return { message: 'Password has been changed successfully.' };
  }

  async verifyEmail(token: string) {
    const user = await this.authRepo.findByVerifyToken(token);
    if (!user) {
      throw new AppError('Invalid or expired verification token', 400);
    }

    await this.authRepo.markEmailVerified(user.id);
    logger.info({ userId: user.id }, 'Email verified successfully');

    return { message: 'Email verified successfully.' };
  }

  async getCurrentUser(userId: string) {
    const user = await this.authRepo.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return user;
  }
}
