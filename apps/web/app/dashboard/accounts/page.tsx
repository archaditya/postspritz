'use client';

import React, { useState } from 'react';
import {
  Share2,
  CheckCircle2,
  ChevronRight,
  AlertTriangle,
  ExternalLink,
  Trash2,
  RefreshCw,
  Plus,
  ShieldCheck,
  Lock,
  ArrowUpRight,
  Sparkles,
  Info,
} from 'lucide-react';
import { useAccounts, SocialAccountItem } from '../../../lib/hooks/useAccounts';
import { useAuth } from '../../../lib/hooks/useAuth';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { Avatar } from '../../../components/ui/avatar';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../components/ui/dialog';
import Link from 'next/link';

interface PlatformWizard {
  id: string;
  name: string;
  isPaid: boolean;
  costInfo?: string;
  badge?: string;
  steps: { title: string; desc: string; link?: string; linkText?: string }[];
}

const PLATFORMS: PlatformWizard[] = [
  {
    id: 'instagram',
    name: 'Instagram (Graph API)',
    isPaid: false,
    badge: 'Meta Graph API',
    steps: [
      {
        title: 'Step 1: Switch to Professional Account',
        desc: 'Open Instagram app -> Settings -> Account -> Switch to Professional Account (Choose Business or Creator).',
      },
      {
        title: 'Step 2: Link to Facebook Page',
        desc: 'Go to your Facebook Page Settings -> Linked Accounts -> Instagram -> Connect Account and log in.',
      },
      {
        title: 'Step 3: Register in Meta Developer Portal',
        desc: 'Create an app at Meta Developers with Instagram Graph API product enabled.',
        link: 'https://developers.facebook.com',
        linkText: 'Open Meta Developer Portal',
      },
      {
        title: 'Step 4: Request Permissions',
        desc: 'Request `instagram_basic`, `instagram_content_publish`, and `pages_show_list` permissions.',
      },
      {
        title: 'Step 5: Turn On 2FA & Page Authorization',
        desc: 'Ensure your Facebook personal account has 2FA enabled to satisfy Meta security mandates.',
      },
      {
        title: 'Step 6: Authorize in PostSpritz',
        desc: 'Click Connect below to initiate the OAuth handshake.',
      },
    ],
  },
  {
    id: 'x',
    name: 'X (Twitter)',
    isPaid: true,
    costInfo: '$0.015 / text tweet · $0.20 / tweet with URLs',
    badge: 'PAID PASS-THROUGH',
    steps: [
      {
        title: 'Step 1: Understand Pass-Through Costs',
        desc: 'X charges $0.015 per basic tweet and $0.20 per tweet with links. PostSpritz passes this cost through directly with zero markup.',
      },
      {
        title: 'Step 2: OAuth 2.0 PKCE Handshake',
        desc: 'Click Connect X to open the authorization dialog and grant `tweet.read`, `tweet.write`, and `offline.access`.',
      },
      {
        title: 'Step 3: Cost Acknowledgment & Wallet Fuel',
        desc: 'Make sure your wallet balance is funded in the Billing section to allow tweet dispatches.',
      },
    ],
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    isPaid: false,
    steps: [
      {
        title: 'Step 1: Choose Profile or Organization Page',
        desc: 'You can publish to your personal profile or any company page you administer.',
      },
      {
        title: 'Step 2: Authorize Permissions',
        desc: 'Grant `w_member_social` and `openid` permissions to allow PostSpritz to publish posts.',
      },
    ],
  },
  {
    id: 'facebook',
    name: 'Facebook Pages',
    isPaid: false,
    steps: [
      {
        title: 'Step 1: Confirm Page Admin Role',
        desc: 'Ensure you are an Admin or Editor of the Facebook Page.',
      },
      {
        title: 'Step 2: Select Pages to Connect',
        desc: 'Click Connect Facebook to log in and select which pages to sync.',
      },
    ],
  },
  {
    id: 'threads',
    name: 'Threads',
    isPaid: false,
    steps: [
      {
        title: 'Step 1: Meta Threads API Access',
        desc: 'Grant `threads_basic` and `threads_content_publish` permissions.',
      },
    ],
  },
  {
    id: 'reddit',
    name: 'Reddit',
    isPaid: false,
    steps: [
      {
        title: 'Step 1: Authorize Script App',
        desc: 'Grant permission to post and select your default subreddit in post composer.',
      },
    ],
  },
];

