'use client';

import React, { useState } from 'react';
import {
  CreditCard,
  CheckCircle2,
  Shield,
  Zap,
  ExternalLink,
  AlertTriangle,
  Wallet,
  Receipt,
  Download,
  Plus,
  Coins,
} from 'lucide-react';
import { useBilling } from '../../../lib/hooks/useBilling';
import { useAuth } from '../../../lib/hooks/useAuth';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { formatCurrency } from '../../../lib/utils';
import { ComingSoonModal } from '../../../components/ComingSoonModal';

export default function BillingPage() {
  const { user } = useAuth();
  const {
    plans,
    isLoadingPlans,
    subscription,
    transactions,
    invoices,
    createSubscription,
    isCreatingSubscription,
    topupWallet,
    isToppingUp,
  } = useBilling();

  const [comingSoonModalOpen, setComingSoonModalOpen] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [topupAmount, setTopupAmount] = useState<number | string>(500);
  const [topupTouched, setTopupTouched] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<'cashfree' | 'razorpay'>('cashfree');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const numericTopup = Number(topupAmount);
  const isTopupValid = !isNaN(numericTopup) && numericTopup >= 100 && numericTopup <= 50000 && Number.isInteger(numericTopup);

  const topupError =
    topupTouched || topupAmount === ''
      ? isNaN(numericTopup) || topupAmount === ''
        ? 'Please enter a valid amount.'
        : numericTopup < 100
        ? 'Minimum wallet top-up is ₹100.'
        : numericTopup > 50000
        ? 'Maximum wallet top-up is ₹50,000.'
        : !Number.isInteger(numericTopup)
        ? 'Amount must be a whole number (no decimals).'
        : null
      : null;

  const handleSubscribe = async (_planId: string) => {
    setComingSoonModalOpen(true);
  };

  const handleTopup = async () => {
    setTopupTouched(true);
    if (!isTopupValid) {
      return;
    }
    try {
      const res = await topupWallet({ amountInr: numericTopup });
      if (res?.paymentUrl) {
        window.location.href = res.paymentUrl;
      } else {
        setStatusMsg({ type: 'success', text: `Wallet credited with ₹${numericTopup}!` });
        setWalletModalOpen(false);
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err?.response?.data?.error?.message || err?.response?.data?.message || 'Failed to process top-up' });
    }
  };

  const defaultPlans = [
    {
      id: 'plan_free',
      name: 'Free Starter',
      price: '₹0',
      cycle: 'forever',
      features: [
        '3 Social Accounts',
        '30 Posts / month',
        '10 Scheduled Posts',
        '20 AI Text Generations',
        '0 AI Images (Upgrade needed)',
      ],
      isCurrent: !subscription || subscription?.plan?.slug === 'free',
    },
    {
      id: 'plan_starter',
      name: 'Creator Pro',
      price: '₹999',
      cycle: '/ month',
      badge: 'Popular',
      features: [
        '10 Social Accounts',
        '200 Posts / month',
        '50 Scheduled Posts',
        '150 AI Text Generations',
        '20 AI Images / month (Strict Max 5/req)',
        'Analytics Dashboard',
      ],
      isCurrent: subscription?.plan?.slug === 'starter',
    },
    {
      id: 'plan_pro',
      name: 'Agency & Teams',
      price: '₹2,999',
      cycle: '/ month',
      badge: 'Advanced',
      features: [
        '30 Social Accounts',
        '1,000 Posts / month',
        '500 Scheduled Posts',
        '1,000 AI Text Generations',
        '100 AI Images / month (Strict Max 5/req)',
        'Custom BYOK AI Provider Keys',
      ],
      isCurrent: subscription?.plan?.slug === 'pro',
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Billing, Plans & Wallet</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage recurring subscriptions via Cashfree (with Razorpay fallback) and fund your X Tweet fuel wallet.
          </p>
        </div>

        <Button variant="glow" onClick={() => setComingSoonModalOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Top Up Wallet
        </Button>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-xl border text-sm flex items-center justify-between ${
            statusMsg.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-destructive/10 border-destructive/20 text-destructive'
          }`}
        >
          <span>{statusMsg.text}</span>
          <button onClick={() => setStatusMsg(null)} className="text-xs hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Wallet Balance & Payment Gateway Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-primary/10 via-card to-card border-primary/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">X Tweet Fuel Wallet</span>
              <Wallet className="w-4 h-4 text-primary" />
            </div>
            <div className="text-3xl font-extrabold text-foreground mb-1">
              {formatCurrency(user?.walletBalancePaise || 0, 'INR')}
            </div>
            <p className="text-xs text-muted-foreground">
              Used strictly for pass-through X API tweet fees ($0.015 or $0.20 with links).
            </p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardContent className="pt-6 flex flex-col justify-between h-full space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Active Subscription Gateway
                </span>
              </div>
              <Badge variant="success">Cashfree Live Subscriptions</Badge>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-muted-foreground border-t border-border/50 pt-3">
              <div>
                <strong className="text-foreground block">Zero KYC Barrier Setup</strong>
                Cashfree Subscriptions handles UPI Autopay, eMandates, and Debit/Credit cards.
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs">Fallback Provider:</span>
                <button
                  onClick={() => setSelectedProvider(selectedProvider === 'cashfree' ? 'razorpay' : 'cashfree')}
                  className="px-2.5 py-1 rounded-lg border border-border bg-muted/40 font-semibold text-foreground text-xs hover:bg-muted"
                >
                  {selectedProvider.toUpperCase()}
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {defaultPlans.map((plan) => (
          <Card
            key={plan.id}
            className={`flex flex-col justify-between relative ${
              plan.badge ? 'border-primary shadow-lg shadow-primary/10' : ''
            }`}
          >
            {plan.badge && (
              <span className="absolute top-4 right-4 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-primary text-white uppercase tracking-wider shadow-sm">
                {plan.badge}
              </span>
            )}

            <CardHeader>
              <CardTitle className="text-lg">{plan.name}</CardTitle>
              <div className="flex items-baseline gap-1 my-2">
                <span className="text-3xl font-extrabold">{plan.price}</span>
                <span className="text-xs text-muted-foreground">{plan.cycle}</span>
              </div>
            </CardHeader>

            <CardContent>
              <ul className="space-y-2.5 text-xs text-muted-foreground">
                {plan.features.map((feat, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </CardContent>

            <div className="p-6 pt-0">
              <Button
                variant={plan.isCurrent ? 'outline' : 'glow'}
                disabled={plan.isCurrent}
                onClick={() => handleSubscribe(plan.id)}
                isLoading={isCreatingSubscription}
                className="w-full text-xs"
              >
                {plan.isCurrent ? 'Current Plan' : `Upgrade via ${selectedProvider}`}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Transaction Ledger & Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transactions Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Coins className="w-4 h-4 text-primary" /> Wallet Ledger & Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-6 text-xs text-muted-foreground">
                No transactions recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-border/40 max-h-60 overflow-y-auto">
                {transactions.map((tx) => (
                  <div key={tx.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-foreground">{tx.description || tx.type}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="font-bold font-mono">
                      {formatCurrency(tx.amountPaise, tx.currency)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invoices List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Receipt className="w-4 h-4 text-primary" /> Invoices & Receipts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {invoices.length === 0 ? (
              <div className="text-center py-6 text-xs text-muted-foreground">
                No invoices generated yet.
              </div>
            ) : (
              <div className="divide-y divide-border/40 max-h-60 overflow-y-auto">
                {invoices.map((inv) => (
                  <div key={inv.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-foreground">Invoice #{inv.invoiceNumber}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(inv.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="success" className="text-[10px]">
                        {inv.status}
                      </Badge>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
                        <Download className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Wallet Top-Up Modal */}
      <Dialog open={walletModalOpen} onOpenChange={setWalletModalOpen}>
        <DialogHeader>
          <DialogTitle>Recharge X Tweet Fuel Wallet</DialogTitle>
          <DialogDescription>
            Pass-through fees ($0.015/tweet or $0.20 with links) are debited from this balance.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {[100, 500, 1000].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => {
                  setTopupAmount(amt);
                  setTopupTouched(false);
                }}
                className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                  numericTopup === amt
                    ? 'border-primary bg-primary/10 text-primary shadow-sm'
                    : 'border-border bg-card text-muted-foreground hover:text-foreground'
                }`}
              >
                ₹{amt}
              </button>
            ))}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold">Custom Amount (INR)</label>
              {isTopupValid && (
                <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3 h-3" /> Valid (min ₹100)
                </span>
              )}
            </div>
            <Input
              type="number"
              value={topupAmount}
              onChange={(e) => {
                setTopupAmount(e.target.value);
                setTopupTouched(true);
              }}
              onBlur={() => setTopupTouched(true)}
              placeholder="Enter amount (min ₹100)"
              min={100}
              max={50000}
              className={topupError ? 'border-destructive focus-visible:ring-destructive' : ''}
            />
            {topupError ? (
              <p className="text-xs text-destructive flex items-center gap-1 mt-1 font-medium">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                {topupError}
              </p>
            ) : isTopupValid ? (
              <p className="text-[11px] text-muted-foreground mt-1">
                Funds approximately <strong className="text-foreground">{Math.floor(numericTopup / (0.015 * 86))}</strong> standard tweets or <strong className="text-foreground">{Math.floor(numericTopup / (0.20 * 86))}</strong> tweets with links.
              </p>
            ) : null}
          </div>

          <Button
            variant="glow"
            onClick={handleTopup}
            isLoading={isToppingUp}
            disabled={!isTopupValid}
            className="w-full gap-2"
          >
            <Wallet className="w-4 h-4" /> Pay {isTopupValid ? `₹${numericTopup}` : 'Amount'} via Cashfree
          </Button>
        </div>
      </Dialog>

      <ComingSoonModal
        open={comingSoonModalOpen}
        onOpenChange={setComingSoonModalOpen}
        featureTitle="Pro Plans & Fuel Wallet Coming Soon"
        featureDescription="As an early platform creator, you are active on our Free Starter Tier. Paid tier upgrades and fuel wallet top-ups are launching soon!"
      />
    </div>
  );
}
