'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('ClipGlass Application Error:', error);
  }, [error]);

  return (
    <main className="min-h-[100dvh] flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg glass glass-rim rounded-[36px] p-8 md:p-10 shadow-2xl text-center flex flex-col items-center gap-6">
        {/* Warning Icon Badge */}
        <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center ring-4 ring-rose-500/30 shadow-[0_0_30px_rgba(244,63,94,0.4)]">
          <AlertTriangle className="w-8 h-8 stroke-[2.5]" />
        </div>

        <div>
          <span className="text-xs font-heading font-bold text-rose-500 uppercase tracking-widest">
            Processing Interruption
          </span>
          <h1 className="font-heading font-bold text-2xl sm:text-3xl text-ink-primary dark:text-ink-dark-primary tracking-tight mt-1">
            something went wrong
          </h1>
          <p className="text-xs sm:text-sm text-ink-secondary dark:text-ink-dark-secondary mt-2 max-w-sm mx-auto font-sans">
            An unexpected error occurred during media orchestration. Your session data remains safe.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:flex-1 h-12 rounded-pill btn-blue btn-gloss text-white font-heading font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-glow-info hover:opacity-95 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Try again</span>
          </button>

          <Link
            href="/"
            className="w-full sm:flex-1 h-12 rounded-pill glass glass-rim text-ink-primary dark:text-ink-dark-primary font-heading font-bold text-xs sm:text-sm flex items-center justify-center gap-2 hover:border-white transition-all"
          >
            <Home className="w-4 h-4" />
            <span>Return to Home</span>
          </Link>
        </div>
      </div>
    </main>
  );
}