export default function AccountsPage() {
  const { user } = useAuth();
  const { accounts, isLoading, disconnect, isDisconnecting, getConnectUrl } = useAccounts();
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformWizard>(PLATFORMS[0]);
  const [xGuideModalOpen, setXGuideModalOpen] = useState(false);

  const isFreeTier = (user?.plan_name === 'free' || !user?.plan_name) && user?.role !== 'admin' && user?.role !== 'superadmin';

  const handleConnect = async (platformId: string) => {
    if (platformId === 'x' && isFreeTier) {
      setXGuideModalOpen(true);
      return;
    }

    try {
      const url = await getConnectUrl(platformId);
      if (url) {
        window.location.href = url;
      } else {
        // Fallback standard endpoint
        window.location.href = `/api/social-accounts/connect/${platformId}`;
      }
    } catch {
      window.location.href = `/api/social-accounts/connect/${platformId}`;
    }
  };

  const isConnected = (platformId: string) =>
    accounts.some((acc) => acc.platform.toLowerCase() === platformId.toLowerCase() && acc.isActive);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Social Channels & Connection Guides</h1>
        <p className="text-sm text-neutral-400 mt-1">
          Connect your social channels to schedule and dispatch campaigns with unified, platform-compliant formatting.
        </p>
      </div>

      {/* Connected Accounts Strip */}
      <Card className="rounded-xl border border-white/10 bg-black/20 shadow-none">
        <CardHeader className="pb-3 border-b border-white/5">
          <CardTitle className="text-xs uppercase tracking-wider text-neutral-400 font-semibold flex items-center justify-between">
            <span>Your Connected Channels ({accounts.length})</span>
            {isLoading && <span className="text-xs font-normal text-neutral-400">Loading channels...</span>}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {accounts.length === 0 ? (
            <div className="text-center py-6 text-xs text-neutral-400">
              No accounts connected yet. Select a platform below to view setup requirements and authorize access.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {accounts.map((acc) => (
                <div
                  key={acc.id}
                  className="p-4 rounded-xl border border-white/10 bg-white/[0.02] flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar src={acc.profilePicUrl} alt={acc.accountName} className="w-10 h-10 shrink-0 border border-white/10" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{acc.accountName}</p>
                      <p className="text-[11px] text-neutral-400 capitalize flex items-center gap-1.5 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        {acc.platform} {acc.accountUsername ? `(@${acc.accountUsername})` : ''}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => disconnect(acc.id)}
                    isLoading={isDisconnecting}
                    className="text-neutral-400 hover:text-rose-400 shrink-0 h-8 w-8"
                    title="Disconnect account"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Platform Wizards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Platform List */}
        <div className="space-y-3">
          {PLATFORMS.map((plat) => {
            const isSelected = selectedPlatform.id === plat.id;
            const connected = isConnected(plat.id);
            const isXLocked = plat.id === 'x' && isFreeTier;

            return (
              <button
                key={plat.id}
                onClick={() => setSelectedPlatform(plat)}
                className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between ${
                  isSelected
                    ? 'bg-white/[0.06] border-white/20'
                    : 'bg-black/20 border-white/10 hover:border-white/15 hover:bg-white/[0.02]'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-white">{plat.name}</span>
                    {connected && (
                      <Badge variant="outline" className="text-[10px] py-0 px-1.5 gap-1 border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
                        <CheckCircle2 className="w-3 h-3" /> Connected
                      </Badge>
                    )}
                    {isXLocked && !connected && (
                      <Badge variant="outline" className="text-[9px] py-0 px-1.5 border-amber-500/40 text-amber-300 bg-amber-500/10 gap-1">
                        <Lock className="w-2.5 h-2.5 text-amber-300" /> Pro Plan
                      </Badge>
                    )}
                    {plat.isPaid && !isXLocked && !connected && (
                      <Badge variant="outline" className="text-[9px] py-0 px-1.5 border-white/20 text-neutral-300">
                        Pass-Through
                      </Badge>
                    )}
                  </div>
                  {plat.costInfo && <p className="text-xs text-neutral-400 mt-1">{plat.costInfo}</p>}
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-500 shrink-0" />
              </button>
            );
          })}
        </div>

        {/* Step-by-Step Wizard Card */}
        <Card className="lg:col-span-2 rounded-xl border border-white/10 bg-black/20 shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-white/10">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2 text-white">
                <span>{selectedPlatform.name} Connection Guide</span>
                {selectedPlatform.id === 'x' && isFreeTier && (
                  <Badge variant="outline" className="text-xs border-amber-500/40 text-amber-300 bg-amber-500/10 gap-1">
                    <Lock className="w-3 h-3" /> Locked on Free Tier
                  </Badge>
                )}
                {selectedPlatform.badge && (!isFreeTier || selectedPlatform.id !== 'x') && (
                  <Badge variant="outline" className="text-xs border-white/20 text-neutral-300">
                    {selectedPlatform.badge}
                  </Badge>
                )}
              </CardTitle>
              <p className="text-xs text-neutral-400 mt-1">
                Follow these instructions carefully to ensure authorized multi-channel publishing.
              </p>
            </div>

            {selectedPlatform.id === 'x' && isFreeTier ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setXGuideModalOpen(true)}
                className="gap-1.5 text-xs font-semibold rounded-none rounded-tr-lg rounded-bl-lg border-amber-500/40 text-amber-300 hover:bg-amber-500/10"
              >
                <Lock className="w-3.5 h-3.5" />
                Unlock with Pro
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={() => handleConnect(selectedPlatform.id)}
                className="gap-1.5 text-xs font-semibold rounded-none rounded-tr-lg rounded-bl-lg bg-white text-black hover:bg-neutral-200"
              >
                Connect Now
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Button>
            )}
          </CardHeader>

          <CardContent className="space-y-6 pt-6">
            {selectedPlatform.id === 'x' && isFreeTier && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                  <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                  X (Twitter) Publishing Requires a Pro Plan & Wallet Fuel
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  Due to X API pass-through billing ($0.015 per text tweet and $0.20 per tweet with links or media), X publishing is disabled for Free Starter users to prevent unexpected billing. Upgrade to a Pro plan to enable X and fund your usage wallet.
                </p>
                <div className="pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setXGuideModalOpen(true)}
                    className="text-xs border-amber-500/40 text-amber-300 hover:bg-amber-500/20"
                  >
                    View X Guide & Requirements
                  </Button>
                </div>
              </div>
            )}

            {selectedPlatform.isPaid && !isFreeTier && (
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex items-start gap-3 text-xs text-neutral-300">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <div>
                  <strong>Direct Pass-Through API Costs:</strong> X (Twitter) charges $0.015 per tweet and $0.20 per tweet
                  containing links. These costs are debited from your Fuel Wallet on each dispatch with zero markup.
                </div>
              </div>
            )}

            {/* Steps Timeline */}
            <div className="space-y-4">
              {selectedPlatform.steps.map((st, i) => (
                <div key={i} className="flex gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/10">
                  <div className="w-7 h-7 rounded-full bg-white/10 border border-white/15 flex items-center justify-center font-bold text-xs text-white shrink-0">
                    {i + 1}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-white">{st.title}</h3>
                    <p className="text-xs text-neutral-400 leading-relaxed">{st.desc}</p>
                    {st.link && (
                      <a
                        href={st.link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-neutral-200 hover:underline pt-1"
                      >
                        {st.linkText}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* X (Twitter) Pro Tier Detailed Guide Dialog */}
      <Dialog open={xGuideModalOpen} onOpenChange={setXGuideModalOpen}>
        <div className="max-w-lg p-6 space-y-5 rounded-xl border border-white/10 bg-[#0e0e0e] text-white">
          <DialogHeader>
            <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-2">
              <Lock className="w-5 h-5 text-amber-400" />
            </div>
            <DialogTitle className="text-lg font-bold text-white">X (Twitter) Integration Guide</DialogTitle>
            <DialogDescription className="text-xs text-neutral-400">
              Why X requires a Pro subscription and how the pass-through API billing works.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-xs text-neutral-300 leading-relaxed">
            <div className="p-3.5 rounded-lg bg-white/[0.03] border border-white/10 space-y-1.5">
              <p className="font-semibold text-white flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-400" />
                Pass-Through Cost Model
              </p>
              <p className="text-neutral-400">
                Unlike LinkedIn, Facebook, and Instagram (which do not charge per post), the X developer API charges third-party platforms directly for every tweet posted:
              </p>
              <ul className="list-disc list-inside text-neutral-300 space-y-1 pl-1">
                <li><strong className="text-white">$0.015</strong> per text-only tweet</li>
                <li><strong className="text-white">$0.20</strong> per tweet with URLs, images, or media</li>
              </ul>
            </div>

            <div className="p-3.5 rounded-lg bg-white/[0.03] border border-white/10 space-y-1.5">
              <p className="font-semibold text-white">Requirements to Post to X:</p>
              <ol className="list-decimal list-inside text-neutral-400 space-y-1 pl-1">
                <li>An active <strong className="text-white">Pro Starter</strong>, <strong className="text-white">Growth Pro</strong>, or <strong className="text-white">Enterprise</strong> plan.</li>
                <li>A funded <strong className="text-white">Fuel Wallet</strong> balance to cover exact API pass-through charges.</li>
                <li>OAuth 2.0 PKCE authorization with read/write permissions.</li>
              </ol>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setXGuideModalOpen(false)}
              className="text-xs text-neutral-400 hover:text-white"
            >
              Close
            </Button>
            <Link href="/dashboard/billing" className="w-full sm:w-auto">
              <Button
                variant="default"
                size="sm"
                className="w-full gap-1.5 text-xs font-semibold rounded-none rounded-tr-lg rounded-bl-lg bg-white text-black hover:bg-neutral-200"
              >
                Upgrade to Pro in Billing
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </DialogFooter>
        </div>
      </Dialog>
    </div>
  );
}
