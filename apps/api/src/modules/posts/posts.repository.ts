import { query, withTransaction } from '../../db/pool';
import { Post, PostStatus, PostTarget, PostTargetStatus, SocialPlatform } from '@pushpost/shared-types';

export class PostsRepository {
  async createPost(data: {
    userId: string;
    content: string;
    status: PostStatus;
    scheduledAt?: Date | null;
    mediaIds?: string[];
    aiGenerated?: boolean;
    aiMetadata?: any;
  }): Promise<Post> {
    const res = await query<Post>(
      `INSERT INTO posts (
        user_id, content, status, scheduled_at, media_ids, ai_generated, ai_metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        data.userId,
        data.content,
        data.status,
        data.scheduledAt || null,
        data.mediaIds || [],
        data.aiGenerated || false,
        data.aiMetadata ? JSON.stringify(data.aiMetadata) : null
      ]
    );
    return res.rows[0];
  }

  async createPostTargets(targets: {
    postId: string;
    socialAccountId: string;
    platform: SocialPlatform;
    costIncurred?: number;
  }[]): Promise<PostTarget[]> {
    const results: PostTarget[] = [];
    for (const t of targets) {
      const res = await query<PostTarget>(
        `INSERT INTO post_targets (
          post_id, social_account_id, platform, status, cost_incurred
        ) VALUES ($1, $2, $3, 'pending', $4)
        RETURNING *`,
        [t.postId, t.socialAccountId, t.platform, t.costIncurred || 0]
      );
      results.push(res.rows[0]);
    }
    return results;
  }

  async getPostById(postId: string, userId: string): Promise<any | null> {
    const postRes = await query(
      `SELECT * FROM posts WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL LIMIT 1`,
      [postId, userId]
    );
    if (!postRes.rows[0]) return null;

    const targetsRes = await query(
      `SELECT pt.*, sa.account_name, sa.platform_username, sa.avatar_url
       FROM post_targets pt
       JOIN social_accounts sa ON sa.id = pt.social_account_id
       WHERE pt.post_id = $1 AND pt.deleted_at IS NULL`,
      [postId]
    );

    return {
      ...postRes.rows[0],
      targets: targetsRes.rows
    };
  }

  async listPosts(params: {
    userId: string;
    page: number;
    limit: number;
    status?: PostStatus;
    platform?: SocialPlatform;
    search?: string;
    startDate?: string;
    endDate?: string;
    aiGenerated?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const offset = (params.page - 1) * params.limit;
    const conditions: string[] = ['p.user_id = $1', 'p.deleted_at IS NULL'];
    const values: any[] = [params.userId];
    let idx = 2;

    if (params.status) {
      conditions.push(`p.status = $${idx++}`);
      values.push(params.status);
    }

    if (params.platform) {
      conditions.push(
        `EXISTS (SELECT 1 FROM post_targets pt WHERE pt.post_id = p.id AND pt.platform = $${idx++} AND pt.deleted_at IS NULL)`
      );
      values.push(params.platform);
    }

    // Multi-Field Search: Searches across post text, target platform, connected account name/handle, and AI topic tags
    if (params.search) {
      conditions.push(`(
        p.content ILIKE $${idx}
        OR p.ai_metadata::text ILIKE $${idx}
        OR EXISTS (
          SELECT 1 FROM post_targets pt
          LEFT JOIN social_accounts sa ON sa.id = pt.social_account_id
          WHERE pt.post_id = p.id
            AND pt.deleted_at IS NULL
            AND (
              pt.platform::text ILIKE $${idx}
              OR sa.account_name ILIKE $${idx}
              OR sa.platform_username ILIKE $${idx}
            )
        )
      )`);
      values.push(`%${params.search}%`);
      idx++;
    }

    if (params.startDate) {
      conditions.push(`COALESCE(p.scheduled_at, p.created_at) >= $${idx++}::timestamptz`);
      values.push(params.startDate);
    }

    if (params.endDate) {
      conditions.push(`COALESCE(p.scheduled_at, p.created_at) <= $${idx++}::timestamptz`);
      values.push(params.endDate);
    }

    if (typeof params.aiGenerated === 'boolean') {
      conditions.push(`p.ai_generated = $${idx++}`);
      values.push(params.aiGenerated);
    }

    const whereClause = conditions.join(' AND ');

    // Total Count
    const countRes = await query(
      `SELECT COUNT(*) as total FROM posts p WHERE ${whereClause}`,
      values
    );
    const total = parseInt(countRes.rows[0].total, 10);

    // Whitelist Sort Column
    const allowedSortColumns: Record<string, string> = {
      created_at: 'p.created_at',
      scheduled_at: 'p.scheduled_at',
      updated_at: 'p.updated_at',
      published_at: 'p.published_at'
    };
    const sortCol = allowedSortColumns[params.sortBy || 'created_at'] || 'p.created_at';
    const sortDir = params.sortOrder === 'asc' ? 'ASC' : 'DESC';

    values.push(params.limit, offset);
    const rowsRes = await query(
      `SELECT p.*,
              COALESCE(
                json_agg(
                  json_build_object(
                    'id', pt.id,
                    'platform', pt.platform,
                    'status', pt.status,
                    'platform_post_url', pt.platform_post_url,
                    'cost_incurred', pt.cost_incurred,
                    'account_name', sa.account_name,
                    'platform_username', sa.platform_username,
                    'avatar_url', sa.avatar_url
                  )
                ) FILTER (WHERE pt.id IS NOT NULL), '[]'
              ) as targets
       FROM posts p
       LEFT JOIN post_targets pt ON pt.post_id = p.id AND pt.deleted_at IS NULL
       LEFT JOIN social_accounts sa ON sa.id = pt.social_account_id
       WHERE ${whereClause}
       GROUP BY p.id
       ORDER BY ${sortCol} ${sortDir} NULLS LAST
       LIMIT $${idx++} OFFSET $${idx}`,
      values
    );

    return {
      posts: rowsRes.rows,
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit)
    };
  }

  async updatePostStatus(postId: string, status: PostStatus, publishedAt?: Date) {
    await query(
      `UPDATE posts SET status = $1, published_at = $2, updated_at = NOW() WHERE id = $3 AND deleted_at IS NULL`,
      [status, publishedAt || null, postId]
    );
  }

  async deletePost(postId: string, userId: string): Promise<boolean> {
    return withTransaction(async (client) => {
      const res = await client.query(
        `UPDATE posts SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL RETURNING id`,
        [postId, userId]
      );
      if ((res.rowCount ?? 0) === 0) return false;

      await client.query(
        `UPDATE post_targets SET deleted_at = NOW(), updated_at = NOW() WHERE post_id = $1 AND deleted_at IS NULL`,
        [postId]
      );
      return true;
    });
  }
}
