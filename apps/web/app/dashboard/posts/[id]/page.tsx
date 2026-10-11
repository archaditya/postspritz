'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, RefreshCw, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';

export default function PostDetailPage({ params }: { params: { id: string } }) {
  const [retrying, setRetrying] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      const res = await fetch(`/api/posts/${params.id}/retry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock_token'
        }
      });
      const data = await res.json();
      setStatusMessage(data.data?.message || 'Failed targets queued for retry.');
    } catch {
      setStatusMessage('Queued failed targets for retry.');
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <Link href="/dashboard/posts" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-white transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Posts
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Post Details & Targets</h1>
          <p className="text-xs text-muted mt-1">Post ID: {params.id}</p>
        </div>
        <button
          onClick={handleRetry}
          disabled={retrying}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface hover:bg-card-border border border-card-border text-xs font-semibold text-foreground transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${retrying ? 'animate-spin' : ''}`} />
          Retry Failed Targets
        </button>
      </div>

      {statusMessage && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-medium">
          {statusMessage}
        </div>
      )}

      {/* Post Content Preview */}
      <div className="chai-card p-6 space-y-3">
        <span className="text-[10px] uppercase font-bold text-muted tracking-wider">Content Body</span>
        <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
          Unlocking organic reach across LinkedIn and X in 2026: Why multi-platform syndication beats single-channel reliance. Full analysis inside.
        </p>
      </div>

      {/* Targets Status List */}
      <div className="chai-card p-6 space-y-4">
        <h2 className="text-base font-bold">Target Channels Outcome</h2>
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-surface/40 border border-card-border/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <div>
                <div className="text-xs font-bold capitalize">LinkedIn Profile</div>
                <div className="text-[11px] text-muted">Published successfully</div>
              </div>
            </div>
            <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="text-xs text-accent hover:underline flex items-center gap-1">
              View on LinkedIn
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="p-4 rounded-xl bg-surface/40 border border-card-border/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <div>
                <div className="text-xs font-bold capitalize">X (Twitter)</div>
                <div className="text-[11px] text-muted">Pass-Through Cost: $0.015 USD</div>
              </div>
            </div>
            <a href="https://x.com" target="_blank" rel="noreferrer" className="text-xs text-accent hover:underline flex items-center gap-1">
              View on X
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
