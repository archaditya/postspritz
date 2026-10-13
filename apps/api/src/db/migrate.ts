import fs from 'fs';
import path from 'path';
import { pool } from './pool';
import { logger } from '../config/logger';

async function migrate() {
  const client = await pool.connect();
  try {
    logger.info('Starting database migrations...');
    await client.query('BEGIN');

    // Create schema_migrations table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    let migrationsDir = path.join(__dirname, 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      const srcDir = path.join(__dirname, '../../src/db/migrations');
      if (fs.existsSync(srcDir)) {
        migrationsDir = srcDir;
      }
    }
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

    for (const file of files) {
      const res = await client.query('SELECT version FROM schema_migrations WHERE version = $1', [file]);
      if (res.rows.length === 0) {
        logger.info(`Applying migration: ${file}`);
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [file]);
        logger.info(`Successfully applied: ${file}`);
      } else {
        logger.debug(`Skipping already applied migration: ${file}`);
      }
    }

    await client.query('COMMIT');
    logger.info('All database migrations completed successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error({ error }, 'Migration failed, transaction rolled back.');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
