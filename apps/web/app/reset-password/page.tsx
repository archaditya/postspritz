'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, KeyRound, CheckCircle2, AlertCircle, ArrowRight, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { apiClient } from '../../lib/api-client';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/card';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialToken = searchParams.get('token') || '';

  const [token, setToken] = useState(initialToken);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [touched, setTouched] = useState(false);

  const isPasswordValid = newPassword.length >= 8;
  const doPasswordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;
  const isFormValid = token.trim().length > 0 && isPasswordValid && doPasswordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setError(null);

    if (!isFormValid) return;

    setLoading(true);
    try {
      await apiClient.post('/auth/reset-password', {
        token: token.trim(),
        newPassword,
      });
      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to reset password. The token may be expired or invalid.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md border-border/80 shadow-2xl relative z-10 backdrop-blur-xl bg-card/90">
      <CardHeader className="text-center pb-2">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 mx-auto flex items-center justify-center mb-3 border border-indigo-500/20 shadow-lg shadow-indigo-500/10">
          <KeyRound className="w-6 h-6" />
        </div>
        <CardTitle className="text-xl font-extrabold tracking-tight">
          Set New Password
        </CardTitle>
        <CardDescription className="text-xs mt-1">
          Enter your verification reset token and choose a strong new password.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {error && (
          <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-base font-bold text-foreground">Password Reset Successfully!</p>
              <p className="text-xs text-muted-foreground mt-1">
                Your credentials have been securely updated. Redirecting you to the sign-in page...
              </p>
            </div>
            <Link href="/login">
              <Button size="sm" className="w-full bg-primary hover:bg-primary/90 text-white mt-2">
                Sign In Now <ArrowRight className="w-3.5 h-3.5 ml-2" />
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-4 text-xs">
            {/* Reset Token */}
            <div>
              <label className="text-muted-foreground font-medium block mb-1.5">Reset Security Token</label>
              <div className="relative">
                <Input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste token received in email..."
                  required
                  className="font-mono text-xs"
                />
              </div>
            </div>

            {/* New Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-muted-foreground font-medium">New Password</label>
                {touched && isPasswordValid && (
                  <span className="text-emerald-400 text-[10px] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Min 8 characters
                  </span>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  required
                  className={`pl-9 pr-10 text-xs ${
                    touched && !isPasswordValid ? 'border-destructive focus-visible:ring-destructive/30' : ''
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {touched && !isPasswordValid && (
                <p className="text-[11px] text-destructive flex items-center gap-1 mt-1 font-medium">
                  <AlertCircle className="w-3 h-3" /> Password must be at least 8 characters.
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-muted-foreground font-medium">Confirm New Password</label>
                {touched && doPasswordsMatch && (
                  <span className="text-emerald-400 text-[10px] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Passwords match
                  </span>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                  required
                  className={`pl-9 pr-4 text-xs ${
                    touched && !doPasswordsMatch ? 'border-destructive focus-visible:ring-destructive/30' : ''
                  }`}
                />
              </div>
              {touched && !doPasswordsMatch && (
                <p className="text-[11px] text-destructive flex items-center gap-1 mt-1 font-medium">
                  <AlertCircle className="w-3 h-3" /> Passwords do not match.
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading || (touched && !isFormValid)}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-2.5 shadow-lg shadow-primary/20 gap-2"
            >
              {loading ? 'Updating Credentials...' : 'Set New Password'}
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
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      <div className="absolute top-1/4 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none" />
      <Suspense fallback={<div className="text-xs text-muted-foreground">Loading password reset...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
