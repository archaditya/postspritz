'use client';

import React from 'react';
import Link from 'next/link';
import { FileText, ShieldCheck, AlertCircle, Scale, Mail } from 'lucide-react';
import { PublicChrome } from '../../components/PublicChrome';
import { Badge } from '../../components/ui/badge';

export default function TermsPage() {
  return (
    <PublicChrome>
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="space-y-4">
          <Badge variant="outline" className="border-primary/40 text-primary gap-1.5 py-1 px-3">
            <Scale className="w-3.5 h-3.5" /> Legal Terms of Service
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Terms &amp; Conditions
          </h1>
          <p className="text-xs text-muted-foreground">
            Last Updated: November 3, 2026 • Effective Date: November 3, 2026
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Please read these Terms and Conditions (&quot;Terms&quot;) carefully before using PostSpritz. By creating an account, connecting social media profiles, or scheduling campaigns, you agree to be bound by these Terms and our Privacy Policy.
          </p>
        </div>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-foreground/90">
          <section className="space-y-3">
            <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">1</span>
              Eligibility &amp; Age Affirmation
            </h2>
            <p className="text-xs text-muted-foreground">
              You must be at least 18 years of age to access or use PostSpritz. By creating an account, you represent and warrant that you are of legal age under Indian law and competent to enter into a legally binding contract under the Indian Contract Act, 1872.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">2</span>
              Platform Description &amp; Free Tier
            </h2>
            <p className="text-xs text-muted-foreground">
              PostSpritz provides automated social media orchestration, multi-account dispatching, and AI-assisted caption generation.
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-xs text-muted-foreground ml-2">
              <li><strong className="text-foreground">Free Starter Tier:</strong> Includes up to 30 posts/month, 3 connected channels, and 20 AI generations at zero cost.</li>
              <li><strong className="text-foreground">Upgrades &amp; Admin Allocation:</strong> Administrators may assign enhanced quotas and features to specific accounts at their discretion.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">3</span>
              Third-Party Social APIs &amp; Pass-Through Costs
            </h2>
            <p className="text-xs text-muted-foreground">
              PostSpritz interfaces directly with official third-party social APIs (Meta Graph API, LinkedIn v2 API, X API v2, Reddit API).
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-xs text-muted-foreground ml-2">
              <li>You agree to comply with all upstream platform policies, including Meta Terms of Service, LinkedIn User Agreement, and X Developer Terms.</li>
              <li><strong className="text-foreground">X (Twitter) Pass-Through Billing:</strong> In accordance with X Developer pricing, dispatches to X incur upstream API charges ($0.015 per basic tweet, $0.20 per tweet with links). PostSpritz deducts these fees directly from your prepaid Creator Fuel Wallet with zero added markup.</li>
              <li>PostSpritz is not liable for upstream service interruptions, platform rate-limiting, account revocations, or algorithm policy enforcement enacted by social networks.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">4</span>
              User Conduct &amp; Prohibited Content
            </h2>
            <p className="text-xs text-muted-foreground">
              You retain full ownership and responsibility for the content you schedule and publish. You strictly agree not to use PostSpritz to publish:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-xs text-muted-foreground ml-2">
              <li>Unlawful, defamatory, obscene, pornographic, or hate speech violating the Information Technology Act, 2000.</li>
              <li>Unsolicited bulk commercial communications (spam) or coordinated inauthentic behavior.</li>
              <li>Material infringing any patent, copyright, trademark, or trade secret of third parties.</li>
              <li>Content intended to deceive, defraud, or impersonate other persons or legal entities.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">5</span>
              Limitation of Liability &amp; Disclaimers
            </h2>
            <p className="text-xs text-muted-foreground">
              PostSpritz is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis. While our publisher worker utilizes automated retry mechanisms and circuit breakers, we do not guarantee uninterrupted or error-free transmissions. To the maximum extent permitted by applicable Indian law, PostSpritz Inc. shall not be liable for indirect, incidental, punitive, or consequential damages resulting from lost social impressions or failed dispatches.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">6</span>
              Governing Law &amp; Dispute Resolution
            </h2>
            <p className="text-xs text-muted-foreground">
              These Terms shall be governed by and construed in accordance with the laws of India. Any disputes or claims arising out of or related to these Terms shall be subject to the exclusive jurisdiction of the competent courts in Bengaluru, Karnataka, India.
            </p>
          </section>

          <section className="p-5 rounded-xl border border-primary/30 bg-primary/5 space-y-2">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary" /> Questions &amp; Legal Notices
            </h3>
            <p className="text-xs text-muted-foreground">
              For questions regarding these Terms or formal legal correspondence:
            </p>
            <p className="text-xs text-foreground">
              <strong>Email:</strong> <a href="mailto:legal@postspritz.com" className="text-primary hover:underline">legal@postspritz.com</a> / <a href="mailto:grievance@postspritz.com" className="text-primary hover:underline">grievance@postspritz.com</a>
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-border/60 flex flex-wrap gap-4 text-xs text-muted-foreground justify-between items-center">
          <Link href="/privacy" className="text-primary hover:underline font-medium">
            ← Read Privacy Policy
          </Link>
          <Link href="/refund" className="text-primary hover:underline font-medium">
            Read Refund Policy →
          </Link>
        </div>
      </div>
    </PublicChrome>
  );
}
