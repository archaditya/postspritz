'use client';

import React from 'react';
import { BarChart3, TrendingUp, Users, Eye, Heart, Share2, Coins, ArrowUpRight } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../lib/store/hooks';
import { setDateRange, setPlatformFilter } from '../../../lib/store/slices/analyticsSlice';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';

const METRICS = [
  { label: 'Total Impressions', value: '48.2K', change: '+18.4%', icon: Eye },
  { label: 'Total Engagements', value: '3,840', change: '+12.1%', icon: Heart },
  { label: 'Audience Growth', value: '+1,240', change: '+8.6%', icon: Users },
  { label: 'Active Channels', value: '6 Channels', change: '100% Up', icon: Share2 },
];

const PLATFORM_PERFORMANCE = [
  { platform: 'LinkedIn', posts: 14, impressions: '24.1K', engagement: '5.2%', cost: '$0.00' },
  { platform: 'X (Twitter)', posts: 28, impressions: '18.4K', engagement: '3.1%', cost: '$0.42 (Pass-Through)' },
  { platform: 'Instagram', posts: 19, impressions: '12.8K', engagement: '4.5%', cost: '$0.00' },
  { platform: 'Facebook', posts: 8, impressions: '3.8K', engagement: '2.4%', cost: '$0.00' },
  { platform: 'Threads', posts: 12, impressions: '1.9K', engagement: '4.8%', cost: '$0.00' },
  { platform: 'Reddit', posts: 5, impressions: '9.3K', engagement: '6.7%', cost: '$0.00' },
];

export default function AnalyticsPage() {
  const dispatch = useAppDispatch();
  const { dateRange, platformFilter } = useAppSelector((state) => state.analytics);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Analytics & Telemetry</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor audience reach, engagement trends, and third-party API pass-through expenses.
          </p>
        </div>

        {/* Date Filter Strip */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/40 border border-border">
          {(['7d', '30d', '90d', 'year'] as const).map((r) => (
            <button
              key={r}
              onClick={() => dispatch(setDateRange(r))}
              className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase transition-all ${
                dateRange === r
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {METRICS.map((m, i) => {
          const Icon = m.icon;
          return (
            <Card key={i} className="hover:border-primary/40 transition-all">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between text-muted-foreground mb-2">
                  <span className="text-xs uppercase font-semibold tracking-wider">{m.label}</span>
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div className="text-2xl font-bold text-foreground">{m.value}</div>
                <div className="text-xs text-emerald-400 font-medium mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {m.change} in selected window
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Platform Breakdown Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-bold">Channel Breakdown</CardTitle>
          <Badge variant="glow">Live Telemetry Synchronized</Badge>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-muted-foreground border-b border-border/60 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="pb-3">Platform</th>
                  <th className="pb-3">Posts Published</th>
                  <th className="pb-3">Estimated Reach</th>
                  <th className="pb-3">Engagement Rate</th>
                  <th className="pb-3">API Cost Incurred</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-medium">
                {PLATFORM_PERFORMANCE.map((p, i) => (
                  <tr key={i} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 font-bold text-foreground">{p.platform}</td>
                    <td className="py-3.5 text-muted-foreground">{p.posts}</td>
                    <td className="py-3.5 text-foreground">{p.impressions}</td>
                    <td className="py-3.5 text-emerald-400 font-semibold">{p.engagement}</td>
                    <td className="py-3.5 font-mono text-amber-300">{p.cost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
