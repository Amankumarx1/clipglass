'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Smartphone, Film, Radio, Sparkles, Disc, Sliders, Info } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { playGlassPop } from '@/lib/soundEffects';

export const GlassPresets: React.FC = () => {
  const { selectedPreset, presetFallbackNote, applyPreset, soundEnabled } = useAppStore();

  const presets = [
    {
      id: 'best_1080p' as const,
      label: 'Best 1080p MP4',
      sub: 'Video + Audio · 1080p',
      icon: Film,
      color: 'from-blue-500/20 to-cyan-500/20 text-blue-600 dark:text-blue-300',
    },
    {
      id: 'podcast' as const,
      label: 'Podcast MP3',
      sub: '320kbps · EBU R128 Norm',
      icon: Mic,
      color: 'from-purple-500/20 to-indigo-500/20 text-purple-600 dark:text-purple-300',
    },
    {
      id: 'audiophile' as const,
      label: 'Audiophile FLAC',
      sub: 'Lossless Audio Master',
      icon: Disc,
      color: 'from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-300',
    },
    {
      id: '4k_master' as const,
      label: '4K Master',
      sub: '2160p/Max Res + Subs',
      icon: Film,
      color: 'from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-300',
    },
    {
      id: 'shorts' as const,
      label: 'Shorts Cut',
      sub: '1080p MP4 Fast',
      icon: Smartphone,
      color: 'from-orange-500/20 to-red-500/20 text-orange-600 dark:text-orange-300',
    },
  ];

  const handleSelect = (id: 'best_1080p' | 'podcast' | 'audiophile' | '4k_master' | 'shorts') => {
    if (soundEnabled) playGlassPop();
    applyPreset(id);
  };

  return (
    <div className="w-full mb-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>One-Click Studio Presets</span>
        </div>
        {selectedPreset === 'custom' && (
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 flex items-center gap-1">
            <Sliders className="w-3 h-3 text-infoAction-start" />
            Custom Configuration
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {presets.map((p) => {
          const Icon = p.icon;
          const isActive = selectedPreset === p.id;

          return (
            <motion.button
              key={p.id}
              type="button"
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelect(p.id)}
              className={`p-2.5 rounded-2xl text-left border transition-all duration-200 flex flex-col justify-between ${
                isActive
                  ? 'bg-gradient-to-br from-blue-500/30 to-indigo-500/20 border-blue-400 dark:border-blue-500 shadow-md ring-1 ring-blue-400/50'
                  : 'bg-white/40 dark:bg-white/[0.04] border-white/60 dark:border-white/10 hover:bg-white/60 dark:hover:bg-white/[0.08]'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className={`p-1.5 rounded-xl bg-gradient-to-br ${p.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </span>
                {isActive && (
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {p.label}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  {p.sub}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {presetFallbackNote && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 px-3 py-1.5 rounded-xl glass border border-amber-400/40 bg-amber-500/10 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-1.5"
          >
            <Info className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>{presetFallbackNote}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
