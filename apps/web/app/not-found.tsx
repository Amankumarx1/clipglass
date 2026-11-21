'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="min-h-[100dvh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-md glass glass-rim rounded-[36px] p-8 md:p-10 shadow-2xl flex flex-col items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-blue-500/15 flex items-center justify-center text-blue-500 mb-1">
          <Compass className="w-8 h-8 animate-pulse" />
        </div>

        <span className="text-xs font-mono font-bold uppercase tracking-widest text-blue-500">
          Error 404
        </span>

        <h1 className="font-heading font-bold text-3xl sm:text-4xl text-ink-primary dark:text-white lowercase tracking-tight">
          page not found
        </h1>

        <p className="text-sm text-ink-secondary dark:text-slate-400">
          The link you visited doesn&apos;t exist or has moved. Return to ClipGlass to download or inspect video and audio.
        </p>

        <Link
          href="/"
          className="mt-2 w-full h-12 rounded-pill btn-blue btn-gloss text-white font-heading font-bold text-sm flex items-center justify-center gap-2 shadow-glow-info hover:opacity-95 transition-all select-none"
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
          <span>Return to Home</span>
        </Link>
      </div>
    </main>
  );
}

