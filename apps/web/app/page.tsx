'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Sparkles,
  Share2,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Lock,
  Layers,
  BarChart,
  Bot,
  Flame,
} from 'lucide-react';
import { PublicChrome } from '../components/PublicChrome';
import { BackgroundBeams } from '../components/ui/background-beams';
import { SparklesCore } from '../components/ui/sparkles';
import { Globe3D } from '../components/ui/globe-3d';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent } from '../components/ui/card';

const stats = [
  { value: '6 Networks', label: 'Single Unified Dispatch' },
  { value: '99.98%', label: 'Queue Dispatch Reliability' },
  { value: 'Max 5 Images', label: 'Budget Safeguard Clamp' },
  { value: 'Zero Markup', label: 'API Pass-Through Wallet' },
];

export default function HomePage() {
  return (
    <PublicChrome>
      {/* Dynamic Background Beams & Sparkles */}
      <BackgroundBeams />

      {/* Hero Section */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-14 pb-20 text-center">
        {/* Sparkles Particle Banner */}
        <div className="relative mx-auto w-full max-w-2xl h-10 flex items-center justify-center mb-6">
          <SparklesCore
            id="hero-sparkles"
            minSize={0.6}
            maxSize={1.8}
            particleDensity={40}
            particleColor="#FF5A1F"
          />
          <Badge variant="glow" className="relative z-10 gap-2 px-4 py-1.5 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-primary animate-spin" />
            <span>Create once. Spritz everywhere. Autonomous AI Social Publishing.</span>
          </Badge>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6">
          Create once. <br />
          <span className="bg-gradient-to-r from-primary via-orange-400 to-[#E84712] bg-clip-text text-transparent">
            Spritz everywhere.
          </span>
        </h1>

        <p className="text-base md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
          Author once, orchestrate with precision AI, and spritz seamlessly across{' '}
          <strong className="text-foreground">LinkedIn, Facebook, Instagram, Threads, X, and Reddit</strong>.
          Featuring visual prompt expansion capped to max 5 images, transparent API pass-through billing, and enterprise audit logs.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Button asChild variant="glow" size="lg" className="w-full sm:w-auto gap-2">
            <Link href="/register">
              Start Free Trial
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full sm:w-auto gap-2">
            <Link href="/dashboard">Explore Live Dashboard</Link>
          </Button>
        </div>

        {/* 3D Interactive Hero Canvas Preview */}
        <div className="relative mx-auto max-w-4xl rounded-2xl border border-border/80 bg-card/40 backdrop-blur-xl p-4 shadow-2xl overflow-hidden mb-16">
          <div className="flex items-center justify-between pb-3 border-b border-border/40 px-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-destructive/60" />
              <span className="w-3 h-3 rounded-full bg-amber-500/60" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/60" />
              <span className="ml-2 font-mono">postspritz.publisher.mesh — live visualization</span>
            </div>
            <Badge variant="success">All Workers Healthy</Badge>
          </div>

          <div className="relative h-72 sm:h-96 w-full flex items-center justify-center">
            <Globe3D className="absolute inset-0 h-full w-full" />
            <div className="relative z-10 text-center pointer-events-none p-6 bg-card/60 rounded-2xl border border-border/40 backdrop-blur-md max-w-md">
              <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">
                Global Distributed Dispatch
              </p>
              <h4 className="text-lg font-bold text-foreground mb-2">Automated Multi-Channel Execution</h4>
              <p className="text-xs text-muted-foreground">
                Circuit-breaker protected publishers dispatching with BullMQ queues and real-time SSE streaming.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-border/40 bg-muted/20 py-12 px-4 sm:px-6">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 sm:grid-cols-4 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-3xl sm:text-4xl font-extrabold text-primary">{s.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20 text-left">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <Badge variant="glow" className="mb-2">Core Pillars</Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground">
            Why Creators &amp; Teams Choose PostSpritz
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:border-primary/40 transition-all bg-card/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4">
                <Share2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-foreground">6 Major Networks</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Step-by-step interactive connection wizards for Instagram Graph API, X PKCE, Facebook Pages, LinkedIn,
                Threads, and Reddit.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:border-accent/40 transition-all bg-card/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-4">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-foreground">AI Visual Director</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Expands your imagination into rich visual prompts tailored to platform aspect ratios. Hard clamped to
                max 5 images to protect your budget.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:border-emerald-500/40 transition-all bg-card/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-foreground">Transparent Pass-Through</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Paid services like X ($0.015 / $0.20 with links) are clearly flagged and wallet-metered. Users select only
                what they need.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-16 px-4 sm:px-6 text-center border-t border-border/40">
        <div className="max-w-4xl mx-auto p-10 rounded-3xl border border-primary/30 bg-primary/5 backdrop-blur-sm shadow-2xl">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-4">
            Start Spritzing Your Posts Across Networks
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto mb-8">
            Join thousands of founders and creators who author once and reach all their audiences automatically.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild variant="glow" size="lg">
              <Link href="/register">
                Start Free Trial
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/pricing">View Pricing Matrix</Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicChrome>
  );
}
