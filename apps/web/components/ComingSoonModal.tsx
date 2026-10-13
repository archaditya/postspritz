'use client';

import React from 'react';
import { Sparkles, CheckCircle2, Rocket, ArrowRight, ShieldCheck } from 'lucide-react';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface ComingSoonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureTitle?: string;
  featureDescription?: string;
}

export function ComingSoonModal({
  open,
  onOpenChange,
  featureTitle = 'Pro Upgrades & Paid Tiers Launching Soon',
  featureDescription = 'We are currently onboarding early creators on our free tier before opening public billing.',
}: ComingSoonModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} className="max-w-md">
      <DialogHeader className="text-center pb-2">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto mb-3 shadow-md shadow-primary/15">
          <Rocket className="w-6 h-6" />
        </div>
        <Badge variant="glow" className="mx-auto text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 mb-1">
          Early Platform Access
        </Badge>
        <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
          {featureTitle}
        </DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto leading-relaxed">
          {featureDescription}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-3.5 my-3 text-xs">
        <div className="p-3.5 rounded-xl border border-border/80 bg-card/60 backdrop-blur-sm space-y-2">
          <p className="font-semibold text-foreground flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            What is included in your active Free Starter tier:
          </p>
          <ul className="space-y-1.5 pl-1 text-muted-foreground text-[11px]">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Up to 2 connected social channels (LinkedIn, X, etc.)</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>30 scheduled or instant dispatches every month</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>AI Visual Director with prompt expansion</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Real-time BullMQ publishing execution &amp; SSE streams</span>
            </li>
          </ul>
        </div>

        <div className="p-3 rounded-xl bg-muted/40 border border-border/50 text-muted-foreground text-[11px] leading-relaxed">
          Paid plans (Pro Creator ₹999/mo &amp; Agency Enterprise ₹4,999/mo) with unlimited connected accounts, priority dispatch queues, and automated payment gateway billing will be enabled in the upcoming production phase.
        </div>
      </div>

      <DialogFooter className="sm:justify-center pt-2 border-t border-border/60">
        <Button variant="glow" onClick={() => onOpenChange(false)} className="w-full text-xs font-semibold h-9">
          Got it, continue with Free Starter
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
