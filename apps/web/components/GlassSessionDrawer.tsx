'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, X, Clock, Download, Copy, Trash2, Film, Music, Check, AlertOctagon } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatBytes } from '@/lib/formatUtils';
import { playGlassTick } from '@/lib/soundEffects';

export const GlassSessionDrawer: React.FC = () => {
  const { isHistoryOpen, setIsHistoryOpen, sessionHistory, removeSessionHistory, soundEnabled } = useAppStore();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  // Tick every second to update countdowns
  useEffect(() => {
    if (!isHistoryOpen) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [isHistoryOpen]);

  const handleCopy = (id: string, name: string) => {
    if (soundEnabled) playGlassTick();
    navigator.clipboard.writeText(name);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRemove = (id: string) => {
    if (soundEnabled) playGlassTick();
    removeSessionHistory(id);
  };

  const formatCountdown = (expiresAt: number) => {
    const diffSecs = Math.max(0, Math.floor((expiresAt - now) / 1000));
    if (diffSecs <= 0) return '00:00';
    const m = Math.floor(diffSecs / 60);
    const s = diffSecs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsHistoryOpen(false)}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="relative w-full max-w-md h-full glass glass-rim shadow-2xl z-10 p-6 flex flex-col justify-between overflow-y-auto"
          >
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/40 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-infoAction-start" />
                  <div>
                    <h3 className="font-heading font-bold text-base text-ink-primary dark:text-ink-dark-primary">
                      Session Media Drawer
                    </h3>
                    <p className="text-[10px] text-ink-tertiary">
                      Client-only sessionStorage · Auto-wipes when tab closes
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsHistoryOpen(false)}
                  className="w-8 h-8 rounded-full glass flex items-center justify-center text-ink-secondary hover:text-ink-primary transition-all"
                  aria-label="Close drawer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Items List */}
              <div className="mt-4 flex flex-col gap-3">
                {sessionHistory.length === 0 ? (
                  <div className="py-16 text-center text-xs text-ink-tertiary">
                    <History className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="font-semibold text-ink-secondary">No media in this session yet.</p>
                    <p className="mt-1 opacity-75">Processed files will appear here with live 15-minute countdowns.</p>
                  </div>
                ) : (
                  sessionHistory.map((item) => {
                    const isExpired = item.expiresAt <= now;
                    const isAudio = ['mp3', 'm4a', 'flac', 'wav', 'opus'].includes(item.format.toLowerCase());

                    return (
                      <div
                        key={item.id}
                        className={`p-3.5 rounded-2xl border transition-all flex flex-col gap-2.5 ${
                          isExpired
                            ? 'bg-slate-200/40 dark:bg-white/[0.02] border-slate-300 dark:border-white/5 opacity-60 grayscale'
                            : 'glass glass-rim border-white/60 dark:border-white/10 shadow-sm'
                        }`}
                      >
                        {/* Title, Badge & Expiry Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-infoAction-start/15 flex items-center justify-center text-infoAction-start shrink-0">
                              {isAudio ? <Music className="w-3.5 h-3.5" /> : <Film className="w-3.5 h-3.5" />}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-ink-primary dark:text-ink-dark-primary truncate">
                                {item.title || item.filename}
                              </p>
                              <p className="text-[10px] font-mono text-ink-tertiary truncate">
                                {item.filename}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-infoAction-start/15 text-infoAction-start font-bold uppercase">
                              {item.format}
                            </span>
                            {isExpired ? (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-500 font-bold flex items-center gap-1">
                                <AlertOctagon className="w-3 h-3" />
                                Expired
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatCountdown(item.expiresAt)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] font-mono text-ink-tertiary pt-1 border-t border-white/20">
                          <span>{formatBytes(item.filesize)}</span>
                          <span className="text-[10px]">15-min TTL</span>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 pt-1">
                          {isExpired ? (
                            <button
                              disabled
                              className="flex-1 h-8 rounded-pill bg-slate-300 dark:bg-slate-700/50 text-slate-500 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-not-allowed"
                            >
                              <span>Expired</span>
                            </button>
                          ) : (
                            <a
                              href={`/api/v1/jobs/${item.id}/file`}
                              download={item.filename}
                              className="flex-1 h-8 rounded-pill btn-blue btn-gloss text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm select-none"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Save again</span>
                            </a>
                          )}

                          <button
                            type="button"
                            onClick={() => handleCopy(item.id, item.filename)}
                            title="Copy file name"
                            className="h-8 px-3 rounded-pill glass text-xs font-semibold text-ink-secondary hover:text-ink-primary flex items-center gap-1"
                          >
                            {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedId === item.id ? 'Copied' : 'Copy'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemove(item.id)}
                            title="Remove from history"
                            className="w-8 h-8 rounded-pill glass text-rose-500 hover:bg-rose-500/10 flex items-center justify-center transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-white/30 text-[11px] text-ink-tertiary text-center">
              Ephemeral storage is unlinked and deleted 15 minutes after completion.
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
