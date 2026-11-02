'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Cookie, ShieldCheck, X, Settings2, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';

export interface CookiePreferences {
  status: 'accepted' | 'rejected' | 'custom';
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
}

const STORAGE_KEY = 'postspritz_cookie_consent';

export function CookieBanner() {
  const [mounted, setMounted] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [analyticsAllowed, setAnalyticsAllowed] = useState(false);
  const [marketingAllowed, setMarketingAllowed] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        setShowBanner(true);
      } else {
        const parsed: CookiePreferences = JSON.parse(stored);
        setAnalyticsAllowed(parsed.analytics);
        setMarketingAllowed(parsed.marketing);
      }
    } catch {
      setShowBanner(true);
    }

    // Listener for footer "Cookie Settings" trigger
    const handleOpenSettings = () => {
      setSettingsOpen(true);
    };

    window.addEventListener('postspritz:open-cookie-settings', handleOpenSettings);
    return () => {
      window.removeEventListener('postspritz:open-cookie-settings', handleOpenSettings);
    };
  }, []);

  const saveConsent = (prefs: CookiePreferences) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {}
    setAnalyticsAllowed(prefs.analytics);
    setMarketingAllowed(prefs.marketing);
    setShowBanner(false);
    setSettingsOpen(false);
  };

  const handleAcceptAll = () => {
    saveConsent({
      status: 'accepted',
      essential: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString(),
    });
  };

  const handleRejectAll = () => {
    saveConsent({
      status: 'rejected',
      essential: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString(),
    });
  };

  const handleSaveCustom = () => {
    saveConsent({
      status: 'custom',
      essential: true,
      analytics: analyticsAllowed,
      marketing: marketingAllowed,
      timestamp: new Date().toISOString(),
    });
  };

  if (!mounted) return null;

  return (
    <>
      {/* Floating Bottom Banner */}
      {showBanner && (
        <div className="fixed bottom-4 left-4 right-4 md:left-6 md:right-auto md:max-w-xl z-50 animate-in slide-in-from-bottom duration-300">
          <div className="p-4 sm:p-5 rounded-2xl border border-primary/30 bg-background/95 backdrop-blur-xl shadow-2xl shadow-primary/10 text-foreground">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-primary">
                <Cookie className="w-4 h-4" />
              </div>
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold tracking-tight text-foreground">
                    Cookie &amp; Privacy Choices
                  </p>
                  <button
                    onClick={handleRejectAll}
                    className="text-muted-foreground hover:text-foreground p-1 -mr-1"
                    aria-label="Dismiss banner"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  We use strictly necessary cookies to ensure secure login and CSRF protection. With your consent, we also use minimal analytical cookies to optimize publishing speed. We do not use third-party advertising tracking. Read our{' '}
                  <Link href="/privacy" className="text-primary hover:underline font-medium">
                    Privacy Notice
                  </Link>.
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-border/50 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                className="text-[11px] font-medium text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
              >
                <Settings2 className="w-3.5 h-3.5" /> Manage Choices
              </button>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRejectAll}
                  className="h-8 text-xs font-semibold px-3"
                >
                  Reject Non-Essential
                </Button>
                <Button
                  size="sm"
                  variant="glow"
                  onClick={handleAcceptAll}
                  className="h-8 text-xs font-semibold px-3 shadow-sm shadow-primary/20"
                >
                  Accept All
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cookie Settings Modal */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <div className="space-y-4 max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <Cookie className="w-4 h-4 text-primary" /> Cookie Preference Center
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Under Indian DPDP Act guidelines, choose which cookie categories you permit. Strictly necessary cookies cannot be disabled as they are required for account security and session persistence.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            {/* Essential */}
            <div className="p-3 rounded-xl border border-border/70 bg-card/50 flex items-start justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 font-bold text-foreground">
                  <span>Strictly Necessary Cookies</span>
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-muted text-muted-foreground">Required</span>
                </div>
                <p className="text-muted-foreground text-[11px]">
                  Enables session tokens, CSRF protection, and secure OAuth state verification.
                </p>
              </div>
              <input
                type="checkbox"
                checked
                disabled
                className="rounded border-border bg-muted text-primary cursor-not-allowed mt-1"
              />
            </div>

            {/* Analytics */}
            <div className="p-3 rounded-xl border border-border/70 bg-card/50 flex items-start justify-between gap-3">
              <div className="space-y-0.5">
                <p className="font-bold text-foreground">Performance &amp; Diagnostics</p>
                <p className="text-muted-foreground text-[11px]">
                  Anonymous API latency metrics to prevent dispatch timeouts and circuit breaker failures.
                </p>
              </div>
              <input
                type="checkbox"
                checked={analyticsAllowed}
                onChange={(e) => setAnalyticsAllowed(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary cursor-pointer mt-1 w-4 h-4"
              />
            </div>

            {/* Marketing */}
            <div className="p-3 rounded-xl border border-border/70 bg-card/50 flex items-start justify-between gap-3">
              <div className="space-y-0.5">
                <p className="font-bold text-foreground">Product Updates &amp; Feature Releases</p>
                <p className="text-muted-foreground text-[11px]">
                  Notifies you of new channel integrations (e.g. Threads, Reddit) and algorithm guidelines.
                </p>
              </div>
              <input
                type="checkbox"
                checked={marketingAllowed}
                onChange={(e) => setMarketingAllowed(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary cursor-pointer mt-1 w-4 h-4"
              />
            </div>
          </div>

          <DialogFooter className="flex flex-row justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRejectAll}
              className="text-xs h-8"
            >
              Reject All
            </Button>
            <Button
              type="button"
              variant="glow"
              size="sm"
              onClick={handleSaveCustom}
              className="text-xs h-8 font-semibold shadow-sm shadow-primary/20"
            >
              Save Preferences
            </Button>
          </DialogFooter>
        </div>
      </Dialog>
    </>
  );
}
