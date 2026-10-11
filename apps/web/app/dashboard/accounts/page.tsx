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
} from 'lucide-react';
import { useAccounts, SocialAccountItem } from '../../../lib/hooks/useAccounts';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { Avatar } from '../../../components/ui/avatar';

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
  const { accounts, isLoading, disconnect, isDisconnecting, getConnectUrl } = useAccounts();
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformWizard>(PLATFORMS[0]);

  const handleConnect = async (platformId: string) => {
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
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Social Accounts & Connection Wizards</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Follow the step-by-step guides to authorize your accounts. Transparent pricing and clear instructions.
        </p>
      </div>

      {/* Connected Accounts Strip */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground font-bold flex items-center justify-between">
            <span>Your Connected Channels ({accounts.length})</span>
            {isLoading && <span className="text-xs font-normal">Loading accounts...</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <div className="text-center py-6 text-xs text-muted-foreground">
              No accounts connected yet. Choose a platform below to view its step-by-step connection wizard.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {accounts.map((acc) => (
                <div
                  key={acc.id}
                  className="p-4 rounded-xl border border-border bg-card/60 flex items-center justify-between gap-3 shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar src={acc.profilePicUrl} alt={acc.accountName} className="w-10 h-10 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{acc.accountName}</p>
                      <p className="text-[11px] text-muted-foreground capitalize flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {acc.platform} {acc.accountUsername ? `(@${acc.accountUsername})` : ''}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => disconnect(acc.id)}
                    isLoading={isDisconnecting}
                    className="text-muted-foreground hover:text-destructive shrink-0"
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

            return (
              <button
                key={plat.id}
                onClick={() => setSelectedPlatform(plat)}
                className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between ${
                  isSelected
                    ? 'bg-card border-primary shadow-lg shadow-primary/20'
                    : 'bg-card/40 border-border hover:border-foreground/30 hover:bg-card/70'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{plat.name}</span>
                    {connected && (
                      <Badge variant="success" className="text-[10px] py-0 px-1.5 gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Connected
                      </Badge>
                    )}
                    {plat.isPaid && !connected && (
                      <Badge variant="warning" className="text-[9px] py-0 px-1.5">
                        Paid Service
                      </Badge>
                    )}
                  </div>
                  {plat.costInfo && <p className="text-xs text-muted-foreground mt-0.5">{plat.costInfo}</p>}
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            );
          })}
        </div>

        {/* Step-by-Step Wizard Card */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border/60">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <span>{selectedPlatform.name} Connection Guide</span>
                {selectedPlatform.badge && (
                  <Badge variant="glow" className="text-xs">
                    {selectedPlatform.badge}
                  </Badge>
                )}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Follow these instructions carefully to ensure authorized multi-channel publishing.
              </p>
            </div>

            <Button
              variant="glow"
              size="sm"
              onClick={() => handleConnect(selectedPlatform.id)}
              className="gap-1.5 text-xs font-semibold"
            >
              Connect Now
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </CardHeader>

          <CardContent className="space-y-6 pt-6">
            {selectedPlatform.isPaid && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 text-xs text-amber-300">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <div>
                  <strong>Pass-Through API Costs Apply:</strong> X (Twitter) charges $0.015 per tweet and $0.20 per tweet
                  containing links. By connecting, you acknowledge these costs will be deducted from your account wallet on
                  each publish.
                </div>
              </div>
            )}

            {/* Steps Timeline */}
            <div className="space-y-4">
              {selectedPlatform.steps.map((st, i) => (
                <div key={i} className="flex gap-4 p-4 rounded-xl bg-muted/20 border border-border/40">
                  <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center font-bold text-xs text-primary shrink-0">
                    {i + 1}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-foreground">{st.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{st.desc}</p>
                    {st.link && (
                      <a
                        href={st.link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline pt-1"
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
    </div>
  );
}
