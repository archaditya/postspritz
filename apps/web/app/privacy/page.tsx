'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Lock, Mail, Clock, FileText, ArrowRight, CheckCircle2 } from 'lucide-react';
import { PublicChrome } from '../../components/PublicChrome';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

export default function PrivacyPolicyPage() {
  return (
    <PublicChrome>
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="space-y-4">
          <Badge variant="outline" className="border-primary/40 text-primary gap-1.5 py-1 px-3">
            <ShieldCheck className="w-3.5 h-3.5" /> DPDP Act 2023 Compliant Privacy Notice
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Privacy Policy &amp; Notice
          </h1>
          <p className="text-xs text-muted-foreground">
            Last Updated: November 3, 2026 • Effective Date: November 3, 2026
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            PostSpritz (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is committed to protecting your personal data in accordance with the Digital Personal Data Protection Act, 2023 (DPDP Act), the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011, and applicable consumer laws.
          </p>
        </div>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-foreground/90">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">1</span>
              Personal Data We Collect
            </h2>
            <p className="text-xs text-muted-foreground">
              We collect only the personal data necessary to provide our multi-platform social dispatching and AI visual direction services:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-xs text-muted-foreground ml-2">
              <li><strong className="text-foreground">Identity &amp; Account Information:</strong> Full name, work email address, encrypted password hash (bcrypt), and account avatar.</li>
              <li><strong className="text-foreground">Social Platform Credentials:</strong> OAuth 2.0 access tokens, refresh tokens (stored encrypted at rest using AES-256-GCM), platform user IDs, and connected handle names.</li>
              <li><strong className="text-foreground">Content &amp; Campaign Data:</strong> Drafted and scheduled captions, media assets (images/videos) uploaded to storage, and AI prompt customization inputs.</li>
              <li><strong className="text-foreground">Technical &amp; Telemetry Data:</strong> IP addresses, browser user agent, login audit timestamps, and non-essential cookie preferences.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">2</span>
              Purpose of Data Processing
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <Card className="border-border/60 bg-card/60">
                <CardContent className="p-4 space-y-1">
                  <p className="font-semibold text-foreground">Service Delivery</p>
                  <p className="text-muted-foreground">Publishing posts, executing scheduled background jobs, and refreshing expiring social tokens.</p>
                </CardContent>
              </Card>
              <Card className="border-border/60 bg-card/60">
                <CardContent className="p-4 space-y-1">
                  <p className="font-semibold text-foreground">AI Generation &amp; Visuals</p>
                  <p className="text-muted-foreground">Synthesizing platform-optimized copy and prompt expansions through configured AI engines.</p>
                </CardContent>
              </Card>
              <Card className="border-border/60 bg-card/60">
                <CardContent className="p-4 space-y-1">
                  <p className="font-semibold text-foreground">Security &amp; Abuse Prevention</p>
                  <p className="text-muted-foreground">Detecting abnormal dispatch velocity, preventing API token leakage, and preserving audit trails.</p>
                </CardContent>
              </Card>
              <Card className="border-border/60 bg-card/60">
                <CardContent className="p-4 space-y-1">
                  <p className="font-semibold text-foreground">Transactional Communications</p>
                  <p className="text-muted-foreground">Sending password resets, security notifications, and critical token expiration warnings.</p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">3</span>
              Third-Party Data Processors
            </h2>
            <p className="text-xs text-muted-foreground">
              To operate PostSpritz, we exchange necessary data with selected third-party service providers bound by strict confidentiality and security terms:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-xs text-muted-foreground ml-2">
              <li><strong className="text-foreground">Connected Social Networks:</strong> Meta Platforms (Facebook, Instagram, Threads), LinkedIn Corporation, X Corp, and Reddit Inc. — only for dispatches you explicitly trigger.</li>
              <li><strong className="text-foreground">AI Providers:</strong> Google Generative AI (Gemini) and OpenAI — prompts are processed statelessly and not used for foundational model training.</li>
              <li><strong className="text-foreground">Infrastructure &amp; Storage:</strong> Cloudflare R2 / AWS S3 for media hosting and Firebase (Google Cloud) for web push alerts.</li>
              <li><strong className="text-foreground">Transactional Email:</strong> Brevo (Sendinblue) for password recovery and account alerts.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">4</span>
              Data Retention &amp; Right to Erasure
            </h2>
            <p className="text-xs text-muted-foreground">
              Your personal data is retained only as long as your account remains active. Under Section 8(7) of the DPDP Act 2023, you have the right to request deletion of your data at any time:
            </p>
            <p className="text-xs text-muted-foreground">
              When an account is deleted via the Dashboard Settings, all connected social tokens, post targets, and media references are immediately deactivated with a 30-day retention grace backoff, after which all database records are permanently purged.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">5</span>
              Your Rights Under the DPDP Act, 2023
            </h2>
            <div className="space-y-2 text-xs text-muted-foreground">
              <p>As a Data Principal under Indian law, you are entitled to:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><strong className="text-foreground">Right to Access Information:</strong> Request a summary of your personal data processed and third parties with whom it has been shared.</li>
                <li><strong className="text-foreground">Right to Correction &amp; Erasure:</strong> Rectify inaccurate personal data or request deletion of data no longer necessary for service delivery.</li>
                <li><strong className="text-foreground">Right of Grievance Redressal:</strong> Contact our Grievance Officer for unresolved privacy concerns.</li>
                <li><strong className="text-foreground">Right to Nominate:</strong> Nominate another individual to exercise data rights in case of death or incapacity.</li>
                <li><strong className="text-foreground">Complaints to Data Protection Board:</strong> Escalate unresolved grievances to the Data Protection Board of India.</li>
              </ul>
            </div>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">6</span>
              Children&apos;s Data (Under 18 Years)
            </h2>
            <p className="text-xs text-muted-foreground">
              PostSpritz is intended strictly for professional creators, social media managers, and businesses aged 18 and older. In compliance with Section 9 of the DPDP Act, 2023, we do not knowingly collect personal data from minors, nor do we perform behavioral monitoring or targeted advertising directed at individuals under 18.
            </p>
          </section>

          {/* Section 7 - Grievance Officer */}
          <section className="p-5 rounded-xl border border-primary/30 bg-primary/5 space-y-2">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary" /> Grievance Officer &amp; Redressal Mechanism
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              In accordance with Section 8(9) of the DPDP Act 2023 and Rule 5(9) of the IT Rules 2011, the details of our designated Grievance Officer are published below:
            </p>
            <div className="text-xs text-foreground space-y-1 pt-1">
              <p><strong>Designation:</strong> Grievance Officer, PostSpritz Compliance Cell</p>
              <p><strong>Email:</strong> <a href="mailto:grievance@postspritz.com" className="text-primary hover:underline">grievance@postspritz.com</a></p>
              <p><strong>Escalation Window:</strong> All grievances are formally acknowledged within <strong>48 hours</strong> and resolved within <strong>30 calendar days</strong>.</p>
            </div>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-border/60 flex flex-wrap gap-4 text-xs text-muted-foreground justify-between items-center">
          <Link href="/terms" className="text-primary hover:underline font-medium">
            Read Terms &amp; Conditions →
          </Link>
          <Link href="/refund" className="text-primary hover:underline font-medium">
            Read Refund Policy →
          </Link>
          <Link href="/contact" className="hover:text-foreground">
            Contact Support &amp; Grievance Desk
          </Link>
        </div>
      </div>
    </PublicChrome>
  );
}
