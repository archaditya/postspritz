'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Lock, Mail, User, Sparkles, AlertCircle, CheckCircle2, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../lib/hooks/useAuth';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { BackgroundBeams } from '../../components/ui/background-beams';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

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

  // Password Strength Calculation (0 - 4 score)
  const passwordStrength = useMemo(() => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  }, [password]);

  const strengthLabel = useMemo(() => {
    switch (passwordStrength) {
      case 0:
      case 1:
        return { text: 'Weak', color: 'text-destructive bg-destructive' };
      case 2:
        return { text: 'Fair', color: 'text-amber-400 bg-amber-400' };
      case 3:
        return { text: 'Good', color: 'text-blue-400 bg-blue-400' };
      case 4:
        return { text: 'Strong', color: 'text-emerald-400 bg-emerald-400' };
      default:
        return { text: '', color: '' };
    }
  }, [passwordStrength]);

  // Inline Field Errors
  const nameError = (touched.fullName || submitAttempted) && !isNameValid
    ? 'Please enter your full name (at least 2 characters)'
    : null;

  const emailError = (touched.email || submitAttempted) && !isEmailValid
    ? !email.trim()
      ? 'Email address is required'
      : 'Please enter a valid email address (e.g., alex@company.com)'
    : null;

  const passwordError = (touched.password || submitAttempted) && !isPasswordLengthValid
    ? 'Password must be at least 8 characters long'
    : null;

  const confirmError = (touched.confirmPassword || submitAttempted) && !isConfirmMatch
    ? !confirmPassword
      ? 'Please confirm your password'
      : 'Passwords do not match'
    : null;

  const isFormValid = isNameValid && isEmailValid && isPasswordLengthValid && isConfirmMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    setServerError(null);

    if (!isFormValid) {
      return;
    }

    try {
      await register({
        fullName: fullName.trim(),
        email: email.trim(),
        password
      });
      router.push('/dashboard');
    } catch (err: any) {
      const errDetails = err?.response?.data?.error?.details;
      if (Array.isArray(errDetails) && errDetails.length > 0) {
        setServerError(errDetails.map((d: any) => `${d.field}: ${d.message}`).join(', '));
      } else {
        setServerError(
          err?.response?.data?.error?.message ||
          err?.response?.data?.message ||
          err?.message ||
          'Failed to create account. Email may already be in use.'
        );
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setServerError(null);
    try {
      await loginWithGoogle();
      router.push('/dashboard');
    } catch (err: any) {
      setServerError(err?.response?.data?.error?.message || err?.response?.data?.message || err?.message || 'Google sign-in failed. Please verify popup permissions.');
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 bg-background text-foreground overflow-hidden">
      <BackgroundBeams />

      <Card className="w-full max-w-md relative z-10 p-2 sm:p-4 border-border/80 shadow-2xl backdrop-blur-xl my-8">
        <CardHeader className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#17191C] border border-primary/30 flex items-center justify-center p-2 mx-auto shadow-lg shadow-primary/25">
            <svg viewBox="0 0 128 128" className="w-8 h-8" aria-label="PostSpritz Logo">
              <path d="M20 54 103 21c5.7-2.3 11.3 3.3 8.9 9L72 106c-2.1 5-9.4 4.8-11.1-.4L49.4 72.1 15 60c-5.2-1.8-5.1-9.1 5-6Z" fill="#FF5A1F"/>
              <path d="M49.4 72.1 100 24 61 83.4Z" fill="#E84712" opacity=".72"/>
              <path d="M8 77H31M2 91H22" stroke="#FF5A1F" strokeWidth="8" strokeLinecap="round"/>
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            Create your Post<span className="text-primary">Spritz</span> account
          </CardTitle>
          <CardDescription className="text-xs">
            Create once. Spritz everywhere.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {serverError && (
            <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4 text-xs">
            {/* Full Name Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-muted-foreground font-medium">Full Name</label>
                {touched.fullName && isNameValid && (
                  <span className="text-emerald-400 text-[10px] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Valid
                  </span>
                )}
              </div>
              <div className="relative">
                <User className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                <Input
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (serverError) setServerError(null);
                  }}
                  onBlur={() => setTouched((prev) => ({ ...prev, fullName: true }))}
                  placeholder="Alex Rivers"
                  className={`pl-9 ${nameError ? 'border-destructive focus-visible:ring-destructive/30' : ''}`}
                />
              </div>
              {nameError && (
                <p className="text-[11px] text-destructive flex items-center gap-1 mt-1 font-medium">
                  {nameError}
                </p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-muted-foreground font-medium">Email Address</label>
                {touched.email && isEmailValid && (
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
                    if (serverError) setServerError(null);
                  }}
                  onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
                  placeholder="alex@company.com"
                  className={`pl-9 ${emailError ? 'border-destructive focus-visible:ring-destructive/30' : ''}`}
                />
              </div>
              {emailError && (
                <p className="text-[11px] text-destructive flex items-center gap-1 mt-1 font-medium">
                  {emailError}
                </p>
              )}
            </div>

            {/* Password Field + Strength Indicator */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-muted-foreground font-medium">Password</label>
                {password.length > 0 && (
                  <span className={`text-[10px] font-semibold ${strengthLabel.color.split(' ')[0]}`}>
                    Strength: {strengthLabel.text}
                  </span>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (serverError) setServerError(null);
                  }}
                  onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
                  placeholder="At least 8 characters"
                  className={`pl-9 pr-10 ${passwordError ? 'border-destructive focus-visible:ring-destructive/30' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Meter Bar */}
              {password.length > 0 && (
                <div className="grid grid-cols-4 gap-1.5 mt-2">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={`h-1 rounded-full transition-all duration-300 ${
                        passwordStrength >= step
                          ? strengthLabel.color.split(' ')[1]
                          : 'bg-muted/40'
                      }`}
                    />
                  ))}
                </div>
              )}

              {passwordError && (
                <p className="text-[11px] text-destructive flex items-center gap-1 mt-1 font-medium">
                  {passwordError}
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-muted-foreground font-medium">Confirm Password</label>
                {touched.confirmPassword && isConfirmMatch && (
                  <span className="text-emerald-400 text-[10px] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Passwords match
                  </span>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (serverError) setServerError(null);
                  }}
                  onBlur={() => setTouched((prev) => ({ ...prev, confirmPassword: true }))}
                  placeholder="Re-type your password"
                  className={`pl-9 pr-10 ${confirmError ? 'border-destructive focus-visible:ring-destructive/30' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmError && (
                <p className="text-[11px] text-destructive flex items-center gap-1 mt-1 font-medium">
                  {confirmError}
                </p>
              )}
            </div>

            <Button
              type="submit"
              variant="glow"
              size="lg"
              isLoading={isRegistering}
              className="w-full gap-2 text-sm mt-3"
            >
              <ShieldCheck className="w-4 h-4" />
              Create Verified Account
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or sign up with</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={handleGoogleSignIn}
            isLoading={isLoggingInWithGoogle}
            className="w-full gap-2 text-sm border-border hover:bg-card/80"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            Sign up with Google
          </Button>

          <div className="text-center text-xs text-muted-foreground pt-2">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline font-semibold">
              Sign in instead
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
