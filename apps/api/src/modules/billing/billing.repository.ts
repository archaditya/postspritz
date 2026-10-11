import { query, withTransaction } from '../../db/pool';
import { Plan, Subscription, SubscriptionStatus, BillingCycle } from '@pushpost/shared-types';

export class BillingRepository {
  async getPlans(): Promise<Plan[]> {
    const res = await query<Plan>(
      `SELECT * FROM plans WHERE is_active = TRUE ORDER BY sort_order ASC`
    );
    return res.rows;
  }

  async getPlanById(planId: string): Promise<Plan | null> {
    const res = await query<Plan>(
      `SELECT * FROM plans WHERE id = $1 LIMIT 1`,
      [planId]
    );
    return res.rows[0] || null;
  }

  async getActiveSubscription(userId: string): Promise<any | null> {
    const res = await query(
      `SELECT s.*, p.name as plan_name, p.display_name as plan_display_name,
              p.features as plan_features, p.max_ai_images, p.max_posts_per_month
       FROM subscriptions s
       JOIN plans p ON p.id = s.plan_id
       WHERE s.user_id = $1 AND s.status IN ('active', 'trialing', 'past_due') AND s.deleted_at IS NULL
       ORDER BY s.created_at DESC LIMIT 1`,
      [userId]
    );
    return res.rows[0] || null;
  }

  /**
   * Atomic Subscription Activation Transaction:
   * 1. Locks user row FOR UPDATE.
   * 2. Supersedes previous active subscription(s).
   * 3. Creates new active subscription record.
   * 4. Updates user's plan_id and resets monthly quotas (posts_this_month = 0, ai_images_this_month = 0).
   * 5. Generates official tax invoice with 18% GST line items.
   * 6. Records ledger entry in transactions table.
   * 7. Records security audit log entry.
   */
  async activateSubscriptionTransaction(data: {
    userId: string;
    planId: string;
    paymentGateway: string;
    gatewaySubscriptionId: string;
    billingCycle: BillingCycle;
    gatewayPaymentId?: string;
  }): Promise<{ subscription: Subscription; invoiceId: string }> {
    return withTransaction(async (client) => {
      // 1. Lock user row
      const userRes = await client.query(
        `SELECT id, email, plan_id, wallet_balance_paise FROM users WHERE id = $1 FOR UPDATE`,
        [data.userId]
      );
      if (userRes.rowCount === 0) {
        throw new Error(`User ${data.userId} not found`);
      }

      // 2. Fetch plan details
      const planRes = await client.query<Plan>(
        `SELECT * FROM plans WHERE id = $1 AND is_active = TRUE`,
        [data.planId]
      );
      const plan = planRes.rows[0];
      if (!plan) {
        throw new Error(`Plan ${data.planId} not found`);
      }

      // 3. Supersede previous active subscription
      await client.query(
        `UPDATE subscriptions
         SET status = 'cancelled', cancel_reason = 'Superseded by new subscription', updated_at = NOW()
         WHERE user_id = $1 AND status IN ('active', 'trialing') AND deleted_at IS NULL`,
        [data.userId]
      );

      // 4. Calculate period end
      const periodDays = data.billingCycle === BillingCycle.YEARLY ? 365 : 30;
      const periodEnd = new Date(Date.now() + periodDays * 24 * 60 * 60 * 1000);

      // 5. Insert new subscription
      const subRes = await client.query<Subscription>(
        `INSERT INTO subscriptions (
          user_id, plan_id, payment_gateway, gateway_subscription_id,
          status, billing_cycle, current_period_start, current_period_end
        ) VALUES ($1, $2, $3, $4, 'active', $5, NOW(), $6)
        RETURNING *`,
        [
          data.userId,
          data.planId,
          data.paymentGateway,
          data.gatewaySubscriptionId,
          data.billingCycle,
          periodEnd
        ]
      );
      const sub = subRes.rows[0];

      // 6. Reset usage counters and update user's plan_id
      await client.query(
        `UPDATE users
         SET plan_id = $1, posts_this_month = 0, ai_images_this_month = 0, updated_at = NOW()
         WHERE id = $2`,
        [data.planId, data.userId]
      );

      // 7. Calculate plan cost in paise & 18% GST tax invoice
      const planPricePaise = data.billingCycle === BillingCycle.YEARLY
        ? (plan.price_yearly_paise || plan.price_monthly_paise * 10)
        : plan.price_monthly_paise;

      const taxPaise = Math.round(planPricePaise * 0.18);
      const totalPaise = planPricePaise + taxPaise;
      const invNumber = `INV-${Date.now().toString(36).toUpperCase()}`;

      const invRes = await client.query(
        `INSERT INTO invoices (
          user_id, subscription_id, payment_gateway, gateway_payment_id,
          amount_paise, tax_paise, total_paise, currency, status, line_items, invoice_number, paid_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'INR', 'paid', $8, $9, NOW())
        RETURNING id`,
        [
          data.userId,
          sub.id,
          data.paymentGateway,
          data.gatewayPaymentId || data.gatewaySubscriptionId,
          planPricePaise,
          taxPaise,
          totalPaise,
          JSON.stringify([
            { description: `${plan.display_name} (${data.billingCycle})`, amount_paise: planPricePaise },
            { description: 'GST (18%)', amount_paise: taxPaise }
          ]),
          invNumber
        ]
      );

      // 8. Record in transactions ledger
      await client.query(
        `INSERT INTO transactions (
          user_id, amount_paise, type, balance_after_paise, description, reference_id
        ) VALUES (
          $1, $2, 'subscription_fee',
          $3,
          $4, $5
        )`,
        [
          data.userId,
          totalPaise,
          userRes.rows[0].wallet_balance_paise || '0',
          `Subscription activation: ${plan.display_name} (${data.billingCycle}) - Invoice ${invNumber}`,
          sub.id
        ]
      );

      // 9. Record in audit_logs inside transaction
      await client.query(
        `INSERT INTO audit_logs (
          user_id, action, resource_type, resource_id, details, created_at
        ) VALUES ($1, 'subscription.activated', 'subscription', $2, $3, NOW())`,
        [
          data.userId,
          sub.id,
          JSON.stringify({
            plan_id: data.planId,
            plan_name: plan.name,
            billing_cycle: data.billingCycle,
            invoice_number: invNumber,
            total_inr: (totalPaise / 100).toFixed(2)
          })
        ]
      );

      return { subscription: sub, invoiceId: invRes.rows[0].id };
    });
  }

