import bcrypt from 'bcryptjs';
import { pool } from '../pool';
import { logger } from '../../config/logger';

async function seed() {
  const client = await pool.connect();
  try {
    logger.info('Starting database seeding...');
    await client.query('BEGIN');

    // 1. Seed Plans
    const plans = [
      {
        name: 'free',
        display_name: 'Free Starter',
        description: 'For individuals exploring social media scheduling.',
        price_monthly_paise: 0,
        price_yearly_paise: 0,
        max_social_accounts: 3,
        max_posts_per_month: 30,
        max_scheduled_posts: 10,
        max_ai_generations: 20,
        max_ai_images: 0,
        max_media_storage_mb: 500,
        features: JSON.stringify({
          ai_content_generation: true,
          ai_image_generation: false,
          analytics: false,
          team_collaboration: false,
          content_calendar: true,
          paid_platforms: {
            x: { enabled: true, cost_per_post: 0.015, cost_with_url: 0.20 }
          }
        }),
        sort_order: 1
      },
      {
        name: 'starter',
        display_name: 'Creator Pro',
        description: 'For active creators looking to boost engagement and visuals.',
        price_monthly_paise: 99900, // ₹999 / mo
        price_yearly_paise: 999000,
        max_social_accounts: 10,
        max_posts_per_month: 200,
        max_scheduled_posts: 50,
        max_ai_generations: 150,
        max_ai_images: 20, // Max 20 images/mo
        max_media_storage_mb: 5000,
        features: JSON.stringify({
          ai_content_generation: true,
          ai_image_generation: true,
          analytics: true,
          team_collaboration: false,
          content_calendar: true,
          priority_support: true,
          paid_platforms: {
            x: { enabled: true, cost_per_post: 0.015, cost_with_url: 0.20 }
          }
        }),
        sort_order: 2
      },
      {
        name: 'pro',
        display_name: 'Agency & Teams',
        description: 'Full autonomy with high volume scheduling and multi-account posting.',
        price_monthly_paise: 299900, // ₹2999 / mo
        price_yearly_paise: 2999000,
        max_social_accounts: 30,
        max_posts_per_month: 1000,
        max_scheduled_posts: 500,
        max_ai_generations: 1000,
        max_ai_images: 100, // Max 100 images/mo
        max_media_storage_mb: 25000,
        features: JSON.stringify({
          ai_content_generation: true,
          ai_image_generation: true,
          analytics: true,
          team_collaboration: true,
          custom_ai_provider: true,
          priority_support: true,
          content_calendar: true,
          api_access: true,
          paid_platforms: {
            x: { enabled: true, cost_per_post: 0.015, cost_with_url: 0.20 }
          }
        }),
        sort_order: 3
      }
    ];

    for (const plan of plans) {
      await client.query(`
        INSERT INTO plans (
          name, display_name, description, price_monthly_paise, price_yearly_paise,
          max_social_accounts, max_posts_per_month, max_scheduled_posts, max_ai_generations,
          max_ai_images, max_media_storage_mb, features, sort_order
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (name) DO UPDATE SET
          display_name = EXCLUDED.display_name,
          description = EXCLUDED.description,
          price_monthly_paise = EXCLUDED.price_monthly_paise,
          price_yearly_paise = EXCLUDED.price_yearly_paise,
          max_social_accounts = EXCLUDED.max_social_accounts,
          max_posts_per_month = EXCLUDED.max_posts_per_month,
          max_scheduled_posts = EXCLUDED.max_scheduled_posts,
          max_ai_generations = EXCLUDED.max_ai_generations,
          max_ai_images = EXCLUDED.max_ai_images,
          max_media_storage_mb = EXCLUDED.max_media_storage_mb,
          features = EXCLUDED.features,
          sort_order = EXCLUDED.sort_order;
      `, [
        plan.name, plan.display_name, plan.description, plan.price_monthly_paise,
        plan.price_yearly_paise, plan.max_social_accounts, plan.max_posts_per_month,
        plan.max_scheduled_posts, plan.max_ai_generations, plan.max_ai_images,
        plan.max_media_storage_mb, plan.features, plan.sort_order
      ]);
    }

    // 2. Seed Superadmin User
    const adminEmail = 'admin@postspritz.com';
    const adminPassHash = await bcrypt.hash('PostSpritzAdmin@2026', 12);
    await client.query(`
      INSERT INTO users (
        email, name, password_hash, role, status, email_verified
      ) VALUES ($1, $2, $3, 'superadmin', 'active', TRUE)
      ON CONFLICT (email) DO NOTHING;
    `, [adminEmail, 'Super Administrator', adminPassHash]);

    await client.query('COMMIT');
    logger.info('Database seeding completed successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error({ error }, 'Database seeding failed.');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
