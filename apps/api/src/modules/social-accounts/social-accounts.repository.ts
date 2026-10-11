import { query } from '../../db/pool';
import { SocialAccount, SocialPlatform, AccountType, AccountStatus } from '@pushpost/shared-types';

export class SocialAccountsRepository {
  async findByUserId(userId: string): Promise<SocialAccount[]> {
    const res = await query<SocialAccount>(
      `SELECT id, user_id, platform, platform_user_id, platform_username, account_type,
              account_name, avatar_url, scopes, status, token_expires_at, metadata, created_at, updated_at
       FROM social_accounts
       WHERE user_id = $1 AND deleted_at IS NULL
       ORDER BY platform ASC, created_at DESC`,
      [userId]
    );
    return res.rows;
  }

  async findWithFilter(params: {
    userId: string;
    page?: number;
    limit?: number;
    search?: string;
    platform?: string;
    status?: string;
  }): Promise<{ accounts: SocialAccount[]; total: number; page: number; limit: number }> {
    const page = params.page || 1;
    const limit = params.limit || 50;
    const offset = (page - 1) * limit;

    const conditions: string[] = ['user_id = $1', 'deleted_at IS NULL'];
    const values: any[] = [params.userId];
    let idx = 2;

    if (params.platform) {
      conditions.push(`platform = $${idx++}`);
      values.push(params.platform);
    }

    if (params.status) {
      conditions.push(`status = $${idx++}`);
      values.push(params.status);
    }

    if (params.search) {
      conditions.push(`(account_name ILIKE $${idx} OR platform_username ILIKE $${idx})`);
      values.push(`%${params.search}%`);
      idx++;
    }

    const whereClause = conditions.join(' AND ');

    const countRes = await query(`SELECT COUNT(*) as total FROM social_accounts WHERE ${whereClause}`, values);
    const total = parseInt(countRes.rows[0].total, 10);

    values.push(limit, offset);
    const res = await query<SocialAccount>(
      `SELECT id, user_id, platform, platform_user_id, platform_username, account_type,
              account_name, avatar_url, scopes, status, token_expires_at, metadata, created_at, updated_at
       FROM social_accounts
       WHERE ${whereClause}
       ORDER BY platform ASC, created_at DESC
       LIMIT $${idx++} OFFSET $${idx}`,
      values
    );

    return { accounts: res.rows, total, page, limit };
  }

  async findByIdAndUser(id: string, userId: string): Promise<any | null> {
    const res = await query(
      `SELECT * FROM social_accounts WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL LIMIT 1`,
      [id, userId]
    );
    return res.rows[0] || null;
  }

  async upsertAccount(data: {
    userId: string;
    platform: SocialPlatform;
    platformUserId: string;
    platformUsername?: string | null;
    accountType: AccountType;
    accountName: string;
    avatarUrl?: string | null;
    accessTokenEnc: string;
    refreshTokenEnc?: string | null;
    tokenExpiresAt?: Date | null;
    scopes: string[];
    metadata?: Record<string, any>;
  }): Promise<SocialAccount> {
    const res = await query<SocialAccount>(
      `INSERT INTO social_accounts (
        user_id, platform, platform_user_id, platform_username, account_type,
        account_name, avatar_url, access_token_enc, refresh_token_enc,
        token_expires_at, scopes, status, metadata, deleted_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'connected', $12, NULL)
      ON CONFLICT (user_id, platform, platform_user_id) DO UPDATE SET
        platform_username = EXCLUDED.platform_username,
        account_name = EXCLUDED.account_name,
        avatar_url = EXCLUDED.avatar_url,
        access_token_enc = EXCLUDED.access_token_enc,
        refresh_token_enc = EXCLUDED.refresh_token_enc,
        token_expires_at = EXCLUDED.token_expires_at,
        scopes = EXCLUDED.scopes,
        status = 'connected',
        error_message = NULL,
        metadata = EXCLUDED.metadata,
        deleted_at = NULL,
        updated_at = NOW()
      RETURNING id, user_id, platform, platform_user_id, platform_username, account_type,
                account_name, avatar_url, scopes, status, token_expires_at, metadata, created_at, updated_at`,
      [
        data.userId,
        data.platform,
        data.platformUserId,
        data.platformUsername || null,
        data.accountType,
        data.accountName,
        data.avatarUrl || null,
        data.accessTokenEnc,
        data.refreshTokenEnc || null,
        data.tokenExpiresAt || null,
        data.scopes,
        JSON.stringify(data.metadata || {})
      ]
    );
    return res.rows[0];
  }

  async deleteAccount(id: string, userId: string): Promise<boolean> {
    const res = await query(
      `UPDATE social_accounts SET deleted_at = NOW(), status = 'revoked', updated_at = NOW() WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
      [id, userId]
    );
    return (res.rowCount ?? 0) > 0;
  }
}
