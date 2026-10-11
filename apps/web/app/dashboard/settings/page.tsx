'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Key, Bell, CheckCircle2, AlertTriangle, Save, User as UserIcon, History, RefreshCw, Clock } from 'lucide-react';
import { useAuth } from '../../../lib/hooks/useAuth';
import { apiClient } from '../../../lib/api-client';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { Switch } from '../../../components/ui/switch';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { Avatar } from '../../../components/ui/avatar';

export default function SettingsPage() {
  const { user, updateProfile } = useAuth();

  // Profile Form States
  const [fullName, setFullName] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [bio, setBio] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [timezone, setTimezone] = useState('Asia/Kolkata');

  // Platform & AI Settings
  const [xEnabled, setXEnabled] = useState(true);
  const [byokProvider, setByokProvider] = useState<'platform' | 'byok'>('platform');
  const [apiKey, setApiKey] = useState('');

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Interaction & validation states
  const [touched, setTouched] = useState<{
    fullName?: boolean;
    profileImageUrl?: boolean;
    phone?: boolean;
    bio?: boolean;
    apiKey?: boolean;
  }>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // User Audit Logs State
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setProfileImageUrl(user.profileImageUrl || '');
      setBio(user.bio || '');
      setCompany(user.company || '');
      setPhone(user.phone || '');
      setTimezone(user.timezone || 'Asia/Kolkata');
    }
  }, [user]);

  // Validation rules
  const URL_REGEX = /^https?:\/\/.+/i;
  const PHONE_REGEX = /^[+]?[0-9\s\-()]{7,20}$/;

  const fullNameError =
    (touched.fullName || submitAttempted) && (!fullName.trim() || fullName.trim().length < 2)
      ? 'Full name is required (minimum 2 characters).'
      : null;

  const urlError =
    (touched.profileImageUrl || submitAttempted) && profileImageUrl.trim() && !URL_REGEX.test(profileImageUrl.trim())
      ? 'Please enter a valid HTTP or HTTPS image URL.'
      : null;

  const phoneError =
    (touched.phone || submitAttempted) && phone.trim() && !PHONE_REGEX.test(phone.trim())
      ? 'Please enter a valid phone number format (e.g., +91 98765 43210).'
      : null;

  const bioError =
    (touched.bio || submitAttempted) && bio.length > 500
      ? 'Bio cannot exceed 500 characters.'
      : null;

  const apiKeyError =
    (touched.apiKey || submitAttempted) && byokProvider === 'byok' && (!apiKey.trim() || apiKey.trim().length < 10)
      ? 'API Key is required when BYOK is enabled (minimum 10 characters).'
      : null;

  const isFormValid = !fullNameError && !urlError && !phoneError && !bioError && !apiKeyError;

  const loadAuditLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await apiClient.get('/users/me/audit-logs?limit=25');
      setAuditLogs(res.data.data.logs || []);
    } catch {
      // Fallback empty
      setAuditLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const handleSave = async () => {
    setSubmitAttempted(true);
    setErrorMessage(null);

    if (!isFormValid) {
      setErrorMessage('Please fix the validation errors highlighted below.');
      return;
    }

    setSaving(true);
    try {
      await updateProfile({
        fullName: fullName.trim(),
        profileImageUrl: profileImageUrl.trim() || undefined,
        bio: bio.trim() || undefined,
        company: company.trim() || undefined,
        phone: phone.trim() || undefined,
        timezone,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.error?.message || err?.response?.data?.message || 'Failed to save profile settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (!currentPassword) {
      setPasswordError('Current password is required.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setPasswordSaving(true);
    try {
      await apiClient.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 5000);
    } catch (err: any) {
      setPasswordError(err?.response?.data?.message || err?.response?.data?.error?.message || 'Failed to update password.');
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Account & Platform Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your user profile, paid platform opt-ins, BYOK AI keys, and 30-day security audit history.
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-xs hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* User Profile Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-primary" /> Profile & Identity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 pb-2">
            <Avatar src={profileImageUrl} alt={fullName} className="w-16 h-16 border-2 border-primary/20" />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold">Avatar Image URL</label>
                {urlError && <span className="text-destructive text-[11px] font-medium">{urlError}</span>}
              </div>
              <Input
                value={profileImageUrl}
                onChange={(e) => {
                  setProfileImageUrl(e.target.value);
                  setTouched((prev) => ({ ...prev, profileImageUrl: true }));
                }}
                onBlur={() => setTouched((prev) => ({ ...prev, profileImageUrl: true }))}
                placeholder="https://images.unsplash.com/your-avatar.jpg"
                className={urlError ? 'border-destructive focus-visible:ring-destructive' : ''}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold">Full Name *</label>
                {fullNameError && <span className="text-destructive text-[11px] font-medium">{fullNameError}</span>}
              </div>
              <Input
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  setTouched((prev) => ({ ...prev, fullName: true }));
                }}
                onBlur={() => setTouched((prev) => ({ ...prev, fullName: true }))}
                className={fullNameError ? 'border-destructive focus-visible:ring-destructive' : ''}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Company / Organization</label>
              <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Acme Corp" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold">Phone Number</label>
                {phoneError && <span className="text-destructive text-[11px] font-medium">{phoneError}</span>}
              </div>
              <Input
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setTouched((prev) => ({ ...prev, phone: true }));
                }}
                onBlur={() => setTouched((prev) => ({ ...prev, phone: true }))}
                placeholder="+91 98765 43210"
                className={phoneError ? 'border-destructive focus-visible:ring-destructive' : ''}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Preferred Timezone</label>
              <Input value={timezone} onChange={(e) => setTimezone(e.target.value)} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold">Short Bio</label>
              <span className={`text-[11px] ${bio.length > 500 ? 'text-destructive font-bold' : 'text-muted-foreground'}`}>
                {bio.length} / 500 characters
              </span>
            </div>
            <Textarea
              value={bio}
              onChange={(e) => {
                setBio(e.target.value);
                setTouched((prev) => ({ ...prev, bio: true }));
              }}
              onBlur={() => setTouched((prev) => ({ ...prev, bio: true }))}
              placeholder="Tell your audience about yourself or your brand..."
              rows={2}
              className={bioError ? 'border-destructive focus-visible:ring-destructive' : ''}
            />
            {bioError && <p className="text-xs text-destructive mt-1 font-medium">{bioError}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Paid Platform Opt-In Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" /> Paid Platforms & Cost Pass-Through (X / Twitter)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            X (Twitter) charges developers $0.015 per text tweet and $0.20 per tweet containing links. PostSpritz passes
            through these fees directly with zero markup from your fuel wallet.
          </p>

          <div className="p-4 rounded-xl bg-muted/20 border border-border flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">Enable X (Twitter) Publishing</span>
                <Badge variant="warning" className="text-[9px]">
                  Paid Pass-Through
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Standard: $0.015 / tweet · With Links/URLs: $0.20 / tweet. Charges are debited on publish.
              </p>
            </div>

            <Switch checked={xEnabled} onCheckedChange={setXEnabled} />
          </div>

          {xEnabled && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 text-xs text-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                You have opted in to X pass-through billing. Cost calculations appear dynamically in the composer.
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* BYOK AI Engine Configuration */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Key className="w-5 h-5 text-accent" /> AI Provider & BYOK (Bring Your Own Key)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Choose whether to use PostSpritz&apos;s managed AI engine or provide your personal Gemini/OpenAI API key.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setByokProvider('platform')}
              className={`p-4 rounded-xl border text-left transition-all ${
                byokProvider === 'platform'
                  ? 'bg-card border-primary shadow-sm shadow-primary/20'
                  : 'bg-muted/20 border-border hover:border-foreground/30'
              }`}
            >
              <div className="font-semibold text-sm">Managed AI (PostSpritz)</div>
              <div className="text-xs text-muted-foreground mt-1">Included in your plan. Capped to max 5 images.</div>
            </button>

            <button
              type="button"
              onClick={() => setByokProvider('byok')}
              className={`p-4 rounded-xl border text-left transition-all ${
                byokProvider === 'byok'
                  ? 'bg-card border-accent shadow-sm shadow-accent/20'
                  : 'bg-muted/20 border-border hover:border-foreground/30'
              }`}
            >
              <div className="font-semibold text-sm">Bring Your Own Key (BYOK)</div>
              <div className="text-xs text-muted-foreground mt-1">Use your own Gemini or OpenAI API credentials.</div>
            </button>
          </div>

          {byokProvider === 'byok' && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-muted-foreground">Personal API Key *</label>
                {apiKeyError && <span className="text-destructive text-[11px] font-medium">{apiKeyError}</span>}
              </div>
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setTouched((prev) => ({ ...prev, apiKey: true }));
                }}
                onBlur={() => setTouched((prev) => ({ ...prev, apiKey: true }))}
                placeholder="AIzaSy... or sk-proj-..."
                className={`font-mono text-xs ${apiKeyError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
              />
              <p className="text-[11px] text-muted-foreground">API keys are securely encrypted at rest using AES-256-GCM.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Action Button */}
      <div className="flex items-center gap-4">
        <Button variant="glow" onClick={handleSave} isLoading={saving} className="gap-2">
          <Save className="w-4 h-4" /> Save Preferences
        </Button>
        {saved && (
          <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" /> Preferences saved successfully
          </span>
        )}
      </div>

      {/* Security & Password Management */}
      <Card className="border-border/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Key className="w-5 h-5 text-indigo-400" /> Security & Password Management
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Update your account password regularly to keep your social channel integrations and wallet secure.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-xl text-xs">
            {passwordError && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}
            {passwordSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Password changed successfully. Your session is secured.</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold mb-1">Current Password *</label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter your current password"
                required
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1">New Password *</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  required
                  className="text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Confirm New Password *</label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  className="text-xs"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={passwordSaving || !currentPassword || !newPassword || !confirmPassword}
              isLoading={passwordSaving}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-9 gap-1.5 shadow-md shadow-indigo-600/20"
            >
              <Shield className="w-3.5 h-3.5" /> Update Password
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* User 30-Day Activity & Audit Logs */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <History className="w-5 h-5 text-primary" /> Security & Activity Audit Trail (30 Days Retention)
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Complete historical record of all authentication, billing debits, subscriptions, and publishing events.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadAuditLogs}
            isLoading={loadingLogs}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {auditLogs.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-xl bg-muted/10">
              <Clock className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
              <p className="font-semibold text-foreground">No recent audit logs recorded</p>
              <p className="mt-1">All your sign-ins, post dispatches, and billing changes will be recorded here for 30 days.</p>
            </div>
          ) : (
            <div className="space-y-2 text-xs font-mono max-h-96 overflow-y-auto pr-1">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-muted/20 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground font-sans">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                      <Badge variant="glow" className="text-[10px] uppercase font-bold py-0">
                        {log.action}
                      </Badge>
                    </div>
                    {log.details && (
                      <p className="text-[11px] text-muted-foreground truncate max-w-lg">
                        {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                      </p>
                    )}
                  </div>
                  {log.ip_address && (
                    <span className="text-[10px] text-muted-foreground font-sans shrink-0">
                      IP: {log.ip_address}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
