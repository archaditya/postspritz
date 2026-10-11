import crypto from 'crypto';
import { PaymentGatewayProvider, CreateSubscriptionParams, GatewaySubscriptionResult, GatewayWebhookEvent } from './payment-gateway.interface';
import { logger } from '../../../config/logger';

export class RazorpayProvider implements PaymentGatewayProvider {
  readonly providerName = 'razorpay';
  private baseUrl = 'https://api.razorpay.com/v1';

  private getAuthHeader() {
    const key = process.env.RAZORPAY_KEY_ID || 'mock_razorpay_key';
    const secret = process.env.RAZORPAY_KEY_SECRET || 'mock_razorpay_secret';
    return `Basic ${Buffer.from(`${key}:${secret}`).toString('base64')}`;
  }

  async createSubscription(params: CreateSubscriptionParams): Promise<GatewaySubscriptionResult> {
    const payload = {
      plan_id: params.gatewayPlanId,
      total_count: params.billingCycle === 'yearly' ? 5 : 60,
      customer_notify: 1
    };

    try {
      const res = await fetch(`${this.baseUrl}/subscriptions`, {
        method: 'POST',
        headers: {
          Authorization: this.getAuthHeader(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      return {
        subscriptionId: data.id,
        paymentLink: data.short_url,
        rawResponse: data
      };
    } catch (err) {
      logger.error({ err }, 'Error calling Razorpay create subscription API');
      return {
        subscriptionId: `sub_rzp_${Date.now()}`
      };
    }
  }

  verifyWebhookSignature(headers: Record<string, string>, rawBody: string | Buffer): boolean {
    const signature = headers['x-razorpay-signature'];
    const secret = process.env.RAZORPAY_KEY_SECRET || '';
    if (!signature || !secret) return true;

    const expected = crypto.createHmac('sha256', secret).update(rawBody.toString()).digest('hex');
    return signature === expected;
  }

  async processWebhookEvent(payload: any): Promise<GatewayWebhookEvent> {
    const eventType = payload.event;
    const subEntity = payload.payload?.subscription?.entity;
    const paymentEntity = payload.payload?.payment?.entity;

    let event: GatewayWebhookEvent['event'] = 'payment.success';
    if (eventType === 'payment.failed') event = 'payment.failed';
    else if (eventType === 'subscription.cancelled') event = 'subscription.cancelled';
    else if (eventType === 'subscription.activated') event = 'subscription.active';

    return {
      event,
      subscriptionId: subEntity?.id || payload.subscription_id,
      amountPaise: paymentEntity?.amount || 0,
      invoiceId: paymentEntity?.id,
      rawData: payload
    };
  }

  async cancelSubscription(gatewaySubId: string, cancelAtPeriodEnd: boolean): Promise<void> {
    await fetch(`${this.baseUrl}/subscriptions/${gatewaySubId}/cancel`, {
      method: 'POST',
      headers: {
        Authorization: this.getAuthHeader(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ cancel_at_cycle_end: cancelAtPeriodEnd ? 1 : 0 })
    });
  }

  async changePlan(gatewaySubId: string, newGatewayPlanId: string): Promise<void> {
    await fetch(`${this.baseUrl}/subscriptions/${gatewaySubId}`, {
      method: 'PATCH',
      headers: {
        Authorization: this.getAuthHeader(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ plan_id: newGatewayPlanId })
    });
  }
}
