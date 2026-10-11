import { BillingRepository } from './billing.repository';
import { UsersRepository } from '../users/users.repository';
import { PaymentGatewayProvider } from './providers/payment-gateway.interface';
import { CashfreeProvider } from './providers/cashfree.provider';
import { RazorpayProvider } from './providers/razorpay.provider';
import { PaymentGateway, BillingCycle, SubscriptionStatus } from '@pushpost/shared-types';
import { redis } from '../../config/redis';
import { AppError } from '../../middlewares/errorHandler.middleware';
import { logger } from '../../config/logger';
import { env } from '../../config/env';

export class BillingService {
  private repo: BillingRepository;
  private usersRepo: UsersRepository;
  private providers: Map<PaymentGateway, PaymentGatewayProvider>;

  constructor() {
    this.repo = new BillingRepository();
    this.usersRepo = new UsersRepository();
    this.providers = new Map<PaymentGateway, PaymentGatewayProvider>([
      [PaymentGateway.CASHFREE, new CashfreeProvider()],
      [PaymentGateway.RAZORPAY, new RazorpayProvider()]
    ]);
  }

  getGateway(gateway?: PaymentGateway): PaymentGatewayProvider {
    const selected = gateway || (env.BILLING_GATEWAY_DEFAULT as PaymentGateway);
    const provider = this.providers.get(selected);
    if (!provider) {
      throw new AppError(`Unsupported payment gateway: ${selected}`, 400);
    }
    return provider;
  }

  async getPlans() {
    return this.repo.getPlans();
  }

  async getSubscription(userId: string) {
    const sub = await this.repo.getActiveSubscription(userId);
    if (!sub) {
      // Default free plan virtual subscription
      const plans = await this.repo.getPlans();
      const freePlan = plans.find(p => p.name === 'free') || plans[0];
      return {
        status: 'active',
        plan_name: 'free',
        plan_display_name: freePlan?.display_name || 'Free Plan',
        plan_features: freePlan?.features || {},
        max_ai_images: freePlan?.max_ai_images || 0,
        billing_cycle: 'monthly'
      };
    }
    return sub;
  }

  async checkout(userId: string, input: {
    planId: string;
    billingCycle?: BillingCycle;
    gateway?: PaymentGateway;
    provider?: string;
    customerPhone?: string;
  }) {
    const plan = await this.repo.getPlanById(input.planId);
    if (!plan) {
      throw new AppError('Plan not found', 404);
    }

    if (plan.name === 'free') {
      return { message: 'You are on the Free Plan. No payment required.' };
    }

    if (!process.env.CASHFREE_APP_ID && !process.env.RAZORPAY_KEY_ID) {
      throw new AppError('PostSpritz is currently in Early Access Free mode. Enjoy all features with complimentary free tier limits!', 400);
    }

    const user = await this.usersRepo.getProfile(userId);
    const selectedGateway = (input.gateway || (input.provider === 'razorpay' ? PaymentGateway.RAZORPAY : PaymentGateway.CASHFREE)) as PaymentGateway;
    const provider = this.getGateway(selectedGateway);
    const cycle = input.billingCycle || BillingCycle.MONTHLY;

    const gatewaySub = await provider.createSubscription({
      userId,
      customerEmail: user.email,
      customerPhone: input.customerPhone,
      planId: plan.id,
      gatewayPlanId: plan.gateway_plan_id || plan.name,
      billingCycle: cycle,
      returnUrl: `${env.WEB_BASE_URL}/dashboard/billing?status=success`
    });

    const sub = await this.repo.createSubscription({
      userId,
      planId: plan.id,
      paymentGateway: provider.providerName,
      gatewaySubscriptionId: gatewaySub.subscriptionId,
      billingCycle: cycle
    });

    logger.info({ userId, subId: sub.id, gateway: provider.providerName }, 'Subscription checkout initialized');

    return {
      subscription: sub,
      paymentLink: gatewaySub.paymentLink,
      sessionToken: gatewaySub.sessionToken
    };
  }

  async topupWallet(userId: string, amountInr: number) {
    if (amountInr <= 0) {
      throw new AppError('Top-up amount must be greater than zero', 400);
    }
    const amountPaise = Math.round(amountInr * 100);
    const result = await this.repo.topupWallet(userId, amountPaise, `Wallet fuel top-up of ₹${amountInr}`);

    // Create wallet receipt invoice
    await this.repo.createInvoice({
      userId,
      paymentGateway: 'cashfree',
      amountPaise,
      taxPaise: Math.round(amountPaise * 0.18),
      totalPaise: Math.round(amountPaise * 1.18),
      status: 'paid',
      lineItems: [{ description: 'X Tweet Fuel Deposit', amount_paise: amountPaise }]
    });

    return result;
  }

