'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldAlert,
  Users,
  Activity,
  Zap,
  Radio,
  Send,
  Bell,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Server,
  Sparkles,
  Smartphone,
  Globe,
  Clock,
  Coins,
  ShieldCheck,
  Eye,
  Wallet,
  Share2,
  FileText,
  Copy,
  Check,
  Lock,
  Package,
} from 'lucide-react';
import { apiClient } from '../../../lib/api-client';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../components/ui/tabs';
import { Avatar } from '../../../components/ui/avatar';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../components/ui/dialog';
import { StatCard } from '../../../components/StatCard';
import { DataTable, Column } from '../../../components/common/table/DataTable';
import { formatCurrency } from '../../../lib/utils';

export default function AdminGovernancePage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('users');

  // User search & pagination state
  const [userSearch, setUserSearch] = useState('');
  const [userPage, setUserPage] = useState(1);

  // User Inspector Modal State
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [inspectorSubTab, setInspectorSubTab] = useState<'platforms' | 'posts' | 'wallet' | 'devices' | 'config'>('platforms');

  // Assign Package Modal State
  const [assignPlanModalOpen, setAssignPlanModalOpen] = useState(false);
  const [assignPlanUser, setAssignPlanUser] = useState<any | null>(null);
  const [selectedPlanName, setSelectedPlanName] = useState<string>('starter');
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [assignSuccessMsg, setAssignSuccessMsg] = useState<string | null>(null);

  // Broadcast Notification Form State
  const [broadcastForm, setBroadcastForm] = useState({
    title: '',
    body: '',
    type: 'promotional',
    targetRole: 'all',
    targetPlan: 'all',
    channel: 'both' as 'both' | 'push' | 'in_app',
    actionUrl: '/dashboard/billing',
  });
  const [broadcastResult, setBroadcastResult] = useState<any | null>(null);

  // 1. Fetch System Telemetry & Platform Stats
  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/stats');
      return res.data.data;
    },
    refetchInterval: 8000,
  });

  // 2. Fetch Real Users Directory
  const {
    data: usersData,
    isLoading: usersLoading,
    refetch: refetchUsers,
  } = useQuery({
    queryKey: ['admin-users', userPage, userSearch],
    queryFn: async () => {
      const res = await apiClient.get('/admin/users', {
        params: { page: userPage, limit: 15, search: userSearch || undefined },
      });
      return res.data;
    },
  });

  // 3. Fetch Single User Full Breakdown (Inspector)
  const {
    data: userDetail,
    isLoading: userDetailLoading,
  } = useQuery({
    queryKey: ['admin-user-detail', selectedUserId],
    queryFn: async () => {
      if (!selectedUserId) return null;
      const res = await apiClient.get(`/admin/users/${selectedUserId}`);
      return res.data.data;
    },
    enabled: !!selectedUserId,
  });

  // 4. Fetch Real Queue Metrics
  const {
    data: queuesData,
    isLoading: queuesLoading,
    refetch: refetchQueues,
  } = useQuery({
    queryKey: ['admin-queues'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/system/queues');
      return res.data.data;
    },
    refetchInterval: 5000,
  });

  // 5. Fetch Audit Logs
  const {
    data: auditData,
    isLoading: auditLoading,
    refetch: refetchAudit,
  } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/audit-logs', { params: { limit: 40 } });
      return res.data;
    },
  });

  // 6. Fetch Available Package Plans & Quotas
  const {
    data: plansData,
    isLoading: plansLoading,
    refetch: refetchPlans,
  } = useQuery({
    queryKey: ['admin-plans'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/plans');
      return res.data.data;
    },
  });

  // Assign Package Mutation
  const assignPlanMutation = useMutation({
    mutationFn: async ({ userId, plan, billingCycle }: { userId: string; plan: string; billingCycle: 'monthly' | 'yearly' }) => {
      const res = await apiClient.post(`/admin/users/${userId}/assign-package`, { plan, billingCycle });
      return res.data;
    },
    onSuccess: (res) => {
      setAssignSuccessMsg(`Package '${res.data?.plan?.display_name}' successfully assigned to user!`);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-plans'] });
      if (selectedUserId) {
        queryClient.invalidateQueries({ queryKey: ['admin-user-detail', selectedUserId] });
      }
      setTimeout(() => {
        setAssignPlanModalOpen(false);
        setAssignSuccessMsg(null);
      }, 1200);
    },
  });

  // User Status Toggle Mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiClient.patch(`/admin/users/${id}/status`, { status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      if (selectedUserId) {
        queryClient.invalidateQueries({ queryKey: ['admin-user-detail', selectedUserId] });
      }
    },
  });

  // Manual Expiry Scan Mutation
  const triggerExpiryMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/admin/system/trigger-expiry');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-queues'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-plans'] });
    },
  });

  // Broadcast Notification Dispatch Mutation
  const broadcastMutation = useMutation({
    mutationFn: async (payload: typeof broadcastForm) => {
      const res = await apiClient.post('/admin/notifications/broadcast', payload);
      return res.data;
    },
    onSuccess: (res) => {
      setBroadcastResult(res.data);
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });

  const handleBroadcastSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastForm.title.trim() || !broadcastForm.body.trim()) return;
    broadcastMutation.mutate(broadcastForm);
  };

  const applyTemplate = (template: {
    title: string;
    body: string;
    type: string;
    channel: 'both' | 'push' | 'in_app';
    actionUrl: string;
  }) => {
    setBroadcastForm((prev) => ({
      ...prev,
      ...template,
    }));
    setBroadcastResult(null);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const circuitBreakers = [
    { name: 'Meta Instagram Graph API', status: 'CLOSED', latency: '240ms', uptime: '99.98%' },
    { name: 'Meta Facebook Pages API', status: 'CLOSED', latency: '210ms', uptime: '99.99%' },
    { name: 'Meta Threads Publish API', status: 'CLOSED', latency: '380ms', uptime: '99.95%' },
    { name: 'LinkedIn Social Member API', status: 'CLOSED', latency: '195ms', uptime: '99.97%' },
    { name: 'X (Twitter) v2 PKCE API', status: 'CLOSED', latency: '320ms', uptime: '99.91%' },
    { name: 'Reddit Submit Post API', status: 'CLOSED', latency: '180ms', uptime: '100%' },
  ];

  // User Directory Columns Definition
  const userColumns: Column<any>[] = [
    {
      key: 'name',
      header: 'User Profile',
      render: (u) => (
        <div className="flex items-center gap-2.5">
          <Avatar
            src={u.avatar_url || u.profile_image_url}
            alt={u.name || 'User'}
            className="w-8 h-8 border-border ring-1 ring-primary/20 shrink-0"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-foreground text-xs truncate">{u.name || 'Anonymous User'}</span>
              {u.email_verified && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
            </div>
            <p className="text-[11px] text-muted-foreground truncate">{u.email}</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                copyToClipboard(u.id, u.id);
              }}
              className="text-[9px] text-muted-foreground/60 hover:text-foreground font-mono flex items-center gap-1 mt-0.5"
            >
              ID: {u.id.substring(0, 8)}...
              {copiedId === u.id ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
            </button>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role & Tier',
      render: (u) => (
        <div className="space-y-1">
          <Badge
            variant="outline"
            className={`text-[9px] uppercase font-bold py-0.5 ${
              u.role === 'superadmin'
                ? 'border-indigo-500/50 text-indigo-400 bg-indigo-500/10'
                : u.role === 'admin'
                ? 'border-purple-500/50 text-purple-400 bg-purple-500/10'
                : 'border-border text-muted-foreground'
            }`}
          >
            {u.role}
          </Badge>
          <p className="capitalize font-semibold text-primary text-[11px]">{u.plan_name || 'Free Starter'}</p>
        </div>
      ),
    },
    {
      key: 'connected_channels',
      header: 'Platform Setups',
      render: (u) => {
        const channels = Array.isArray(u.connected_channels) ? u.connected_channels : [];
        if (channels.length === 0) {
          return <span className="text-[11px] text-muted-foreground/60 italic">No channels connected</span>;
        }
        return (
          <div className="flex flex-wrap gap-1 max-w-xs">
            {channels.map((ch: any, idx: number) => (
              <Badge key={idx} variant="outline" className="text-[10px] py-0.5 px-2 bg-muted/30 border-border/70 text-foreground gap-1">
                <span className="capitalize font-semibold">{ch.platform}</span>
                {ch.username && <span className="text-muted-foreground font-normal">@{ch.username}</span>}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      key: 'total_posts',
      header: 'Posts',
      render: (u) => (
        <div>
          <span className="font-mono text-xs font-semibold text-foreground">{u.total_posts ?? 0}</span>
          <span className="text-[10px] text-muted-foreground block">posts</span>
        </div>
      ),
    },
    {
      key: 'wallet_balance_paise',
      header: 'Fuel Wallet',
      render: (u) => (
        <span className="font-mono text-xs font-bold text-emerald-400">
          {formatCurrency((u.wallet_balance_paise || 0) / 100)}
        </span>
      ),
    },
    {
      key: 'ai_tokens_used',
      header: 'AI Tokens',
      render: (u) => (
        <span className="font-mono text-[11px] text-muted-foreground">
          {(u.ai_tokens_used || 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (u) => (
        <Badge variant={u.status === 'active' ? 'success' : 'destructive'} className="text-[10px] capitalize font-semibold">
          {u.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (u) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setAssignPlanUser(u);
              setSelectedPlanName(u.plan_name || 'free');
              setAssignPlanModalOpen(true);
            }}
            className="text-[11px] h-7 px-2.5 gap-1 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 hover:border-indigo-500"
          >
            <Package className="w-3 h-3" /> Assign Package
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedUserId(u.id);
              setInspectorSubTab('platforms');
            }}
            className="text-[11px] h-7 px-2.5 gap-1 hover:border-primary hover:text-primary"
          >
            <Eye className="w-3 h-3" /> Inspect Setup
          </Button>

          {u.role !== 'superadmin' ? (
            <Button
              variant="outline"
              size="sm"
              disabled={updateStatusMutation.isPending}
              onClick={() =>
                updateStatusMutation.mutate({
                  id: u.id,
                  status: u.status === 'active' ? 'suspended' : 'active',
                })
              }
              className={`text-[11px] h-7 px-2.5 ${
                u.status === 'active'
                  ? 'hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30'
                  : 'hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/30'
              }`}
            >
              {u.status === 'active' ? 'Suspend' : 'Activate'}
            </Button>
          ) : (
            <Badge variant="outline" className="text-[9px] text-muted-foreground/60">
              Protected
            </Badge>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Platform Governance & Observability Hub
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 ml-10">
            Real-time user directory, connected platform setups, wallet ledgers, BullMQ worker queues, and marketing notifications.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Badge variant="outline" className="text-xs bg-emerald-500/10 border-emerald-500/30 text-emerald-400 gap-1.5 py-1 px-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Platform Operational
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchStats();
              refetchUsers();
              refetchQueues();
              refetchAudit();
            }}
            className="gap-2 text-xs h-8 border-border hover:bg-muted/60"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Telemetry
          </Button>
        </div>
      </div>

      {/* Primary Telemetry Cards (Using StatCard Component) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Platform Users"
          value={statsLoading ? '...' : stats?.users?.total ?? 0}
          subtitle={`${stats?.users?.active ?? 0} active users`}
          icon={Users}
        />

        <StatCard
          title="Queue Workers"
          value="5 Workers"
          subtitle="Publisher · Refresh · Notif · Cleanup · SubExpiry"
          icon={Server}
        />

        <StatCard
          title="AI Generation Logs"
          value={statsLoading ? '...' : (stats?.aiUsage?.tokensConsumed ?? 0).toLocaleString()}
          subtitle={`${stats?.aiUsage?.generations ?? 0} total generations`}
          icon={Coins}
        />

        <StatCard
          title="Push Subscribers"
          value={statsLoading ? '...' : stats?.pushNotifications?.registeredDevices ?? 0}
          subtitle="Firebase Cloud Messaging (FCM)"
          icon={Radio}
        />
      </div>

      {/* Main Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
        <TabsList className="bg-card/70 border border-border/60 p-1 rounded-2xl flex flex-wrap gap-1">
          <TabsTrigger value="users" className="gap-2 text-xs font-semibold rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white">
            <Users className="w-3.5 h-3.5" /> User Directory
            <Badge variant="outline" className="text-[10px] ml-1 py-0 px-1.5 border-primary/30">
              {usersData?.total ?? 0}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="broadcast" className="gap-2 text-xs font-semibold rounded-xl data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
            <Radio className="w-3.5 h-3.5 text-amber-300" /> Broadcast Studio
          </TabsTrigger>
          <TabsTrigger value="queues" className="gap-2 text-xs font-semibold rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white">
            <Server className="w-3.5 h-3.5" /> Background Queues
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-2 text-xs font-semibold rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white">
            <Clock className="w-3.5 h-3.5" /> Security Audit Trail
            <Badge variant="outline" className="text-[10px] ml-1 py-0 px-1.5 border-border">
              {auditData?.total ?? 0}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="plans" className="gap-2 text-xs font-semibold rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white">
            <Package className="w-3.5 h-3.5" /> Packages & Quotas
            <Badge variant="outline" className="text-[10px] ml-1 py-0 px-1.5 border-border">
              {plansData?.length ?? 3}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="overview" className="gap-2 text-xs font-semibold rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white">
            <Activity className="w-3.5 h-3.5" /> Circuit Breakers
          </TabsTrigger>
        </TabsList>

        {/* 1. REAL USER DIRECTORY TAB (PRIMARY FOCUS) */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-foreground">Platform User Governance</h2>
              <p className="text-xs text-muted-foreground">
                Inspect registered users, active subscriptions, connected channels, and wallet fuel.
              </p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
              <Input
                placeholder="Search by name, email, or user ID..."
                value={userSearch}
                onChange={(e) => {
                  setUserSearch(e.target.value);
                  setUserPage(1);
                }}
                className="pl-9 h-9 text-xs"
              />
            </div>
          </div>

          <DataTable
            data={usersData?.data || []}
            columns={userColumns}
            loading={usersLoading}
            emptyMessage="No registered users found matching query."
            rowKey={(u) => u.id}
            pagination={{
              page: userPage,
              pageSize: 15,
              total: usersData?.total || 0,
              onPageChange: (p) => setUserPage(p),
            }}
          />
        </TabsContent>

        {/* 2. DEDICATED PROMOTIONAL & PUSH BROADCAST STUDIO TAB */}
        <TabsContent value="broadcast" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Broadcast Composer Form */}
            <div className="lg:col-span-7">
              <Card className="border-border/80 shadow-md">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Radio className="w-4 h-4 text-indigo-400" /> Platform Notification Broadcast Center
                      </CardTitle>
                      <CardDescription className="text-xs mt-1">
                        Send promotional offers, service updates, and maintenance announcements via WebPush and In-App notifications.
                      </CardDescription>
                    </div>
                    <Badge variant="glow" className="text-[10px]">
                      LIVE DISPATCH
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Preset Templates */}
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                      Quick Presets
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          applyTemplate({
                            title: '⚡ Flash Sale: 50% Off Pro Plans',
                            body: 'Upgrade to PostSpritz Pro today and get unlimited AI captions, image generation, and scheduled threads at half price!',
                            type: 'promotional',
                            channel: 'both',
                            actionUrl: '/dashboard/billing',
                          })
                        }
                        className="text-xs h-7 border-border hover:border-primary/50"
                      >
                        🎁 50% Off Flash Sale
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          applyTemplate({
                            title: '📢 Scheduled Maintenance Window',
                            body: 'PostSpritz will undergo scheduled infrastructure maintenance on Sunday at 02:00 UTC for approx 15 minutes. Scheduled posts will run normally.',
                            type: 'maintenance',
                            channel: 'both',
                            actionUrl: '/dashboard',
                          })
                        }
                        className="text-xs h-7 border-border hover:border-amber-500/50"
                      >
                        ⚠️ System Maintenance
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          applyTemplate({
                            title: '🚀 New Channels Live: Threads & Instagram Carousel',
                            body: 'You can now publish multi-slide carousels and Threads conversations directly from PostSpritz Content Studio!',
                            type: 'feature_update',
                            channel: 'both',
                            actionUrl: '/dashboard/compose',
                          })
                        }
                        className="text-xs h-7 border-border hover:border-indigo-500/50"
                      >
                        🚀 New Feature Release
                      </Button>
                    </div>
                  </div>

                  <form onSubmit={handleBroadcastSubmit} className="space-y-3.5">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-foreground">Notification Title *</label>
                        <span className="text-[10px] text-muted-foreground">{broadcastForm.title.length}/100</span>
                      </div>
                      <Input
                        required
                        maxLength={100}
                        placeholder="e.g. 🎉 Diwali Special: Double Your AI Tokens!"
                        value={broadcastForm.title}
                        onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                        className="text-xs"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-foreground">Message Body *</label>
                        <span className="text-[10px] text-muted-foreground">{broadcastForm.body.length}/350</span>
                      </div>
                      <Textarea
                        required
                        maxLength={350}
                        rows={3}
                        placeholder="Provide details about the promotional offer or system message..."
                        value={broadcastForm.body}
                        onChange={(e) => setBroadcastForm({ ...broadcastForm, body: e.target.value })}
                        className="text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-foreground block mb-1">Type</label>
                        <select
                          value={broadcastForm.type}
                          onChange={(e) => setBroadcastForm({ ...broadcastForm, type: e.target.value })}
                          className="w-full text-xs h-9 rounded-xl border border-border bg-background px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="promotional">Promotional Offer 🎁</option>
                          <option value="system_update">System Update 📢</option>
                          <option value="maintenance">Maintenance ⚠️</option>
                          <option value="security">Security Alert 🔒</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-foreground block mb-1">Target Audience</label>
                        <select
                          value={broadcastForm.targetPlan}
                          onChange={(e) => setBroadcastForm({ ...broadcastForm, targetPlan: e.target.value })}
                          className="w-full text-xs h-9 rounded-xl border border-border bg-background px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="all">All Platform Users</option>
                          <option value="free">Free Creators</option>
                          <option value="pro">Pro Creators</option>
                          <option value="enterprise">Enterprise Agencies</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-foreground block mb-1">Delivery Channel</label>
                        <select
                          value={broadcastForm.channel}
                          onChange={(e) =>
                            setBroadcastForm({
                              ...broadcastForm,
                              channel: e.target.value as 'both' | 'push' | 'in_app',
                            })
                          }
                          className="w-full text-xs h-9 rounded-xl border border-border bg-background px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="both">Both Push (FCM) & In-App</option>
                          <option value="push">WebPush (FCM Only)</option>
                          <option value="in_app">In-App Notification Only</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-foreground block mb-1">Click Action URL (Optional)</label>
                      <Input
                        placeholder="e.g. /dashboard/billing or /dashboard"
                        value={broadcastForm.actionUrl}
                        onChange={(e) => setBroadcastForm({ ...broadcastForm, actionUrl: e.target.value })}
                        className="text-xs"
                      />
                    </div>

                    {broadcastResult && (
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>
                            Delivered to <strong>{broadcastResult.recipients}</strong> user accounts ({broadcastResult.inAppDelivered} In-App, {broadcastResult.pushDispatched} Push Multicasts dispatched).
                          </span>
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={() => setBroadcastResult(null)} className="h-6 text-xs">
                          Dismiss
                        </Button>
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={broadcastMutation.isPending || !broadcastForm.title || !broadcastForm.body}
                      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white gap-2 font-bold py-2 shadow-md shadow-indigo-600/25 text-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {broadcastMutation.isPending ? 'Dispatching Broadcast...' : 'Dispatch Broadcast'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Live Interactive Notification Preview Card */}
            <div className="lg:col-span-5 space-y-4">
              <Card className="border-border/80 shadow-md bg-card/60 backdrop-blur-xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-purple-400" /> Live Simulation Preview
                  </CardTitle>
                  <CardDescription className="text-xs">
                    How users will receive this notice across browser push and in-app feeds.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Browser WebPush Simulation */}
                  <div className="rounded-2xl border border-white/10 bg-[#16181D] p-4 shadow-xl space-y-3">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground pb-2 border-b border-white/5">
                      <div className="flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-primary" />
                        <span className="font-semibold text-foreground">PostSpritz WebPush</span>
                      </div>
                      <span>Just now</span>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF5A1F] to-[#E84712] p-1.5 flex items-center justify-center shrink-0 shadow-md shadow-primary/20">
                        <svg viewBox="0 0 128 128" className="w-full h-full fill-white" aria-label="Logo">
                          <path d="M20 54 103 21c5.7-2.3 11.3 3.3 8.9 9L72 106c-2.1 5-9.4 4.8-11.1-.4L49.4 72.1 15 60c-5.2-1.8-5.1-9.1 5-6Z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate">
                          {broadcastForm.title || 'Notification Headline'}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-3 leading-relaxed">
                          {broadcastForm.body || 'This is where your promotional announcement or system message will appear on user devices.'}
                        </p>
                        <p className="text-[10px] text-indigo-400 font-mono mt-1.5">
                          Tap to open: {broadcastForm.actionUrl || '/dashboard'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* In-App Notification Bell Item Simulation */}
                  <div className="rounded-2xl border border-border/60 bg-muted/20 p-3.5 space-y-2">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span className="font-bold uppercase tracking-wider text-primary">In-App Notification Item</span>
                      <Badge variant="glow" className="text-[9px] capitalize py-0 px-1.5">
                        {broadcastForm.type}
                      </Badge>
                    </div>
                    <p className="text-xs font-bold text-foreground">
                      {broadcastForm.title || 'Headline'}
                    </p>
                    <p className="text-[11px] text-muted-foreground line-clamp-2">
                      {broadcastForm.body || 'Message body...'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* 3. REAL BACKGROUND QUEUES TAB */}
        <TabsContent value="queues" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Publisher Queue */}
            <Card className="border-border/80">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Server className="w-4 h-4 text-primary" /> publisher-queue
                  </CardTitle>
                  <Badge variant="success" className="text-[10px]">ACTIVE POOL</Badge>
                </div>
                <CardDescription className="text-xs">
                  Handles multi-channel social post publication, asset uploading, and provider retry loops.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-3 rounded-xl bg-muted/20 border border-border/50">
                    <span className="text-muted-foreground block text-[10px] uppercase">Active</span>
                    <span className="text-lg font-bold text-indigo-400">{queuesData?.publisher?.active ?? 0}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/20 border border-border/50">
                    <span className="text-muted-foreground block text-[10px] uppercase">Waiting</span>
                    <span className="text-lg font-bold text-amber-400">{queuesData?.publisher?.waiting ?? 0}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/20 border border-border/50">
                    <span className="text-muted-foreground block text-[10px] uppercase">Completed</span>
                    <span className="text-lg font-bold text-emerald-400">{queuesData?.publisher?.completed ?? 0}</span>
                  </div>
                </div>
                <div className="flex justify-between text-[11px] text-muted-foreground pt-1">
                  <span>Delayed / Scheduled: <strong className="text-foreground">{queuesData?.publisher?.delayed ?? 0}</strong></span>
                  <span>Failed: <strong className="text-destructive">{queuesData?.publisher?.failed ?? 0}</strong></span>
                </div>
              </CardContent>
            </Card>

            {/* Token Refresh Queue */}
            <Card className="border-border/80">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-emerald-400" /> token-refresh-queue
                  </CardTitle>
                  <Badge variant="success" className="text-[10px]">CRON 6H</Badge>
                </div>
                <CardDescription className="text-xs">
                  Periodically re-exchanges Facebook 60-day user tokens and refreshes Threads/LinkedIn OAuth tokens.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-3 rounded-xl bg-muted/20 border border-border/50">
                    <span className="text-muted-foreground block text-[10px] uppercase">Active</span>
                    <span className="text-lg font-bold text-indigo-400">{queuesData?.tokenRefresh?.active ?? 0}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/20 border border-border/50">
                    <span className="text-muted-foreground block text-[10px] uppercase">Waiting</span>
                    <span className="text-lg font-bold text-amber-400">{queuesData?.tokenRefresh?.waiting ?? 0}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/20 border border-border/50">
                    <span className="text-muted-foreground block text-[10px] uppercase">Completed</span>
                    <span className="text-lg font-bold text-emerald-400">{queuesData?.tokenRefresh?.completed ?? 0}</span>
                  </div>
                </div>
                <div className="flex justify-between text-[11px] text-muted-foreground pt-1">
                  <span>Auto-proactive refresh threshold: <strong>48 hours before expiry</strong></span>
                </div>
              </CardContent>
            </Card>

            {/* Notification Queue */}
            <Card className="border-border/80">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Bell className="w-4 h-4 text-purple-400" /> notification-queue
                  </CardTitle>
                  <Badge variant="success" className="text-[10px]">SSE / PUSH</Badge>
                </div>
                <CardDescription className="text-xs">
                  Dispatches transactional emails, push alerts (Firebase), and in-app realtime notices.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-3 rounded-xl bg-muted/20 border border-border/50">
                    <span className="text-muted-foreground block text-[10px] uppercase">Active</span>
                    <span className="text-lg font-bold text-indigo-400">{queuesData?.notifications?.active ?? 0}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/20 border border-border/50">
                    <span className="text-muted-foreground block text-[10px] uppercase">Waiting</span>
                    <span className="text-lg font-bold text-amber-400">{queuesData?.notifications?.waiting ?? 0}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/20 border border-border/50">
                    <span className="text-muted-foreground block text-[10px] uppercase">Completed</span>
                    <span className="text-lg font-bold text-emerald-400">{queuesData?.notifications?.completed ?? 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cleanup & Retention Queue */}
            <Card className="border-border/80">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" /> cleanup-queue
                  </CardTitle>
                  <Badge variant="success" className="text-[10px]">DAILY CRON</Badge>
                </div>
                <CardDescription className="text-xs">
                  Purges expired soft-deleted records and rotates audit logs after 30 days.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-3 rounded-xl bg-muted/20 border border-border/50">
                    <span className="text-muted-foreground block text-[10px] uppercase">Active</span>
                    <span className="text-lg font-bold text-indigo-400">{queuesData?.cleanup?.active ?? 0}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/20 border border-border/50">
                    <span className="text-muted-foreground block text-[10px] uppercase">Waiting</span>
                    <span className="text-lg font-bold text-amber-400">{queuesData?.cleanup?.waiting ?? 0}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/20 border border-border/50">
                    <span className="text-muted-foreground block text-[10px] uppercase">Completed</span>
                    <span className="text-lg font-bold text-emerald-400">{queuesData?.cleanup?.completed ?? 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Subscription Expiry Worker Queue */}
            <Card className="border-border/80 md:col-span-2">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Package className="w-4 h-4 text-indigo-400" /> subscription-queue (Package Expiry Engine)
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="success" className="text-[10px]">HOURLY CRON</Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={triggerExpiryMutation.isPending}
                      onClick={() => triggerExpiryMutation.mutate()}
                      className="h-6 text-[10px] px-2.5 border-indigo-500/40 text-indigo-400 hover:bg-indigo-500/10 gap-1"
                    >
                      <RefreshCw className={`w-3 h-3 ${triggerExpiryMutation.isPending ? 'animate-spin' : ''}`} />
                      {triggerExpiryMutation.isPending ? 'Scanning Subscriptions...' : 'Run Expiry Scan Now'}
                    </Button>
                  </div>
                </div>
                <CardDescription className="text-xs">
                  Periodically monitors active package subscriptions. If a package passes its end date, the worker transitions the status to 'expired', issues user alerts, and immediately enforces Free Starter limits.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-3 rounded-xl bg-muted/20 border border-border/50">
                    <span className="text-muted-foreground block text-[10px] uppercase">Active</span>
                    <span className="text-lg font-bold text-indigo-400">{queuesData?.subscriptions?.active ?? 0}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/20 border border-border/50">
                    <span className="text-muted-foreground block text-[10px] uppercase">Waiting</span>
                    <span className="text-lg font-bold text-amber-400">{queuesData?.subscriptions?.waiting ?? 0}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/20 border border-border/50">
                    <span className="text-muted-foreground block text-[10px] uppercase">Completed</span>
                    <span className="text-lg font-bold text-emerald-400">{queuesData?.subscriptions?.completed ?? 0}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/20 border border-border/50">
                    <span className="text-muted-foreground block text-[10px] uppercase">Failed</span>
                    <span className="text-lg font-bold text-destructive">{queuesData?.subscriptions?.failed ?? 0}</span>
                  </div>
                </div>
                <div className="flex justify-between text-[11px] text-muted-foreground pt-1">
                  <span>Recurring automated schedule: <strong>Hourly (0 * * * *)</strong></span>
                  <span>Delayed / Scheduled: <strong className="text-foreground">{queuesData?.subscriptions?.delayed ?? 0}</strong></span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 4. REAL SECURITY AUDIT TRAIL TAB */}
        <TabsContent value="audit" className="space-y-4">
          <div className="flex items-center justify-between pb-1">
            <div>
              <h2 className="text-base font-bold text-foreground">Security & Activity Audit Trail</h2>
              <p className="text-xs text-muted-foreground">
                Chronological record of platform logins, administrative operations, and provider authorizations.
              </p>
            </div>
          </div>

          <DataTable<any>
            data={auditData?.data || []}
            columns={[
              {
                key: 'created_at',
                header: 'Timestamp',
                render: (l: any) => (
                  <span className="text-indigo-400 font-mono text-xs">
                    [{new Date(l.created_at).toLocaleString()}]
                  </span>
                ),
              },
              {
                key: 'action',
                header: 'Action & Event',
                render: (l: any) => (
                  <div>
                    <span className="text-foreground font-semibold text-xs">{l.action}</span>
                    {l.user_email && <p className="text-[11px] text-muted-foreground">Actor: {l.user_email}</p>}
                  </div>
                ),
              },
              {
                key: 'resource_type',
                header: 'Resource',
                render: (l: any) => (
                  <Badge variant="outline" className="text-[9px] uppercase">
                    {l.resource_type || 'SYSTEM'}
                  </Badge>
                ),
              },
              {
                key: 'ip_address',
                header: 'IP Address',
                render: (l: any) => (
                  <span className="text-muted-foreground font-mono text-[11px]">{l.ip_address || '—'}</span>
                ),
              },
            ]}
            loading={auditLoading}
            emptyMessage="No audit logs recorded."
            rowKey={(l: any) => l.id || String(Math.random())}
          />
        </TabsContent>

        {/* 5. CIRCUIT BREAKERS & API HEALTH TAB */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-border/80 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Zap className="w-4 h-4 text-emerald-400" /> Social Publisher Circuit Breakers
                    </CardTitle>
                    <CardDescription className="text-xs mt-1">
                      Fail-safe circuit trip gates preventing cascade failures during platform API outages.
                    </CardDescription>
                  </div>
                  <Badge variant="success" className="text-[10px]">
                    6 / 6 HEALTHY
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {circuitBreakers.map((cb, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-border/60 bg-muted/20 flex items-center justify-between text-xs hover:border-border transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-foreground">{cb.name}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Latency: <span className="font-mono text-foreground">{cb.latency}</span> · Uptime: <span className="text-emerald-400 font-mono">{cb.uptime}</span>
                      </p>
                    </div>
                    <Badge variant="success" className="text-[10px] uppercase font-bold tracking-wide">
                      {cb.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/80 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" /> Platform Core Health
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  Active database connections, Redis pub/sub broker, and background scheduling pipeline.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">PostgreSQL 16 Connection Pool</span>
                    <Badge variant="success" className="text-[10px]">Connected</Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">Redis 7 Cluster & Session Cache</span>
                    <Badge variant="success" className="text-[10px]">Connected (PONG)</Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">Firebase Cloud Messaging Service</span>
                    <Badge variant="success" className="text-[10px]">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">Cloudflare R2 Object Storage</span>
                    <Badge variant="success" className="text-[10px]">Operational</Badge>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-indigo-500/20 bg-indigo-500/5 space-y-1.5">
                  <p className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" /> Proactive Token Refresh Pipeline
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Social token auto-refresh runs periodically every 6 hours, re-exchanging expiring Facebook, Instagram, and Threads tokens before expiration without user downtime.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 6. PACKAGES & QUOTA GUARDRAILS TAB */}
        <TabsContent value="plans" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-foreground">Platform Packages & Quota Guardrails</h2>
              <p className="text-xs text-muted-foreground">
                Configured subscription packages, monthly posting quotas, and account limits. Admins can assign packages directly to any user.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab('users')}
              className="text-xs h-8 gap-1.5 border-primary/40 text-primary hover:bg-primary/10"
            >
              <Users className="w-3.5 h-3.5" /> Go to User Directory to Assign
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(plansData && plansData.length > 0 ? plansData : [
              {
                id: 'p-free',
                name: 'free',
                display_name: 'Free Starter',
                description: 'Default tier for all new signups. Limited posting with guardrails.',
                price_monthly_paise: 0,
                max_social_accounts: 2,
                max_posts_per_month: 30,
                max_ai_generations: 20,
                max_ai_images: 0,
                active_subscribers: 0,
              },
              {
                id: 'p-starter',
                name: 'starter',
                display_name: 'Creator Pro',
                description: 'For active creators looking to boost engagement with multi-channels & AI.',
                price_monthly_paise: 99900,
                max_social_accounts: 10,
                max_posts_per_month: 200,
                max_ai_generations: 150,
                max_ai_images: 20,
                active_subscribers: 0,
              },
              {
                id: 'p-pro',
                name: 'pro',
                display_name: 'Agency & Teams',
                description: 'Full autonomy with high volume scheduling and agency team posting.',
                price_monthly_paise: 299900,
                max_social_accounts: 30,
                max_posts_per_month: 1000,
                max_ai_generations: 1000,
                max_ai_images: 100,
                active_subscribers: 0,
              },
            ]).map((plan: any) => (
              <Card
                key={plan.id}
                className={`border transition-all duration-200 relative overflow-hidden flex flex-col justify-between ${
                  plan.name === 'starter'
                    ? 'border-indigo-500/50 shadow-lg shadow-indigo-500/10 bg-indigo-500/[0.02]'
                    : plan.name === 'pro'
                    ? 'border-purple-500/40 bg-purple-500/[0.02]'
                    : 'border-border/80'
                }`}
              >
                <div>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge
                        variant="outline"
                        className={`text-[9px] uppercase font-bold py-0.5 ${
                          plan.name === 'starter'
                            ? 'border-indigo-500/50 text-indigo-400 bg-indigo-500/10'
                            : plan.name === 'pro'
                            ? 'border-purple-500/50 text-purple-400 bg-purple-500/10'
                            : 'border-border text-muted-foreground'
                        }`}
                      >
                        {plan.name === 'free' ? 'Default Tier' : plan.name === 'starter' ? 'Creator Tier' : 'Agency Tier'}
                      </Badge>
                      <span className="text-[11px] font-mono text-muted-foreground flex items-center gap-1">
                        <Users className="w-3 h-3 text-primary" /> {plan.active_subscribers ?? 0} active
                      </span>
                    </div>

                    <CardTitle className="text-base font-bold text-foreground mt-2">{plan.display_name}</CardTitle>
                    <CardDescription className="text-xs line-clamp-2 mt-1">{plan.description}</CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4 pt-0">
                    <div className="p-3 rounded-xl bg-muted/20 border border-border/50">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold font-mono text-foreground">
                          {formatCurrency((plan.price_monthly_paise || 0) / 100)}
                        </span>
                        <span className="text-xs text-muted-foreground">/ month</span>
                      </div>
                      {plan.price_yearly_paise > 0 && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          or {formatCurrency(plan.price_yearly_paise / 100)} / year
                        </p>
                      )}
                    </div>

                    <div className="space-y-2 text-xs">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Enforced Guardrail Quotas
                      </p>
                      <div className="flex items-center justify-between py-1 border-b border-border/30">
                        <span className="text-muted-foreground">Social Channels</span>
                        <strong className="text-foreground font-mono">{plan.max_social_accounts} accounts</strong>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-border/30">
                        <span className="text-muted-foreground">Posts Quota</span>
                        <strong className="text-foreground font-mono">{plan.max_posts_per_month} posts / mo</strong>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-border/30">
                        <span className="text-muted-foreground">AI Generations</span>
                        <strong className="text-foreground font-mono">{plan.max_ai_generations ?? 20} / mo</strong>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-border/30">
                        <span className="text-muted-foreground">AI Image Generation</span>
                        <strong className="text-foreground font-mono">
                          {plan.max_ai_images && plan.max_ai_images > 0 ? `${plan.max_ai_images} images / mo` : 'Not included (Coming Soon)'}
                        </strong>
                      </div>
                    </div>
                  </CardContent>
                </div>

                <div className="p-4 pt-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedPlanName(plan.name);
                      setActiveTab('users');
                    }}
                    className="w-full text-xs h-8 border-border hover:border-primary hover:text-primary gap-1.5"
                  >
                    <Package className="w-3.5 h-3.5" /> Assign Users to {plan.display_name}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* USER SETUP INSPECTOR MODAL */}
      <Dialog open={!!selectedUserId} onOpenChange={(open) => !open && setSelectedUserId(null)} className="max-w-4xl p-6">
        <DialogHeader className="text-left pb-3 border-b border-border/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar
                src={userDetail?.user?.avatar_url || userDetail?.user?.profile_image_url}
                alt={userDetail?.user?.name || 'User'}
                className="w-12 h-12 border-2 border-primary/20 shrink-0"
              />
              <div>
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  {userDetail?.user?.name || 'User Profile'}
                  <Badge
                    variant="outline"
                    className="text-[9px] uppercase font-bold py-0.5 border-indigo-500/40 text-indigo-400 bg-indigo-500/10"
                  >
                    {userDetail?.user?.role}
                  </Badge>
                  <Badge
                    variant={userDetail?.user?.status === 'active' ? 'success' : 'destructive'}
                    className="text-[9px] capitalize"
                  >
                    {userDetail?.user?.status}
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  {userDetail?.user?.email} · Joined {userDetail?.user?.created_at ? new Date(userDetail.user.created_at).toLocaleDateString() : 'N/A'}
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* Quick Metrics Header Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3">
            <div className="p-2.5 rounded-xl bg-muted/20 border border-border/40 text-center flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-muted-foreground block uppercase font-semibold">Active Plan</span>
                <span className="text-xs font-bold text-primary capitalize">{userDetail?.user?.plan_name || 'Free Starter'}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAssignPlanUser(userDetail.user);
                  setSelectedPlanName(userDetail?.user?.plan_name || 'free');
                  setAssignPlanModalOpen(true);
                }}
                className="mt-1 text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold underline"
              >
                Assign Package
              </button>
            </div>
            <div className="p-2.5 rounded-xl bg-muted/20 border border-border/40 text-center">
              <span className="text-[10px] text-muted-foreground block uppercase font-semibold">Fuel Wallet</span>
              <span className="text-xs font-bold text-emerald-400 font-mono">
                {formatCurrency((userDetail?.user?.wallet_balance_paise || 0) / 100)}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-muted/20 border border-border/40 text-center">
              <span className="text-[10px] text-muted-foreground block uppercase font-semibold">Social Channels</span>
              <span className="text-xs font-bold text-foreground">{userDetail?.socialAccounts?.length ?? 0} Active</span>
            </div>
            <div className="p-2.5 rounded-xl bg-muted/20 border border-border/40 text-center">
              <span className="text-[10px] text-muted-foreground block uppercase font-semibold">FCM Push Devices</span>
              <span className="text-xs font-bold text-purple-400">{userDetail?.fcmDevices?.length ?? 0} Registered</span>
            </div>
          </div>
        </DialogHeader>

        {/* Inspector Sub-Tabs Navigation */}
        <div className="pt-3">
          <div className="flex border-b border-border/60 gap-1 pb-1 text-xs">
            <button
              type="button"
              onClick={() => setInspectorSubTab('platforms')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                inspectorSubTab === 'platforms' ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted/40'
              }`}
            >
              <Share2 className="w-3.5 h-3.5" /> Platform Setups ({userDetail?.socialAccounts?.length ?? 0})
            </button>
            <button
              type="button"
              onClick={() => setInspectorSubTab('posts')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                inspectorSubTab === 'posts' ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted/40'
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> Recent Posts ({userDetail?.recentPosts?.length ?? 0})
            </button>
            <button
              type="button"
              onClick={() => setInspectorSubTab('wallet')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                inspectorSubTab === 'wallet' ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted/40'
              }`}
            >
              <Wallet className="w-3.5 h-3.5" /> Wallet & Transactions
            </button>
            <button
              type="button"
              onClick={() => setInspectorSubTab('devices')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                inspectorSubTab === 'devices' ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted/40'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" /> FCM Devices ({userDetail?.fcmDevices?.length ?? 0})
            </button>
            <button
              type="button"
              onClick={() => setInspectorSubTab('config')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                inspectorSubTab === 'config' ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted/40'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> AI Config & BYOK
            </button>
          </div>

          <div className="pt-4 max-h-[50vh] overflow-y-auto pr-1">
            {userDetailLoading ? (
              <div className="py-12 text-center text-xs text-muted-foreground">Loading account details...</div>
            ) : null}

            {/* Sub-Tab 1: Platform Setups */}
            {inspectorSubTab === 'platforms' && (
              <div className="space-y-2.5">
                {!userDetail?.socialAccounts || userDetail.socialAccounts.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-xl bg-muted/10">
                    <Share2 className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="font-semibold text-foreground">No Social Channels Connected</p>
                    <p className="mt-1">User has not authorized any accounts yet.</p>
                  </div>
                ) : (
                  userDetail.socialAccounts.map((acc: any) => (
                    <div
                      key={acc.id}
                      className="p-3.5 rounded-xl border border-border/70 bg-muted/20 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar src={acc.avatar_url} alt={acc.account_name} className="w-9 h-9 border-border shrink-0" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground text-xs">{acc.account_name || 'Account'}</span>
                            <Badge variant="outline" className="text-[10px] uppercase font-bold py-0 text-primary border-primary/30">
                              {acc.platform}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            {acc.platform_username ? `@${acc.platform_username}` : 'No username set'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={acc.status === 'active' ? 'success' : 'destructive'} className="text-[10px] capitalize">
                          {acc.status}
                        </Badge>
                        <p className="text-[10px] text-muted-foreground font-mono mt-1">
                          Connected {new Date(acc.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Sub-Tab 2: Recent Posts */}
            {inspectorSubTab === 'posts' && (
              <div className="space-y-2.5">
                {!userDetail?.recentPosts || userDetail.recentPosts.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-xl bg-muted/10">
                    <FileText className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="font-semibold text-foreground">No Posts Created</p>
                    <p className="mt-1">User has not created or scheduled any posts yet.</p>
                  </div>
                ) : (
                  userDetail.recentPosts.map((post: any) => (
                    <div
                      key={post.id}
                      className="p-3.5 rounded-xl border border-border/70 bg-muted/20 space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <Badge
                          variant={post.status === 'published' ? 'success' : post.status === 'scheduled' ? 'outline' : 'secondary'}
                          className="text-[10px] capitalize"
                        >
                          {post.status}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {new Date(post.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-foreground text-xs line-clamp-2 leading-relaxed">
                        {post.caption || '(No caption text)'}
                      </p>
                      {post.scheduled_at && (
                        <p className="text-[10px] text-indigo-400 font-mono">
                          Scheduled for: {new Date(post.scheduled_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Sub-Tab 3: Fuel Wallet & Ledger */}
            {inspectorSubTab === 'wallet' && (
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-500/20 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-400 block">Available Fuel Balance</span>
                    <span className="text-2xl font-bold text-foreground font-mono">
                      {formatCurrency((userDetail?.user?.wallet_balance_paise || 0) / 100)}
                    </span>
                  </div>
                  <Badge variant="success" className="text-xs">
                    {(userDetail?.user?.wallet_balance_paise || 0) > 0 ? 'Funded' : 'Zero Balance'}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Recent Wallet Transaction Ledger
                  </p>
                  {!userDetail?.transactions || userDetail.transactions.length === 0 ? (
                    <div className="p-6 text-center text-xs text-muted-foreground border border-dashed rounded-xl bg-muted/10">
                      No wallet transactions recorded.
                    </div>
                  ) : (
                    userDetail.transactions.map((tx: any) => (
                      <div
                        key={tx.id}
                        className="p-3 rounded-xl border border-border/60 bg-muted/20 flex items-center justify-between text-xs font-mono"
                      >
                        <div>
                          <p className="font-semibold text-foreground font-sans">{tx.description || tx.type}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(tx.created_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`font-bold ${
                              tx.type === 'credit' ? 'text-emerald-400' : 'text-amber-400'
                            }`}
                          >
                            {tx.type === 'credit' ? '+' : '-'}{formatCurrency(Math.abs(tx.amount_paise) / 100)}
                          </span>
                          <span className="text-[10px] text-muted-foreground block">
                            Bal: {formatCurrency((tx.balance_after_paise || 0) / 100)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Sub-Tab 4: Registered Push Devices */}
            {inspectorSubTab === 'devices' && (
              <div className="space-y-2.5">
                {!userDetail?.fcmDevices || userDetail.fcmDevices.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-xl bg-muted/10">
                    <Smartphone className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="font-semibold text-foreground">No FCM Push Devices Registered</p>
                    <p className="mt-1">User has not registered any web push tokens.</p>
                  </div>
                ) : (
                  userDetail.fcmDevices.map((dev: any) => (
                    <div
                      key={dev.id}
                      className="p-3.5 rounded-xl border border-border/70 bg-muted/20 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] uppercase font-bold text-purple-400 border-purple-500/30">
                            {dev.device_type || 'web'}
                          </Badge>
                          <span className="text-foreground font-medium truncate max-w-md">
                            {dev.user_agent || 'Browser Web Client'}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          Registered {new Date(dev.created_at).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant="success" className="text-[9px]">
                        ACTIVE TOKEN
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Sub-Tab 5: AI Config & BYOK */}
            {inspectorSubTab === 'config' && (
              <div className="space-y-3">
                <div className="p-4 rounded-xl border border-border/70 bg-muted/20 space-y-2 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-border/50">
                    <span className="font-semibold text-foreground">AI Configuration Mode</span>
                    <Badge variant="outline" className="text-[10px] text-primary">
                      {userDetail?.user?.ai_config?.byokEnabled ? 'BYOK (Personal API Key)' : 'PostSpritz Managed AI Engine'}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-muted-foreground">
                    <p>
                      Preferred Tone:{' '}
                      <strong className="text-foreground">{userDetail?.user?.preferences?.tone || 'Professional & Engaging'}</strong>
                    </p>
                    <p>
                      Default Language:{' '}
                      <strong className="text-foreground">{userDetail?.user?.preferences?.language || 'English (US)'}</strong>
                    </p>
                    <p>
                      Brand Hashtags:{' '}
                      <strong className="text-foreground">
                        {userDetail?.user?.preferences?.defaultHashtags?.join(' ') || 'None specified'}
                      </strong>
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-muted/10 border border-border/40 font-mono text-[11px] max-h-40 overflow-y-auto">
                  <pre>{JSON.stringify(userDetail?.user?.preferences || {}, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between">
          <div>
            {userDetail?.user?.role !== 'superadmin' && (
              <Button
                variant="outline"
                size="sm"
                disabled={updateStatusMutation.isPending}
                onClick={() => {
                  updateStatusMutation.mutate({
                    id: userDetail.user.id,
                    status: userDetail.user.status === 'active' ? 'suspended' : 'active',
                  });
                }}
                className={`text-xs ${
                  userDetail?.user?.status === 'active'
                    ? 'hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30'
                    : 'hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/30'
                }`}
              >
                {userDetail?.user?.status === 'active' ? 'Suspend Account' : 'Reactivate Account'}
              </Button>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={() => setSelectedUserId(null)} className="text-xs">
            Close Inspector
          </Button>
        </DialogFooter>
      </Dialog>

      {/* ASSIGN PACKAGE & TIER MODAL */}
      <Dialog open={assignPlanModalOpen} onOpenChange={(open) => !open && setAssignPlanModalOpen(false)} className="max-w-xl p-6">
        <DialogHeader className="text-left pb-3 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Package className="w-5 h-5" />
            </span>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Assign Package & Quota Guardrails
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Target User: <strong className="text-foreground">{assignPlanUser?.name || 'User'}</strong> ({assignPlanUser?.email})
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-muted/20 border border-border/40">
            <span className="text-muted-foreground">Current Active Plan:</span>
            <Badge variant="outline" className="capitalize text-xs font-bold text-primary border-primary/30">
              {assignPlanUser?.plan_name || 'Free Starter'}
            </Badge>
          </div>

          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
              Select Package Tier
            </label>
            <div className="space-y-2.5">
              {[
                {
                  id: 'free',
                  name: 'free',
                  title: 'Free Starter',
                  price: '₹0 / mo',
                  channels: '2 Channels',
                  posts: '30 Posts / mo',
                  desc: 'Default tier with guardrails for exploration',
                  badge: 'Free Tier',
                },
                {
                  id: 'starter',
                  name: 'starter',
                  title: 'Creator Pro',
                  price: '₹999 / mo',
                  channels: '10 Channels',
                  posts: '200 Posts / mo',
                  desc: 'Multi-account posting, 150 AI captions, 20 AI images',
                  badge: 'Most Popular',
                },
                {
                  id: 'pro',
                  name: 'pro',
                  title: 'Agency & Teams',
                  price: '₹2,999 / mo',
                  channels: '30 Channels',
                  posts: '1,000 Posts / mo',
                  desc: 'High-volume scheduling, 1000 AI gens, 100 AI images',
                  badge: 'Unlimited Power',
                },
              ].map((tier) => (
                <div
                  key={tier.id}
                  onClick={() => setSelectedPlanName(tier.name)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 text-xs ${
                    selectedPlanName === tier.name
                      ? 'border-indigo-500 bg-indigo-500/10 shadow-sm shadow-indigo-500/20 ring-1 ring-indigo-500/30'
                      : 'border-border/60 bg-muted/10 hover:border-border hover:bg-muted/30'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground text-xs">{tier.title}</span>
                      <Badge variant="outline" className="text-[9px] py-0 px-1.5 border-border">
                        {tier.badge}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{tier.desc}</p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono pt-1">
                      <span className="text-foreground font-semibold">{tier.channels}</span>
                      <span>•</span>
                      <span className="text-foreground font-semibold">{tier.posts}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono font-bold text-foreground block text-xs">{tier.price}</span>
                    <input
                      type="radio"
                      name="tier_select"
                      checked={selectedPlanName === tier.name}
                      onChange={() => setSelectedPlanName(tier.name)}
                      className="mt-1.5 text-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
              Billing Cycle Duration
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setSelectedBillingCycle('monthly')}
                className={`py-2 px-3 rounded-xl border text-center font-semibold transition-colors ${
                  selectedBillingCycle === 'monthly'
                    ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
                    : 'border-border text-muted-foreground hover:bg-muted/30'
                }`}
              >
                Monthly (30 Days)
              </button>
              <button
                type="button"
                onClick={() => setSelectedBillingCycle('yearly')}
                className={`py-2 px-3 rounded-xl border text-center font-semibold transition-colors ${
                  selectedBillingCycle === 'yearly'
                    ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
                    : 'border-border text-muted-foreground hover:bg-muted/30'
                }`}
              >
                Yearly (365 Days)
              </button>
            </div>
          </div>

          {assignSuccessMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{assignSuccessMsg}</span>
            </div>
          )}
        </div>

        <DialogFooter className="pt-3 border-t border-border/60 flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setAssignPlanModalOpen(false)}
            className="text-xs"
          >
            Cancel
          </Button>

          <Button
            type="button"
            size="sm"
            disabled={assignPlanMutation.isPending || !assignPlanUser}
            onClick={() => {
              if (assignPlanUser) {
                assignPlanMutation.mutate({
                  userId: assignPlanUser.id,
                  plan: selectedPlanName,
                  billingCycle: selectedBillingCycle,
                });
              }
            }}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs gap-1.5 shadow-md shadow-indigo-600/20"
          >
            {assignPlanMutation.isPending ? 'Assigning Package...' : 'Confirm & Assign Package'}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
