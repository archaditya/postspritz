import { query } from '../../db/pool';
import { Notification } from '@pushpost/shared-types';

export class NotificationsRepository {
  async listNotifications(userId: string, page = 1, limit = 20, unreadOnly = false) {
    const offset = (page - 1) * limit;
    let whereClause = 'WHERE user_id = $1';
    if (unreadOnly) {
      whereClause += ' AND read = FALSE';
    }

    const countRes = await query(`SELECT COUNT(*) as total FROM notifications ${whereClause}`, [userId]);
    const total = parseInt(countRes.rows[0].total, 10);

    const rowsRes = await query<Notification>(
      `SELECT * FROM notifications ${whereClause} ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return {
      notifications: rowsRes.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async markAsRead(id: string, userId: string): Promise<boolean> {
    const res = await query(
      `UPDATE notifications SET read = TRUE, read_at = NOW() WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
    return (res.rowCount ?? 0) > 0;
  }

  async markAllAsRead(userId: string): Promise<void> {
    await query(
      `UPDATE notifications SET read = TRUE, read_at = NOW() WHERE user_id = $1 AND read = FALSE`,
      [userId]
    );
  }

  async getUnreadCount(userId: string): Promise<number> {
    const res = await query(
      `SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND read = FALSE`,
      [userId]
    );
    return parseInt(res.rows[0].count, 10);
  }
}
