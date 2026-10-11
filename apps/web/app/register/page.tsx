'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Share2,
  Lock,
  Mail,
  User,
  Sparkles,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  Zap,
  ArrowRight,
  CheckCircle2,
  Loader2,
  KeyRound,
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
    icon: Sparkles,
    title: 'Free Starter Access',
    description: 'Get started immediately with 30 dispatches and 2 connected channels—no credit card needed.',
  },
  {
    icon: KeyRound,
    title: 'Direct OAuth Integrations',
    description: 'Step-by-step setup for LinkedIn, X, Meta Pages, Instagram, Threads, and Reddit.',
  },
  {
    icon: ShieldCheck,
    title: 'Zero-Markup Pass-Through',
    description: 'Pay only what upstream social APIs charge with our prepaid INR API wallet.',
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const { register, isRegistering, loginWithGoogle, isLoggingInWithGoogle } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [touched, setTouched] = useState<{
    fullName?: boolean;
    email?: boolean;
    password?: boolean;
    confirmPassword?: boolean;
  }>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Field Validations
  const isNameValid = fullName.trim().length >= 2;
  const isEmailValid = EMAIL_REGEX.test(email.trim());
  const isPasswordLengthValid = password.length >= 8;
  const isConfirmMatch = confirmPassword.length > 0 && confirmPassword === password;

  const nameError =
    (touched.fullName || submitAttempted) && !isNameValid
      ? !fullName.trim()
        ? 'Full name is required'
        : 'Name must be at least 2 characters long'
      : null;

  const emailError =
    (touched.email || submitAttempted) && !isEmailValid
      ? !email.trim()
        ? 'Email address is required'
        : 'Please enter a valid work email'
      : null;

  const passwordError =
    (touched.password || submitAttempted) && !isPasswordLengthValid
      ? !password
        ? 'Password is required'
        : 'Password must be at least 8 characters long'
      : null;

  const confirmError =
    (touched.confirmPassword || submitAttempted) && (!confirmPassword || !isConfirmMatch)
      ? !confirmPassword
        ? 'Please confirm your password'
        : 'Passwords do not match'
      : null;

  const isFormValid = isNameValid && isEmailValid && isPasswordLengthValid && isConfirmMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    setServerError(null);

    if (!isFormValid) return;

    try {
      const data = await register({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
      });
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
        'Registration failed. This email may already be registered.';
      setServerError(errorMsg);
    }
  };

  const handleGoogleSignup = async () => {
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
        'Google signup was cancelled or failed.';
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
                Start Publishing Across Networks
              </Badge>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
                Create your account in <span className="text-primary">seconds</span>.
              </h1>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                Connect your channels, preview visual expansions, and dispatch scheduled posts with precision circuit-breaking.
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

          {/* Right Column: Clean, Sharp Registration Card */}
          <div className="lg:col-span-6 max-w-md mx-auto w-full">
            <Card className="border border-border/80 bg-card/70 backdrop-blur-xl shadow-xl rounded-xl">
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-xl font-bold tracking-tight text-foreground">
                  Create Account
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Get started with free access to multi-channel social orchestration
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
                  onClick={handleGoogleSignup}
                  disabled={isLoggingInWithGoogle || isRegistering}
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
                  {isLoggingInWithGoogle ? 'Connecting with Google...' : 'Sign up with Google'}
                </Button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border/60" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase font-semibold">
                    <span className="bg-card px-2 text-muted-foreground">Or with work email</span>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Aditya Kumar"
                        value={fullName}
                        onChange={(e) => {
                          setFullName(e.target.value);
                          setTouched((prev) => ({ ...prev, fullName: true }));
                        }}
                        onBlur={() => setTouched((prev) => ({ ...prev, fullName: true }))}
                        className={`pl-9 h-10 text-xs bg-background/70 ${
                          nameError ? 'border-destructive focus-visible:ring-destructive' : ''
                        }`}
                      />
                    </div>
                    {nameError && <p className="text-[11px] text-destructive font-medium">{nameError}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Work Email</label>
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

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Password (min 8 chars)</label>
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

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          setTouched((prev) => ({ ...prev, confirmPassword: true }));
                        }}
                        onBlur={() => setTouched((prev) => ({ ...prev, confirmPassword: true }))}
                        className={`pl-9 pr-9 h-10 text-xs bg-background/70 ${
                          confirmError ? 'border-destructive focus-visible:ring-destructive' : ''
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {confirmError && <p className="text-[11px] text-destructive font-medium">{confirmError}</p>}
                  </div>

                  <Button
                    type="submit"
                    variant="glow"
                    disabled={isRegistering}
                    className="w-full justify-center h-10 text-xs font-semibold gap-2 mt-2"
                  >
                    {isRegistering ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      <>
                        Create Free Account
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </>
                    )}
                  </Button>
                </form>

                <div className="pt-2 text-center text-xs text-muted-foreground border-t border-border/50">
                  Already have an account?{' '}
                  <Link href="/login" className="text-primary font-semibold hover:underline">
                    Sign in here
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
