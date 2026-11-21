'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Clipboard,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Download,
  Film,
  Zap,
  ArrowRight,
  ShieldCheck,
  Check,
  RefreshCw,
  Archive
} from 'lucide-react';
import { useClipStore } from '@/lib/clipStore';
import { createClipJob, subscribeToClipJobEvents, getExportAllUrl } from '@/lib/clipApi';
import { GlassStageTimeline } from './GlassStageTimeline';
import { GlassClipCard } from './GlassClipCard';
import { GlassCaptionEditorDrawer } from './GlassCaptionEditorDrawer';
import { GlassHeader } from './GlassHeader';
import { playGlassPop, playGlassTick } from '@/lib/soundEffects';

export const ScreenAutoClip: React.FC = () => {
  const {
    url,
    setUrl,
    activeJobId,
    setActiveJobId,
    stage,
    setStage,
    percent,
    setPercent,
    activeStep,
    setActiveStep,
    clips,
    setClips,
    minLength,
    setMinLength,
    maxLength,
    setMaxLength,
    clipCount,
    setClipCount,
    reframeMode,
    setReframeMode,
    captionPreset,
    setCaptionPreset,
    polishStyle,
    setPolishStyle,
    consent,
    setConsent,
    error,
    setError,
    reset
  } = useClipStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        playGlassTick();
        setUrl(text.trim());
      }
    } catch (e) {
      console.warn('Clipboard read notice:', e);
    }
  };

  const handleStartAutoClip = async () => {
    if (!url.trim() || !consent) return;
    playGlassTick();
    setIsSubmitting(true);
    setError(null);
    setStage('queued');
    setPercent(5);
    setActiveStep('Initializing Auto Clip pipeline...');

    try {
      const jobId = await createClipJob({
        url: url.trim(),
        minLength,
        maxLength,
        clipCount,
        reframeMode,
        captionPreset,
        polishStyle,
        consent: true
      });

      setActiveJobId(jobId);

      // Subscribe to real-time SSE stage events
      subscribeToClipJobEvents(
        jobId,
        (event) => {
          setStage(event.stage as any);
          setPercent(event.percent);
          setActiveStep(event.activeStep);
          if (event.clips && event.clips.length > 0) {
            setClips(event.clips);
          }
          if (event.error) {
            setError(event.error);
          }
        },
        (err) => {
          console.warn('SSE stream error notice:', err);
        }
      );

    } catch (err: any) {
      setError(err);
      setStage('failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isJobActive = ['queued', 'ingest', 'transcribe', 'signals', 'scoring'].includes(stage);
  const isJobReady = stage === 'ready' && clips.length > 0;

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col items-center py-4 px-2 sm:px-4">
      {/* Liquid Glass Header */}
      <GlassHeader />

      {/* Hero Badge */}
      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 text-orange-600 dark:text-orange-300 text-xs font-semibold mb-3">
        <Sparkles className="w-3.5 h-3.5" />
        <span>AI Auto Clip · Ranked 9:16 Shorts Engine</span>
      </div>

      <h1 className="text-2xl sm:text-4xl font-heading font-extrabold text-ink-primary dark:text-ink-dark-primary text-center mb-2 tracking-tight">
        Turn Any Long Video Into Viral 9:16 Shorts
      </h1>
      <p className="text-xs sm:text-sm text-ink-secondary dark:text-ink-dark-secondary text-center max-w-xl mb-6">
        Paste a YouTube link. Our multimodal engine analyzes heatmaps, audio spikes, and scene shifts to extract, track faces, and burn word-synced animated subtitles.
      </p>

      {/* Main Glass Search / Input Card */}
      <div className="w-full glass glass-rim rounded-3xl p-5 mb-6 shadow-xl relative overflow-hidden">
        {/* Pill URL Search Bar */}
        <div className="relative flex items-center glass rounded-full h-14 px-5 border border-white/40 dark:border-white/10 shadow-inner mb-4">
          <Film className="w-5 h-5 text-orange-500 mr-3 flex-shrink-0" />
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste YouTube video or podcast URL (e.g. https://www.youtube.com/watch?v=...)"
            className="w-full bg-transparent text-xs sm:text-sm text-ink-primary dark:text-ink-dark-primary focus:outline-none placeholder-slate-400 font-sans"
          />

          <button
            type="button"
            onClick={handlePaste}
            title="Paste from clipboard"
            className="p-2 rounded-full hover:bg-white/20 text-ink-secondary dark:text-slate-300 transition-colors flex-shrink-0"
          >
            <Clipboard className="w-4 h-4" />
          </button>
        </div>

        {/* Options Row */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
          <div>
            <label className="text-[11px] font-semibold text-ink-secondary block mb-1">
              Target Length: {minLength}s - {maxLength}s
            </label>
            <div className="flex items-center gap-1">
              {[
                { label: '30s', min: 20, max: 40 },
                { label: '45s', min: 30, max: 60 },
                { label: '60s', min: 45, max: 80 }
              ].map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => { playGlassPop(); setMinLength(opt.min); setMaxLength(opt.max); }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                    minLength === opt.min
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'glass hover:bg-white/30 text-ink-secondary'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-ink-secondary block mb-1">
              Clips to Extract:
            </label>
            <select
              value={clipCount}
              onChange={(e) => setClipCount(parseInt(e.target.value, 10))}
              className="w-full glass h-8 px-2 rounded-lg text-xs bg-transparent text-ink-primary dark:text-ink-dark-primary border border-white/30"
            >
              <option value={1} className="dark:bg-slate-900">1 Best Clip</option>
              <option value={3} className="dark:bg-slate-900">3 Top Clips</option>
              <option value={5} className="dark:bg-slate-900">5 Top Clips</option>
              <option value={8} className="dark:bg-slate-900">8 Top Clips</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-ink-secondary block mb-1">
              9:16 Reframe Mode:
            </label>
            <select
              value={reframeMode}
              onChange={(e) => setReframeMode(e.target.value as any)}
              className="w-full glass h-8 px-2 rounded-lg text-xs bg-transparent text-ink-primary dark:text-ink-dark-primary border border-white/30"
            >
              <option value="follow-face" className="dark:bg-slate-900">Follow Active Speaker</option>
              <option value="center" className="dark:bg-slate-900">Center 9:16 Crop</option>
              <option value="split" className="dark:bg-slate-900">Split Screen Stack</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-ink-secondary block mb-1">
              Caption Style Preset:
            </label>
            <select
              value={captionPreset}
              onChange={(e) => setCaptionPreset(e.target.value as any)}
              className="w-full glass h-8 px-2 rounded-lg text-xs bg-transparent text-ink-primary dark:text-ink-dark-primary border border-white/30"
            >
              <option value="viral_pop" className="dark:bg-slate-900">Viral Pop (Yellow Highlight)</option>
              <option value="minimalist" className="dark:bg-slate-900">Clean Minimalist</option>
              <option value="neon_cyber" className="dark:bg-slate-900">Neon Cyber Glow</option>
              <option value="karaoke" className="dark:bg-slate-900">Karaoke Bounce</option>
              <option value="headline" className="dark:bg-slate-900">Impact Headline</option>
            </select>
          </div>
        </div>

        {/* Mandatory Consent Checkbox */}
        <div className="flex items-center justify-between pt-2 border-t border-white/20 dark:border-white/10 mb-4">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="w-4 h-4 rounded text-orange-600 focus:ring-0 bg-transparent border-slate-400"
            />
            <span className="text-xs text-ink-secondary dark:text-ink-dark-secondary flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              I own this video or have permission to clip it.
            </span>
          </label>

          {activeJobId && (
            <button
              type="button"
              onClick={reset}
              className="text-xs text-ink-secondary hover:text-ink-primary flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Generate Button */}
        <button
          type="button"
          disabled={!url.trim() || !consent || isJobActive}
          onClick={handleStartAutoClip}
          className="w-full h-12 rounded-2xl bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white font-heading font-bold text-sm shadow-xl hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isJobActive ? (
            <>
              <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              <span>Processing Multimodal Auto Clip Pipeline...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Generate Ranked Auto Clips</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </>
          )}
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="w-full glass rounded-2xl p-4 border border-red-500/30 bg-red-500/10 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-red-600 dark:text-red-400">
              {error.title || 'Error Occurred'}
            </h4>
            <p className="text-xs text-ink-secondary mt-0.5">
              {error.explanation || String(error)}
            </p>
          </div>
        </div>
      )}

      {/* Live Stage Timeline */}
      {isJobActive && (
        <GlassStageTimeline stage={stage} percent={percent} activeStep={activeStep} />
      )}

      {/* Results Section */}
      {isJobReady && (
        <div className="w-full space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-heading font-bold text-ink-primary dark:text-ink-dark-primary flex items-center gap-2">
                <span>Top Ranked Viral Clips</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                  {clips.length} Ready
                </span>
              </h2>
              <p className="text-xs text-ink-secondary">
                Ranked by retention signals and hook strength. Click any clip to preview or edit words before final save.
              </p>
            </div>

            {activeJobId && (
              <a
                href={getExportAllUrl(activeJobId)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold shadow-md hover:opacity-95 flex items-center gap-1.5 transition-all"
              >
                <Archive className="w-4 h-4" />
                <span>Export All (ZIP)</span>
              </a>
            )}
          </div>

          {/* Grid of Clip Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {clips.map((clip) => (
              <GlassClipCard key={clip.clipId} clip={clip} jobId={activeJobId!} />
            ))}
          </div>
        </div>
      )}

      {/* Slide-in Caption Editor Drawer */}
      <GlassCaptionEditorDrawer />
    </div>
  );
};
