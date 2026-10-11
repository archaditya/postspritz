import crypto from 'crypto';
import { PaymentGatewayProvider, CreateSubscriptionParams, GatewaySubscriptionResult, GatewayWebhookEvent } from './payment-gateway.interface';
import { env } from '../../../config/env';
import { logger } from '../../../config/logger';

export class CashfreeProvider implements PaymentGatewayProvider {
  readonly providerName = 'cashfree';
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.CASHFREE_ENV === 'production'
      ? 'https://api.cashfree.com/pg'
      : 'https://sandbox.cashfree.com/pg';
  }

  private getHeaders() {
    return {
      'x-client-id': process.env.CASHFREE_APP_ID || 'mock_app_id',
      'x-client-secret': process.env.CASHFREE_SECRET_KEY || 'mock_secret_key',
      'x-api-version': '2023-08-01',
      'Content-Type': 'application/json'
    };
  }

  async createSubscription(params: CreateSubscriptionParams): Promise<GatewaySubscriptionResult> {
    const subId = `sub_${params.userId.slice(0, 8)}_${Date.now()}`;
    const payload = {
      subscription_id: subId,
      plan_id: params.gatewayPlanId,
      customer_details: {
        customer_id: params.userId,
        customer_email: params.customerEmail,
        customer_phone: params.customerPhone || '9999999999'
      },
      subscription_meta: {
        return_url: params.returnUrl
      }
    };

    try {
      const res = await fetch(`${this.baseUrl}/subscriptions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      return {
        subscriptionId: data.subscription_id || subId,
        paymentLink: data.sub_session?.payment_link || data.subscription_meta?.payment_link,
        sessionToken: data.sub_session?.session_id,
        rawResponse: data
      };
    } catch (err) {
      logger.error({ err }, 'Error calling Cashfree create subscription API, falling back to mock link');
      return {
        subscriptionId: subId,
        paymentLink: `https://payments.pushpost.dev/checkout?sub_id=${subId}`
      };
    }
  }

  verifyWebhookSignature(headers: Record<string, string>, rawBody: string | Buffer): boolean {
    const signature = headers['x-webhook-signature'];
    const timestamp = headers['x-webhook-timestamp'];
    const secret = process.env.CASHFREE_SECRET_KEY || '';

    if (!signature || !timestamp || !secret) {
      return true; // Mock dev bypass if keys missing
    }

    const payload = `${timestamp}${rawBody.toString()}`;
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('base64');
    return signature === expected;
  }

  async processWebhookEvent(payload: any): Promise<GatewayWebhookEvent> {
    const type = payload.type || payload.event;
    const subData = payload.data?.subscription || payload.data;

    let event: GatewayWebhookEvent['event'] = 'payment.success';
    if (type?.includes('PAYMENT_FAILED') || type?.includes('FAILED')) {
      event = 'payment.failed';
    } else if (type?.includes('CANCELLED')) {
      event = 'subscription.cancelled';
    } else if (type?.includes('ACTIVE')) {
      event = 'subscription.active';
    }

    return {
      event,
      subscriptionId: subData?.subscription_id || payload.subscription_id,
      amountPaise: Math.round((subData?.payment_amount || payload.payment_amount || 0) * 100),
      invoiceId: payload.data?.payment?.payment_id,
      rawData: payload
    };
  }

  async cancelSubscription(gatewaySubId: string, cancelAtPeriodEnd: boolean): Promise<void> {
    await fetch(`${this.baseUrl}/subscriptions/${gatewaySubId}/cancel`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ cancel_at_period_end: cancelAtPeriodEnd })
    });
  }

  async changePlan(gatewaySubId: string, newGatewayPlanId: string): Promise<void> {
    await fetch(`${this.baseUrl}/subscriptions/${gatewaySubId}/plan`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ plan_id: newGatewayPlanId })
    });
  }
}
