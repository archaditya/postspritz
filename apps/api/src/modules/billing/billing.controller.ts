import { Request, Response, NextFunction } from 'express';
import { billingService } from '../../container';
import { ApiResponse } from '../../utils/apiResponse';

export class BillingController {
  getPlans = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const plans = await billingService.getPlans();
      ApiResponse.success(res, plans, 'Pricing plans retrieved successfully');
    } catch (err) {
      next(err);
    }
  };

  getSubscription = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const subscription = await billingService.getSubscription(req.user!.id);
      ApiResponse.success(res, subscription, 'Active subscription details retrieved');
    } catch (err) {
      next(err);
    }
  };

  checkout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await billingService.checkout(req.user!.id, req.body);
      ApiResponse.success(res, result, 'Checkout session initialized');
    } catch (err) {
      next(err);
    }
  };

  topupWallet = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const amountInr = Number(req.body.amountInr || req.body.amount || 100);
      const result = await billingService.topupWallet(req.user!.id, amountInr);
      ApiResponse.success(res, result, 'Wallet fuel top-up processed successfully');
    } catch (err) {
      next(err);
    }
  };

  getTransactions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const transactions = await billingService.getTransactions(req.user!.id);
      ApiResponse.success(res, transactions, 'Ledger transactions retrieved');
    } catch (err) {
      next(err);
    }
  };

  cancel = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await billingService.cancel(req.user!.id, req.body);
      ApiResponse.success(res, result, 'Subscription cancelled successfully');
    } catch (err) {
      next(err);
    }
  };

  getInvoices = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const invoices = await billingService.getInvoices(req.user!.id);
      ApiResponse.success(res, invoices, 'Tax invoices retrieved');
    } catch (err) {
      next(err);
    }
  };

  webhook = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const gateway = (req.params.gateway || 'cashfree') as string;
      const result = await billingService.handleWebhook(
        gateway,
        req.headers as Record<string, string>,
        req.body
      );
      ApiResponse.success(res, result, 'Webhook event processed');
    } catch (err) {
      next(err);
    }
  };
}
