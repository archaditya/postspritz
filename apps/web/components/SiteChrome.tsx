'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu, X, ArrowRight, ShieldCheck, Sparkles, Send } from 'lucide-react';
import { Button } from './ui/button';
import { ThemeToggle } from './ui/theme-toggle';
import { useAuth } from '../lib/hooks/useAuth';
import { cn } from '../lib/utils';

export type SiteAction = {
  label: string;
  to: string;
  variant?: 'default' | 'outline' | 'ghost' | 'glow';
};

interface SiteChromeProps {
  children: React.ReactNode;
  showNav?: boolean;
  headerAction?: SiteAction;
  footerAction?: SiteAction;
  className?: string;
}

export function SiteChrome({
  children,
  showNav = true,
  headerAction,
  footerAction,
  className,
}: SiteChromeProps) {
  const { user, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAdmin = user?.role === 'superadmin' || user?.role === 'admin';
  const dashboardLink = isAdmin ? '/dashboard/admin' : '/dashboard';

  const action =
    headerAction ??
    (user
      ? { label: 'Go to Dashboard', to: dashboardLink, variant: 'glow' as const }
      : { label: 'Sign In', to: '/login', variant: 'outline' as const });

  const footerCta =
    footerAction ??
    (user
      ? { label: 'Launch Dashboard', to: dashboardLink, variant: 'glow' as const }
      : { label: 'Start Free Trial', to: '/register', variant: 'glow' as const });

  return (
    <div
      className={cn(
        'min-h-screen bg-background text-foreground flex flex-col relative selection:bg-primary selection:text-white',
        className
      )}
    >
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div
          className="absolute -top-32 left-1/2 h-80 w-[45rem] -translate-x-1/2 rounded-full blur-3xl opacity-20 dark:opacity-30"
          style={{
            background:
              'radial-gradient(ellipse, rgba(255, 90, 31, 0.45) 0%, rgba(232, 71, 18, 0.2) 40%, transparent 75%)',
          }}
        />
        <div
          className="absolute top-1/3 right-[-5rem] h-80 w-80 rounded-full blur-3xl opacity-10 dark:opacity-20"
          style={{
            background:
              'radial-gradient(ellipse, rgba(255, 90, 31, 0.35) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute bottom-10 left-[-5rem] h-72 w-72 rounded-full blur-3xl opacity-10 dark:opacity-20"
          style={{
            background:
              'radial-gradient(ellipse, rgba(232, 71, 18, 0.3) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* Sticky Header */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#17191C] border border-primary/30 flex items-center justify-center p-1.5 shadow-md shadow-primary/20">
              <svg viewBox="0 0 128 128" className="w-6 h-6" aria-label="PostSpritz Logo">
                <path d="M20 54 103 21c5.7-2.3 11.3 3.3 8.9 9L72 106c-2.1 5-9.4 4.8-11.1-.4L49.4 72.1 15 60c-5.2-1.8-5.1-9.1 5-6Z" fill="#FF5A1F"/>
                <path d="M49.4 72.1 100 24 61 83.4Z" fill="#E84712" opacity=".72"/>
                <path d="M8 77H31M2 91H22" stroke="#FF5A1F" strokeWidth="8" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="text-lg font-extrabold tracking-tight text-foreground">
              Post<span className="text-primary">Spritz</span>
            </span>
          </Link>

          {/* Nav Links */}
          {showNav && (
            <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex">
              <Link href="/" className="transition-colors hover:text-foreground">
                Home
              </Link>
              <Link href="/features" className="transition-colors hover:text-foreground">
                Features
              </Link>
              <Link href="/pricing" className="transition-colors hover:text-foreground">
                Pricing
              </Link>
              <Link href="/contact" className="transition-colors hover:text-foreground">
                Contact
              </Link>
            </nav>
          )}

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            <ThemeToggle />

            {mounted && (
              <>
                {user ? (
                  <div className="hidden sm:flex items-center gap-2.5">
                    <Link
                      href={dashboardLink}
                      className="flex items-center gap-2 py-1 px-2.5 rounded-full border border-primary/30 bg-primary/10 hover:bg-primary/20 hover:border-primary/50 transition-all text-xs font-semibold text-foreground group"
                    >
                      <div className="w-5 h-5 rounded-full bg-primary text-white font-bold flex items-center justify-center text-[10px] uppercase shadow-sm">
                        {(user.fullName || user.name || user.email || 'U')[0]}
                      </div>
                      <span className="truncate max-w-[130px] text-xs font-medium">
                        {user.fullName || user.name || user.email?.split('@')[0]}
                      </span>
                      {isAdmin && (
                        <span className="text-[9px] uppercase font-extrabold tracking-wider px-1.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                          Admin
                        </span>
                      )}
                    </Link>

                    <Button asChild size="sm" variant="glow" className="gap-1.5 h-8 text-xs font-bold shadow-sm shadow-primary/20">
                      <Link href={dashboardLink}>
                        Dashboard <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="hidden sm:flex items-center gap-2">
                    <Button asChild size="sm" variant="ghost" className="gap-2 text-xs font-medium text-muted-foreground hover:text-foreground">
                      <Link href="/login">Sign In</Link>
                    </Button>
                    <Button asChild size="sm" variant="glow" className="gap-2 text-xs font-bold shadow-sm shadow-primary/20">
                      <Link href="/register">Get Started Free</Link>
                    </Button>
                  </div>
                )}
              </>
            )}

            {showNav && (
              <button
                className="md:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                onClick={() => setMobileMenuOpen((v) => !v)}
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            )}
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {showNav && mobileMenuOpen && (
          <div className="md:hidden border-t border-border/60 bg-background/95 backdrop-blur-xl px-5 py-4 space-y-3 animate-in fade-in duration-150">
            {/* If user is logged in, show user profile card in mobile menu */}
            {user && (
              <div className="p-3 rounded-xl bg-card border border-border/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-primary text-white font-bold flex items-center justify-center text-xs uppercase shrink-0">
                    {(user.fullName || user.name || user.email || 'U')[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">{user.fullName || user.name || 'User'}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>
                <Link
                  href={dashboardLink}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-primary text-white shrink-0 hover:bg-primary/90"
                >
                  Dashboard
                </Link>
              </div>
            )}

            <div className="space-y-1">
              {[
                { href: '/', label: 'Home' },
                { href: '/features', label: 'Features' },
                { href: '/pricing', label: 'Pricing' },
                { href: '/contact', label: 'Contact' },
              ].map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="block px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {label}
                </Link>
              ))}
            </div>

            <div className="pt-3 border-t border-border/60 flex flex-col gap-2">
              {user ? (
                <>
                  <Button asChild size="sm" variant="glow" className="w-full justify-center">
                    <Link href={dashboardLink} onClick={() => setMobileMenuOpen(false)}>
                      Go to Dashboard <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full justify-center text-xs text-muted-foreground hover:text-destructive"
                  >
                    Log Out
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild size="sm" variant="outline" className="w-full justify-center">
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                      Sign In
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="glow" className="w-full justify-center">
                    <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                      Get Started Free
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-card/40 backdrop-blur-sm w-full">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="grid gap-8 grid-cols-1 md:grid-cols-4">
            <div className="md:col-span-2">
              <Link href="/" className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#17191C] border border-primary/30 flex items-center justify-center p-1 shadow-md shadow-primary/20">
                  <svg viewBox="0 0 128 128" className="w-5 h-5" aria-label="PostSpritz Logo">
                    <path d="M20 54 103 21c5.7-2.3 11.3 3.3 8.9 9L72 106c-2.1 5-9.4 4.8-11.1-.4L49.4 72.1 15 60c-5.2-1.8-5.1-9.1 5-6Z" fill="#FF5A1F"/>
                    <path d="M49.4 72.1 100 24 61 83.4Z" fill="#E84712" opacity=".72"/>
                    <path d="M8 77H31M2 91H22" stroke="#FF5A1F" strokeWidth="8" strokeLinecap="round"/>
                  </svg>
                </div>
                <span className="text-lg font-extrabold tracking-tight text-foreground">
                  Post<span className="text-primary">Spritz</span>
                </span>
              </Link>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground max-w-sm">
                Autonomous multi-channel social publishing, AI visual direction, and distributed orchestration mesh.
                Create once, spritz everywhere with precision circuit breaking.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Publishing mesh operational &amp; resilient</span>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Platform
              </p>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li>
                  <Link href="/features" className="hover:text-foreground transition-colors">
                    Features &amp; Channels
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-foreground transition-colors">
                    Pricing &amp; Pass-Through
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-foreground transition-colors">
                    Enterprise Inquiries
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Access
              </p>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li>
                  <Link href="/login" className="hover:text-foreground transition-colors">
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="hover:text-foreground transition-colors">
                    Create Account
                  </Link>
                </li>
                <li>
                  <Link href={footerCta.to} className="hover:text-foreground transition-colors text-primary font-medium">
                    {footerCta.label} →
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 border-t border-border/60 pt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} PostSpritz Inc. All rights reserved.</p>
            <div className="flex gap-4">
              <Link href="/contact" className="hover:text-foreground transition-colors">
                Contact &amp; Support
              </Link>
              <span>•</span>
              <span>API Pass-Through Architecture</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
