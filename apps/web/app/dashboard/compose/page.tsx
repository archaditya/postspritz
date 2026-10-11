'use client';

import React, { useState } from 'react';
import {
  PenSquare,
  Sparkles,
  Calendar,
  Send,
  AlertCircle,
  Image as ImageIcon,
  Link as LinkIcon,
  CheckCircle2,
  Trash2,
  Plus,
  Coins,
  ShieldCheck,
  Maximize2,
} from 'lucide-react';
import { useComposeStore } from '../../../lib/stores/useComposeStore';
import { useAI } from '../../../lib/hooks/useAI';
import { usePosts } from '../../../lib/hooks/usePosts';
import { useAccounts } from '../../../lib/hooks/useAccounts';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../../components/ui/card';
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';

const PLATFORMS = [
  { id: 'linkedin', name: 'LinkedIn', isPaid: false, maxChars: 3000 },
  { id: 'facebook', name: 'Facebook', isPaid: false, maxChars: 63206 },
  { id: 'instagram', name: 'Instagram', isPaid: false, maxChars: 2200 },
  { id: 'threads', name: 'Threads', isPaid: false, maxChars: 500 },
  { id: 'x', name: 'X (Twitter)', isPaid: true, costBase: 0.015, costUrl: 0.20, maxChars: 280 },
  { id: 'reddit', name: 'Reddit', isPaid: false, maxChars: 40000 },
];

