import { query } from '../../db/pool';
import { Media, MediaStatus } from '@pushpost/shared-types';

export class MediaRepository {
  async createMedia(data: {
    userId: string;
    originalFilename: string;
    mimeType: string;
    fileSizeBytes: number;
    storageKey: string;
    storageUrl: string;
    width?: number;
    height?: number;
    durationSeconds?: number;
    thumbnailUrl?: string;
  }): Promise<Media> {
    const res = await query<Media>(
      `INSERT INTO media (
        user_id, original_filename, mime_type, file_size_bytes, storage_key, storage_url,
        width, height, duration_seconds, thumbnail_url, status, deleted_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'ready', NULL)
      RETURNING *`,
      [
        data.userId,
        data.originalFilename,
        data.mimeType,
        data.fileSizeBytes,
        data.storageKey,
        data.storageUrl,
        data.width || null,
        data.height || null,
        data.durationSeconds || null,
        data.thumbnailUrl || null
      ]
    );
    return res.rows[0];
  }

  async listUserMedia(params: { userId: string; page?: number; limit?: number; search?: string; mimeType?: string }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const offset = (page - 1) * limit;

    const conditions: string[] = ['user_id = $1', 'deleted_at IS NULL'];
    const values: any[] = [params.userId];
    let idx = 2;

    if (params.mimeType) {
      conditions.push(`mime_type LIKE $${idx++}`);
      values.push(`${params.mimeType}%`);
    }

    if (params.search) {
      conditions.push(`original_filename ILIKE $${idx++}`);
      values.push(`%${params.search}%`);
    }

    const whereClause = conditions.join(' AND ');
    const countRes = await query(`SELECT COUNT(*) as total FROM media WHERE ${whereClause}`, values);
    const total = parseInt(countRes.rows[0].total, 10);

    values.push(limit, offset);
    const rowsRes = await query<Media>(
      `SELECT * FROM media WHERE ${whereClause} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx}`,
      values
    );

    return {
      media: rowsRes.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getMediaById(id: string, userId: string): Promise<Media | null> {
    const res = await query<Media>(`SELECT * FROM media WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL LIMIT 1`, [id, userId]);
    return res.rows[0] || null;
  }

  async deleteMedia(id: string, userId: string): Promise<boolean> {
    const res = await query(`UPDATE media SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`, [id, userId]);
    return (res.rowCount ?? 0) > 0;
  }
}
