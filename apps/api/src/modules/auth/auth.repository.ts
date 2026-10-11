import { query } from '../../db/pool';
import { User } from '@pushpost/shared-types';

export class AuthRepository {
  async findByEmail(email: string): Promise<any | null> {
    const res = await query(
      `SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL LIMIT 1`,
      [email.toLowerCase().trim()]
    );
    return res.rows[0] || null;
  }

  async findById(id: string): Promise<any | null> {
    const res = await query(
      `SELECT id, email, name, avatar_url, role, status, email_verified, preferences, notification_settings, created_at, updated_at
       FROM users WHERE id = $1 AND deleted_at IS NULL LIMIT 1`,
      [id]
    );
    return res.rows[0] || null;
  }

  async findWithPasswordById(id: string): Promise<any | null> {
    const res = await query(
      `SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL LIMIT 1`,
      [id]
    );
    return res.rows[0] || null;
  }

  async createUser(data: {
    email: string;
    name?: string | null;
    passwordHash: string;
    emailVerifyToken?: string;
    emailVerifyExpires?: Date;
  }): Promise<User> {
    const res = await query<User>(
      `INSERT INTO users (
        email, name, password_hash, email_verify_token, email_verify_expires
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, name, avatar_url, role, status, email_verified, preferences, notification_settings, created_at, updated_at`,
      [
        data.email.toLowerCase().trim(),
        data.name || null,
        data.passwordHash,
        data.emailVerifyToken || null,
        data.emailVerifyExpires || null
      ]
    );
    return res.rows[0];
  }

  async setResetToken(userId: string, token: string, expires: Date): Promise<void> {
    await query(
      `UPDATE users SET password_reset_token = $1, password_reset_expires = $2 WHERE id = $3`,
      [token, expires, userId]
    );
  }

  async findByResetToken(token: string): Promise<any | null> {
    const res = await query(
      `SELECT * FROM users WHERE password_reset_token = $1 AND password_reset_expires > NOW() LIMIT 1`,
      [token]
    );
    return res.rows[0] || null;
  }

  async updatePassword(userId: string, newHash: string): Promise<void> {
    await query(
      `UPDATE users SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL, updated_at = NOW() WHERE id = $2`,
      [newHash, userId]
    );
  }

  async findByVerifyToken(token: string): Promise<any | null> {
    const res = await query(
      `SELECT * FROM users WHERE email_verify_token = $1 AND email_verify_expires > NOW() LIMIT 1`,
      [token]
    );
    return res.rows[0] || null;
  }

  async markEmailVerified(userId: string): Promise<void> {
    await query(
      `UPDATE users SET email_verified = TRUE, email_verified_at = NOW(), email_verify_token = NULL, email_verify_expires = NULL, updated_at = NOW() WHERE id = $1`,
      [userId]
    );
  }
}
