'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Share2,
  Lock,
  Mail,
  Sparkles,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  Zap,
  Layers,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../lib/hooks/useAuth';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { PublicChrome } from '../../components/PublicChrome';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const highlights = [
  {
    icon: Share2,
    title: 'Unified 6-Channel Dispatch',
    description: 'Connect LinkedIn, Facebook, Instagram, Threads, X, and Reddit in one workspace.',
  },
  {
    icon: Zap,
    title: 'Autonomous Queue Mesh',
    description: 'BullMQ worker concurrency with exponential backoff and circuit-breaker isolation.',
  },
  {
    icon: ShieldCheck,
    title: 'Transparent Pass-Through',
    description: 'Zero markup on upstream network fees. Metered precisely through your API wallet.',
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoggingIn, loginWithGoogle, isLoggingInWithGoogle } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Field validation & interaction states
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Validation rules
  const isEmailValid = EMAIL_REGEX.test(email.trim());
  const isPasswordValid = password.length >= 8;

  const emailError =
    (touched.email || submitAttempted) && !isEmailValid
      ? !email.trim()
        ? 'Email address is required'
        : 'Please enter a valid email address (e.g., name@company.com)'
      : null;

  const passwordError =
    (touched.password || submitAttempted) && !isPasswordValid
      ? !password
        ? 'Password is required'
        : 'Password must be at least 8 characters long'
      : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    setServerError(null);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    try {
      const data = await login({ email: email.trim(), password });
      const userRole = data?.user?.role;
      if (userRole === 'superadmin' || userRole === 'admin') {
        router.push('/dashboard/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error?.message ||
        'Authentication failed. Please verify your email and password.';
      setServerError(errorMsg);
    }
  };

  const handleGoogleLogin = async () => {
    setServerError(null);
    try {
      const data = await loginWithGoogle();
      const userRole = data?.user?.role;
      if (userRole === 'superadmin' || userRole === 'admin') {
        router.push('/dashboard/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error?.message ||
        err?.message ||
        'Google authentication was cancelled or failed.';
      setServerError(errorMsg);
    }
  };

  return (
    <PublicChrome>
      <div className="max-w-6xl mx-auto px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Product Value Highlights (Matching Fe pattern) */}
          <div className="lg:col-span-6 space-y-8">
            <div>
              <Badge variant="outline" className="mb-3 border-primary/30 text-primary text-xs font-semibold px-2.5 py-1">
                PostSpritz Platform Access
              </Badge>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
                Welcome back to your <span className="text-primary">Social Command Center</span>.
              </h1>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                Log in to monitor your active dispatches, manage connected accounts, view BullMQ worker health, and configure AI visual prompts.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              {highlights.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="flex items-start gap-3.5 p-4 rounded-xl border border-border/60 bg-card/40 backdrop-blur-sm"
                  >
                    <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 mt-0.5">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground">{item.title}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Clean, Sharp Login Card */}
          <div className="lg:col-span-6 max-w-md mx-auto w-full">
            <Card className="border border-border/80 bg-card/70 backdrop-blur-xl shadow-xl rounded-xl">
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-xl font-bold tracking-tight text-foreground">
                  Sign In
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Enter your credentials or authenticate securely with Google
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {serverError && (
                  <div className="p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span className="leading-snug">{serverError}</span>
                  </div>
                )}

                {/* Google OAuth Button */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleLogin}
                  disabled={isLoggingInWithGoogle || isLoggingIn}
                  className="w-full justify-center gap-2.5 h-10 border-border/80 text-xs font-semibold"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  {isLoggingInWithGoogle ? 'Connecting with Google...' : 'Continue with Google'}
                </Button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border/60" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase font-semibold">
                    <span className="bg-card px-2 text-muted-foreground">Or with work email</span>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3.5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="you@company.com"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setTouched((prev) => ({ ...prev, email: true }));
                        }}
                        onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
                        className={`pl-9 h-10 text-xs bg-background/70 ${
                          emailError ? 'border-destructive focus-visible:ring-destructive' : ''
                        }`}
                      />
                    </div>
                    {emailError && <p className="text-[11px] text-destructive font-medium">{emailError}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-foreground">Password</label>
                      <Link
                        href="/forgot-password"
                        className="text-[11px] text-primary hover:underline font-medium"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setTouched((prev) => ({ ...prev, password: true }));
                        }}
                        onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
                        className={`pl-9 pr-9 h-10 text-xs bg-background/70 ${
                          passwordError ? 'border-destructive focus-visible:ring-destructive' : ''
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {passwordError && <p className="text-[11px] text-destructive font-medium">{passwordError}</p>}
                  </div>

                  <Button
                    type="submit"
                    variant="glow"
                    disabled={isLoggingIn}
                    className="w-full justify-center h-10 text-xs font-semibold gap-2 mt-2"
                  >
                    {isLoggingIn ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign In
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </>
                    )}
                  </Button>
                </form>

                <div className="pt-2 text-center text-xs text-muted-foreground border-t border-border/50">
                  Don't have an account yet?{' '}
                  <Link href="/register" className="text-primary font-semibold hover:underline">
                    Create free account
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PublicChrome>
  );
}
