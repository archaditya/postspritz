import { query } from '../db/pool';
import { logger } from '../config/logger';

export interface AuditLogEntry {
  userId?: string | null;
  action: string;
  resourceType?: string | null;
  resourceId?: string | null;
  details?: Record<string, any> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export class AuditLogService {
  private static instance: AuditLogService;

  private constructor() {}

  public static getInstance(): AuditLogService {
    if (!AuditLogService.instance) {
      AuditLogService.instance = new AuditLogService();
    }
    return AuditLogService.instance;
  }

  /**
   * Records a user or system action in the audit_logs table.
   */
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      await query(
        `INSERT INTO audit_logs (
          user_id, action, resource_type, resource_id, details, ip_address, user_agent, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [
          entry.userId || null,
          entry.action,
          entry.resourceType || null,
          entry.resourceId || null,
          JSON.stringify(entry.details || {}),
          entry.ipAddress || null,
          entry.userAgent || null
        ]
      );
    } catch (err: any) {
      logger.error({ err: err.message, action: entry.action }, 'Failed to record audit log entry');
    }
  }

  /**
   * Fetches audit logs for a specific authenticated user with multi-field search and date filters.
   */
  async getUserLogs(userId: string, params?: {
    page?: number;
    limit?: number;
    search?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const offset = (page - 1) * limit;

    const conditions: string[] = ['user_id = $1'];
    const values: any[] = [userId];
    let idx = 2;

    if (params?.action) {
      conditions.push(`action ILIKE $${idx++}`);
      values.push(`%${params.action}%`);
    }

    if (params?.search) {
      conditions.push(`(
        action ILIKE $${idx}
        OR resource_type ILIKE $${idx}
        OR resource_id ILIKE $${idx}
        OR details::text ILIKE $${idx}
      )`);
      values.push(`%${params.search}%`);
      idx++;
    }

    if (params?.startDate) {
      conditions.push(`created_at >= $${idx++}::timestamptz`);
      values.push(params.startDate);
    }

    if (params?.endDate) {
      conditions.push(`created_at <= $${idx++}::timestamptz`);
      values.push(params.endDate);
    }

    const whereClause = conditions.join(' AND ');

    const countRes = await query(`SELECT COUNT(*) as total FROM audit_logs WHERE ${whereClause}`, values);
    const total = parseInt(countRes.rows[0].total, 10);

    values.push(limit, offset);
    const rowsRes = await query(
      `SELECT id, action, resource_type, resource_id, details, ip_address, created_at
       FROM audit_logs
       WHERE ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${idx++} OFFSET $${idx}`,
      values
    );

    return {
      logs: rowsRes.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Fetches platform-wide audit logs for admin console.
   */
  async getAdminLogs(page = 1, limit = 50, actionFilter?: string) {
    const offset = (page - 1) * limit;
    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (actionFilter) {
      conditions.push(`action ILIKE $${idx++}`);
      values.push(`%${actionFilter}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await query(`SELECT COUNT(*) as total FROM audit_logs ${whereClause}`, values);
    const total = parseInt(countRes.rows[0].total, 10);

    values.push(limit, offset);
    const rowsRes = await query(
      `SELECT a.id, a.user_id, u.email as user_email, u.name as user_name,
              a.action, a.resource_type, a.resource_id, a.details, a.ip_address, a.user_agent, a.created_at
       FROM audit_logs a
       LEFT JOIN users u ON u.id = a.user_id
       ${whereClause}
       ORDER BY a.created_at DESC
       LIMIT $${idx++} OFFSET $${idx}`,
      values
    );

    return {
      logs: rowsRes.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Purges logs older than the retention threshold (default 30 days).
   */
  async purgeOldLogs(retentionDays = 30): Promise<{ purgedAuditLogs: number; purgedAiLogs: number }> {
    const auditRes = await query(
      `DELETE FROM audit_logs WHERE created_at < NOW() - ($1 || ' days')::INTERVAL RETURNING id`,
      [retentionDays]
    );

    const aiRes = await query(
      `DELETE FROM ai_generation_logs WHERE created_at < NOW() - ($1 || ' days')::INTERVAL RETURNING id`,
      [retentionDays]
    );

    const result = {
      purgedAuditLogs: auditRes.rowCount || 0,
      purgedAiLogs: aiRes.rowCount || 0
    };

    logger.info(result, 'Purged expired 30-day logs from database');
    return result;
  }
}
