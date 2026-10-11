'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  PenSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Trash2,
  RotateCw,
  Send,
  ExternalLink,
  Coins,
} from 'lucide-react';
import { usePosts, PostItem } from '../../../lib/hooks/usePosts';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';

export default function PostsPage() {
  const [filter, setFilter] = useState<string>('all');
  const { posts, total, isLoading, publishNow, isPublishing, retryTarget, isRetrying, deletePost, isDeleting } =
    usePosts(filter !== 'all' ? { status: filter } : undefined);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Posts & Content Calendar</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track published, scheduled, and retry-pending cross-posts across all connected channels.
          </p>
        </div>
        <Link href="/dashboard/compose">
          <Button variant="glow" size="sm" className="gap-2">
            <PenSquare className="w-4 h-4" /> Create New Post
          </Button>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-border/60 pb-3 text-xs overflow-x-auto">
        {['all', 'scheduled', 'published', 'failed', 'draft'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3.5 py-1.5 rounded-lg capitalize font-medium transition-colors ${
              filter === tab
                ? 'bg-card text-foreground border border-border shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-12 text-xs text-muted-foreground">Loading posts...</div>
        ) : posts.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Calendar className="w-10 h-10 mx-auto mb-3 opacity-40 text-muted-foreground" />
              <p className="text-sm font-semibold text-foreground">No posts found</p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">
                You have no {filter !== 'all' ? filter : ''} posts yet.
              </p>
              <Link href="/dashboard/compose">
                <Button variant="glow" size="sm">
                  Create Your First Post
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          posts.map((post) => (
            <Card key={post.id} className="space-y-3 p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      post.status === 'published'
                        ? 'success'
                        : post.status === 'failed'
                        ? 'destructive'
                        : 'glow'
                    }
                    className="capitalize text-[10px]"
                  >
                    {post.status.replace('_', ' ')}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Created {new Date(post.createdAt).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {post.status === 'scheduled' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => publishNow(post.id)}
                      isLoading={isPublishing}
                      className="text-xs h-8 gap-1.5"
                    >
                      <Send className="w-3 h-3" /> Publish Now
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deletePost(post.id)}
                    isLoading={isDeleting}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">{post.content}</p>

              {/* Targets Strip */}
              <div className="pt-2 border-t border-border/40 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-muted-foreground">Channels:</span>
                  {(post.targets || []).map((t) => (
                    <div
                      key={t.id}
                      className="px-2.5 py-1 rounded-lg bg-muted/40 border border-border font-medium flex items-center gap-2 text-[11px]"
                    >
                      <span className="capitalize">{t.platform}</span>
                      <Badge
                        variant={
                          t.status === 'published'
                            ? 'success'
                            : t.status === 'failed'
                            ? 'destructive'
                            : 'outline'
                        }
                        className="text-[9px] py-0 px-1 capitalize"
                      >
                        {t.status}
                      </Badge>

                      {t.status === 'failed' && (
                        <button
                          onClick={() => retryTarget(t.id)}
                          className="text-primary hover:underline flex items-center gap-1 text-[10px]"
                          title="Retry failed dispatch"
                        >
                          <RotateCw className="w-2.5 h-2.5" /> Retry
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {post.scheduledAt && (
                  <div className="text-primary flex items-center gap-1.5 text-xs font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    Scheduled for {new Date(post.scheduledAt).toLocaleString()}
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