  // Alias for backward compatibility
  async createSubscription(data: {
    userId: string;
    planId: string;
    paymentGateway: string;
    gatewaySubscriptionId: string;
    billingCycle: BillingCycle;
  }): Promise<Subscription> {
    const res = await this.activateSubscriptionTransaction(data);
    return res.subscription;
  }

  async updateSubscriptionStatus(subId: string, status: SubscriptionStatus) {
    await query(`UPDATE subscriptions SET status = $1, updated_at = NOW() WHERE id = $2 AND deleted_at IS NULL`, [status, subId]);
  }

  /**
   * Atomic Subscription Cancellation Transaction:
   * 1. Updates subscription cancellation status and period flag.
   * 2. If immediate cancellation, rolls user back to Free tier.
   * 3. Records audit log entry inside transaction.
   */
  async cancelSubscription(subId: string, reason?: string, cancelAtPeriodEnd = true): Promise<void> {
    return withTransaction(async (client) => {
      const subRes = await client.query(
        `SELECT id, user_id, plan_id FROM subscriptions WHERE id = $1 FOR UPDATE`,
        [subId]
      );
      if (subRes.rowCount === 0) {
        throw new Error(`Subscription ${subId} not found`);
      }
      const sub = subRes.rows[0];

      await client.query(
        `UPDATE subscriptions SET
          cancel_at_period_end = $1,
          cancel_reason = $2,
          cancelled_at = NOW(),
          status = CASE WHEN $1 = TRUE THEN status ELSE 'cancelled' END,
          updated_at = NOW()
         WHERE id = $3`,
        [cancelAtPeriodEnd, reason || null, subId]
      );

      if (!cancelAtPeriodEnd) {
        const freePlanRes = await client.query(`SELECT id FROM plans WHERE name = 'free' LIMIT 1`);
        const freePlanId = freePlanRes.rows[0]?.id;
        if (freePlanId) {
          await client.query(
            `UPDATE users SET plan_id = $1, updated_at = NOW() WHERE id = $2`,
            [freePlanId, sub.user_id]
          );
        }
      }

      await client.query(
        `INSERT INTO audit_logs (
          user_id, action, resource_type, resource_id, details, created_at
        ) VALUES ($1, 'subscription.cancelled', 'subscription', $2, $3, NOW())`,
        [
          sub.user_id,
          subId,
          JSON.stringify({ reason: reason || 'User requested cancellation', cancelAtPeriodEnd })
        ]
      );
    });
  }

