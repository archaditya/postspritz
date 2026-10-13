import { query } from '../../db/pool';
import { publisherQueue, notificationQueue, tokenRefreshQueue, cleanupQueue, subscriptionQueue } from '../../config/bullmq';
import { redis } from '../../config/redis';
import { firebaseService } from '../../services/firebase.service';
import { AppError } from '../../middlewares/errorHandler.middleware';
import { processExpiredSubscriptions } from '../../workers/subscription-expiry.worker';

export class AdminService {
  async listUsers(page = 1, limit = 20, search?: string) {
    const offset = (page - 1) * limit;
    let whereClause = '';
    const values: any[] = [];
    if (search) {
      whereClause = 'WHERE email ILIKE $1 OR name ILIKE $1';
      values.push(`%${search}%`);
    }

    const countRes = await query(`SELECT COUNT(*) as total FROM users ${whereClause}`, values);
    const total = parseInt(countRes.rows[0].total, 10);

    const usersRes = await query(
      `SELECT u.id, u.email, u.name, u.role, u.status, u.email_verified, u.wallet_balance_paise, u.created_at,
              s.status as subscription_status, p.name as plan_name,
              COALESCE((SELECT COUNT(*) FROM posts WHERE user_id = u.id AND deleted_at IS NULL), 0)::int as total_posts,
              COALESCE((SELECT COUNT(*) FROM social_accounts WHERE user_id = u.id AND deleted_at IS NULL), 0)::int as total_channels,
              COALESCE((SELECT json_agg(json_build_object('platform', sa.platform, 'username', sa.platform_username, 'status', sa.status)) FROM social_accounts sa WHERE sa.user_id = u.id AND sa.deleted_at IS NULL), '[]'::json) as connected_channels,
              COALESCE((SELECT SUM(tokens_input + tokens_output) FROM ai_generation_logs WHERE user_id = u.id), 0)::int as ai_tokens_used
       FROM users u
       LEFT JOIN subscriptions s ON s.user_id = u.id AND s.status = 'active'
       LEFT JOIN plans p ON p.id = s.plan_id
       ${whereClause}
       ORDER BY u.created_at DESC
       LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, limit, offset]
    );

    return {
      users: usersRes.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getUserDetail(userId: string) {
    const userRes = await query(
      `SELECT u.id, u.email, u.name, u.role, u.status, u.email_verified, u.wallet_balance_paise,
              u.preferences, u.ai_config, u.created_at, u.updated_at,
              s.status as subscription_status, s.billing_cycle, s.current_period_end,
              p.name as plan_name, p.display_name as plan_display_name
       FROM users u
       LEFT JOIN subscriptions s ON s.user_id = u.id AND s.status = 'active'
       LEFT JOIN plans p ON p.id = s.plan_id
       WHERE u.id = $1`,
      [userId]
    );

    if (!userRes.rows[0]) {
      throw new AppError('User not found', 404);
    }

    const [accountsRes, postsRes, transactionsRes, fcmRes] = await Promise.all([
      query(`SELECT id, platform, platform_username, account_name, avatar_url, status, created_at FROM social_accounts WHERE user_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC`, [userId]),
      query(`SELECT id, caption, status, scheduled_at, published_at, created_at FROM posts WHERE user_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 10`, [userId]),
      query(`SELECT id, amount_paise, type, balance_after_paise, description, created_at FROM transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10`, [userId]),
      query(`SELECT id, device_type, user_agent, created_at FROM user_fcm_tokens WHERE user_id = $1 ORDER BY updated_at DESC`, [userId])
    ]);

    return {
      user: userRes.rows[0],
      socialAccounts: accountsRes.rows,
      recentPosts: postsRes.rows,
      transactions: transactionsRes.rows,
      fcmDevices: fcmRes.rows
    };
  }

  async updateUserStatus(userId: string, status: 'active' | 'suspended' | 'deactivated') {
    const res = await query(
      `UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, status`,
      [status, userId]
    );
    if (!res.rows[0]) {
      throw new AppError('User not found', 404);
    }
    return res.rows[0];
  }

  async getQueueStats() {
    const [pubCounts, notifCounts, refreshCounts, cleanupCounts, subCounts] = await Promise.all([
      publisherQueue.getJobCounts('active', 'completed', 'failed', 'delayed', 'waiting'),
      notificationQueue.getJobCounts('active', 'completed', 'failed', 'delayed', 'waiting'),
      tokenRefreshQueue.getJobCounts('active', 'completed', 'failed', 'delayed', 'waiting'),
      cleanupQueue.getJobCounts('active', 'completed', 'failed', 'delayed', 'waiting'),
      subscriptionQueue.getJobCounts('active', 'completed', 'failed', 'delayed', 'waiting')
    ]);

    return {
      publisher: pubCounts,
      notifications: notifCounts,
      tokenRefresh: refreshCounts,
      cleanup: cleanupCounts,
      subscriptions: subCounts
    };
  }

  async getSystemStats() {
    const [
      usersCountRes,
      activeUsersRes,
      postsCountRes,
      publishedPostsRes,
      accountsCountRes,
      aiLogsRes,
      fcmDevicesRes
    ] = await Promise.all([
      query(`SELECT COUNT(*) as total FROM users WHERE deleted_at IS NULL`),
      query(`SELECT COUNT(*) as total FROM users WHERE status = 'active' AND deleted_at IS NULL`),
      query(`SELECT COUNT(*) as total FROM posts WHERE deleted_at IS NULL`),
      query(`SELECT COUNT(*) as total FROM posts WHERE status = 'published' AND deleted_at IS NULL`),
      query(`SELECT COUNT(*) as total FROM social_accounts WHERE deleted_at IS NULL`),
      query(`SELECT COUNT(*) as total_gens, COALESCE(SUM(tokens_input + tokens_output), 0) as total_tokens, COALESCE(SUM(estimated_cost_usd), 0) as total_cost FROM ai_generation_logs`),
      query(`SELECT COUNT(DISTINCT fcm_token) as total_devices, COUNT(DISTINCT user_id) as users_with_push FROM user_fcm_tokens`)
    ]);

    const queueStats = await this.getQueueStats();

    return {
      users: {
        total: parseInt(usersCountRes.rows[0]?.total || '0', 10),
        active: parseInt(activeUsersRes.rows[0]?.total || '0', 10)
      },
      posts: {
        total: parseInt(postsCountRes.rows[0]?.total || '0', 10),
        published: parseInt(publishedPostsRes.rows[0]?.total || '0', 10)
      },
      socialAccounts: {
        total: parseInt(accountsCountRes.rows[0]?.total || '0', 10)
      },
      aiUsage: {
        generations: parseInt(aiLogsRes.rows[0]?.total_gens || '0', 10),
        tokensConsumed: parseInt(aiLogsRes.rows[0]?.total_tokens || '0', 10),
        estimatedCostUsd: parseFloat(aiLogsRes.rows[0]?.total_cost || '0')
      },
      pushNotifications: {
        registeredDevices: parseInt(fcmDevicesRes.rows[0]?.total_devices || '0', 10),
        usersSubscribed: parseInt(fcmDevicesRes.rows[0]?.users_with_push || '0', 10)
      },
      queues: queueStats
    };
  }

  async broadcastNotification(input: {
    title: string;
    body: string;
    type?: string;
    targetRole?: string;
    targetPlan?: string;
    channel?: 'both' | 'push' | 'in_app';
    actionUrl?: string;
  }) {
    const {
      title,
      body,
      type = 'promotional',
      targetRole,
      targetPlan,
      channel = 'both',
      actionUrl = '/dashboard'
    } = input;

    // Filter recipients
    const conditions: string[] = ['u.deleted_at IS NULL', "u.status = 'active'"];
    const params: any[] = [];

    if (targetRole && targetRole !== 'all') {
      params.push(targetRole);
      conditions.push(`u.role = $${params.length}`);
    }

    if (targetPlan && targetPlan !== 'all') {
      params.push(targetPlan);
      conditions.push(`p.name = $${params.length}`);
    }

    const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const usersRes = await query<{ id: string; email: string }>(
      `SELECT DISTINCT u.id, u.email
       FROM users u
       LEFT JOIN subscriptions s ON s.user_id = u.id AND s.status = 'active'
       LEFT JOIN plans p ON p.id = s.plan_id
       ${whereSql}`,
      params
    );

    const targetUserIds = usersRes.rows.map((u) => u.id);

    let inAppInserted = 0;
    if (channel === 'both' || channel === 'in_app') {
      if (targetUserIds.length > 0) {
        // Bulk insert in-app notifications
        const insertRes = await query(
          `INSERT INTO notifications (user_id, type, title, body, action_url, channels)
           SELECT u.id, $1, $2, $3, $4, ARRAY['inapp']
           FROM users u
           WHERE u.id = ANY($5::uuid[])
           RETURNING id`,
          [type, title, body, actionUrl, targetUserIds]
        );
        inAppInserted = insertRes.rowCount || 0;

        // Publish live SSE update for active connected tabs
        for (const userId of targetUserIds) {
          redis.publish(
            `notifications:${userId}`,
            JSON.stringify({
              type,
              title,
              body,
              actionUrl,
              created_at: new Date().toISOString()
            })
          ).catch(() => {});
        }
      }
    }

    let fcmResult = { successCount: 0, failureCount: 0, totalTokens: 0 };
    if (channel === 'both' || channel === 'push') {
      fcmResult = await firebaseService.sendBroadcastPush(
        {
          title,
          body,
          clickUrl: actionUrl,
          data: { type, click_action: actionUrl }
        },
        targetUserIds
      );
    }

    return {
      success: true,
      recipients: targetUserIds.length,
      inAppDelivered: inAppInserted,
      pushDispatched: fcmResult.totalTokens,
      fcmSuccess: fcmResult.successCount
    };
  }

  async getAuditLogs(page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    const countRes = await query(`SELECT COUNT(*) as total FROM audit_logs`);
    const total = parseInt(countRes.rows[0].total, 10);

    const rowsRes = await query(
      `SELECT a.*, u.email as user_email
       FROM audit_logs a
       LEFT JOIN users u ON u.id = a.user_id
       ORDER BY a.created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return {
      logs: rowsRes.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getPlans() {
    const res = await query(
      `SELECT id, name, display_name, description, price_monthly_paise, price_yearly_paise,
              currency, max_social_accounts, max_posts_per_month, max_scheduled_posts,
              max_ai_generations, max_ai_images, max_media_storage_mb, features, is_active, sort_order,
              COALESCE((SELECT COUNT(*) FROM subscriptions s WHERE s.plan_id = plans.id AND s.status = 'active'), 0)::int as active_subscribers
       FROM plans
       WHERE is_active = TRUE
       ORDER BY sort_order ASC`
    );
    return res.rows;
  }

  async assignUserPlan(params: {
    adminUserId: string;
    targetUserId: string;
    planNameOrId: string;
    billingCycle?: 'monthly' | 'yearly';
  }) {
    const { adminUserId, targetUserId, planNameOrId, billingCycle = 'monthly' } = params;

    // 1. Verify target user
    const userRes = await query(`SELECT id, email, name, role FROM users WHERE id = $1 AND deleted_at IS NULL`, [targetUserId]);
    const user = userRes.rows[0];
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // 2. Verify target plan
    const planRes = await query(
      `SELECT * FROM plans WHERE (id::text = $1 OR name = $1) AND is_active = TRUE LIMIT 1`,
      [planNameOrId]
    );
    const plan = planRes.rows[0];
    if (!plan) {
      throw new AppError(`Plan '${planNameOrId}' not found`, 404);
    }

    // 3. Cancel existing active subscriptions
    await query(
      `UPDATE subscriptions
       SET status = 'cancelled', cancel_reason = 'Superseded by administrative package assignment', updated_at = NOW()
       WHERE user_id = $1 AND status IN ('active', 'trialing') AND deleted_at IS NULL`,
      [targetUserId]
    );

    // 4. Calculate period end
    const periodDays = billingCycle === 'yearly' ? 365 : 30;
    const periodEnd = new Date(Date.now() + periodDays * 24 * 60 * 60 * 1000);
    const subId = `sub_admin_${Date.now().toString(36)}`;

    // 5. Insert new active subscription
    const subRes = await query(
      `INSERT INTO subscriptions (
         user_id, plan_id, payment_gateway, gateway_subscription_id,
         status, billing_cycle, current_period_start, current_period_end
       ) VALUES ($1, $2, 'cashfree', $3, 'active', $4, NOW(), $5)
       RETURNING *`,
      [targetUserId, plan.id, subId, billingCycle, periodEnd]
    );

    // 6. Reset usage counters for the user
    await query(
      `UPDATE users
       SET usage = jsonb_set(
             COALESCE(usage, '{"posts_this_month": 0, "ai_generations_this_month": 0, "ai_images_this_month": 0}'::jsonb),
             '{posts_this_month}', '0'::jsonb
           ),
           updated_at = NOW()
       WHERE id = $1`,
      [targetUserId]
    );

    // 7. Record security audit log
    await query(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, metadata)
       VALUES ($1, 'ASSIGN_PACKAGE', 'USER_SUBSCRIPTION', $2, $3)`,
      [
        adminUserId,
        subRes.rows[0].id,
        JSON.stringify({
          target_user_id: targetUserId,
          target_email: user.email,
          assigned_plan: plan.name,
          plan_display_name: plan.display_name,
          billing_cycle: billingCycle,
          max_posts_per_month: plan.max_posts_per_month,
          max_social_accounts: plan.max_social_accounts
        })
      ]
    );

    return {
      success: true,
      user: { id: user.id, email: user.email, name: user.name },
      plan: {
        id: plan.id,
        name: plan.name,
        display_name: plan.display_name,
        max_posts_per_month: plan.max_posts_per_month,
        max_social_accounts: plan.max_social_accounts,
        max_ai_generations: plan.max_ai_generations,
        max_ai_images: plan.max_ai_images
      },
      subscription: subRes.rows[0]
    };
  }

  async triggerSubscriptionExpiryCheck() {
    const result = await processExpiredSubscriptions();
    return result;
  }
}
