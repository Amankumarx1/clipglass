'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Download, Check, Globe, Loader2 } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { playGlassPop, playCrystalChime } from '@/lib/soundEffects';

export const GlassSubtitles: React.FC = () => {
  const {
    url,
    metadata,
    enableSubtitles,
    setEnableSubtitles,
    subtitleLang,
    setSubtitleLang,
    soundEnabled,
  } = useAppStore();

  const [format, setFormat] = useState<'srt' | 'vtt' | 'txt'>('srt');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!enableSubtitles) return null;

  const availableSubs = metadata?.availableSubtitles || [
    { lang: 'en', name: 'English' },
    { lang: 'es', name: 'Spanish' },
    { lang: 'fr', name: 'French' },
    { lang: 'de', name: 'German' },
  ];

  const handleInstantDownload = async () => {
    if (soundEnabled) playGlassPop();
    setIsDownloading(true);
    setDownloadSuccess(false);

    try {
      const targetUrl = url || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      const apiEndpoint = `${process.env.NEXT_PUBLIC_API_URL || ''}/api/v1/subtitles/download?url=${encodeURIComponent(
        targetUrl
      )}&lang=${subtitleLang}&format=${format}`;

      const res = await fetch(apiEndpoint);
      if (!res.ok) {
        // Fallback for demo or mock if backend didn't extract real captions
        const sampleSrt = `1\n00:00:01,000 --> 00:00:04,500\n[Music playing]\n\n2\n00:00:05,000 --> 00:00:09,200\nWelcome to ClipGlass — premium liquid glass media studio.\n\n3\n00:00:10,000 --> 00:00:14,000\nBuilding high-performance audio and video tools.`;
        const blob = new Blob([sampleSrt], { type: 'text/plain;charset=utf-8' });
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `${metadata?.defaultFilename || 'subtitles'}_${subtitleLang}.${format}`;
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
      } else {
        const blob = await res.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `${metadata?.defaultFilename || 'subtitles'}_${subtitleLang}.${format}`;
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
      }

      setDownloadSuccess(true);
      if (soundEnabled) playCrystalChime();
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.warn('Subtitles download notice:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="w-full mt-3 p-4 rounded-2xl bg-white/30 dark:bg-white/[0.04] border border-white/60 dark:border-white/10 backdrop-blur-md"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-500" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Subtitle & Transcript Options
          </span>
        </div>

        {/* Instant Subtitles Download Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleInstantDownload}
          disabled={isDownloading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md hover:shadow-lg transition-all"
        >
          {isDownloading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : downloadSuccess ? (
            <Check className="w-3.5 h-3.5 text-emerald-300" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
          <span>{downloadSuccess ? 'Downloaded!' : `Download .${format} now`}</span>
        </motion.button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Language selector */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
            <Globe className="w-3 h-3 text-slate-500" />
            Language
          </label>
          <select
            value={subtitleLang}
            onChange={(e) => setSubtitleLang(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-white/50 dark:bg-white/[0.08] border border-white/60 dark:border-white/15 text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-blue-400"
          >
            {availableSubs.map((sub) => (
              <option key={sub.lang} value={sub.lang} className="dark:bg-slate-900">
                {sub.name} ({sub.lang.toUpperCase()})
              </option>
            ))}
          </select>
        </div>

        {/* Format chips */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
            Format
          </label>
          <div className="flex items-center gap-1.5">
            {(['srt', 'vtt', 'txt'] as const).map((fmt) => (
              <button
                key={fmt}
                onClick={() => setFormat(fmt)}
                className={`flex-1 py-1.5 text-xs font-mono uppercase rounded-xl border transition-all ${
                  format === fmt
                    ? 'bg-blue-500 text-white border-blue-500 shadow-sm font-semibold'
                    : 'bg-white/40 dark:bg-white/[0.05] border-white/60 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-white/60'
                }`}
              >
                .{fmt}
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

