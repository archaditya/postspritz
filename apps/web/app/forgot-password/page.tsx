'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, KeyRound, Loader2 } from 'lucide-react';
import { apiClient } from '../../lib/api-client';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { PublicChrome } from '../../components/PublicChrome';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = emailRegex.test(email.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setError(null);

    if (!isEmailValid) return;

    setLoading(true);
    try {
      await apiClient.post('/auth/forgot-password', { email: email.trim() });
      setSubmitted(true);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
        'Failed to dispatch password reset request. Please check your email.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicChrome>
      <div className="max-w-md mx-auto px-4 py-16 sm:px-6 sm:py-24">
        <Card className="border border-border/80 bg-card/70 backdrop-blur-xl shadow-xl rounded-xl">
          <CardHeader className="space-y-1 pb-4 text-center">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto mb-2">
              <KeyRound className="w-6 h-6" />
            </div>
            <CardTitle className="text-xl font-bold tracking-tight text-foreground">
              Reset Password
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Enter your registered work email and we'll dispatch a secure recovery link
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="leading-snug">{error}</span>
              </div>
            )}

            {submitted ? (
              <div className="space-y-4 text-center py-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-foreground">Recovery Link Dispatched</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  If an account exists with <strong className="text-foreground">{email}</strong>, you will receive password reset instructions shortly.
                </p>
                <Button asChild variant="outline" className="w-full justify-center h-10 text-xs">
                  <Link href="/login">Return to Sign In</Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Registered Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setTouched(true);
                      }}
                      className={`pl-9 h-10 text-xs bg-background/70 ${
                        touched && !isEmailValid ? 'border-destructive focus-visible:ring-destructive' : ''
                      }`}
                    />
                  </div>
                  {touched && !isEmailValid && (
                    <p className="text-[11px] text-destructive font-medium">
                      Please enter a valid email address
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  variant="glow"
                  disabled={loading}
                  className="w-full justify-center h-10 text-xs font-semibold gap-2 mt-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending Recovery Link...
                    </>
                  ) : (
                    <>
                      Send Reset Instructions
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </>
                  )}
                </Button>

                <div className="pt-3 text-center border-t border-border/50">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to Sign In
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </PublicChrome>
  );
}
