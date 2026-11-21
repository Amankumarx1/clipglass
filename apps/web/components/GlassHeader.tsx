'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Moon, Sun, Volume2, VolumeX, History, Bookmark, Check, DownloadCloud } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { playGlassTick, playCrystalChime } from '@/lib/soundEffects';

export const GlassHeader: React.FC = () => {
  const {
    theme,
    toggleTheme,
    soundEnabled,
    toggleSound,
    sessionHistory,
    setIsHistoryOpen,
  } = useAppStore();

  const [bookmarkCopied, setBookmarkCopied] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  React.useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallPWA = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      if (soundEnabled) playCrystalChime();
      setDeferredPrompt(null);
    }
  };

  const handleCopyBookmarklet = () => {
    const code = `javascript:(function(){window.open('http://localhost:3000/?url='+encodeURIComponent(location.href));})();`;
    navigator.clipboard.writeText(code);
    setBookmarkCopied(true);
    setTimeout(() => setBookmarkCopied(false), 2500);
  };

  return (
    <header className="w-full flex items-center justify-between py-4 px-6 md:px-8 border-b border-white/40 dark:border-white/10 select-none">
      {/* Logo: Colorful Play Prism + Wordmark */}
      <Link href="/" className="flex items-center gap-2.5 group">
        <div className="relative w-7 h-7 flex items-center justify-center">
          <svg viewBox="0 0 28 28" fill="none" className="w-7 h-7 filter drop-shadow-[0_2px_8px_rgba(47,107,255,0.4)]">
            <defs>
              <linearGradient id="prismGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2F6BFF" />
                <stop offset="45%" stopColor="#7C4DFF" />
                <stop offset="85%" stopColor="#FF5A3C" />
                <stop offset="100%" stopColor="#5CE1FF" />
              </linearGradient>
            </defs>
            <path
              d="M7 5.5C7 4.3 8.3 3.6 9.3 4.2L22.5 12.2C23.5 12.8 23.5 14.2 22.5 14.8L9.3 22.8C8.3 23.4 7 22.7 7 21.5V5.5Z"
              fill="url(#prismGrad)"
            />
          </svg>
        </div>
        <span className="font-heading font-bold text-lg md:text-xl tracking-tight text-ink-primary dark:text-ink-dark-primary">
          ClipGlass
        </span>
      </Link>

      {/* Center Nav Links */}
      <nav className="hidden sm:flex items-center gap-4 md:gap-6 text-xs md:text-sm font-semibold text-ink-secondary dark:text-ink-dark-secondary">
        <Link href="/#how-it-works" className="hover:text-ink-primary dark:hover:text-ink-dark-primary transition-colors">
          How it works
        </Link>
        <span className="text-ink-tertiary/40">|</span>
        <Link href="/faq" className="hover:text-ink-primary dark:hover:text-ink-dark-primary transition-colors">
          FAQ
        </Link>
        <span className="text-ink-tertiary/40">|</span>
        <Link href="/terms" className="hover:text-ink-primary dark:hover:text-ink-dark-primary transition-colors">
          Terms
        </Link>
        <span className="text-ink-tertiary/40">|</span>
        <Link href="/privacy" className="hover:text-ink-primary dark:hover:text-ink-dark-primary transition-colors">
          Privacy
        </Link>
      </nav>

      {/* Right Controls: Sound, Bookmarklet, History, Theme Moon Pill */}
      <div className="flex items-center gap-2">
        {/* PWA Install Button (Dynamic) */}
        {deferredPrompt && (
          <button
            type="button"
            onClick={handleInstallPWA}
            title="Install ClipGlass Desktop / Mobile App"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-pill glass border border-blue-400 text-xs font-semibold text-blue-600 dark:text-blue-300 shadow-sm animate-pulse"
          >
            <DownloadCloud className="w-3.5 h-3.5 text-blue-500" />
            <span>Install App</span>
          </button>
        )}

        {/* Bookmarklet Quick Tool */}
        <button
          type="button"
          onClick={handleCopyBookmarklet}
          title="Click to copy 1-Click YouTube Bookmarklet"
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-pill glass glass-rim text-xs font-semibold text-ink-secondary dark:text-ink-dark-secondary hover:text-ink-primary transition-all"
        >
          {bookmarkCopied ? <Check className="w-3.5 h-3.5 text-success stroke-[3]" /> : <Bookmark className="w-3.5 h-3.5 text-infoAction-start" />}
          <span>{bookmarkCopied ? 'Bookmarklet Copied!' : '1-Click Tool'}</span>
        </button>

        {/* Sensory Sound Toggle */}
        <button
          type="button"
          onClick={() => {
            playGlassTick();
            toggleSound();
          }}
          title={soundEnabled ? 'Disable glass audio feedback' : 'Enable glass audio feedback'}
          aria-label="Toggle sensory sound effects"
          className="w-9 h-9 rounded-full flex items-center justify-center glass glass-rim text-ink-secondary hover:text-ink-primary transition-all"
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4 text-infoAction-start" />
          ) : (
            <VolumeX className="w-4 h-4 text-ink-tertiary" />
          )}
        </button>

        {/* Session Media History Drawer Trigger */}
        <button
          type="button"
          onClick={() => setIsHistoryOpen(true)}
          title="Recent session downloads"
          aria-label="Open session media history"
          className="relative w-9 h-9 rounded-full flex items-center justify-center glass glass-rim text-ink-secondary hover:text-ink-primary transition-all"
        >
          <History className="w-4 h-4" />
          {sessionHistory.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primaryAction-start text-white text-[9px] font-bold flex items-center justify-center shadow-sm">
              {sessionHistory.length}
            </span>
          )}
        </button>

        {/* Theme Moon Toggle */}
        <button
          type="button"
          onClick={() => {
            if (soundEnabled) playGlassTick();
            toggleTheme();
          }}
          aria-label="Toggle theme"
          className="w-9 h-9 rounded-full flex items-center justify-center glass glass-rim text-ink-primary dark:text-ink-dark-primary hover:border-white transition-all shadow-sm"
        >
          {theme === 'light' ? (
            <Moon className="w-4 h-4 text-ink-secondary fill-ink-secondary/20" />
          ) : (
            <Sun className="w-4 h-4 text-amber-300" />
          )}
        </button>
      </div>
    </header>
  );
};
