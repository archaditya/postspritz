'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Sparkles,
  Coins,
  Activity,
  Search,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Database,
  Cpu,
  ArrowUpRight,
  TrendingUp,
  Filter,
  Eye,
  FileCode2,
  Calendar,
  Layers,
  Send,
  Zap,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { StatCard } from '@/components/StatCard';

interface AdminObservabilityViewProps {
  onRefreshParent?: () => void;
}

export function AdminObservabilityView({ onRefreshParent }: AdminObservabilityViewProps) {
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d' | '6m' | '1y'>('30d');
  const [subTab, setSubTab] = useState<'llm' | 'audit' | 'reliability'>('llm');

  // LLM Filters
  const [llmPage, setLlmPage] = useState(1);
  const [llmSearch, setLlmSearch] = useState('');
  const [llmModel, setLlmModel] = useState('');
  const [llmPurpose, setLlmPurpose] = useState('');
  const [llmStatus, setLlmStatus] = useState('');
  const [selectedLlmCall, setSelectedLlmCall] = useState<any | null>(null);

  // Audit Filters
  const [auditPage, setAuditPage] = useState(1);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditEntity, setAuditEntity] = useState('');
  const [auditAction, setAuditAction] = useState('');
  const [selectedAuditLog, setSelectedAuditLog] = useState<any | null>(null);

  // 1. Fetch LLM Calls & Metrics
  const {
    data: llmData,
    isLoading: llmLoading,
    refetch: refetchLlm,
  } = useQuery({
    queryKey: ['admin-observability-llm', timeframe, llmPage, llmSearch, llmModel, llmPurpose, llmStatus],
    queryFn: async () => {
      const res = await apiClient.get('/admin/observability/llm-calls', {
        params: {
          page: llmPage,
          limit: 15,
          timeframe,
          search: llmSearch || undefined,
          model: llmModel || undefined,
          purpose: llmPurpose || undefined,
          status: llmStatus || undefined,
        },
      });
      return res.data.data;
    },
    refetchInterval: 15000,
  });

  // 2. Fetch Complete Audit Logs
  const {
    data: auditData,
    isLoading: auditLoading,
    refetch: refetchAudit,
  } = useQuery({
    queryKey: ['admin-observability-audit', timeframe, auditPage, auditSearch, auditEntity, auditAction],
    queryFn: async () => {
      const res = await apiClient.get('/admin/observability/audit-logs', {
        params: {
          page: auditPage,
          limit: 20,
          timeframe,
          search: auditSearch || undefined,
          entity: auditEntity || undefined,
          action: auditAction || undefined,
        },
      });
      return res.data.data;
    },
    refetchInterval: 15000,
  });

  // 3. Fetch Reliability & Cost Trends
  const {
    data: reliabilityData,
    isLoading: reliabilityLoading,
    refetch: refetchReliability,
  } = useQuery({
    queryKey: ['admin-observability-reliability', timeframe],
    queryFn: async () => {
      const res = await apiClient.get('/admin/observability/reliability', {
        params: { timeframe },
      });
      return res.data.data;
    },
    refetchInterval: 30000,
  });

  const summary = llmData?.summary || {
    totalCalls: 0,
    totalTokens: 0,
    totalPromptTokens: 0,
    totalCompletionTokens: 0,
    totalCostUsd: 0,
    avgLatencyMs: 0,
    failedCalls: 0,
    successRate: 100,
  };

  const handleRefreshAll = () => {
    refetchLlm();
    refetchAudit();
    refetchReliability();
    if (onRefreshParent) onRefreshParent();
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Timeframe Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/60 border border-border/80 p-4 rounded-2xl backdrop-blur-md shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-foreground">System Observability & Auditing Hub</h2>
            <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-300 border-purple-500/30">
              Production Telemetry
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Trace LLM token usage, calculate multi-month run rates, audit system mutations, and inspect vector queries.
          </p>
        </div>

        {/* Timeframe Filter Buttons */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border/60 text-xs">
            {(['24h', '7d', '30d', '6m', '1y'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => {
                  setTimeframe(tf);
                  setLlmPage(1);
                  setAuditPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  timeframe === tf
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tf === '24h' ? '24 Hours' : tf === '7d' ? '7 Days' : tf === '30d' ? '30 Days' : tf === '6m' ? '6 Months' : '1 Year'}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            className="h-8 gap-1.5 text-xs border-border"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total AI Invocations"
          value={llmLoading ? '...' : summary.totalCalls.toLocaleString()}
          subtitle={`${summary.successRate}% success rate (${summary.failedCalls} errors)`}
          icon={Cpu}
        />

        <StatCard
          title="Tokens Consumed"
          value={llmLoading ? '...' : summary.totalTokens.toLocaleString()}
          subtitle={`Prompt: ${summary.totalPromptTokens.toLocaleString()} · Out: ${summary.totalCompletionTokens.toLocaleString()}`}
          icon={Coins}
        />

        <StatCard
          title="Total Estimated AI Cost"
          value={llmLoading ? '...' : `$${summary.totalCostUsd.toFixed(4)}`}
          subtitle={`Run-rate: ~$${(summary.totalCostUsd * (timeframe === '24h' ? 365 : timeframe === '7d' ? 52 : timeframe === '30d' ? 12 : 1)).toFixed(2)} / yr`}
          icon={TrendingUp}
        />

        <StatCard
          title="Post Delivery Reliability"
          value={
            reliabilityLoading
              ? '...'
              : `${reliabilityData?.postReliability?.successful_dispatches ?? 0} Published`
          }
          subtitle={`${reliabilityData?.postReliability?.failed_dispatches ?? 0} failed · ${reliabilityData?.postReliability?.active_in_queue ?? 0} active/scheduled`}
          icon={Send}
        />
      </div>

      {/* Observability Section Navigation Tabs */}
      <div className="flex border-b border-border/80 gap-6 text-sm font-medium">
        <button
          onClick={() => setSubTab('llm')}
          className={`pb-2.5 flex items-center gap-2 border-b-2 transition-all ${
            subTab === 'llm'
              ? 'border-purple-500 text-purple-400 font-bold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Cpu className="w-4 h-4" /> LLM Call Tracing & Embeddings ({llmData?.total ?? 0})
        </button>
        <button
          onClick={() => setSubTab('audit')}
          className={`pb-2.5 flex items-center gap-2 border-b-2 transition-all ${
            subTab === 'audit'
              ? 'border-purple-500 text-purple-400 font-bold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Database className="w-4 h-4" /> System Audit Trail ({auditData?.total ?? 0})
        </button>
        <button
          onClick={() => setSubTab('reliability')}
          className={`pb-2.5 flex items-center gap-2 border-b-2 transition-all ${
            subTab === 'reliability'
              ? 'border-purple-500 text-purple-400 font-bold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Activity className="w-4 h-4" /> 1-Year Cost Trends & Dispatch Health
        </button>
      </div>

      {/* 1. LLM CALL TRACING VIEW */}
      {subTab === 'llm' && (
        <Card className="border-border/70 bg-card/60 backdrop-blur-md">
          <CardHeader className="pb-3 border-b border-border/50">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-purple-400" /> Granular LLM Traces & Vector Queries
                </CardTitle>
                <CardDescription className="text-xs">
                  Every prompt, token count, latency, estimated cost, and vector embedding indexed for semantic search.
                </CardDescription>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-[200px]">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search prompt or preview..."
                    value={llmSearch}
                    onChange={(e) => {
                      setLlmSearch(e.target.value);
                      setLlmPage(1);
                    }}
                    className="h-8 pl-8 text-xs bg-muted/40"
                  />
                </div>

                <select
                  value={llmModel}
                  onChange={(e) => {
                    setLlmModel(e.target.value);
                    setLlmPage(1);
                  }}
                  className="h-8 rounded-lg border border-border bg-muted/40 text-xs px-2 text-foreground"
                >
                  <option value="">All Models</option>
                  <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                  <option value="gpt-4o">GPT-4o</option>
                  <option value="imagen-3">Imagen 3</option>
                </select>

                <select
                  value={llmPurpose}
                  onChange={(e) => {
                    setLlmPurpose(e.target.value);
                    setLlmPage(1);
                  }}
                  className="h-8 rounded-lg border border-border bg-muted/40 text-xs px-2 text-foreground"
                >
                  <option value="">All Purposes</option>
                  <option value="post_text_generation">Post Generation</option>
                  <option value="visual_prompt_expansion">Visual Expansion</option>
                  <option value="guardrail_eval">Guardrail Evaluation</option>
                </select>

                <select
                  value={llmStatus}
                  onChange={(e) => {
                    setLlmStatus(e.target.value);
                    setLlmPage(1);
                  }}
                  className="h-8 rounded-lg border border-border bg-muted/40 text-xs px-2 text-foreground"
                >
                  <option value="">All Statuses</option>
                  <option value="success">Success</option>
                  <option value="failed">Failed</option>
                  <option value="guardrail_flagged">Guardrail Flagged</option>
                </select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {llmLoading ? (
              <div className="py-16 text-center text-xs text-muted-foreground">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-purple-400" />
                Querying observability telemetry...
              </div>
            ) : !llmData?.calls || llmData.calls.length === 0 ? (
              <div className="py-16 text-center text-xs text-muted-foreground">
                No LLM calls found matching the selected timeframe and filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border/50">
                    <tr>
                      <th className="px-4 py-2.5">Timestamp</th>
                      <th className="px-4 py-2.5">User / Initiator</th>
                      <th className="px-4 py-2.5">Purpose</th>
                      <th className="px-4 py-2.5">Model</th>
                      <th className="px-4 py-2.5">Tokens (In/Out)</th>
                      <th className="px-4 py-2.5">Est. Cost</th>
                      <th className="px-4 py-2.5">Latency</th>
                      <th className="px-4 py-2.5">Status</th>
                      <th className="px-4 py-2.5 text-right">Inspect</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 font-mono">
                    {llmData.calls.map((call: any) => (
                      <tr key={call.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                          {new Date(call.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          <span className="block text-[10px] opacity-70">
                            {new Date(call.created_at).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 font-sans whitespace-nowrap">
                          {call.user_email ? (
                            <div>
                              <span className="font-semibold text-foreground text-xs block">{call.user_name || 'User'}</span>
                              <span className="text-[10px] text-muted-foreground">{call.user_email}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic">System / Worker</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <Badge variant="outline" className="text-[10px] bg-muted/60 border-border capitalize font-sans">
                            {call.purpose.replace(/_/g, ' ')}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap font-semibold text-foreground">
                          {call.model}
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <span className="text-foreground">{call.total_tokens.toLocaleString()}</span>
                          <span className="text-[10px] text-muted-foreground block">
                            {call.prompt_tokens} in / {call.completion_tokens} out
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-emerald-400 font-semibold whitespace-nowrap">
                          ${Number(call.estimated_cost_usd).toFixed(5)}
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                          {call.latency_ms}ms
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <Badge
                            variant={call.status === 'success' ? 'success' : 'destructive'}
                            className="text-[10px] capitalize font-sans"
                          >
                            {call.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5 text-right whitespace-nowrap font-sans">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedLlmCall(call)}
                            className="h-7 text-xs px-2 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" /> View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {llmData && llmData.totalPages > 1 && (
              <div className="flex items-center justify-between p-3 border-t border-border/50 text-xs">
                <span className="text-muted-foreground">
                  Page {llmPage} of {llmData.totalPages} ({llmData.total} total traces)
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={llmPage <= 1}
                    onClick={() => setLlmPage((p) => Math.max(1, p - 1))}
                    className="h-7 text-xs"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={llmPage >= llmData.totalPages}
                    onClick={() => setLlmPage((p) => p + 1)}
                    className="h-7 text-xs"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 2. SYSTEM AUDIT TRAIL VIEW */}
      {subTab === 'audit' && (
        <Card className="border-border/70 bg-card/60 backdrop-blur-md">
          <CardHeader className="pb-3 border-b border-border/50">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Database className="w-4 h-4 text-purple-400" /> Unified Immutable Audit Log
                </CardTitle>
                <CardDescription className="text-xs">
                  All create, update, delete, scheduling, and billing actions across the platform for compliance.
                </CardDescription>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-[200px]">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search action or entity..."
                    value={auditSearch}
                    onChange={(e) => {
                      setAuditSearch(e.target.value);
                      setAuditPage(1);
                    }}
                    className="h-8 pl-8 text-xs bg-muted/40"
                  />
                </div>

                <select
                  value={auditEntity}
                  onChange={(e) => {
                    setAuditEntity(e.target.value);
                    setAuditPage(1);
                  }}
                  className="h-8 rounded-lg border border-border bg-muted/40 text-xs px-2 text-foreground"
                >
                  <option value="">All Entities</option>
                  <option value="posts">Posts</option>
                  <option value="users">Users</option>
                  <option value="social_accounts">Social Accounts</option>
                  <option value="subscriptions">Subscriptions</option>
                  <option value="contact_messages">Support Tickets</option>
                </select>

                <select
                  value={auditAction}
                  onChange={(e) => {
                    setAuditAction(e.target.value);
                    setAuditPage(1);
                  }}
                  className="h-8 rounded-lg border border-border bg-muted/40 text-xs px-2 text-foreground"
                >
                  <option value="">All Actions</option>
                  <option value="POST_SCHEDULED">Post Scheduled</option>
                  <option value="POST_DISPATCHED">Post Dispatched</option>
                  <option value="POST_DELETED">Post Deleted</option>
                  <option value="ASSIGN_PACKAGE">Package Assigned</option>
                  <option value="CONNECT_ACCOUNT">Account Connected</option>
                </select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {auditLoading ? (
              <div className="py-16 text-center text-xs text-muted-foreground">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-purple-400" />
                Loading audit ledger...
              </div>
            ) : !auditData?.logs || auditData.logs.length === 0 ? (
              <div className="py-16 text-center text-xs text-muted-foreground">
                No audit logs found for the selected parameters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border/50">
                    <tr>
                      <th className="px-4 py-2.5">Timestamp</th>
                      <th className="px-4 py-2.5">Actor</th>
                      <th className="px-4 py-2.5">Action</th>
                      <th className="px-4 py-2.5">Entity & Record ID</th>
                      <th className="px-4 py-2.5">IP Address</th>
                      <th className="px-4 py-2.5">Status</th>
                      <th className="px-4 py-2.5 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 font-mono">
                    {auditData.logs.map((log: any) => (
                      <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                          {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          <span className="block text-[10px] opacity-70">
                            {new Date(log.created_at).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 font-sans whitespace-nowrap">
                          <span className="font-semibold text-foreground text-xs block">{log.user_email || 'System'}</span>
                          <span className="text-[10px] text-muted-foreground uppercase">{log.actor_role || 'system'}</span>
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-300 border-purple-500/20 font-mono">
                            {log.action}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <span className="text-foreground capitalize font-sans font-semibold">{log.entity || 'system'}</span>
                          {log.entity_id && (
                            <span className="text-[10px] text-muted-foreground block truncate max-w-[140px]">
                              {log.entity_id}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                          {log.ip_address || 'Internal/Cron'}
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap font-sans">
                          <Badge
                            variant={log.status === 'success' ? 'success' : 'destructive'}
                            className="text-[10px] capitalize"
                          >
                            {log.status || 'success'}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5 text-right whitespace-nowrap font-sans">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedAuditLog(log)}
                            className="h-7 text-xs px-2 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                          >
                            <FileCode2 className="w-3.5 h-3.5 mr-1" /> Diff
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {auditData && auditData.totalPages > 1 && (
              <div className="flex items-center justify-between p-3 border-t border-border/50 text-xs">
                <span className="text-muted-foreground">
                  Page {auditPage} of {auditData.totalPages} ({auditData.total} entries)
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={auditPage <= 1}
                    onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
                    className="h-7 text-xs"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={auditPage >= auditData.totalPages}
                    onClick={() => setAuditPage((p) => p + 1)}
                    className="h-7 text-xs"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 3. 1-YEAR COST TRENDS & RELIABILITY VIEW */}
      {subTab === 'reliability' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Historical Cost & Token Chart */}
          <Card className="border-border/70 bg-card/60 backdrop-blur-md">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" /> 12-Month Historical Cost & Token Trajectory
              </CardTitle>
              <CardDescription className="text-xs">
                Monthly aggregated AI spend for long-term audit & budget planning.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {reliabilityLoading ? (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  Loading trend data...
                </div>
              ) : !reliabilityData?.monthlyCostTrend || reliabilityData.monthlyCostTrend.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  No historical month data available yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {reliabilityData.monthlyCostTrend.map((m: any) => (
                    <div key={m.month} className="p-3 rounded-xl bg-muted/30 border border-border/50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-xs font-bold">
                          {m.month}
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-foreground block">
                            {Number(m.call_count).toLocaleString()} Invocations
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {Number(m.tokens).toLocaleString()} total tokens consumed
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-emerald-400 font-mono block">
                          ${Number(m.cost_usd).toFixed(4)}
                        </span>
                        <span className="text-[10px] text-muted-foreground">USD Spend</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delivery & Reliability Breakdown */}
          <Card className="border-border/70 bg-card/60 backdrop-blur-md">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Send className="w-4 h-4 text-purple-400" /> Multi-Platform Dispatch & Push Delivery
              </CardTitle>
              <CardDescription className="text-xs">
                Target publishing outcomes, retry rates, and notification channels breakdown.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-muted/40 border border-border/50">
                  <span className="text-[11px] text-muted-foreground block">Total Dispatches</span>
                  <span className="text-lg font-bold text-foreground">
                    {reliabilityData?.postReliability?.total_dispatches ?? 0}
                  </span>
                  <span className="text-[10px] text-emerald-400 block mt-0.5">
                    {reliabilityData?.postReliability?.successful_dispatches ?? 0} Successful
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-muted/40 border border-border/50">
                  <span className="text-[11px] text-muted-foreground block">Dispatch Failures</span>
                  <span className="text-lg font-bold text-rose-400">
                    {reliabilityData?.postReliability?.failed_dispatches ?? 0}
                  </span>
                  <span className="text-[10px] text-muted-foreground block mt-0.5">
                    Avg Retries: {reliabilityData?.postReliability?.avg_retries ?? 0}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-muted/40 border border-border/50">
                  <span className="text-[11px] text-muted-foreground block">FCM Push Delivery</span>
                  <span className="text-lg font-bold text-foreground">
                    {reliabilityData?.notificationReliability?.fcm_sent_count ?? 0}
                  </span>
                  <span className="text-[10px] text-muted-foreground block mt-0.5">Active mobile/browser devices</span>
                </div>

                <div className="p-3 rounded-xl bg-muted/40 border border-border/50">
                  <span className="text-[11px] text-muted-foreground block">Email Notifications</span>
                  <span className="text-lg font-bold text-foreground">
                    {reliabilityData?.notificationReliability?.email_sent_count ?? 0}
                  </span>
                  <span className="text-[10px] text-muted-foreground block mt-0.5">Transactional updates</span>
                </div>
              </div>

              {/* Vector & Embeddings Engine Status */}
              <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5" /> Vector Embedding & Full-Text Search Engine
                  </span>
                  <Badge variant="outline" className="text-[10px] bg-purple-500/20 text-purple-200 border-purple-500/40">
                    Active
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  PostgreSQL GIN indexing on <code className="text-purple-300">search_vector</code> (plainto_tsquery) coupled with float vector embeddings allows sub-10ms keyword and semantic lookups across months of LLM prompts and audit traces.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal / Drawer for LLM Call Inspection */}
      {selectedLlmCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl shadow-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">LLM Call Inspector</h3>
                  <span className="text-[10px] text-muted-foreground font-mono">{selectedLlmCall.id}</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedLlmCall(null)}
                className="h-8 w-8 p-0"
              >
                ✕
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-muted/40 border border-border/50">
                <span className="text-[10px] text-muted-foreground block">Model</span>
                <span className="font-bold text-foreground">{selectedLlmCall.model}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-muted/40 border border-border/50">
                <span className="text-[10px] text-muted-foreground block">Tokens</span>
                <span className="font-bold text-foreground">{selectedLlmCall.total_tokens.toLocaleString()}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-muted/40 border border-border/50">
                <span className="text-[10px] text-muted-foreground block">Est. Cost</span>
                <span className="font-bold text-emerald-400 font-mono">${Number(selectedLlmCall.estimated_cost_usd).toFixed(5)}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-muted/40 border border-border/50">
                <span className="text-[10px] text-muted-foreground block">Latency</span>
                <span className="font-bold text-foreground">{selectedLlmCall.latency_ms}ms</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">User / Initiator Prompt:</label>
              <div className="p-3 rounded-xl bg-muted/50 border border-border text-xs font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
                {selectedLlmCall.prompt}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Generated Response Preview:</label>
              <div className="p-3 rounded-xl bg-muted/50 border border-border text-xs font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
                {selectedLlmCall.response_preview || 'No text preview available'}
              </div>
            </div>

            {selectedLlmCall.metadata && Object.keys(selectedLlmCall.metadata).length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Metadata & Vector Details:</label>
                <pre className="p-3 rounded-xl bg-muted/50 border border-border text-[11px] font-mono text-muted-foreground overflow-x-auto">
                  {JSON.stringify(
                    {
                      ...selectedLlmCall.metadata,
                      embedding_model: selectedLlmCall.embedding_model,
                      vector_dimensions: 1536,
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button size="sm" onClick={() => setSelectedLlmCall(null)} className="text-xs">
                Close Inspector
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal / Drawer for Audit Log Diff Inspection */}
      {selectedAuditLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl shadow-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Audit Record & Changes Diff</h3>
                  <span className="text-[10px] text-muted-foreground font-mono">{selectedAuditLog.id}</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedAuditLog(null)}
                className="h-8 w-8 p-0"
              >
                ✕
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-muted/40 border border-border/50">
                <span className="text-[10px] text-muted-foreground block">Action</span>
                <span className="font-bold text-foreground font-mono">{selectedAuditLog.action}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-muted/40 border border-border/50">
                <span className="text-[10px] text-muted-foreground block">Entity</span>
                <span className="font-bold text-foreground capitalize">{selectedAuditLog.entity || 'System'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-muted/40 border border-border/50">
                <span className="text-[10px] text-muted-foreground block">Actor</span>
                <span className="font-bold text-foreground truncate block">{selectedAuditLog.user_email || 'System'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-muted/40 border border-border/50">
                <span className="text-[10px] text-muted-foreground block">Status</span>
                <span className="font-bold text-emerald-400 capitalize">{selectedAuditLog.status || 'Success'}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Details & Payload:</label>
              <pre className="p-3 rounded-xl bg-muted/50 border border-border text-xs font-mono overflow-x-auto">
                {JSON.stringify(selectedAuditLog.details || {}, null, 2)}
              </pre>
            </div>

            {selectedAuditLog.changes && Object.keys(selectedAuditLog.changes).length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Changes Diff (Before / After):</label>
                <pre className="p-3 rounded-xl bg-muted/50 border border-border text-xs font-mono text-emerald-400 overflow-x-auto">
                  {JSON.stringify(selectedAuditLog.changes, null, 2)}
                </pre>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button size="sm" onClick={() => setSelectedAuditLog(null)} className="text-xs">
                Close Diff
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
