'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Bookmark, Clock, Scissors } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { ChapterInfo } from '@/lib/mockData';
import { formatDuration } from '@/lib/formatUtils';
import { playGlassTick } from '@/lib/soundEffects';

interface GlassChaptersProps {
  chapters?: ChapterInfo[];
}

export const GlassChapters: React.FC<GlassChaptersProps> = ({ chapters }) => {
  const {
    activeChapter,
    setActiveChapter,
    setTrimEnabled,
    setTrimStart,
    setTrimEnd,
    setCustomFilename,
    setSelectedPreset,
    soundEnabled,
  } = useAppStore();

  if (!chapters || chapters.length === 0) return null;

  const handleSelectChapter = (ch: ChapterInfo) => {
    if (soundEnabled) playGlassTick();
    setActiveChapter(ch.title);
    setTrimEnabled(true);
    setTrimStart(formatDuration(Math.floor(ch.startTime)));
    setTrimEnd(formatDuration(Math.floor(ch.endTime)));
    const cleanChapterSlug = ch.title
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setCustomFilename(cleanChapterSlug || 'chapter-clip');
    setSelectedPreset('custom');
  };

  return (
    <div className="w-full mt-4 p-4 rounded-2xl bg-white/30 dark:bg-white/[0.04] border border-white/60 dark:border-white/10 shadow-sm backdrop-blur-md">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bookmark className="w-4 h-4 text-violet-500" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Detected Video Chapters ({chapters.length})
          </span>
        </div>
        <span className="text-[11px] text-slate-500 flex items-center gap-1">
          <Scissors className="w-3 h-3 text-emerald-500" />
          Click a chapter to auto-trim segment
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {chapters.map((ch, idx) => {
          const isSelected = activeChapter === ch.title;
          const durationSec = Math.floor(ch.endTime - ch.startTime);

          return (
            <motion.button
              key={idx}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelectChapter(ch)}
              className={`flex items-center justify-between p-2.5 rounded-xl text-left transition-all duration-200 border text-xs ${
                isSelected
                  ? 'bg-blue-500/20 border-blue-400 text-blue-900 dark:text-blue-100 font-semibold shadow-inner'
                  : 'bg-white/40 dark:bg-white/[0.03] border-white/60 dark:border-white/10 hover:bg-white/60 dark:hover:bg-white/[0.08] text-slate-800 dark:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 pr-2">
                <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-700 dark:text-violet-300 flex items-center justify-center text-[10px] font-mono shrink-0">
                  {idx + 1}
                </span>
                <span className="truncate">{ch.title}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0 font-mono text-[11px] text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-black/20 px-2 py-0.5 rounded-md">
                <Clock className="w-3 h-3" />
                <span>
                  {formatDuration(Math.floor(ch.startTime))} - {formatDuration(Math.floor(ch.endTime))}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

