import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api-client';

export interface PlanItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  priceMonthlyInrPaise: number;
  priceMonthlyUsdCents: number;
  features: {
    maxSocialAccounts: number;
    maxPostsPerMonth: number;
    aiGenerationsPerMonth: number;
    maxImagesPerRequest: number;
    analyticsHistoryDays: number;
    canUseCustomApiKeys: boolean;
  };
}

export interface SubscriptionStatus {
  id: string;
  planId: string;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'paused';
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  provider: 'cashfree' | 'razorpay';
  plan: PlanItem;
}

export interface TransactionItem {
  id: string;
  amountPaise: number;
  currency: string;
  type: 'wallet_topup' | 'subscription_fee' | 'x_api_passthrough';
  status: 'pending' | 'success' | 'failed';
  description: string;
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  amountPaise: number;
  currency: string;
  status: 'paid' | 'unpaid' | 'void';
  pdfUrl?: string;
  createdAt: string;
}

export function useBilling() {
  const queryClient = useQueryClient();

  const plansQuery = useQuery({
    queryKey: ['billing', 'plans'],
    queryFn: async (): Promise<PlanItem[]> => {
      const res = await apiClient.get('/billing/plans');
      return res.data.data || [];
    },
    staleTime: 1000 * 60 * 60,
  });

  const subscriptionQuery = useQuery({
    queryKey: ['billing', 'subscription'],
    queryFn: async (): Promise<SubscriptionStatus | null> => {
      const res = await apiClient.get('/billing/subscription');
      return res.data.data || null;
    },
    staleTime: 1000 * 60 * 5,
  });

  const transactionsQuery = useQuery({
    queryKey: ['billing', 'transactions'],
    queryFn: async (): Promise<TransactionItem[]> => {
      const res = await apiClient.get('/billing/transactions');
      return res.data.data || [];
    },
    staleTime: 1000 * 60 * 2,
  });

  const invoicesQuery = useQuery({
    queryKey: ['billing', 'invoices'],
    queryFn: async (): Promise<InvoiceItem[]> => {
      const res = await apiClient.get('/billing/invoices');
      return res.data.data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const createSubscriptionMutation = useMutation({
    mutationFn: async ({ planId, provider = 'cashfree' }: { planId: string; provider?: 'cashfree' | 'razorpay' }) => {
      const res = await apiClient.post('/billing/subscriptions', { planId, provider });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing'] });
    },
  });

  const topupWalletMutation = useMutation({
    mutationFn: async ({ amountInr }: { amountInr: number }) => {
      const res = await apiClient.post('/billing/wallet/topup', { amountInr });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing'] });
      queryClient.invalidateQueries({ queryKey: ['auth', 'profile'] });
    },
  });

  return {
    plans: plansQuery.data || [],
    isLoadingPlans: plansQuery.isLoading,
    subscription: subscriptionQuery.data,
    isLoadingSubscription: subscriptionQuery.isLoading,
    transactions: transactionsQuery.data || [],
    invoices: invoicesQuery.data || [],
    createSubscription: createSubscriptionMutation.mutateAsync,
    isCreatingSubscription: createSubscriptionMutation.isPending,
    topupWallet: topupWalletMutation.mutateAsync,
    isToppingUp: topupWalletMutation.isPending,
  };
}
