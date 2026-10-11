import { Router } from 'express';
import { BillingController } from './billing.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { validateRequest } from '../../middlewares/validate.middleware';
import { checkoutSubscriptionSchema, cancelSubscriptionSchema } from './billing.schemas';

const router = Router();
const controller = new BillingController();

// Public plans
router.get('/plans', controller.getPlans);

// Webhook endpoint (unauthenticated, signature-verified)
router.post('/webhook/:gateway', controller.webhook);

// Protected subscription endpoints
router.get('/subscription', authenticate, controller.getSubscription);
router.post('/checkout', authenticate, validateRequest(checkoutSubscriptionSchema), controller.checkout);
router.post('/subscriptions', authenticate, controller.checkout); // Alias for frontend
router.post('/cancel', authenticate, validateRequest(cancelSubscriptionSchema), controller.cancel);
router.get('/invoices', authenticate, controller.getInvoices);

// Protected wallet ledger endpoints
router.get('/transactions', authenticate, controller.getTransactions);
router.post('/wallet/topup', authenticate, controller.topupWallet);

export const billingRoutes = router;
