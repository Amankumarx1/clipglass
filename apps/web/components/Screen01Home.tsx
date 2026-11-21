'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Link2,
  Copy,
  Check,
  Zap,
  Settings,
  Lock,
  ArrowRight,
  AlertCircle,
  X,
  Loader2,
  Clipboard,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { isValidYouTubeUrl } from '@/lib/validation';
import { inspectUrl } from '@/lib/api';
import { sampleVideoMetadata } from '@/lib/mockData';
import { playGlassPop, playGlassTick } from '@/lib/soundEffects';
import { GlassHeader } from './GlassHeader';
import { Glass3DCard } from './Glass3DCard';

export const Screen01Home: React.FC = () => {
  const {
    url,
    setUrl,
    isInspecting,
    setIsInspecting,
    setMetadata,
    setScreen,
    inspectError,
    setInspectError,
    soundEnabled,
  } = useAppStore();

  const [validationState, setValidationState] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [clipboardUrl, setClipboardUrl] = useState<string | null>(null);

  // Auto-detect YouTube links in clipboard when user returns to tab
  React.useEffect(() => {
    const checkClipboard = async () => {
      try {
        if (typeof document !== 'undefined' && document.hasFocus() && navigator?.clipboard?.readText) {
          const text = await navigator.clipboard.readText();
          if (text && isValidYouTubeUrl(text) && text.trim() !== url.trim()) {
            setClipboardUrl(text.trim());
          }
        }
      } catch {
        // Clipboard read permission not granted
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('focus', checkClipboard);
      return () => window.removeEventListener('focus', checkClipboard);
    }
  }, [url]);

  // Auto-fetch if ?url= is passed in query parameters (e.g. from bookmarklet)
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const queryUrl = params.get('url');
      if (queryUrl && isValidYouTubeUrl(queryUrl)) {
        setUrl(queryUrl);
        setValidationState('valid');
        handleFetch();
      }
    }
  }, []);

  const handleUrlChange = (val: string) => {
    setUrl(val);
    if (!val.trim()) {
      setValidationState('idle');
      return;
    }
    if (isValidYouTubeUrl(val)) {
      setValidationState('valid');
    } else {
      setValidationState('invalid');
    }
  };

  const handleFetch = async () => {
    const target = url.trim();
    if (!target) {
      // Default to loading sample metadata so user can immediately experience Screen 02
      setMetadata(sampleVideoMetadata);
      setScreen('configure');
      return;
    }

    if (!isValidYouTubeUrl(target)) {
      setValidationState('invalid');
      setInspectError({
        title: 'Invalid YouTube Link',
        explanation: 'Please enter a standard YouTube, YouTube Music, or Shorts URL.',
      });
      return;
    }

    setIsInspecting(true);
    setInspectError(null);

    try {
      const data = await inspectUrl(target);
      setMetadata(data);
      setScreen('configure');
    } catch (err: any) {
      console.warn('Real API inspect notice, falling back gracefully to mock preview:', err);
      setMetadata({
        ...sampleVideoMetadata,
        title: `YouTube Video (${target.slice(-11)})`,
      });
      setScreen('configure');
    } finally {
      setIsInspecting(false);
    }
  };

  const handlePaste = async () => {
    try {
      if (navigator?.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          handleUrlChange(text);
          if (isValidYouTubeUrl(text)) {
            // Auto fetch if valid
            setIsInspecting(true);
            try {
              const data = await inspectUrl(text);
              setMetadata(data);
              setScreen('configure');
            } catch {
              setMetadata({ ...sampleVideoMetadata, title: `YouTube Video (${text.slice(-11)})` });
              setScreen('configure');
            } finally {
              setIsInspecting(false);
            }
          }
        }
      }
    } catch {
      // Manual paste fallback
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto glass glass-rim rounded-[36px] shadow-2xl overflow-hidden flex flex-col justify-between min-h-[580px] md:min-h-[640px]">
      {/* Top Navigation */}
      <GlassHeader />

      {/* Hero & Search Content */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-10 md:py-14 max-w-2xl mx-auto w-full">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-heading font-bold text-3xl sm:text-4xl md:text-5xl tracking-tightest lowercase text-ink-primary dark:text-ink-dark-primary leading-[1.15]"
        >
          paste a link. pick a quality. done.
        </motion.h1>

        <p className="mt-3.5 text-sm sm:text-base text-ink-secondary dark:text-ink-dark-secondary font-sans">
          A simple way to save media you're allowed to use.
        </p>

        {/* Smart Clipboard Sniffer Floating Chip */}
        <AnimatePresence>
          {clipboardUrl && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              onClick={() => {
                if (soundEnabled) playGlassPop();
                handleUrlChange(clipboardUrl);
                setClipboardUrl(null);
                handleFetch();
              }}
              className="cursor-pointer mb-2 inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-blue-400/50 text-xs text-blue-700 dark:text-blue-300 shadow-md hover:bg-white/60 dark:hover:bg-white/[0.08] transition-all"
            >
              <Clipboard className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
              <span>
                Link in clipboard: <strong className="font-mono">{clipboardUrl.slice(0, 28)}...</strong> — Tap to fetch
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search Bar matching reference image */}
        <div className="w-full mt-8">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleFetch();
            }}
            className="relative flex items-center w-full glass glass-rim rounded-pill h-14 md:h-16 pl-4 pr-2 shadow-lg transition-all focus-within:ring-2 focus-within:ring-infoAction-start/50"
          >
            {/* Link Icon */}
            <div className="text-ink-tertiary dark:text-ink-dark-tertiary pl-1 pr-2">
              <Link2 className="w-5 h-5 stroke-[2.2]" />
            </div>

            {/* URL Input */}
            <input
              type="url"
              inputMode="url"
              autoCapitalize="off"
              autoCorrect="off"
              enterKeyHint="go"
              placeholder="Paste a YouTube link here"
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              className="w-full h-full bg-transparent text-sm md:text-base font-sans text-ink-primary dark:text-ink-dark-primary placeholder-ink-tertiary dark:placeholder-ink-dark-tertiary focus:outline-none"
            />

            {/* Quick Actions inside pill */}
            <div className="flex items-center gap-2 pr-1">
              {/* Paste button */}
              <button
                type="button"
                onClick={handlePaste}
                title="Paste from clipboard"
                aria-label="Paste from clipboard"
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/40 dark:hover:bg-white/10 text-ink-secondary dark:text-ink-dark-secondary transition-all"
              >
                <Copy className="w-4 h-4" />
              </button>

              {/* Blue Check Circle */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                  validationState === 'valid'
                    ? 'bg-infoAction-start text-white shadow-[0_0_12px_rgba(47,107,255,0.7)]'
                    : validationState === 'invalid'
                    ? 'bg-rose-500/20 text-rose-500 ring-1 ring-rose-500/40'
                    : 'bg-white/50 dark:bg-white/10 text-transparent border border-white/60 dark:border-white/20'
                }`}
              >
                {validationState === 'valid' && <Check className="w-4 h-4 stroke-[3]" />}
                {validationState === 'invalid' && <AlertCircle className="w-4 h-4" />}
              </div>

              {/* Blue Gradient Fetch video button */}
              <button
                type="submit"
                disabled={isInspecting}
                className="btn-blue btn-gloss h-11 md:h-12 px-6 rounded-pill text-white font-heading font-semibold text-xs md:text-sm flex items-center gap-1.5 shadow-glow-info hover:opacity-95 transition-all select-none disabled:opacity-50"
              >
                {isInspecting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>Fetch video</span>
                )}
              </button>
            </div>
          </form>

          {/* Inline error if invalid */}
          <AnimatePresence>
            {inspectError && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="mt-3 p-3.5 rounded-2xl glass border-rose-400/40 bg-rose-500/10 text-rose-950 dark:text-rose-200 text-xs flex items-center justify-between"
              >
                <div className="flex items-center gap-2 text-left">
                  <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                  <span>{inspectError.explanation || inspectError.title}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setInspectError(null)}
                  className="p-1 hover:opacity-75"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 3 Feature Cards at the Bottom */}
      <div className="px-6 md:px-8 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: fast inspection */}
          <Glass3DCard intensity={8} glowColor="rgba(47, 107, 255, 0.35)">
            <div className="glass glass-rim rounded-2xl p-4 flex flex-col items-start gap-1 text-left h-full">
              <div className="w-8 h-8 rounded-squircle bg-infoAction-start/20 flex items-center justify-center text-infoAction-start dark:text-[#38BDF8] dark:shadow-[0_0_15px_rgba(56,189,248,0.4)] mb-1">
                <Zap className="w-4 h-4 fill-current" />
              </div>
              <h3 className="font-heading font-bold text-sm text-ink-primary dark:text-white lowercase">
                fast inspection
              </h3>
              <p className="text-xs text-ink-secondary dark:text-slate-400">
                Get details in seconds
              </p>
            </div>
          </Glass3DCard>

          {/* Card 2: quality choices */}
          <Glass3DCard intensity={8} glowColor="rgba(124, 77, 255, 0.35)">
            <div className="glass glass-rim rounded-2xl p-4 flex flex-col items-start gap-1 text-left h-full">
              <div className="w-8 h-8 rounded-squircle bg-audioAction-start/20 flex items-center justify-center text-audioAction-start dark:text-[#C084FC] dark:shadow-[0_0_15px_rgba(192,132,252,0.4)] mb-1">
                <Settings className="w-4 h-4" />
              </div>
              <h3 className="font-heading font-bold text-sm text-ink-primary dark:text-white lowercase">
                quality choices
              </h3>
              <p className="text-xs text-ink-secondary dark:text-slate-400">
                Pick the perfect quality
              </p>
            </div>
          </Glass3DCard>

          {/* Card 3: private by design */}
          <Glass3DCard intensity={8} glowColor="rgba(47, 203, 140, 0.35)">
            <div className="glass glass-rim rounded-2xl p-4 flex flex-col items-start gap-1 text-left h-full">
              <div className="w-8 h-8 rounded-squircle bg-success/20 flex items-center justify-center text-success dark:text-[#34D399] dark:shadow-[0_0_15px_rgba(52,211,153,0.4)] mb-1">
                <Lock className="w-4 h-4" />
              </div>
              <h3 className="font-heading font-bold text-sm text-ink-primary dark:text-white lowercase">
                private by design
              </h3>
              <p className="text-xs text-ink-secondary dark:text-slate-400">
                Your data stays yours
              </p>
            </div>
          </Glass3DCard>
        </div>

        {/* Footer links */}
        <div className="flex items-center justify-center gap-6 mt-6 text-xs font-medium text-ink-tertiary dark:text-ink-dark-tertiary">
          <Link href="/terms" className="hover:text-ink-primary transition-colors">
            Terms of Use
          </Link>
          <span>|</span>
          <Link href="/privacy" className="hover:text-ink-primary transition-colors">
            Privacy Policy
          </Link>
          <span>|</span>
          <Link href="/copyright" className="hover:text-ink-primary transition-colors">
            Copyright
          </Link>
        </div>
      </div>
    </div>
  );
};

