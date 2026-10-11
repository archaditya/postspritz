import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Valid email address is required').toLowerCase().trim(),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
  fcmToken: z.string().optional(),
  deviceType: z.string().optional()
});

export const loginSchema = z.object({
  email: z.string().email('Valid email address is required').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
  fcmToken: z.string().optional(),
  deviceType: z.string().optional()
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Valid email address is required').toLowerCase().trim()
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters long')
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required')
});

export const fcmTokenSchema = z.object({
  fcmToken: z.string().min(1, 'FCM token is required'),
  deviceType: z.string().optional().default('web')
});

export const googleAuthSchema = z.object({
  idToken: z.string().min(1, 'Firebase ID token is required'),
  fcmToken: z.string().optional(),
  deviceType: z.string().optional().default('web')
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters long')
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type FcmTokenInput = z.infer<typeof fcmTokenSchema>;
export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;