  async createInvoice(data: {
    userId: string;
    subscriptionId?: string;
    paymentGateway: string;
    gatewayPaymentId?: string;
    amountPaise: number;
    taxPaise?: number;
    totalPaise?: number;
    currency?: string;
    status: 'paid' | 'failed' | 'pending';
    lineItems?: any[];
  }) {
    const invNumber = `INV-${Date.now().toString(36).toUpperCase()}`;
    const tax = data.taxPaise || Math.round(data.amountPaise * 0.18); // 18% GST standard
    const total = data.totalPaise || (data.amountPaise + tax);

    await query(
      `INSERT INTO invoices (
        user_id, subscription_id, payment_gateway, gateway_payment_id,
        amount_paise, tax_paise, total_paise, currency, status, line_items, invoice_number, paid_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CASE WHEN $9 = 'paid' THEN NOW() ELSE NULL END)`,
      [
        data.userId,
        data.subscriptionId || null,
        data.paymentGateway,
        data.gatewayPaymentId || null,
        data.amountPaise,
        tax,
        total,
        data.currency || 'INR',
        data.status,
        JSON.stringify(data.lineItems || []),
        invNumber
      ]
    );
  }

  async getInvoices(userId: string) {
    const res = await query(`SELECT * FROM invoices WHERE user_id = $1 ORDER BY created_at DESC`, [userId]);
    return res.rows;
  }

  async getTransactions(userId: string) {
    const res = await query(
      `SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [userId]
    );
    return res.rows;
  }

  async topupWallet(userId: string, amountPaise: number, description = 'Wallet fuel deposit') {
    return withTransaction(async (client) => {
      // 1. Lock user row & fetch balance
      const userRes = await client.query(
        `SELECT wallet_balance_paise FROM users WHERE id = $1 FOR UPDATE`,
        [userId]
      );
      const currentBalance = BigInt(userRes.rows[0]?.wallet_balance_paise || 0);
      const newBalance = currentBalance + BigInt(amountPaise);

      // 2. Update user wallet balance
      await client.query(
        `UPDATE users SET wallet_balance_paise = $1, updated_at = NOW() WHERE id = $2`,
        [newBalance.toString(), userId]
      );

      // 3. Record in ledger
      const txRes = await client.query(
        `INSERT INTO transactions (
          user_id, amount_paise, type, balance_after_paise, description
        ) VALUES ($1, $2, 'credit_deposit', $3, $4)
        RETURNING *`,
        [userId, amountPaise, newBalance.toString(), description]
      );

      return {
        transaction: txRes.rows[0],
        newBalancePaise: Number(newBalance)
      };
    });
  }

  async deductWallet(userId: string, amountPaise: number, description: string, referenceId?: string): Promise<{ success: boolean; newBalancePaise: number }> {
    return withTransaction(async (client) => {
      const userRes = await client.query(
        `SELECT wallet_balance_paise FROM users WHERE id = $1 FOR UPDATE`,
        [userId]
      );
      const currentBalance = BigInt(userRes.rows[0]?.wallet_balance_paise || 0);
      const debitAmount = BigInt(amountPaise);

      if (currentBalance < debitAmount) {
        throw new Error(
          `Insufficient wallet balance for X posting. Required: ₹${(amountPaise / 100).toFixed(2)}, Available: ₹${(Number(currentBalance) / 100).toFixed(2)}. Please recharge your wallet in Billing.`
        );
      }

      const newBalance = currentBalance - debitAmount;
      await client.query(
        `UPDATE users SET wallet_balance_paise = $1, updated_at = NOW() WHERE id = $2`,
        [newBalance.toString(), userId]
      );

      await client.query(
        `INSERT INTO transactions (
          user_id, amount_paise, type, balance_after_paise, description, reference_id
        ) VALUES ($1, $2, 'debit_x_post', $3, $4, $5)`,
        [userId, amountPaise, newBalance.toString(), description, referenceId || null]
      );

      return { success: true, newBalancePaise: Number(newBalance) };
    });
  }
}
