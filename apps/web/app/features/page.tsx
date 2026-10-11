'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Share2,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Layers,
  BarChart,
  Bot,
  ArrowRight,
  Cpu,
  RefreshCw,
  Wallet,
} from 'lucide-react';
import { PublicChrome } from '../../components/PublicChrome';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';

const featureHighlights = [
  {
    icon: Bot,
    title: 'Autonomous AI Visual Director',
    tagline: 'Prompt expansion with budget guardrails',
    color: '#FF5A1F',
    description:
      'Turn a simple prompt into high-impact social copy and tailored visual assets. Automatically optimizes dimensions for Instagram square/portrait, X landscape, and LinkedIn feeds—strictly clamped to a maximum of 5 images per request to prevent surprise API runaway bills.',
    bullets: [
      'Multi-aspect ratio image generation (1:1, 16:9, 4:5)',
      'Budget-locked: Strict 5-image clamp per post request',
      'Platform-native tone matching (professional, meme, technical)',
      'Built-in safety filtering and caption hashtags',
    ],
  },
  {
    icon: Share2,
    title: '6-Channel Unified Dispatch',
    tagline: 'Publish everywhere in a single click',
    color: '#E84712',
    description:
      'Native API integrations across LinkedIn, Facebook Pages, Instagram Graph API, Threads, X (Twitter v2), and Reddit. Each channel is authenticated securely via OAuth 2.0 with automated token refresh cycles.',
    bullets: [
      'Interactive OAuth connection wizards',
      'Thread scheduling and carousel photo handling',
      'Subreddit flair support and markdown formatting',
      'Zero external aggregator dependencies',
    ],
  },
  {
    icon: Zap,
    title: 'Distributed BullMQ Mesh & Circuit Breakers',
    tagline: 'Enterprise-grade queue resilience',
    color: '#FF5A1F',
    description:
      'Powered by Redis-backed BullMQ workers with exponential backoff and automatic circuit breaker isolation. If a third-party social API experiences rate limits or outages, PostSpritz pauses the partition without dropping jobs.',
    bullets: [
      'Real-time Server-Sent Events (SSE) live progress feed',
      'Automatic exponential backoff with jitter',
      'Circuit breakers per provider to prevent cascading rate-limits',
      'Dead-letter queue inspection and 1-click retry',
    ],
  },
  {
    icon: Wallet,
    title: 'Transparent Pass-Through API Wallet',
    tagline: 'Pay only what upstream networks charge',
    color: '#E84712',
    description:
      'Unlike platforms that mark up social API costs with high monthly lock-ins, PostSpritz provides transparent pass-through metering in Indian Rupees (Paise) for fee-based platform endpoints like X API v2.',
    bullets: [
      'Live wallet balance with Razorpay top-up',
      'Cost pre-flight check before launching expensive posts',
      'Itemized transaction history for every dispatch',
      'Zero hidden markups on direct-connected channels',
    ],
  },
];

export default function FeaturesPage() {
  return (
    <PublicChrome>
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pb-16 pt-16 sm:px-6 sm:pt-20 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge variant="glow" className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>PostSpritz Platform Capabilities</span>
          </Badge>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground leading-tight">
            Engineered for <span className="text-primary">Reliable Scale</span>.
          </h1>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            From smart prompt expansions to BullMQ-driven distributed dispatch, discover the tools designed to keep
            your multi-channel presence running effortlessly.
          </p>
        </div>
      </section>

      {/* Feature Deep Dive */}
      <section className="max-w-6xl mx-auto px-4 pb-20 sm:px-6">
        <div className="space-y-12">
          {featureHighlights.map((feat, idx) => {
            const Icon = feat.icon;
            const isReversed = idx % 2 === 1;
            return (
              <div
                key={feat.title}
                className={`grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-8 rounded-2xl border border-border/70 bg-card/50 backdrop-blur-sm ${
                  isReversed ? 'lg:flex-row-reverse' : ''
                }`}
              >
                <div className={`lg:col-span-7 ${isReversed ? 'lg:order-2' : ''}`}>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                    {feat.tagline}
                  </span>
                  <h3 className="text-2xl font-bold text-foreground mt-1 mb-3">{feat.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-6">{feat.description}</p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {feat.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-xs text-foreground/90">
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div
                  className={`lg:col-span-5 flex items-center justify-center p-6 rounded-xl border border-border/50 bg-background/50 ${
                    isReversed ? 'lg:order-1' : ''
                  }`}
                >
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shadow-lg shadow-primary/20">
                      <Icon className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{feat.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">Operational &amp; Monitored</p>
                    </div>
                    <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                      Built into PostSpritz Core
                    </Badge>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Channel Matrix */}
      <section className="border-t border-border/60 bg-muted/20 py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">
            Supported Social Destinations
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            Connect once via official OAuth 2.0 and let PostSpritz handle token refreshes and publishing.
          </p>
        </div>

        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {[
            { name: 'LinkedIn', desc: 'Personal & Company pages' },
            { name: 'Facebook', desc: 'Public pages & Media' },
            { name: 'Instagram', desc: 'Carousels & Reels' },
            { name: 'Threads', desc: 'Text & Visual threads' },
            { name: 'X / Twitter', desc: 'PKCE v2 with Pay-as-you-go' },
            { name: 'Reddit', desc: 'Subreddit posts & flair' },
          ].map((channel) => (
            <div
              key={channel.name}
              className="p-4 rounded-xl border border-border/60 bg-card/70 text-center hover:border-primary/50 transition-colors"
            >
              <p className="text-sm font-bold text-foreground">{channel.name}</p>
              <p className="text-xs text-muted-foreground mt-1">{channel.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Bottom Banner */}
      <section className="py-20 px-4 sm:px-6 text-center">
        <div className="max-w-3xl mx-auto p-8 rounded-2xl border border-primary/30 bg-primary/5 backdrop-blur-sm">
          <h3 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-3">
            Ready to streamline your publishing workflow?
          </h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-xl mx-auto">
            Get started with our free tier or upgrade when your volume demands higher concurrency.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild variant="glow" size="lg">
              <Link href="/register">
                Start Free Trial
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/pricing">View Plans &amp; Pricing</Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicChrome>
  );
}
