'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Layers, Menu, X, Sparkles } from 'lucide-react';
import { GlassThemeToggle } from './GlassThemeToggle';

export const GlassNav: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-4 z-40 w-full max-w-5xl mx-auto px-4">
      <nav className="glass glass-rim rounded-pill h-16 px-6 flex items-center justify-between shadow-lg">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group select-none">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primaryAction-start to-infoAction-end flex items-center justify-center text-white shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-heading font-bold text-lg tracking-tightest lowercase text-ink-primary dark:text-ink-dark-primary group-hover:opacity-90 transition-opacity">
            clipglass
          </span>
        </Link>

        {/* Desktop Nav Items */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-ink-secondary dark:text-ink-dark-secondary">
          <a href="#how-it-works" className="hover:text-ink-primary dark:hover:text-ink-dark-primary transition-colors">
            how it works
          </a>
          <a href="#faq" className="hover:text-ink-primary dark:hover:text-ink-dark-primary transition-colors">
            faq
          </a>
          <Link href="/terms" className="hover:text-ink-primary dark:hover:text-ink-dark-primary transition-colors">
            legal
          </Link>
          <Link
            href="/design"
            className="flex items-center gap-1.5 px-3 py-1 rounded-pill bg-white/40 dark:bg-white/10 text-xs font-semibold hover:bg-white/60 transition-all text-infoAction-start"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>design system</span>
          </Link>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          <GlassThemeToggle />

          {/* Mobile menu trigger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-10 h-10 rounded-squircle flex items-center justify-center btn-clear-glass text-ink-primary dark:text-ink-dark-primary"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-2 glass glass-rim rounded-card p-5 shadow-2xl flex flex-col gap-3 text-sm font-semibold text-ink-primary dark:text-ink-dark-primary">
          <a
            href="#how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="py-2 px-3 rounded-xl hover:bg-white/40 dark:hover:bg-white/10"
          >
            How it works
          </a>
          <a
            href="#faq"
            onClick={() => setMobileMenuOpen(false)}
            className="py-2 px-3 rounded-xl hover:bg-white/40 dark:hover:bg-white/10"
          >
            FAQ
          </a>
          <Link
            href="/terms"
            onClick={() => setMobileMenuOpen(false)}
            className="py-2 px-3 rounded-xl hover:bg-white/40 dark:hover:bg-white/10"
          >
            Terms & Consent
          </Link>
          <Link
            href="/privacy"
            onClick={() => setMobileMenuOpen(false)}
            className="py-2 px-3 rounded-xl hover:bg-white/40 dark:hover:bg-white/10"
          >
            Privacy & 15m TTL
          </Link>
          <Link
            href="/copyright"
            onClick={() => setMobileMenuOpen(false)}
            className="py-2 px-3 rounded-xl hover:bg-white/40 dark:hover:bg-white/10"
          >
            Copyright / DMCA
          </Link>
          <Link
            href="/design"
            onClick={() => setMobileMenuOpen(false)}
            className="py-2 px-3 rounded-xl bg-infoAction-start/15 text-infoAction-start font-bold flex items-center gap-2"
          >
            <Layers className="w-4 h-4" />
            Design System Showcase
          </Link>
        </div>
      )}
    </header>
  );
};

