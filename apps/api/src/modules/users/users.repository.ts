import { query } from '../../db/pool';

export class UsersRepository {
  async getProfile(userId: string) {
    const res = await query(
      `SELECT u.id, u.email, u.name, u.avatar_url, u.avatar_url as profile_image_url,
              u.bio, u.company, u.phone, u.timezone, u.wallet_balance_paise,
              u.billing_address, u.gst_number, u.role, u.status, u.email_verified,
              u.preferences, u.notification_settings, u.ai_config, u.usage, u.created_at,
              s.id as subscription_id, s.status as subscription_status, s.billing_cycle,
              s.current_period_end, p.id as plan_id, p.name as plan_name, p.name as plan_slug,
              p.display_name as plan_display_name, p.features as plan_features,
              p.max_posts_per_month, p.max_social_accounts, p.max_scheduled_posts,
              p.max_ai_generations, p.max_ai_images
       FROM users u
       LEFT JOIN subscriptions s ON s.user_id = u.id AND s.status = 'active'
       LEFT JOIN plans p ON p.id = s.plan_id
       WHERE u.id = $1 AND u.deleted_at IS NULL LIMIT 1`,
      [userId]
    );
    return res.rows[0] || null;
  }

  async updateProfile(
    userId: string,
    data: {
      name?: string;
      fullName?: string;
      avatar_url?: string | null;
      profileImageUrl?: string | null;
      bio?: string;
      company?: string;
      phone?: string;
      timezone?: string;
      billing_address?: Record<string, any>;
      gst_number?: string;
    }
  ) {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    const resolvedName = data.fullName !== undefined ? data.fullName : data.name;
    if (resolvedName !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(resolvedName);
    }

    const resolvedAvatar = data.profileImageUrl !== undefined ? data.profileImageUrl : data.avatar_url;
    if (resolvedAvatar !== undefined) {
      fields.push(`avatar_url = $${idx++}`);
      values.push(resolvedAvatar);
    }

    if (data.bio !== undefined) {
      fields.push(`bio = $${idx++}`);
      values.push(data.bio);
    }
    if (data.company !== undefined) {
      fields.push(`company = $${idx++}`);
      values.push(data.company);
    }
    if (data.phone !== undefined) {
      fields.push(`phone = $${idx++}`);
      values.push(data.phone);
    }
    if (data.timezone !== undefined) {
      fields.push(`timezone = $${idx++}`);
      values.push(data.timezone);
    }
    if (data.billing_address !== undefined) {
      fields.push(`billing_address = $${idx++}`);
      values.push(JSON.stringify(data.billing_address));
    }
    if (data.gst_number !== undefined) {
      fields.push(`gst_number = $${idx++}`);
      values.push(data.gst_number);
    }

    if (fields.length === 0) return this.getProfile(userId);

    fields.push(`updated_at = NOW()`);
    values.push(userId);

    await query(`UPDATE users SET ${fields.join(', ')} WHERE id = $${idx}`, values);
    return this.getProfile(userId);
  }

  async getPasswordHash(userId: string): Promise<string | null> {
    const res = await query(`SELECT password_hash FROM users WHERE id = $1`, [userId]);
    return res.rows[0]?.password_hash || null;
  }

  async updatePasswordHash(userId: string, hash: string) {
    await query(`UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`, [hash, userId]);
  }

  async updateNotificationSettings(userId: string, settings: any) {
    await query(
      `UPDATE users SET notification_settings = notification_settings || $1::jsonb, updated_at = NOW() WHERE id = $2`,
      [JSON.stringify(settings), userId]
    );
    return this.getProfile(userId);
  }

  async updatePreferences(userId: string, preferences: any) {
    await query(
      `UPDATE users SET preferences = preferences || $1::jsonb, updated_at = NOW() WHERE id = $2`,
      [JSON.stringify(preferences), userId]
    );
    return this.getProfile(userId);
  }

  async updateAiConfig(userId: string, config: any) {
    await query(
      `UPDATE users SET ai_config = $1::jsonb, updated_at = NOW() WHERE id = $2`,
      [JSON.stringify(config), userId]
    );
    return this.getProfile(userId);
  }
}
