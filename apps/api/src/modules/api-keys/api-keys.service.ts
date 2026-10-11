import crypto from 'crypto';
import { query } from '../../db/pool';
import { AppError } from '../../middlewares/errorHandler.middleware';

export class ApiKeysService {
  async createKey(userId: string, name: string, scopes: string[] = ['read', 'write']) {
    const rawKey = `pk_live_${crypto.randomBytes(24).toString('hex')}`;
    const keyPrefix = rawKey.slice(0, 12);
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

    const res = await query(
      `INSERT INTO api_keys (
        user_id, name, key_hash, key_prefix, scopes
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, key_prefix, scopes, created_at`,
      [userId, name, keyHash, keyPrefix, JSON.stringify(scopes)]
    );

    return {
      apiKey: rawKey, // Only shown once upon creation
      record: res.rows[0]
    };
  }

  async listKeys(userId: string) {
    const res = await query(
      `SELECT id, name, key_prefix, scopes, last_used_at, status, created_at
       FROM api_keys WHERE user_id = $1 AND status = 'active'
       ORDER BY created_at DESC`,
      [userId]
    );
    return res.rows;
  }

  async revokeKey(id: string, userId: string) {
    const res = await query(
      `UPDATE api_keys SET status = 'revoked', revoked_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, userId]
    );
    if (!res.rows[0]) {
      throw new AppError('API key not found', 404);
    }
    return { message: 'API key revoked successfully' };
  }
}
