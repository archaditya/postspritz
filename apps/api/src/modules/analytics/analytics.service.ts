import { query } from '../../db/pool';

export class AnalyticsService {
  async getOverview(userId: string) {
    // Total posts published, scheduled, failed
    const countsRes = await query(
      `SELECT
        COUNT(*) FILTER (WHERE status = 'published') as published_count,
        COUNT(*) FILTER (WHERE status = 'scheduled') as scheduled_count,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_count,
        COUNT(*) as total_count
       FROM posts WHERE user_id = $1`,
      [userId]
    );

    // Platform breakdown
    const platformsRes = await query(
      `SELECT pt.platform, COUNT(*) as post_count,
              SUM(pt.cost_incurred) as total_cost
       FROM post_targets pt
       JOIN posts p ON p.id = pt.post_id
       WHERE p.user_id = $1 AND pt.status = 'published'
       GROUP BY pt.platform`,
      [userId]
    );

    return {
      stats: countsRes.rows[0],
      platforms: platformsRes.rows
    };
  }

  async getRecentPerformance(userId: string) {
    const res = await query(
      `SELECT p.id, p.content, p.status, p.published_at,
              COALESCE(
                json_agg(
                  json_build_object(
                    'platform', pt.platform,
                    'status', pt.status,
                    'url', pt.platform_post_url,
                    'cost', pt.cost_incurred
                  )
                ) FILTER (WHERE pt.id IS NOT NULL), '[]'
              ) as targets
       FROM posts p
       LEFT JOIN post_targets pt ON pt.post_id = p.id
       WHERE p.user_id = $1 AND p.status IN ('published', 'partially_published')
       GROUP BY p.id
       ORDER BY p.published_at DESC LIMIT 10`,
      [userId]
    );
    return res.rows;
  }
}
