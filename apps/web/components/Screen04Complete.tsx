'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Check,
  Sparkles,
  Download,
  Copy,
  Clock,
  RotateCcw,
  X,
  AlertOctagon,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatBytes } from '@/lib/formatUtils';
import { playCrystalChime, playGlassTick } from '@/lib/soundEffects';
import { GlassAudioPreview } from './GlassAudioPreview';

export const Screen04Complete: React.FC = () => {
  const {
    activeJobId,
    mode,
    customFilename,
    container,
    audioFormat,
    selectedHeight,
    finalFilesize,
    setScreen,
    setUrl,
    setMetadata,
    soundEnabled,
    addSessionHistory,
  } = useAppStore();

  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900); // 15 mins (15:00)

  const isAudio = mode === 'audio';
  const effectiveExt = isAudio ? (audioFormat || 'mp3') : container;
  const filename = customFilename.endsWith(`.${effectiveExt}`)
    ? customFilename
    : `${customFilename}.${effectiveExt}`;
  const resolution = selectedHeight === 'best' ? '1080p' : `${selectedHeight}`;
  const sizeText = formatBytes(finalFilesize || 248 * 1024 * 1024);
  const isExpired = timeLeft <= 0;

  useEffect(() => {
    // Play crystal glass harmonic chime on success
    if (soundEnabled) {
      playCrystalChime();
    }

    // Save to session history (sessionStorage backed)
    addSessionHistory({
      id: activeJobId || 'demo-job-id',
      filename,
      title: customFilename,
      filesize: finalFilesize || 248 * 1024 * 1024,
      format: effectiveExt,
      timestamp: Date.now(),
      expiresAt: Date.now() + 900 * 1000,
    });

    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatCountdown = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s.toString().padStart(2, '0')}`;
  };

  const handleCopyName = () => {
    if (soundEnabled) playGlassTick();
    navigator.clipboard.writeText(filename);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartAnother = () => {
    if (soundEnabled) playGlassTick();
    setUrl('');
    setMetadata(null);
    setScreen('home');
  };

  const downloadHref = activeJobId
    ? `/api/v1/jobs/${activeJobId}/file`
    : `data:text/plain;charset=utf-8,${encodeURIComponent('ClipGlass Demo Media File')}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        onClick={() => setScreen('configure')}
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-md transition-all"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="relative w-full max-w-lg glass glass-rim rounded-[36px] p-6 sm:p-8 shadow-2xl z-10 flex flex-col items-center text-center gap-5 max-h-[90vh] overflow-y-auto"
      >
        <button
          type="button"
          onClick={() => setScreen('configure')}
          className="absolute top-5 right-5 w-8 h-8 rounded-full glass flex items-center justify-center text-ink-secondary hover:text-ink-primary transition-all"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Glowing Green Checkmark with Sparkle Accents */}
        <div className="relative mt-1 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-success text-white flex items-center justify-center shadow-[0_4px_20px_rgba(47,203,140,0.5)] dark:shadow-[0_0_35px_rgba(47,203,140,0.85)] dark:ring-4 dark:ring-emerald-400/30 z-10">
            <Check className="w-8 h-8 stroke-[3]" />
          </div>
          <Sparkles className="absolute -top-3 -left-3 w-5 h-5 text-amber-300 dark:text-cyan-300 animate-pulse dark:drop-shadow-[0_0_8px_rgba(103,232,249,0.8)]" />
          <Sparkles className="absolute -bottom-2 -right-3 w-4 h-4 text-emerald-400 animate-pulse delay-150 dark:drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
        </div>

        <div className="flex flex-col gap-1">
          <h3 className="font-heading font-bold text-xl md:text-2xl text-ink-primary dark:text-ink-dark-primary lowercase tracking-tight">
            your file is ready
          </h3>
          <p className="text-xs md:text-sm font-mono text-ink-secondary dark:text-ink-dark-secondary truncate max-w-sm">
            {filename}
          </p>
          <p className="text-xs text-ink-tertiary mt-0.5 font-medium">
            {effectiveExt.toUpperCase()} {isAudio ? '' : `· ${resolution}`} · {sizeText}
          </p>
        </div>

        {/* Feature 17: Audition Audio Waveform Preview before saving */}
        {isAudio && (
          <div className="w-full text-left">
            <GlassAudioPreview mode="full" jobId={activeJobId} />
          </div>
        )}

        <div className="w-full flex flex-col gap-2.5 pt-1">
          {isExpired ? (
            <button
              disabled
              className="w-full h-12 rounded-pill bg-slate-300 dark:bg-slate-700/50 text-slate-500 font-heading font-bold text-sm flex items-center justify-center gap-2 cursor-not-allowed select-none"
            >
              <AlertOctagon className="w-4 h-4" />
              <span>File Expired (Storage Purged)</span>
            </button>
          ) : (
            <a
              href={downloadHref}
              download={filename}
              onClick={() => {
                if (soundEnabled) playGlassTick();
              }}
              className="w-full h-12 rounded-pill btn-blue btn-gloss text-white font-heading font-bold text-sm flex items-center justify-center gap-2 shadow-glow-info hover:opacity-95 transition-all select-none"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>Save file</span>
            </a>
          )}

          <button
            type="button"
            onClick={handleCopyName}
            className="w-full h-11 rounded-pill glass glass-rim text-xs font-semibold text-ink-primary dark:text-ink-dark-primary hover:border-white transition-all flex items-center justify-center gap-2"
          >
            <Copy className="w-3.5 h-3.5 text-ink-tertiary" />
            <span>{copied ? 'Copied to clipboard!' : 'Copy file name'}</span>
          </button>
        </div>

        {/* 15-Minute Expiration Countdown */}
        <div className="flex items-center gap-1.5 text-xs text-ink-tertiary font-medium">
          <Clock className={`w-3.5 h-3.5 ${isExpired ? 'text-rose-500' : 'text-audioAction-start'}`} />
          <span>{isExpired ? 'Temporary file expired' : 'Temporary file expires in'}</span>
          <span
            className={`px-2 py-0.5 rounded-full font-mono font-bold ${
              isExpired
                ? 'bg-rose-500/15 text-rose-500'
                : 'bg-audioAction-start/15 text-audioAction-start'
            }`}
          >
            {isExpired ? '00:00 (Expired)' : formatCountdown(timeLeft)}
          </span>
        </div>

        <button
          type="button"
          onClick={handleStartAnother}
          className="w-full h-10 rounded-pill glass text-xs font-semibold text-ink-secondary dark:text-ink-dark-secondary hover:text-ink-primary hover:border-white transition-all flex items-center justify-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5 text-ink-tertiary" />
          <span>Start another download</span>
        </button>
      </motion.div>
    </div>
  );
};
