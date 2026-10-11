'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  PenSquare,
  Share2,
  Calendar,
  Sparkles,
  AlertCircle,
  Wallet,
  TrendingUp,
  Clock,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../lib/hooks/useAuth';
import { usePosts } from '../../lib/hooks/usePosts';
import { useAccounts } from '../../lib/hooks/useAccounts';
import { useBilling } from '../../lib/hooks/useBilling';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { formatCurrency } from '../../lib/utils';

export default function DashboardOverviewPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { posts, total } = usePosts({ limit: 5 });
  const { accounts } = useAccounts();
  const { subscription } = useBilling();

  useEffect(() => {
    if (user && (user.role === 'superadmin' || user.role === 'admin')) {
      router.replace('/dashboard/admin');
    }
  }, [user, router]);

  if (user && (user.role === 'superadmin' || user.role === 'admin')) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground font-mono">Routing to Platform Governance Console...</p>
      </div>
    );
  }

  const scheduledCount = posts.filter((p) => p.status === 'scheduled').length;
  const publishedCount = posts.filter((p) => p.status === 'published').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Superadmin Governance Notice */}
      {(user?.role === 'superadmin' || user?.role === 'admin') && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent border border-indigo-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-foreground">Superadmin Privileges Active</span>
                <Badge variant="outline" className="text-[10px] bg-indigo-500/10 border-indigo-500/30 text-indigo-400">
                  {user.role.toUpperCase()}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Manage platform users, queue workers, circuit breakers, and broadcast notifications from the governance hub.
              </p>
            </div>
          </div>
          <Link href="/dashboard/admin">
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2 shadow-lg shadow-indigo-600/20 shrink-0">
              Open Governance Console <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      )}

      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name || user?.fullName || 'Creator'} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Autonomous multi-channel scheduling & visual direction across all your social properties.
          </p>
        </div>
        <Link href="/dashboard/compose">
          <Button variant="glow" size="lg" className="gap-2 shadow-lg shadow-primary/25">
            <PenSquare className="w-4 h-4" /> Create New Post
          </Button>
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="hover:border-primary/40 transition-all">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs uppercase font-semibold tracking-wider">Total Posts</span>
              <Calendar className="w-4 h-4 text-primary" />
            </div>
            <div className="text-2xl font-bold text-foreground">{total} Posts</div>
            <p className="text-xs text-muted-foreground mt-1">
              {publishedCount} published · {scheduledCount} scheduled
            </p>
          </CardContent>
        </Card>

        <Card className="hover:border-accent/40 transition-all">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs uppercase font-semibold tracking-wider">Connected Channels</span>
              <Share2 className="w-4 h-4 text-accent" />
            </div>
            <div className="text-2xl font-bold text-foreground">{accounts.length} Accounts</div>
            <p className="text-xs text-emerald-400 mt-1">
              {accounts.length > 0 ? accounts.map((a) => a.platform).join(', ') : 'No channels connected'}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:border-amber-500/40 transition-all">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs uppercase font-semibold tracking-wider">Usage & API Wallet</span>
              <Wallet className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(user?.walletBalancePaise || 0, 'INR')}
            </div>
            <Link href="/dashboard/billing" className="text-xs text-primary hover:underline mt-1 block">
              Manage pass-through wallet →
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:border-emerald-500/40 transition-all">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs uppercase font-semibold tracking-wider">Active Plan</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-foreground capitalize">
              {subscription?.plan?.name || 'Free Starter'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Max 5 AI images per request</p>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline & Readiness */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Posts Pipeline */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-bold">Recent Scheduled & Published Posts</CardTitle>
            <Link href="/dashboard/posts" className="text-xs text-primary hover:underline font-medium">
              View All Posts →
            </Link>
          </CardHeader>
          <CardContent>
            {posts.length === 0 ? (
              <div className="border border-dashed border-border rounded-xl p-8 text-center space-y-3">
                <Calendar className="w-8 h-8 text-muted-foreground mx-auto opacity-50" />
                <p className="text-xs text-muted-foreground">
                  No posts created yet. Ready to start your multi-channel campaign?
                </p>
                <Link href="/dashboard/compose">
                  <Button variant="outline" size="sm">
                    Compose Your First Post
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {posts.slice(0, 4).map((p) => (
                  <div key={p.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{p.content}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {p.scheduledAt
                          ? `Scheduled for ${new Date(p.scheduledAt).toLocaleString()}`
                          : `Created ${new Date(p.createdAt).toLocaleDateString()}`}
                      </p>
                    </div>
                    <Badge
                      variant={
                        p.status === 'published'
                          ? 'success'
                          : p.status === 'failed'
                          ? 'destructive'
                          : 'glow'
                      }
                      className="text-[10px] capitalize shrink-0"
                    >
                      {p.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Channels Readiness Checklist */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">Channel Authorizations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { name: 'LinkedIn', id: 'linkedin' },
              { name: 'Instagram', id: 'instagram' },
              { name: 'X (Twitter)', id: 'x', isPaid: true },
              { name: 'Facebook', id: 'facebook' },
              { name: 'Threads', id: 'threads' },
              { name: 'Reddit', id: 'reddit' },
            ].map((plat) => {
              const connected = accounts.some((a) => a.platform.toLowerCase() === plat.id);
              return (
                <div
                  key={plat.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-muted/20 border border-border/40 text-xs"
                >
                  <span className="font-semibold">{plat.name}</span>
                  {connected ? (
                    <Badge variant="success" className="text-[10px] py-0 px-1.5">
                      Authorized
                    </Badge>
                  ) : (
                    <Link href="/dashboard/accounts" className="text-primary hover:underline text-[11px]">
                      Setup Wizard →
                    </Link>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
