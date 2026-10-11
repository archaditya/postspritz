'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, KeyRound } from 'lucide-react';
import { apiClient } from '../../lib/api-client';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/card';

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
      setError(err?.response?.data?.message || 'Failed to dispatch password reset request. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-40 w-96 h-96 bg-purple-500/10 rounded-full blur-[140px] pointer-events-none" />

      <Card className="w-full max-w-md border-border/80 shadow-2xl relative z-10 backdrop-blur-xl bg-card/90">
        <CardHeader className="text-center pb-2">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center mb-3 border border-primary/20 shadow-lg shadow-primary/10">
            <KeyRound className="w-6 h-6" />
          </div>
          <CardTitle className="text-xl font-extrabold tracking-tight">
            Reset Your Password
          </CardTitle>
          <CardDescription className="text-xs mt-1">
            Enter your account email and we'll send you a secure verification link to reset your password.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {submitted ? (
            <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Reset Instructions Dispatched</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  If an account exists for <strong className="text-foreground">{email}</strong>, you will receive an email with instructions to securely reset your credentials.
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <Link href={`/reset-password`}>
                  <Button variant="outline" size="sm" className="w-full text-xs gap-1.5 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
                    Have a Reset Token? Reset Now <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSubmitted(false);
                    setEmail('');
                  }}
                  className="text-xs text-muted-foreground"
                >
                  Try another email
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-4 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-muted-foreground font-medium">Account Email</label>
                  {touched && isEmailValid && (
                    <span className="text-emerald-400 text-[10px] flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Valid format
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError(null);
                    }}
                    onBlur={() => setTouched(true)}
                    placeholder="admin@postspritz.com"
                    required
                    className={`pl-9 pr-4 text-xs transition-colors ${
                      touched && !isEmailValid ? 'border-destructive focus-visible:ring-destructive/30' : ''
                    }`}
                  />
                </div>
                {touched && !isEmailValid && (
                  <p className="text-[11px] text-destructive flex items-center gap-1 mt-1 font-medium">
                    <AlertCircle className="w-3 h-3" /> Please provide a valid email address.
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading || (touched && !isEmailValid)}
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-2.5 shadow-lg shadow-primary/20 gap-2"
              >
                {loading ? 'Sending Instructions...' : 'Send Reset Link'}
                {!loading && <ArrowRight className="w-3.5 h-3.5" />}
              </Button>
            </form>
          )}
        </CardContent>

        <CardFooter className="flex justify-center border-t border-border/40 pt-4">
          <Link
            href="/login"
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
