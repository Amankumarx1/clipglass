'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wrench } from 'lucide-react';
import { useAppStore, ScreenState } from '@/lib/store';
import { sampleVideoMetadata } from '@/lib/mockData';

export const ScreenSwitcher: React.FC = () => {
  const { screen, setScreen, metadata, setMetadata } = useAppStore();
  const [isVisible, setIsVisible] = useState(false);

  // Guard: if explicitly disabled by environment flag, compile out completely
  if (process.env.NEXT_PUBLIC_ENABLE_DEV_DOCK === 'false') {
    return null;
  }

  useEffect(() => {
    // 1. Check if ?dev=true or ?preview=true is in URL
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('dev') === 'true' || params.get('preview') === 'true') {
        setIsVisible(true);
      }
    }

    // 2. Secret Dev Shortcut: Ctrl+Shift+D or Cmd+Shift+D
    const handleToggleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        e.preventDefault();
        setIsVisible((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleToggleKey);
    return () => window.removeEventListener('keydown', handleToggleKey);
  }, []);

  if (!isVisible) return null;

  const screens: { id: ScreenState; label: string }[] = [
    { id: 'home', label: '01 HOME' },
    { id: 'configure', label: '02 CONFIGURE' },
    { id: 'in_progress', label: '03 IN PROGRESS' },
    { id: 'complete', label: '04 COMPLETE' },
    { id: 'auto_clip', label: '05 AUTO CLIP' },
  ];

  const handleSelectScreen = (id: ScreenState) => {
    if (id !== 'home' && !metadata) {
      setMetadata(sampleVideoMetadata);
    }
    setScreen(id);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        className="w-full flex items-center justify-center mb-5 px-4 select-none z-30"
      >
        <div className="inline-flex items-center gap-1.5 p-1 pl-3 pr-1.5 rounded-pill glass glass-rim shadow-lg backdrop-blur-xl border border-blue-400/30">
          <span className="flex items-center gap-1 text-[10px] font-mono text-blue-500 font-bold uppercase tracking-wider mr-1">
            <Wrench className="w-3 h-3 text-blue-400" />
            DEV
          </span>

          {screens.map((s) => {
            const isActive = screen === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => handleSelectScreen(s.id)}
                className={`relative px-3.5 py-1.5 rounded-pill text-[11px] font-heading font-bold tracking-tight transition-all z-10 ${
                  isActive
                    ? 'text-white'
                    : 'text-ink-secondary dark:text-ink-dark-secondary hover:text-ink-primary dark:hover:text-white'
                }`}
              >
                <span>{s.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeScreenPill"
                    className="absolute inset-0 bg-gradient-to-r from-infoAction-start to-infoAction-middle rounded-pill shadow-sm dark:shadow-[0_0_15px_rgba(47,107,255,0.7)] -z-10"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
              </button>
            );
          })}

          {/* Dismiss Button */}
          <button
            type="button"
            onClick={() => setIsVisible(false)}
            title="Hide Dev Switcher (Press Ctrl+Shift+D to toggle)"
            className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/20 text-ink-tertiary hover:text-ink-primary transition-all ml-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
