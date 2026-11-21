'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, Sparkles } from 'lucide-react';

export const GlassFooter: React.FC = () => {
  return (
    <footer className="w-full max-w-5xl mx-auto px-4 pt-10 pb-16 mt-12 border-t border-white/40 dark:border-white/10">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Brand & Tagline */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-primaryAction-start to-infoAction-end flex items-center justify-center text-white text-xs">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span className="font-heading font-bold text-base tracking-tightest lowercase text-ink-primary dark:text-ink-dark-primary">
              clipglass
            </span>
          </div>
          <p className="text-xs text-ink-tertiary dark:text-ink-dark-tertiary mt-1">
            Liquid glass media workflow. Ephemeral, ad-free, respectful.
          </p>
        </div>

        {/* Legal & Nav Links */}
        <div className="flex items-center gap-6 text-xs font-medium text-ink-secondary dark:text-ink-dark-secondary">
          <Link href="/terms" className="hover:text-ink-primary dark:hover:text-ink-dark-primary transition-colors">
            Terms of Service
          </Link>
          <Link href="/privacy" className="hover:text-ink-primary dark:hover:text-ink-dark-primary transition-colors">
            Privacy Policy
          </Link>
          <Link href="/copyright" className="hover:text-ink-primary dark:hover:text-ink-dark-primary transition-colors">
            Copyright & DMCA
          </Link>
          <Link href="/faq" className="hover:text-ink-primary dark:hover:text-ink-dark-primary transition-colors">
            FAQ
          </Link>
          <Link href="/design" className="hover:text-infoAction-start transition-colors font-semibold">
            Design Showcase
          </Link>
        </div>
      </div>

      {/* Mandatory Disclaimer from Section 10 */}
      <div className="mt-8 pt-6 border-t border-white/20 dark:border-white/5 text-[11px] text-ink-tertiary dark:text-ink-dark-tertiary leading-relaxed text-center">
        <p>
          <strong>Disclaimer:</strong> ClipGlass is an independent open-source web application and is not affiliated with, authorized, maintained, sponsored or endorsed by YouTube, Google LLC, or Alphabet Inc. ClipGlass does not host, store, or redistribute copyrighted media. All processing is strictly ephemeral and deleted within 15 minutes. Users are solely responsible for ensuring their use conforms to applicable copyright laws and platform terms.
        </p>
        <p className="mt-2">
          © {new Date().getFullYear()} ClipGlass. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

