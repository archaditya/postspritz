import { z } from 'zod';
import { BillingCycle, PaymentGateway } from '@pushpost/shared-types';

export const checkoutSubscriptionSchema = z.object({
  planId: z.string().uuid('Valid plan ID required'),
  billingCycle: z.nativeEnum(BillingCycle).default(BillingCycle.MONTHLY),
  gateway: z.nativeEnum(PaymentGateway).optional().default(PaymentGateway.CASHFREE),
  customerPhone: z.string().optional()
});

export const changePlanSchema = z.object({
  newPlanId: z.string().uuid('Valid new plan ID required')
});

export const cancelSubscriptionSchema = z.object({
  reason: z.string().optional(),
  cancelAtPeriodEnd: z.boolean().default(true)
});
