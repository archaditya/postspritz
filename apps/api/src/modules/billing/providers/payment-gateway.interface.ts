export interface CreateSubscriptionParams {
  userId: string;
  customerEmail: string;
  customerPhone?: string;
  planId: string;
  gatewayPlanId: string;
  billingCycle: 'monthly' | 'yearly';
  returnUrl: string;
}

export interface GatewaySubscriptionResult {
  subscriptionId: string;
  paymentLink?: string;
  sessionToken?: string;
  rawResponse?: any;
}

export interface GatewayWebhookEvent {
  event: 'payment.success' | 'payment.failed' | 'subscription.active' | 'subscription.cancelled';
  subscriptionId: string;
  amountPaise: number;
  invoiceId?: string;
  rawData: any;
}

export interface PaymentGatewayProvider {
  readonly providerName: 'cashfree' | 'razorpay';

  createSubscription(params: CreateSubscriptionParams): Promise<GatewaySubscriptionResult>;
  verifyWebhookSignature(headers: Record<string, string>, rawBody: string | Buffer): boolean;
  processWebhookEvent(payload: any): Promise<GatewayWebhookEvent>;
  cancelSubscription(gatewaySubId: string, cancelAtPeriodEnd: boolean): Promise<void>;
  changePlan(gatewaySubId: string, newGatewayPlanId: string): Promise<void>;
}
