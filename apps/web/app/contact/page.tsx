'use client';

import React, { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { PublicChrome } from '../../components/PublicChrome';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Card, CardContent } from '../../components/ui/card';

const contactChannels = [
  {
    icon: Mail,
    title: 'Support & Inquiries',
    desc: 'support@postspritz.com',
    actionText: 'Email support',
    href: 'mailto:support@postspritz.com',
  },
  {
    icon: Clock,
    title: 'Response SLA',
    desc: 'Within 4-12 hours for all active accounts',
    actionText: 'Priority queue available',
    href: '#',
  },
  {
    icon: MapPin,
    title: 'Headquarters & Mesh',
    desc: 'Cloud Distributed Cluster (Asia-South & Global)',
    actionText: 'All systems operational',
    href: '#',
  },
];

import { apiClient } from '../../lib/api-client';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await apiClient.post('/contact', {
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim() || undefined,
        message: message.trim(),
      });
      setSubmissionId(res.data?.data?.id || null);
      setIsSubmitted(true);
    } catch (err: any) {
      setErrorMessage(
        err?.response?.data?.message ||
        err?.response?.data?.error?.message ||
        'Failed to transmit inquiry. Please check your details and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PublicChrome>
      {/* Header */}
      <section className="relative overflow-hidden px-4 pb-12 pt-16 sm:px-6 sm:pt-20 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge variant="glow" className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>Connect with the PostSpritz Team</span>
          </Badge>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground leading-tight">
            How can we <span className="text-primary">help you</span>?
          </h1>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Have questions about custom multi-account scaling, enterprise quotas, or technical integrations? Reach out anytime.
          </p>
        </div>
      </section>

      {/* Main Grid */}
      <section className="max-w-6xl mx-auto px-4 pb-20 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Cards */}
          <div className="lg:col-span-5 space-y-4">
            {contactChannels.map((c) => {
              const Icon = c.icon;
              return (
                <div
                  key={c.title}
                  className="p-6 rounded-2xl border border-border/70 bg-card/40 backdrop-blur-sm flex items-start gap-4 hover:border-border transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 mt-0.5">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">{c.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{c.desc}</p>
                    <span className="inline-block mt-2 text-xs text-primary font-medium">
                      {c.actionText}
                    </span>
                  </div>
                </div>
              );
            })}

            <div className="p-6 rounded-2xl border border-primary/30 bg-primary/5 backdrop-blur-sm">
              <h4 className="text-sm font-bold text-foreground mb-1">Developer &amp; Webhook API Inquiries</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                If you are looking to integrate PostSpritz queue webhooks into your existing CRM or marketing stack, mention it in the message notes for custom endpoint routing.
              </p>
            </div>
          </div>

          {/* Right Form */}
          <div className="lg:col-span-7">
            <Card className="border-border/70 bg-card/60 backdrop-blur-sm p-8 rounded-2xl shadow-xl">
              {errorMessage && (
                <div className="mb-4 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                  <span>{errorMessage}</span>
                </div>
              )}

              {isSubmitted ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">Inquiry Successfully Transmitted!</h3>
                  {submissionId && (
                    <div className="inline-block px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[11px] font-mono text-primary">
                      Reference #{submissionId.slice(0, 8)}
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                    Thank you, <strong className="text-foreground">{name}</strong>. Your message has been routed to our admin support team. We will respond directly to <strong className="text-foreground">{email}</strong> within one business day.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      setIsSubmitted(false);
                      setSubmissionId(null);
                      setName('');
                      setEmail('');
                      setSubject('');
                      setMessage('');
                    }}
                  >
                    Send another message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Your Name *</label>
                      <Input
                        required
                        placeholder="Aditya Kumar"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="bg-background/80"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Work Email *</label>
                      <Input
                        required
                        type="email"
                        placeholder="aditya@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-background/80"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Subject / Topic</label>
                    <Input
                      placeholder="e.g. Enterprise quota, custom webhook integration"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="bg-background/80"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Message *</label>
                    <Textarea
                      required
                      rows={5}
                      placeholder="Tell us what you are looking to achieve with PostSpritz..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="bg-background/80"
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="glow"
                    size="lg"
                    disabled={isSubmitting}
                    className="w-full justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Transmitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Inquiry
                      </>
                    )}
                  </Button>
                </form>
              )}
            </Card>
          </div>
        </div>
      </section>
    </PublicChrome>
  );
}
