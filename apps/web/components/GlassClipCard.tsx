'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  Pause,
  Download,
  Sliders,
  Sparkles,
  Clock,
  Layers,
  CheckCircle2,
  Share2,
  FileText
} from 'lucide-react';
import { ClipMoment, renderClip, getClipDownloadUrl } from '@/lib/clipApi';
import { useClipStore } from '@/lib/clipStore';
import { playGlassPop, playGlassTick } from '@/lib/soundEffects';

interface GlassClipCardProps {
  clip: ClipMoment;
  jobId: string;
}

export const GlassClipCard: React.FC<GlassClipCardProps> = ({ clip, jobId }) => {
  const { updateLocalClip, setSelectedClipId, setIsCaptionDrawerOpen } = useClipStore();
  const [isRendering, setIsRendering] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-500 stroke-emerald-500';
    if (score >= 75) return 'text-cyan-500 stroke-cyan-500';
    return 'text-amber-500 stroke-amber-500';
  };

  const handleRender = async () => {
    playGlassTick();
    setIsRendering(true);
    try {
      const updated = await renderClip(jobId, clip.clipId);
      updateLocalClip(clip.clipId, updated);
      playGlassPop();
    } catch (err: any) {
      alert(`Render failed: ${err.message || err}`);
    } finally {
      setIsRendering(false);
    }
  };

  const handleOpenEdit = () => {
    playGlassPop();
    setSelectedClipId(clip.clipId);
    setIsCaptionDrawerOpen(true);
  };

  const downloadUrl = getClipDownloadUrl(jobId, clip.clipId);

  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      className="glass glass-rim rounded-3xl p-5 flex flex-col justify-between transition-all duration-300 relative overflow-hidden group shadow-lg"
    >
      {/* Top Row: Score Ring & Hook Badge */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-orange-500/20 text-orange-600 dark:text-orange-300 border border-orange-500/30 mb-2">
            <Sparkles className="w-2.5 h-2.5" />
            {clip.hook}
          </span>
          <h3 className="text-sm font-heading font-bold text-ink-primary dark:text-ink-dark-primary line-clamp-2">
            {clip.title}
          </h3>
        </div>

        {/* Circular Score Gauge */}
        <div className="relative w-12 h-12 flex-shrink-0 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-slate-200 dark:text-white/10"
              strokeWidth="3.5"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className={`${getScoreColor(clip.score)} transition-all duration-500`}
              strokeDasharray={`${clip.score}, 100`}
              strokeWidth="3.5"
              strokeLinecap="round"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xs font-mono font-bold text-slate-800 dark:text-white leading-none">
              {clip.score}
            </span>
          </div>
        </div>
      </div>

      {/* Video Preview Card Area (9:16 Mockup) */}
      <div className="relative aspect-[9/12] w-full rounded-2xl bg-slate-900 overflow-hidden mb-4 border border-white/10 flex items-center justify-center">
        {clip.status === 'ready' && clip.videoUrl ? (
          <video
            src={downloadUrl}
            controls={isPlaying}
            className="w-full h-full object-cover"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-4">
            <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white mb-2">
              <Play className="w-4 h-4 fill-current ml-0.5" />
            </div>
            <p className="text-xs font-semibold text-slate-200">
              {clip.status === 'rendering' ? 'Rendering 9:16 Clip...' : '9:16 Vertical Preview'}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {clip.reframeMode === 'split' ? 'Split Screen Stack' : 'Speaker Face Follow'}
            </p>
          </div>
        )}

        {/* Duration badge */}
        <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-sm text-[10px] font-mono font-bold text-white flex items-center gap-1">
          <Clock className="w-2.5 h-2.5" />
          {clip.duration}s
        </div>
      </div>

      {/* Meta & Reason */}
      <div className="space-y-2 mb-4">
        <p className="text-[11px] text-ink-secondary dark:text-ink-dark-secondary line-clamp-2">
          {clip.reason}
        </p>
        <div className="flex flex-wrap gap-1">
          {clip.hashtags.map((tag) => (
            <span key={tag} className="text-[10px] font-mono text-blue-500">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-2 border-t border-white/20 dark:border-white/10">
        <button
          type="button"
          onClick={handleOpenEdit}
          className="flex-1 py-2 px-3 rounded-xl glass hover:bg-white/30 text-xs font-semibold text-ink-primary dark:text-ink-dark-primary flex items-center justify-center gap-1.5 transition-colors"
        >
          <Sliders className="w-3.5 h-3.5 text-blue-500" />
          <span>Edit & Captions</span>
        </button>

        {clip.status === 'ready' ? (
          <a
            href={downloadUrl}
            download={`clip_${clip.clipId}.mp4`}
            className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold shadow-md hover:opacity-95 flex items-center justify-center gap-1.5 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Save 9:16</span>
          </a>
        ) : (
          <button
            type="button"
            disabled={isRendering}
            onClick={handleRender}
            className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold shadow-md hover:opacity-95 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
          >
            {isRendering ? (
              <>
                <div className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span>Burning...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Burn Clip</span>
              </>
            )}
          </button>
        )}
      </div>
    </motion.div>
  );
};

