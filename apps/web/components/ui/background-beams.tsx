'use client';

import React from 'react';
import { cn } from '../../lib/utils';

export function BackgroundBeams({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 -z-10 overflow-hidden [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]',
        className
      )}
    >
      <div className="absolute -top-[30%] left-1/2 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-primary/20 via-indigo-500/10 to-transparent blur-[120px]" />
      <div className="absolute top-[20%] -left-[10%] h-[400px] w-[600px] rounded-full bg-gradient-to-br from-accent/15 via-purple-500/10 to-transparent blur-[140px]" />
      <div className="absolute bottom-[-10%] right-[-5%] h-[500px] w-[500px] rounded-full bg-gradient-to-tl from-primary/15 via-sky-500/10 to-transparent blur-[130px]" />
      
      {/* Grid Pattern overlay */}
      <svg
        className="absolute inset-0 h-full w-full stroke-white/[0.03] [mask-image:radial-gradient(100%_100%_at_top_center,white,transparent)]"
        aria-hidden="true"
      >
        <defs>
          <pattern
            id="beams-grid"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path d="M.5 40V.5H40" fill="none" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" strokeWidth="0" fill="url(#beams-grid)" />
      </svg>
    </div>
  );
}
