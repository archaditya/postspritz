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
} from 'lucide-react';
import { BackgroundBeams } from '../components/ui/background-beams';
import { SparklesCore } from '../components/ui/sparkles';
import { Globe3D } from '../components/ui/globe-3d';
import { ThemeToggle } from '../components/ui/theme-toggle';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent } from '../components/ui/card';

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground selection:bg-primary selection:text-white">
      {/* Dynamic Background Beams & Sparkles */}
      <BackgroundBeams />

      {/* Top Header */}
      <header className="relative z-20 max-w-7xl mx-auto px-6 h-20 flex items-center justify-between border-b border-border/50 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#17191C] border border-primary/30 flex items-center justify-center p-1.5 shadow-lg shadow-primary/25">
            <svg viewBox="0 0 128 128" className="w-7 h-7" aria-label="PostSpritz Logo">
              <path d="M20 54 103 21c5.7-2.3 11.3 3.3 8.9 9L72 106c-2.1 5-9.4 4.8-11.1-.4L49.4 72.1 15 60c-5.2-1.8-5.1-9.1 5-6Z" fill="#FF5A1F"/>
              <path d="M49.4 72.1 100 24 61 83.4Z" fill="#E84712" opacity=".72"/>
              <path d="M8 77H31M2 91H22" stroke="#FF5A1F" strokeWidth="8" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="text-xl font-extrabold tracking-tight text-foreground">
            Post<span className="text-primary">Spritz</span>
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Sign In
          </Link>
          <Link href="/register">
            <Button variant="glow" size="sm">
              Get Started Free
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-16 pb-24 text-center">
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

        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
          Author once, orchestrate with precision AI, and spritz seamlessly across{' '}
          <strong>LinkedIn, Facebook, Instagram, Threads, X, and Reddit</strong>. Featuring visual prompt expansion
          capped to max 5 images, transparent API pass-through billing, and enterprise audit logs.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link href="/register" className="w-full sm:w-auto">
            <Button variant="glow" size="lg" className="w-full sm:w-auto gap-2">
              Start Free Trial
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2">
              Explore Live Dashboard
            </Button>
          </Link>
        </div>

        {/* 3D Interactive Hero Canvas Preview */}
        <div className="relative mx-auto max-w-4xl rounded-2xl border border-border/80 bg-card/40 backdrop-blur-xl p-4 shadow-2xl overflow-hidden mb-20">
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
              <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Global Distributed Dispatch</p>
              <h4 className="text-lg font-bold text-foreground mb-2">Automated Multi-Channel Execution</h4>
              <p className="text-xs text-muted-foreground">
                Circuit-breaker protected publishers dispatching with BullMQ queues and real-time SSE streaming.
              </p>
            </div>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <Card className="hover:border-primary/40 transition-all">
            <CardContent className="pt-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4">
                <Share2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-foreground">6 Major Networks</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Step-by-step interactive connection wizards for Instagram Graph API, X PKCE, Facebook Pages, LinkedIn,
                Threads, and Reddit.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:border-accent/40 transition-all">
            <CardContent className="pt-6">
              <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-4">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-foreground">AI Visual Director</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Expands your imagination into rich visual prompts tailored to platform aspect ratios. Hard clamped to
                max 5 images to protect your budget.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:border-emerald-500/40 transition-all">
            <CardContent className="pt-6">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-foreground">Transparent Pass-Through</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Paid services like X ($0.015 / $0.20 with links) are clearly flagged and wallet-metered. Users select only
                what they need.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 text-center text-xs text-muted-foreground">
        <p>© 2026 PostSpritz Inc. Built for high-reliability social orchestration.</p>
      </footer>
    </div>
  );
}