  /**
   * Deducts pass-through fee for X (Twitter) posting from user's fuel wallet balance.
   * X fee: $0.015 for basic tweet (~₹1.26), $0.20 for tweet with link (~₹16.80) at ₹84/USD.
   */
  async deductWalletForXPost(userId: string, postId: string, hasUrl: boolean) {
    const usdRate = 84; // INR per USD conversion reference
    const costUsd = hasUrl ? 0.20 : 0.015;
    const amountInr = costUsd * usdRate;
    const amountPaise = Math.round(amountInr * 100);

    const desc = hasUrl
      ? `X Pass-Through ($0.20 / ₹${amountInr.toFixed(2)}) - Link post #${postId}`
      : `X Pass-Through ($0.015 / ₹${amountInr.toFixed(2)}) - Text post #${postId}`;

    return this.repo.deductWallet(userId, amountPaise, desc, postId);
  }

  async getTransactions(userId: string) {
    return this.repo.getTransactions(userId);
  }

  /**
   * Proration Calculator: Computes unused days credit when upgrading/downgrading.
   */
  calculateProration(currentPeriodEnd: Date, monthlyPricePaise: number): { unusedDays: number; creditPaise: number } {
    const msRemaining = currentPeriodEnd.getTime() - Date.now();
    const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
    const dailyRate = monthlyPricePaise / 30;
    const creditPaise = Math.round(daysRemaining * dailyRate);

    return { unusedDays: daysRemaining, creditPaise };
  }

  async handleWebhook(gatewayName: string, headers: Record<string, string>, rawBody: any) {
    const gateway = this.getGateway(gatewayName as PaymentGateway);
    const isValid = gateway.verifyWebhookSignature(headers, rawBody);
    if (!isValid) {
      logger.warn({ gateway: gatewayName }, 'Webhook signature verification failed');
      throw new AppError('Invalid webhook signature', 400);
    }

    const payload = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;
    const event = await gateway.processWebhookEvent(payload);

    // Redis Idempotency Lock: 48 hours TTL
    const eventId = headers['x-webhook-id'] || payload.id || `${event.subscriptionId}_${event.event}_${Date.now()}`;
    const idempotencyKey = `idempotency:webhook:${gatewayName}:${eventId}`;
    const acquired = await redis.set(idempotencyKey, '1', 'EX', 172800, 'NX');

    if (!acquired) {
      logger.info({ idempotencyKey }, 'Webhook already processed (idempotent ignore)');
      return { status: 'ignored_duplicate' };
    }

    logger.info({ event: event.event, subscriptionId: event.subscriptionId }, 'Processing billing webhook event');

    if (event.event === 'payment.failed') {
      // Dunning cycle: mark past_due with 3-day grace period
      logger.warn({ subId: event.subscriptionId }, 'Recurring subscription payment failed. Initiating dunning cycle.');
      if (event.subscriptionId) {
        await this.repo.updateSubscriptionStatus(event.subscriptionId, SubscriptionStatus.PAST_DUE);
      }
    } else if (event.event === 'payment.success') {
      logger.info({ subId: event.subscriptionId }, 'Recurring subscription payment succeeded. Generating tax invoice.');
      if (event.subscriptionId) {
        await this.repo.updateSubscriptionStatus(event.subscriptionId, SubscriptionStatus.ACTIVE);
      }
    }

    return { status: 'processed', event: event.event };
  }

  async cancel(userId: string, input: { reason?: string; cancelAtPeriodEnd?: boolean }) {
    const sub = await this.repo.getActiveSubscription(userId);
    if (!sub) {
      throw new AppError('No active subscription found to cancel', 404);
    }

    const provider = this.getGateway(sub.payment_gateway as PaymentGateway);
    await provider.cancelSubscription(sub.gateway_subscription_id, input.cancelAtPeriodEnd ?? true);
    await this.repo.cancelSubscription(sub.id, input.reason, input.cancelAtPeriodEnd ?? true);

    logger.info({ userId, subId: sub.id }, 'Subscription cancelled');
    return { message: 'Subscription cancelled successfully' };
  }

  async getInvoices(userId: string) {
    return this.repo.getInvoices(userId);
  }
}
