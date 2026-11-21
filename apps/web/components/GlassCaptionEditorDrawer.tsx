'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Sliders,
  Type,
  Clock,
  Layers,
  Sparkles,
  Check,
  Film,
  Smartphone
} from 'lucide-react';
import { useClipStore } from '@/lib/clipStore';
import { updateClipMoment, renderClip } from '@/lib/clipApi';
import { playGlassPop, playGlassTick } from '@/lib/soundEffects';

export const GlassCaptionEditorDrawer: React.FC = () => {
  const {
    activeJobId,
    clips,
    selectedClipId,
    isCaptionDrawerOpen,
    setIsCaptionDrawerOpen,
    updateLocalClip
  } = useClipStore();

  const clip = clips.find((c) => c.clipId === selectedClipId);

  const [start, setStart] = useState<number>(0);
  const [end, setEnd] = useState<number>(0);
  const [hook, setHook] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [transcript, setTranscript] = useState<string>('');
  const [captionPreset, setCaptionPreset] = useState<any>('viral_pop');
  const [reframeMode, setReframeMode] = useState<any>('follow-face');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (clip) {
      setStart(clip.start);
      setEnd(clip.end);
      setHook(clip.hook);
      setTitle(clip.title);
      setTranscript(clip.transcriptText || '');
      setCaptionPreset(clip.captionPreset);
      setReframeMode(clip.reframeMode);
    }
  }, [clip]);

  if (!isCaptionDrawerOpen || !clip || !activeJobId) return null;

  const captionPresets = [
    { id: 'viral_pop', label: 'Viral Pop', desc: 'Bold Yellow & White with Heavy Outline' },
    { id: 'minimalist', label: 'Clean Minimalist', desc: 'Understated Inter with Subtle Shadow' },
    { id: 'neon_cyber', label: 'Neon Cyber', desc: 'Electric Cyan & Magenta Glow' },
    { id: 'karaoke', label: 'Karaoke Bounce', desc: 'Word-by-word Bright Green Highlight' },
    { id: 'headline', label: 'Impact Headline', desc: 'Top Sticky Hook Card with Bottom Subtitles' },
  ];

  const handleSave = async () => {
    playGlassTick();
    setIsSaving(true);
    try {
      const updated = await updateClipMoment(activeJobId, clip.clipId, {
        start,
        end,
        hook,
        title,
        transcriptText: transcript,
        captionPreset,
        reframeMode,
      });
      updateLocalClip(clip.clipId, updated);
      playGlassPop();
      setIsCaptionDrawerOpen(false);
    } catch (e: any) {
      alert(`Save failed: ${e.message || e}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-full max-w-lg h-full glass glass-rim border-l border-white/20 dark:border-white/10 p-6 overflow-y-auto flex flex-col justify-between shadow-2xl bg-slate-900/90 text-white"
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-blue-400" />
              <h2 className="text-base font-bold font-heading">
                Edit Clip & Caption Studio
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setIsCaptionDrawerOpen(false)}
              className="w-8 h-8 rounded-full glass hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Timing Section */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              Clip Timing Boundaries ({Math.round(end - start)}s duration)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] text-slate-400">Start Time (sec)</span>
                <input
                  type="number"
                  step="0.5"
                  value={start}
                  onChange={(e) => setStart(parseFloat(e.target.value) || 0)}
                  className="w-full glass h-9 px-3 rounded-xl text-xs bg-transparent text-white border border-white/20"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400">End Time (sec)</span>
                <input
                  type="number"
                  step="0.5"
                  value={end}
                  onChange={(e) => setEnd(parseFloat(e.target.value) || 0)}
                  className="w-full glass h-9 px-3 rounded-xl text-xs bg-transparent text-white border border-white/20"
                />
              </div>
            </div>
          </div>

          {/* Hook & Title */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Opening Hook Teaser
              </label>
              <input
                type="text"
                value={hook}
                onChange={(e) => setHook(e.target.value)}
                className="w-full glass h-9 px-3 rounded-xl text-xs bg-transparent text-white border border-white/20 uppercase"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Clip Headline Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full glass h-9 px-3 rounded-xl text-xs bg-transparent text-white border border-white/20"
              />
            </div>
          </div>

          {/* Transcript Editor */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-purple-400" />
              Spoken Transcript (Editable before burn)
            </label>
            <textarea
              rows={4}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              className="w-full glass p-3 rounded-xl text-xs bg-transparent text-white border border-white/20 focus:outline-none leading-relaxed"
              placeholder="Correct words or remove filler words..."
            />
          </div>

          {/* Caption Style Preset Picker */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">
              Word-Synced Caption Style Preset
            </label>
            <div className="space-y-1.5">
              {captionPresets.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => { playGlassPop(); setCaptionPreset(p.id); }}
                  className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                    captionPreset === p.id
                      ? 'bg-blue-600/30 border-blue-400 ring-1 ring-blue-400'
                      : 'glass hover:bg-white/10 border-white/10'
                  }`}
                >
                  <div>
                    <p className="text-xs font-bold text-white">{p.label}</p>
                    <p className="text-[10px] text-slate-400">{p.desc}</p>
                  </div>
                  {captionPreset === p.id && <Check className="w-4 h-4 text-blue-400" />}
                </button>
              ))}
            </div>
          </div>

          {/* Reframe Mode Picker */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              9:16 Vertical Reframing Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'follow-face', label: 'Face Track' },
                { id: 'center', label: 'Center 9:16' },
                { id: 'split', label: 'Split Screen' }
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => { playGlassPop(); setReframeMode(m.id); }}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-center ${
                    reframeMode === m.id
                      ? 'bg-emerald-600/30 border-emerald-400 text-white ring-1 ring-emerald-400'
                      : 'glass hover:bg-white/10 border-white/10 text-slate-300'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Save & Render Actions */}
        <div className="pt-6 border-t border-white/10 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsCaptionDrawerOpen(false)}
            className="flex-1 py-2.5 rounded-xl glass hover:bg-white/20 text-xs font-semibold text-slate-300 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold shadow-lg hover:opacity-95 transition-all disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
