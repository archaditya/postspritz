'use client';

import React from 'react';
import Link from 'next/link';
import { RefreshCcw, ShieldCheck, CreditCard, Mail } from 'lucide-react';
import { PublicChrome } from '../../components/PublicChrome';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent } from '../../components/ui/card';

export default function RefundPage() {
  return (
    <PublicChrome>
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="space-y-4">
          <Badge variant="outline" className="border-primary/40 text-primary gap-1.5 py-1 px-3">
            <RefreshCcw className="w-3.5 h-3.5" /> Consumer Transparency Policy
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Refund &amp; Cancellation Policy
          </h1>
          <p className="text-xs text-muted-foreground">
            Last Updated: November 3, 2026 • In compliance with Consumer Protection (E-Commerce) Rules, 2020
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            At PostSpritz, we believe in complete financial transparency with zero hidden fees. This policy explains our cancellation and refund standards across subscriptions and Creator Fuel Wallet balances.
          </p>
        </div>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-foreground/90">
          <section className="space-y-3">
            <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">1</span>
              Free Starter Tier
            </h2>
            <p className="text-xs text-muted-foreground">
              Our Starter plan is completely free. No credit card or billing details are required to join. You can use your 30 monthly dispatches and 3 connected channels with no financial obligation.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">2</span>
              Paid Subscriptions &amp; Cancellations
            </h2>
            <p className="text-xs text-muted-foreground">
              For upgraded creator and agency tiers:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-xs text-muted-foreground ml-2">
              <li><strong className="text-foreground">Cancel Anytime:</strong> You may cancel recurring monthly or yearly subscriptions at any time through the Billing section in your Dashboard.</li>
              <li><strong className="text-foreground">Period End Access:</strong> When canceled, your subscription remains fully functional until the end of the current pre-paid billing period. No further renewals will be billed.</li>
              <li><strong className="text-foreground">7-Day Cooling Off Period:</strong> If you are dissatisfied with a newly purchased subscription upgrade, you may request a full refund within 7 calendar days of your initial charge by emailing support.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">3</span>
              Creator Fuel Wallet &amp; Pass-Through Fees
            </h2>
            <p className="text-xs text-muted-foreground">
              Prepaid INR wallet credits power direct pass-through social fees:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-xs text-muted-foreground ml-2">
              <li><strong className="text-foreground">Unconsumed Balances:</strong> Any remaining, unspent wallet balance can be refunded to your source bank account upon request upon account closure.</li>
              <li><strong className="text-foreground">Dispatched Posts:</strong> API fees incurred for tweets or posts successfully accepted by upstream platforms (e.g. X API) cannot be reversed or refunded once dispatched.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">4</span>
              Refund Processing Timeline
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <Card className="border-border/60 bg-card/60">
                <CardContent className="p-4 space-y-1">
                  <p className="font-semibold text-foreground">Payment Gateway Window</p>
                  <p className="text-muted-foreground">Approved refunds are processed through our payment gateway (Cashfree/Razorpay) within <strong>5–7 business days</strong>.</p>
                </CardContent>
              </Card>
              <Card className="border-border/60 bg-card/60">
                <CardContent className="p-4 space-y-1">
                  <p className="font-semibold text-foreground">Original Payment Method</p>
                  <p className="text-muted-foreground">Funds are credited directly to the original UPI, debit card, or net banking account used at purchase.</p>
                </CardContent>
              </Card>
            </div>
          </section>

          <section className="p-5 rounded-xl border border-primary/30 bg-primary/5 space-y-2">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary" /> Request a Refund
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              To request a refund or raise a billing inquiry, email our support desk with your registered email and transaction reference ID:
            </p>
            <p className="text-xs text-foreground pt-1">
              <strong>Billing Desk:</strong> <a href="mailto:billing@postspritz.com" className="text-primary hover:underline">billing@postspritz.com</a> (Response within 24 hours)
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-border/60 flex flex-wrap gap-4 text-xs text-muted-foreground justify-between items-center">
          <Link href="/privacy" className="text-primary hover:underline font-medium">
            ← Read Privacy Policy
          </Link>
          <Link href="/terms" className="text-primary hover:underline font-medium">
            Read Terms of Service →
          </Link>
        </div>
      </div>
    </PublicChrome>
  );
}
