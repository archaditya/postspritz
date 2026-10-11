import { Pool, PoolClient } from 'pg';
import { env } from '../config/env';
import { logger } from '../config/logger';

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  min: env.DATABASE_POOL_MIN,
  max: env.DATABASE_POOL_MAX,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});

pool.on('connect', () => {
  logger.debug('PostgreSQL client acquired from pool');
});

pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected PostgreSQL pool error');
});

export const query = async <T = any>(text: string, params?: any[]): Promise<{ rows: T[]; rowCount: number | null }> => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  logger.debug({ text, duration, rows: res.rowCount }, 'Executed PostgreSQL query');
  return { rows: res.rows as T[], rowCount: res.rowCount };
};

/**
 * Executes a callback within a managed database transaction.
 * Automatically handles BEGIN, COMMIT, and ROLLBACK upon error.
 */
export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>,
  isolationLevel: 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE' = 'READ COMMITTED'
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query(`BEGIN TRANSACTION ISOLATION LEVEL ${isolationLevel}`);
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error({ error }, 'Database transaction rolled back due to error');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Health check verification for database connectivity.
 */
export async function checkDatabaseHealth(): Promise<{ status: 'healthy' | 'unhealthy'; latencyMs: number }> {
  const start = Date.now();
  try {
    await pool.query('SELECT 1');
    return { status: 'healthy', latencyMs: Date.now() - start };
  } catch {
    return { status: 'unhealthy', latencyMs: Date.now() - start };
  }
}
