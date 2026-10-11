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
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../lib/hooks/useAuth';
import { usePosts } from '../../lib/hooks/usePosts';
import { useAccounts } from '../../lib/hooks/useAccounts';
import { useBilling } from '../../lib/hooks/useBilling';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { StatCard } from '../../components/StatCard';
import { formatCurrency } from '../../lib/utils';

import AdminGovernancePage from './admin/page';

export default function DashboardOverviewPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { posts, total } = usePosts({ limit: 5 });
  const { accounts } = useAccounts();
  const { subscription } = useBilling();

  const isAdmin = user?.role === 'superadmin' || user?.role === 'admin';

  if (isAdmin) {
    return <AdminGovernancePage />;
  }

  const scheduledCount = posts.filter((p) => p.status === 'scheduled').length;
  const publishedCount = posts.filter((p) => p.status === 'published').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Welcome back, {user?.fullName || user?.name || 'Creator'} 👋
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Autonomous multi-channel scheduling & visual direction across all your social properties.
          </p>
        </div>
        <Link href="/dashboard/compose">
          <Button size="sm" className="bg-primary hover:bg-primary/90 text-white font-bold gap-2 shadow-md shadow-primary/20">
            <PenSquare className="w-4 h-4" /> Create New Post
          </Button>
        </Link>
      </div>

      {/* Metrics Row (Using StatCard Component) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Posts"
          value={`${total} Posts`}
          subtitle={`${publishedCount} published · ${scheduledCount} scheduled`}
          icon={Calendar}
        />

        <StatCard
          title="Connected Channels"
          value={`${accounts.length} Accounts`}
          subtitle={accounts.length > 0 ? accounts.map((a) => a.platform).join(', ') : 'No channels connected'}
          icon={Share2}
        />

        <StatCard
          title="Fuel Wallet"
          value={formatCurrency(user?.walletBalancePaise || 0, 'INR')}
          subtitle="Available tweet fuel balance"
          icon={Wallet}
        />

        <StatCard
          title="Active Plan"
          value={subscription?.plan?.name || 'Free Starter'}
          subtitle="Max 5 AI images per request"
          icon={ShieldCheck}
        />
      </div>

      {/* Pipeline & Readiness */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Posts Pipeline */}
        <Card className="lg:col-span-2 border-border/80 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-bold">Recent Scheduled & Published Posts</CardTitle>
            <Link href="/dashboard/posts" className="text-xs text-primary hover:underline font-medium">
              View All Posts →
            </Link>
          </CardHeader>
          <CardContent>
            {posts.length === 0 ? (
              <div className="border border-dashed border-border/70 rounded-xl p-8 text-center space-y-2 bg-muted/10">
                <Calendar className="w-8 h-8 text-muted-foreground/40 mx-auto" />
                <p className="text-xs text-muted-foreground font-medium">
                  No posts created yet. Ready to start your multi-channel campaign?
                </p>
                <Link href="/dashboard/compose">
                  <Button variant="outline" size="sm" className="text-xs mt-2">
                    Compose Your First Post
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border/40 text-xs">
                {posts.slice(0, 5).map((p) => (
                  <div key={p.id} className="py-3 flex items-center justify-between gap-4 hover:bg-muted/20 px-2 rounded-lg transition-colors">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate text-xs">{p.content}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">
                        {p.scheduledAt
                          ? `Scheduled: ${new Date(p.scheduledAt).toLocaleString()}`
                          : `Created: ${new Date(p.createdAt).toLocaleDateString()}`}
                      </p>
                    </div>
                    <Badge
                      variant={
                        p.status === 'published'
                          ? 'success'
                          : p.status === 'failed'
                          ? 'destructive'
                          : 'outline'
                      }
                      className="text-[10px] capitalize shrink-0 font-bold"
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
        <Card className="border-border/80 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold">Channel Authorizations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {[
              { name: 'LinkedIn', id: 'linkedin' },
              { name: 'Instagram', id: 'instagram' },
              { name: 'X (Twitter)', id: 'x' },
              { name: 'Facebook', id: 'facebook' },
              { name: 'Threads', id: 'threads' },
              { name: 'Reddit', id: 'reddit' },
            ].map((plat) => {
              const connected = accounts.some((a) => a.platform.toLowerCase() === plat.id);
              return (
                <div
                  key={plat.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-muted/20 border border-border/50 text-xs"
                >
                  <span className="font-semibold text-foreground">{plat.name}</span>
                  {connected ? (
                    <Badge variant="success" className="text-[10px] py-0 px-2 font-bold">
                      Connected
                    </Badge>
                  ) : (
                    <Link href="/dashboard/accounts" className="text-primary hover:underline text-[11px] font-semibold">
                      Connect →
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
