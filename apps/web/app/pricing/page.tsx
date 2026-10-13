'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Check, HelpCircle, ArrowRight, Sparkles, ShieldCheck, Zap } from 'lucide-react';
import { PublicChrome } from '../../components/PublicChrome';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { useAuth } from '../../lib/hooks/useAuth';
import { ComingSoonModal } from '../../components/ComingSoonModal';

interface PricingTier {
  name: string;
  tagline: string;
  priceInr: string;
  period: string;
  popular?: boolean;
  features: string[];
  cta: string;
  ctaLink: string;
}

const tiers: PricingTier[] = [
  {
    name: 'Starter',
    tagline: 'Ideal for solo creators testing multi-channel automation',
    priceInr: '₹0',
    period: 'Free forever',
    features: [
      'Up to 2 connected social channels',
      '30 scheduled dispatches / month',
      'AI Prompt Expansion & Hashtags',
      'Standard BullMQ queue execution',
      '7 days analytics history',
      'Community Discord support',
    ],
    cta: 'Start Free',
    ctaLink: '/register',
  },
  {
    name: 'Pro Creator',
    tagline: 'For active content creators, brands, and digital marketers',
    priceInr: '₹999',
    period: 'per month',
    popular: true,
    features: [
      'All 6 social networks (LinkedIn, X, IG, FB, Threads, Reddit)',
      'Unlimited scheduled posts',
      'AI Visual Director (up to 5 image expansion per post)',
      'Priority worker queues & real-time SSE updates',
      'Pass-Through API Wallet integration',
      '30 days analytics history & metrics breakdown',
      'Priority email & ticket support',
    ],
    cta: 'Get Started with Pro',
    ctaLink: '/register',
  },
  {
    name: 'Agency & Enterprise',
    tagline: 'For marketing agencies, multi-brand studios, and teams',
    priceInr: '₹4,999',
    period: 'per month',
    features: [
      'Unlimited connected accounts & client partitions',
      'Dedicated BullMQ worker concurrency',
      'Custom API keys & BYOK (Bring Your Own Key)',
      'Full compliance & security audit logging',
      'Subreddit flairs and multi-handle cross-posting',
      '90 days analytics history & CSV export',
      'Dedicated account manager & 1-on-1 onboarding',
    ],
    cta: 'Contact Sales',
    ctaLink: '/contact',
  },
];

const faqs = [
  {
    q: 'How does the API Pass-Through Wallet work?',
    a: 'Certain social platforms (such as X/Twitter v2 API) charge usage fees per post request. Instead of hiding high subscription fees, PostSpritz lets you top up a live wallet balance in Indian Rupees (Paise) and bills only the exact network charges when you publish.',
  },
  {
    q: 'Can I connect all 6 social networks on the free plan?',
    a: 'The free Starter plan lets you connect any 2 channels of your choice to test the full pipeline. You can upgrade to Pro at any time to unlock all 6 channels simultaneously.',
  },
  {
    q: 'What is the 5-image clamp on AI visual prompts?',
    a: 'To protect you from unexpected model execution costs, our AI Visual Director generator is strictly clamped to produce a maximum of 5 tailored images per post request.',
  },
  {
    q: 'Can I cancel or change plans anytime?',
    a: 'Yes! Subscriptions can be upgraded, downgraded, or canceled directly from your dashboard settings at any point without lock-ins.',
  },
];

export default function PricingPage() {
  const { user } = useAuth();
  const [comingSoonModalOpen, setComingSoonModalOpen] = useState(false);

  return (
    <PublicChrome>
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pb-12 pt-16 sm:px-6 sm:pt-20 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge variant="glow" className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>Transparent Pricing &amp; No Hidden Lock-ins</span>
          </Badge>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground leading-tight">
            Simple Plans for <span className="text-primary">Every Stage</span>.
          </h1>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Choose the tier that matches your publishing scale. Upgrade or top-up your API wallet whenever you need.
          </p>
        </div>
      </section>

      {/* Pricing Cards Grid */}
      <section className="max-w-7xl mx-auto px-4 pb-20 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-2xl border transition-all flex flex-col justify-between p-8 backdrop-blur-sm ${
                tier.popular
                  ? 'border-primary shadow-xl shadow-primary/10 bg-card/70'
                  : 'border-border/70 bg-card/40 hover:border-border'
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <Badge variant="glow" className="px-3 py-1 text-xs font-semibold uppercase tracking-wider">
                    Most Popular
                  </Badge>
                </div>
              )}

              <div>
                <h3 className="text-xl font-bold text-foreground">{tier.name}</h3>
                <p className="text-xs text-muted-foreground mt-1 mb-6 min-h-[32px]">{tier.tagline}</p>

                <div className="flex items-baseline gap-1.5 mb-6 pb-6 border-b border-border/50">
                  <span className="text-4xl font-extrabold text-foreground">{tier.priceInr}</span>
                  <span className="text-xs text-muted-foreground">{tier.period}</span>
                </div>

                <ul className="space-y-3 mb-8">
                  {tier.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2.5 text-xs text-foreground/90">
                      <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                {tier.name === 'Starter' ? (
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="w-full justify-center"
                  >
                    <Link href={user ? '/dashboard' : tier.ctaLink}>
                      {user ? 'Active on Starter' : tier.cta}
                    </Link>
                  </Button>
                ) : (
                  <Button
                    variant={tier.popular ? 'glow' : 'outline'}
                    size="lg"
                    onClick={() => setComingSoonModalOpen(true)}
                    className="w-full justify-center"
                  >
                    {tier.cta} (Coming Soon)
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <ComingSoonModal
        open={comingSoonModalOpen}
        onOpenChange={setComingSoonModalOpen}
        featureTitle="Pro Plans & Dedicated Queues Launching Soon"
        featureDescription="PostSpritz is currently in early creator access on our generous Free Starter tier. Paid plans with unlimited accounts and priority BullMQ queues will open shortly!"
      />

      {/* FAQ Section */}
      <section className="border-t border-border/60 bg-muted/20 py-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">
              Everything you need to know about our billing, wallets, and channel limits.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {faqs.map((faq) => (
              <div
                key={faq.q}
                className="p-6 rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm"
              >
                <h4 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-primary shrink-0" />
                  {faq.q}
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed pl-6">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicChrome>
  );
}