export default function ComposePage() {
  const {
    content,
    setContent,
    selectedPlatforms,
    togglePlatform,
    media,
    addMedia,
    removeMedia,
    scheduledAt,
    setScheduledAt,
    hasUrl,
    xEstimatedCostUsd,
    xPassThroughAcknowledged,
    setXAcknowledged,
    reset,
  } = useComposeStore();

  const { accounts } = useAccounts();
  const { createPost, isCreating } = usePosts();
  const { generatePost, isGeneratingPost, generateImages, isGeneratingImages } = useAI();

  // AI Modal States
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiTopicError, setAiTopicError] = useState<string | null>(null);
  const [aiTone, setAiTone] = useState<'professional' | 'casual' | 'storytelling' | 'bold'>('professional');
  const [userVisionPrompt, setUserVisionPrompt] = useState('');
  const [visionPromptError, setVisionPromptError] = useState<string | null>(null);
  const [imageCount, setImageCount] = useState(2); // Default 2, clamped max 5
  const [generatedImagePrompts, setGeneratedImagePrompts] = useState<any[]>([]);
  const [aiTelemetry, setAiTelemetry] = useState<{ tokens: number; cost: number } | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Field interaction & validation states
  const [touched, setTouched] = useState<{
    content?: boolean;
    platforms?: boolean;
    schedule?: boolean;
    xConsent?: boolean;
  }>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const xSelected = selectedPlatforms.includes('x');

  // Multi-platform character limit validation
  const exceededPlatformLimits = PLATFORMS.filter(
    (p) => selectedPlatforms.includes(p.id) && content.length > p.maxChars
  );

  const isScheduleInPast = scheduledAt
    ? new Date(scheduledAt).getTime() < Date.now() + 60 * 1000 * 2 // Must be at least 2 mins in future
    : false;

  const contentError =
    touched.content || submitAttempted
      ? !content.trim()
        ? 'Post content is required (cannot be empty or spaces only).'
        : content.trim().length < 3
        ? 'Post content must be at least 3 characters long.'
        : exceededPlatformLimits.length > 0
        ? `Exceeds max character limit for ${exceededPlatformLimits.map((p) => `${p.name} (max ${p.maxChars})`).join(', ')}.`
        : null
      : null;

  const platformsError =
    (touched.platforms || submitAttempted) && selectedPlatforms.length === 0
      ? 'Please select at least one social media channel to publish.'
      : null;

  const xConsentError =
    xSelected && !xPassThroughAcknowledged && (touched.xConsent || submitAttempted)
      ? 'Mandatory: You must acknowledge the X pass-through cost before publishing.'
      : null;

  const scheduleError =
    scheduledAt && isScheduleInPast
      ? 'Scheduled time must be at least 2 minutes in the future.'
      : null;

  const isFormValid =
    content.trim().length >= 3 &&
    selectedPlatforms.length > 0 &&
    exceededPlatformLimits.length === 0 &&
    (!xSelected || xPassThroughAcknowledged) &&
    !isScheduleInPast;

  const handleAiText = async () => {
    if (!aiTopic.trim()) {
      setAiTopicError('Please enter a core topic or thesis for the AI.');
      return;
    }
    setAiTopicError(null);

    try {
      const result = await generatePost({
        topic: aiTopic.trim(),
        tone: aiTone,
        targetPlatforms: selectedPlatforms,
        includeHashtags: true,
      });

      if (result.variations && result.variations.length > 0) {
        setContent(result.variations[0].content);
        setAiTelemetry({
          tokens: result.usage.promptTokens + result.usage.completionTokens,
          cost: result.usage.estimatedCostUsd,
        });
        setAiModalOpen(false);
        setStatusMsg({ type: 'success', text: 'AI content generated & adapted for platforms!' });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err?.response?.data?.message || 'Failed to generate AI post' });
    }
  };

  const handleAiImages = async () => {
    if (!userVisionPrompt.trim()) {
      setVisionPromptError('Please describe the image concept you imagine.');
      return;
    }
    setVisionPromptError(null);

    try {
      const result = await generateImages({
        topic: aiTopic || content || 'Social media post visual',
        context: content,
        platform: (selectedPlatforms[0] as any) || 'instagram',
        userVisionDescription: userVisionPrompt.trim(),
        imageCount: Math.min(Math.max(1, imageCount), 5), // Max 5 clamp
      });

      setGeneratedImagePrompts(result.prompts || []);
      setAiTelemetry({
        tokens: result.usage.estimatedTokens,
        cost: result.usage.estimatedCostUsd,
      });
      setStatusMsg({ type: 'success', text: `Generated ${result.prompts?.length || 0} visual concepts (Max 5 enforced)` });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err?.response?.data?.message || 'Failed to generate visual concepts' });
    }
  };

  const handleAttachPromptAsMedia = (prompt: any) => {
    const success = addMedia({
      id: `ai-img-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      url: prompt.previewPlaceholderUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
      type: 'image',
      aspectRatio: prompt.recommendedAspectRatio,
    });

    if (!success) {
      setStatusMsg({
        type: 'error',
        text: 'Maximum 5 images allowed per post to prevent runaway cloud storage & API costs.',
      });
    } else {
      setImageModalOpen(false);
    }
  };

  const handlePublish = async () => {
    setSubmitAttempted(true);

    if (!isFormValid) {
      if (!content.trim() || content.trim().length < 3) {
        setStatusMsg({ type: 'error', text: 'Validation Error: Post content must be at least 3 characters.' });
      } else if (selectedPlatforms.length === 0) {
        setStatusMsg({ type: 'error', text: 'Validation Error: Select at least one social media channel.' });
      } else if (exceededPlatformLimits.length > 0) {
        setStatusMsg({
          type: 'error',
          text: `Validation Error: Post exceeds character limits for ${exceededPlatformLimits.map((p) => p.name).join(', ')}.`,
        });
      } else if (xSelected && !xPassThroughAcknowledged) {
        setStatusMsg({
          type: 'error',
          text: `Validation Error: You must check the X pass-through cost acknowledgement.`,
        });
      } else if (isScheduleInPast) {
        setStatusMsg({
          type: 'error',
          text: 'Validation Error: Scheduled time cannot be in the past.',
        });
      }
      return;
    }

    try {
      await createPost({
        content: content.trim(),
        platformAccountIds: selectedPlatforms,
        scheduledAt,
        mediaIds: media.map((m) => m.id),
        xPassThroughAcknowledged,
      });
      setStatusMsg({
        type: 'success',
        text: scheduledAt ? 'Post successfully scheduled!' : 'Post submitted to dispatcher queue!',
      });
      reset();
      setSubmitAttempted(false);
      setTouched({});
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err?.response?.data?.message || 'Failed to queue post' });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Compose & Visual Studio</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Author once, expand visual prompts with AI, and verify transparent pass-through costs.
          </p>
        </div>

        {aiTelemetry && (
          <Badge variant="glow" className="gap-2 py-1.5 px-3">
            <Coins className="w-3.5 h-3.5 text-primary" />
            <span>AI Telemetry: {aiTelemetry.tokens} tokens (~${aiTelemetry.cost.toFixed(4)})</span>
          </Badge>
        )}
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-xl border text-sm flex items-center justify-between ${
            statusMsg.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-destructive/10 border-destructive/20 text-destructive'
          }`}
        >
          <span>{statusMsg.text}</span>
          <button onClick={() => setStatusMsg(null)} className="text-xs hover:underline">
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Editor Main Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Target Channels */}
          <Card className={platformsError ? 'border-destructive bg-destructive/[0.02]' : ''}>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground font-bold">
                Target Channels ({selectedPlatforms.length} Selected)
              </CardTitle>
              {platformsError && (
                <span className="text-destructive text-xs font-semibold flex items-center gap-1 animate-pulse">
                  <AlertCircle className="w-3.5 h-3.5" /> At least 1 channel required
                </span>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2.5">
                {PLATFORMS.map((plat) => {
                  const isSelected = selectedPlatforms.includes(plat.id);
                  const isExceeded = isSelected && content.length > plat.maxChars;
                  return (
                    <button
                      key={plat.id}
                      onClick={() => {
                        togglePlatform(plat.id);
                        setTouched((prev) => ({ ...prev, platforms: true }));
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-2 ${
                        isExceeded
                          ? 'bg-destructive/15 text-destructive border-destructive shadow-sm'
                          : isSelected
                          ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                          : 'bg-card text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground'
                      }`}
                    >
                      <span>{plat.name}</span>
                      {plat.isPaid && (
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          Paid
                        </span>
                      )}
                      {isSelected && (
                        <span
                          className={`text-[10px] px-1 rounded ${
                            isExceeded
                              ? 'bg-destructive text-white font-bold'
                              : content.length > plat.maxChars * 0.85
                              ? 'bg-amber-500/30 text-amber-300 font-medium'
                              : 'bg-white/20 text-white/90'
                          }`}
                        >
                          {content.length}/{plat.maxChars}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {platformsError && (
                <p className="text-xs text-destructive mt-3 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {platformsError}
                </p>
              )}
            </CardContent>
          </Card>

          {/* X Pass-Through Cost Banner */}
          {xSelected && (
            <div
              className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs transition-all ${
                xConsentError
                  ? 'bg-destructive/10 border-destructive text-destructive ring-2 ring-destructive/30 animate-pulse'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <AlertCircle
                  className={`w-4 h-4 shrink-0 mt-0.5 ${xConsentError ? 'text-destructive' : 'text-amber-400'}`}
                />
                <div>
                  <strong className={`block ${xConsentError ? 'text-destructive font-bold' : 'text-amber-200'}`}>
                    {xConsentError
                      ? 'Action Required: X API Pass-Through Consent Missing'
                      : 'X (Twitter) Pass-Through Billing Active'}
                  </strong>
                  <span>{hasUrl ? 'URL link detected ($0.20 / tweet)' : 'Basic tweet ($0.015 / tweet)'}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                <span className="font-bold px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-200 font-mono">
                  ${xEstimatedCostUsd.toFixed(3)} USD
                </span>
                <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-amber-200 hover:text-white">
                  <input
                    type="checkbox"
                    checked={xPassThroughAcknowledged}
                    onChange={(e) => {
                      setXAcknowledged(e.target.checked);
                      setTouched((prev) => ({ ...prev, xConsent: true }));
                    }}
                    className="rounded border-amber-400/50 text-primary focus:ring-primary w-4 h-4"
                  />
                  <span>Opt-in Acknowledged</span>
                </label>
              </div>
            </div>
          )}

          {/* Text Editor */}
          <Card className={contentError ? 'border-destructive bg-destructive/[0.01]' : ''}>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground font-bold">
                Post Content
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAiModalOpen(true)}
                  className="gap-1.5 text-xs text-primary border-primary/30 hover:bg-primary/10"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  AI Text Assistant
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setImageModalOpen(true)}
                  className="gap-1.5 text-xs text-amber-400 border-amber-400/30 hover:bg-amber-400/10"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  AI Visual Director (Max 5)
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  setTouched((prev) => ({ ...prev, content: true }));
                }}
                onBlur={() => setTouched((prev) => ({ ...prev, content: true }))}
                placeholder="Share your thoughts, insights, announcement or let AI expand your vision..."
                rows={7}
                className={`resize-none transition-colors ${
                  contentError ? 'border-destructive focus-visible:ring-destructive' : ''
                }`}
              />

              {contentError && (
                <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{contentError}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground pt-1">
                <div className="flex items-center gap-3">
                  <span
                    className={
                      exceededPlatformLimits.length > 0
                        ? 'text-destructive font-bold'
                        : content.length >= 250 && xSelected
                        ? 'text-amber-400 font-semibold'
                        : ''
                    }
                  >
                    {content.length} characters
                  </span>
                  {selectedPlatforms.map((platId) => {
                    const p = PLATFORMS.find((item) => item.id === platId);
                    if (!p) return null;
                    const isOver = content.length > p.maxChars;
                    return (
                      <span
                        key={p.id}
                        className={`text-[11px] px-1.5 py-0.5 rounded ${
                          isOver
                            ? 'bg-destructive/20 text-destructive font-bold'
                            : 'bg-muted/40 text-muted-foreground'
                        }`}
                      >
                        {p.name}: {p.maxChars - content.length} left
                      </span>
                    );
                  })}
                </div>

                {hasUrl && (
                  <span className="text-accent flex items-center gap-1">
                    <LinkIcon className="w-3.5 h-3.5" /> Link detected (affects X rate)
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Media Attachments Strip (Max 5) */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground font-bold">
                Media Attachments ({media.length}/5)
              </CardTitle>
              <span className="text-[11px] text-muted-foreground">Hard-clamped max 5 items</span>
            </CardHeader>
            <CardContent>
              {media.length === 0 ? (
                <div className="border border-dashed border-border rounded-xl p-6 text-center text-xs text-muted-foreground">
                  <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  No images attached. Use the <strong>AI Visual Director</strong> or upload images (max 5).
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {media.map((item) => (
                    <div
                      key={item.id}
                      className="group relative aspect-square rounded-xl overflow-hidden border border-border bg-muted/40"
                    >
                      <img src={item.url} alt="Attached" className="h-full w-full object-cover" />
                      <button
                        onClick={() => removeMedia(item.id)}
                        className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-background/80 text-destructive hover:bg-destructive hover:text-white transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: Preview & Schedule */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold">Multi-Channel Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#17191C] border border-primary/30 flex items-center justify-center p-1 font-bold text-xs">
                    <svg viewBox="0 0 128 128" className="w-5 h-5">
                      <path d="M20 54 103 21c5.7-2.3 11.3 3.3 8.9 9L72 106c-2.1 5-9.4 4.8-11.1-.4L49.4 72.1 15 60c-5.2-1.8-5.1-9.1 5-6Z" fill="#FF5A1F"/>
                      <path d="M49.4 72.1 100 24 61 83.4Z" fill="#E84712" opacity=".72"/>
                      <path d="M8 77H31M2 91H22" stroke="#FF5A1F" strokeWidth="8" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">Post<span className="text-primary">Spritz</span> Automated Dispatch</p>
                    <p className="text-[10px] text-muted-foreground">
                      Targeting: {selectedPlatforms.join(', ') || 'None selected'}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed">
                  {content || 'Preview your post here in real-time...'}
                </p>
                {media.length > 0 && (
                  <div className="grid grid-cols-2 gap-1.5 pt-2">
                    {media.slice(0, 4).map((m) => (
                      <div key={m.id} className="aspect-video rounded-lg overflow-hidden bg-muted">
                        <img src={m.url} alt="Preview" className="h-full w-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold">Scheduling & Dispatch</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-muted-foreground">Schedule Time (Optional)</label>
                  {scheduledAt && !scheduleError && (
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                      <CheckCircle2 className="w-3 h-3" /> Valid future date
                    </span>
                  )}
                </div>
                <Input
                  type="datetime-local"
                  value={scheduledAt || ''}
                  onChange={(e) => {
                    setScheduledAt(e.target.value || null);
                    setTouched((prev) => ({ ...prev, schedule: true }));
                  }}
                  onBlur={() => setTouched((prev) => ({ ...prev, schedule: true }))}
                  className={scheduleError ? 'border-destructive focus-visible:ring-destructive' : ''}
                />
                {scheduleError && (
                  <p className="text-xs text-destructive flex items-center gap-1 mt-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {scheduleError}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Button
                  variant="glow"
                  size="lg"
                  onClick={handlePublish}
                  isLoading={isCreating}
                  className={`w-full gap-2 transition-all ${
                    submitAttempted && !isFormValid ? 'ring-2 ring-destructive/40' : ''
                  }`}
                >
                  <Send className="w-4 h-4" />
                  {scheduledAt ? 'Schedule Publication' : 'Publish Immediately'}
                </Button>

                {submitAttempted && !isFormValid && (
                  <p className="text-xs text-destructive text-center flex items-center justify-center gap-1 font-semibold animate-pulse">
                    <AlertCircle className="w-3.5 h-3.5" /> Please resolve form validation errors above
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* AI Text Dialog */}
      <Dialog open={aiModalOpen} onOpenChange={setAiModalOpen}>
        <DialogHeader>
          <DialogTitle>AI Social Content Creator</DialogTitle>
          <DialogDescription>
            Input your core thesis and desired tone. Content will be tailored for social platforms.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1">Core Topic / Prompt</label>
            <Input
              value={aiTopic}
              onChange={(e) => {
                setAiTopic(e.target.value);
                if (aiTopicError) setAiTopicError(null);
              }}
              placeholder="e.g. Announcing our 2.0 release with real-time analytics"
              className={aiTopicError ? 'border-destructive focus-visible:ring-destructive' : ''}
            />
            {aiTopicError && (
              <p className="text-xs text-destructive flex items-center gap-1 mt-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {aiTopicError}
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Voice & Tone</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['professional', 'casual', 'storytelling', 'bold'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setAiTone(t)}
                  className={`p-2 rounded-xl text-xs font-semibold capitalize border transition-all ${
                    aiTone === t
                      ? 'bg-primary text-white border-primary'
                      : 'bg-card text-muted-foreground border-border hover:text-foreground'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <Button variant="glow" onClick={handleAiText} isLoading={isGeneratingPost} className="w-full">
            Generate Adapted Post
          </Button>
        </div>
      </Dialog>

      {/* AI Visual Director Dialog (Hard clamped Max 5) */}
      <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
        <DialogHeader>
          <DialogTitle>AI Visual Director (Max 5 Image Concepts)</DialogTitle>
          <DialogDescription>
            Expands your imagination into cinematic, platform-tailored prompts. Capped to max 5 images.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1">Describe What You Imagine</label>
            <Textarea
              value={userVisionPrompt}
              onChange={(e) => {
                setUserVisionPrompt(e.target.value);
                if (visionPromptError) setVisionPromptError(null);
              }}
              placeholder="e.g. Futuristic glass server rack in neon ambient light, clean cinematic shot, 8k resolution"
              rows={3}
              className={visionPromptError ? 'border-destructive focus-visible:ring-destructive' : ''}
            />
            {visionPromptError && (
              <p className="text-xs text-destructive flex items-center gap-1 mt-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {visionPromptError}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold">Image Variations (Max 5):</span>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setImageCount(num)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold border transition-colors ${
                    imageCount === num
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-card text-muted-foreground border-border hover:border-foreground/40'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <Button
            variant="default"
            onClick={handleAiImages}
            isLoading={isGeneratingImages}
            className="w-full bg-amber-600 hover:bg-amber-500 text-white"
          >
            Direct Visual Concepts
          </Button>

          {/* Generated Concepts Grid */}
          {generatedImagePrompts.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-border/60 max-h-64 overflow-y-auto">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Generated Visual Directions
              </span>
              {generatedImagePrompts.map((p, idx) => (
                <div key={idx} className="p-3 rounded-xl border border-border bg-card/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">{p.title}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {p.recommendedAspectRatio}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed italic">
                    "{p.expandedVisualPrompt}"
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAttachPromptAsMedia(p)}
                    className="w-full text-xs gap-1.5"
                  >
                    <Plus className="w-3 h-3" /> Attach Concept to Post
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Dialog>
    </div>
  );
}
