'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Smartphone,
  Film,
  Sparkles,
  Layers,
  Zap,
  Bot,
  Sliders,
  ChevronDown,
  Play,
  CheckCircle2,
  AlertTriangle,
  Tv,
  Eye,
  Type,
  Music2,
  Wand2,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { playGlassPop, playGlassTick } from '@/lib/soundEffects';
import { generateExplainerShort } from '@/lib/api';

export const GlassShortsStudio: React.FC = () => {
  const {
    filterStyle,
    setFilterStyle,
    splitScreen,
    setSplitScreen,
    hookIntro,
    setHookIntro,
    hookText,
    setHookText,
    aspectRatio,
    setAspectRatio,
    shortsStudioOpen,
    setShortsStudioOpen,
    soundEnabled,
    setScreen,
    setActiveJobId,
    setJobPercent,
    setJobStage,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'filters' | 'split' | 'hook' | 'explainer'>('filters');
  const [explainerTopic, setExplainerTopic] = useState('How Christopher Nolan shoots on IMAX');
  const [explainerStyle, setExplainerStyle] = useState<'blueprint' | 'film_noir' | 'cyberpunk' | 'retro_vhs'>('blueprint');
  const [explainerVoice, setExplainerVoice] = useState('en-US-ChristopherNeural');
  const [isGeneratingExplainer, setIsGeneratingExplainer] = useState(false);
  const [explainerStatus, setExplainerStatus] = useState<string | null>(null);

  const filterOptions = [
    { id: 'none' as const, label: 'Standard', desc: 'Original colors without filter', icon: Film, color: 'text-slate-400' },
    { id: 'vintage_35mm' as const, label: 'Vintage 35mm', desc: 'Analog film grain & warm silver-halide tone', icon: Film, color: 'text-amber-400' },
    { id: 'retro_vhs' as const, label: 'Retro VHS 90s', desc: 'NTSC scanlines, tracking jitter & OSD timer', icon: Tv, color: 'text-pink-400' },
    { id: 'scifi_hud' as const, label: 'Sci-Fi HUD', desc: 'Tactical targeting brackets & cyan telemetry', icon: Eye, color: 'text-cyan-400' },
    { id: 'film_noir' as const, label: 'Film Noir', desc: 'Crushed high-contrast monochrome & grain', icon: Film, color: 'text-zinc-200' },
  ];

  const splitOptions = [
    { id: 'none' as const, label: 'Single Video', desc: 'Standard single frame crop' },
    { id: 'audio_nebula' as const, label: 'Audio Nebula Spectrum', desc: 'Top: Movie scene · Bottom: Live reactive waveform' },
    { id: 'hypnotic_tunnel' as const, label: 'Hypnotic Fractal Tunnel', desc: 'Top: Movie scene · Bottom: Infinite procedural Mandelbrot' },
    { id: 'liquid_flow' as const, label: 'Liquid Chromatic Flow', desc: 'Top: Movie scene · Bottom: Generative color wave simulation' },
  ];

  const hookOptions = [
    { id: 'none' as const, label: 'No Hook', desc: 'Starts immediately at 00:00' },
    { id: 'slam_title' as const, label: '3D Slam Title Card', desc: 'High-contrast punch-in headline for 3 seconds' },
    { id: 'glitch_reveal' as const, label: 'Glitch Reveal', desc: 'Electric cyan cyber glitch teaser' },
    { id: 'breaking_hook' as const, label: 'Breaking News Banner', desc: '⚠️ Viral warning headline sticker' },
  ];

  const hookSuggestions = [
    'WAIT FOR THE END...',
    'NOBODY EXPECTED THIS 🤯',
    'THE SECRET HE HID FOR 20 YEARS',
    'WATCH TILL THE CUT ⚠️',
    'THIS CHANGED CINEMA FOREVER',
  ];

  const handleExplainerGenerate = async () => {
    if (!explainerTopic.trim()) return;
    if (soundEnabled) playGlassTick();
    setIsGeneratingExplainer(true);
    setExplainerStatus('Synthesizing neural voiceover & compiling procedural canvas...');

    try {
      const res = await generateExplainerShort({
        topic: explainerTopic,
        style: explainerStyle,
        voice: explainerVoice,
        duration: 30,
      });

      setExplainerStatus('Explainer Short Ready!');
      setActiveJobId(res.jobId);
      setJobPercent(100);
      setJobStage('ready');
      setScreen('complete');
    } catch (err: any) {
      setExplainerStatus(err.message || 'Generation failed. Please try again.');
    } finally {
      setIsGeneratingExplainer(false);
    }
  };

  return (
    <div className="glass glass-rim rounded-2xl p-4 transition-all duration-300 mb-2">
      {/* Studio Toggle Header */}
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setShortsStudioOpen(!shortsStudioOpen)}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500/30 to-red-500/30 flex items-center justify-center text-orange-500 shadow-sm">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-ink-primary dark:text-ink-dark-primary">
                Viral Shorts & Creative Code Studio
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-500/20 to-pink-500/20 text-orange-600 dark:text-orange-300 font-semibold border border-orange-500/30 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> Lemo-Opuscar FX
              </span>
            </div>
            <p className="text-[11px] text-ink-secondary dark:text-ink-dark-secondary">
              Cinematic filters, 9:16 split visualizers, 3-sec hooks & AI text-to-video explainers
            </p>
          </div>
        </div>

        <button
          type="button"
          className="p-1.5 rounded-lg hover:bg-white/20 text-ink-secondary transition-colors"
        >
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${shortsStudioOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <AnimatePresence>
        {shortsStudioOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="pt-4 border-t border-white/20 dark:border-white/10 mt-3 flex flex-col gap-4 overflow-hidden"
          >
            {/* Aspect Ratio & Studio Mode Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="inline-flex p-1 rounded-xl glass glass-rim text-xs font-medium">
                <button
                  type="button"
                  onClick={() => { if (soundEnabled) playGlassTick(); setActiveTab('filters'); }}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    activeTab === 'filters' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-white'
                  }`}
                >
                  <Film className="w-3.5 h-3.5" />
                  <span>1. Film Filters</span>
                </button>
                <button
                  type="button"
                  onClick={() => { if (soundEnabled) playGlassTick(); setActiveTab('split'); }}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    activeTab === 'split' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>2. Retention Split</span>
                </button>
                <button
                  type="button"
                  onClick={() => { if (soundEnabled) playGlassTick(); setActiveTab('hook'); }}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    activeTab === 'hook' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-white'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>3. Kinetic Hook</span>
                </button>
                <button
                  type="button"
                  onClick={() => { if (soundEnabled) playGlassTick(); setActiveTab('explainer'); }}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    activeTab === 'explainer' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-white'
                  }`}
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>4. AI Explainer</span>
                </button>
              </div>

              {/* Aspect Ratio Selector */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-[11px] font-semibold text-ink-secondary">Format:</span>
                {(['9:16', 'original', '16:9', '1:1'] as const).map((ar) => (
                  <button
                    key={ar}
                    type="button"
                    onClick={() => { if (soundEnabled) playGlassPop(); setAspectRatio(ar); }}
                    className={`px-2 py-1 rounded-md text-[11px] font-mono transition-all ${
                      aspectRatio === ar
                        ? 'bg-blue-600 text-white font-bold shadow-sm'
                        : 'glass text-slate-600 dark:text-slate-300 hover:bg-white/30'
                    }`}
                  >
                    {ar === '9:16' ? '📱 9:16 Vertical' : ar}
                  </button>
                ))}
              </div>
            </div>

            {/* TAB 1: CINEMATIC FILTERS */}
            {activeTab === 'filters' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-ink-secondary">
                  <span>Cinematic & Retro Color Grading (Procedural FFmpeg Complex)</span>
                  <span className="text-[10px] text-orange-500 font-mono">Real film curves</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {filterOptions.map((f) => {
                    const Icon = f.icon;
                    const isActive = filterStyle === f.id;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => { if (soundEnabled) playGlassPop(); setFilterStyle(f.id); }}
                        className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                          isActive
                            ? 'bg-gradient-to-br from-orange-500/20 to-pink-500/20 border-orange-400 dark:border-orange-500 ring-1 ring-orange-400/50 shadow-sm'
                            : 'bg-white/40 dark:bg-white/[0.04] border-white/60 dark:border-white/10 hover:bg-white/60'
                        }`}
                      >
                        <span className={`p-2 rounded-lg bg-black/20 ${f.color}`}>
                          <Icon className="w-4 h-4" />
                        </span>
                        <div>
                          <p className="text-xs font-semibold text-ink-primary dark:text-ink-dark-primary">
                            {f.label}
                          </p>
                          <p className="text-[10px] text-ink-secondary dark:text-ink-dark-secondary">
                            {f.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: RETENTION SPLIT-SCREEN VISUALIZERS */}
            {activeTab === 'split' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-ink-secondary">
                  <span>High-Retention 9:16 Split Screen (100% Original Procedural Graphics)</span>
                  <span className="text-[10px] text-emerald-500 font-mono">Zero Copyright Risk</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {splitOptions.map((s) => {
                    const isActive = splitScreen === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          if (soundEnabled) playGlassPop();
                          setSplitScreen(s.id);
                          if (s.id !== 'none') setAspectRatio('9:16');
                        }}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isActive
                            ? 'bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border-blue-400 dark:border-blue-500 ring-1 ring-blue-400/50 shadow-sm'
                            : 'bg-white/40 dark:bg-white/[0.04] border-white/60 dark:border-white/10 hover:bg-white/60'
                        }`}
                      >
                        <p className="text-xs font-semibold text-ink-primary dark:text-ink-dark-primary flex items-center justify-between">
                          <span>{s.label}</span>
                          {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />}
                        </p>
                        <p className="text-[10px] text-ink-secondary dark:text-ink-dark-secondary mt-1">
                          {s.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: KINETIC 3-SECOND HOOK */}
            {activeTab === 'hook' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-ink-secondary">
                  <span>First 3 Seconds Kinetic Motion Graphic Hook</span>
                  <span className="text-[10px] text-amber-500 font-mono">Stops The Scroll</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {hookOptions.map((h) => {
                    const isActive = hookIntro === h.id;
                    return (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => { if (soundEnabled) playGlassPop(); setHookIntro(h.id); }}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          isActive
                            ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-amber-400 dark:border-amber-500 ring-1 ring-amber-400/50 shadow-sm'
                            : 'bg-white/40 dark:bg-white/[0.04] border-white/60 dark:border-white/10 hover:bg-white/60'
                        }`}
                      >
                        <p className="text-xs font-semibold text-ink-primary dark:text-ink-dark-primary truncate">
                          {h.label}
                        </p>
                        <p className="text-[10px] text-ink-secondary dark:text-ink-dark-secondary line-clamp-1 mt-0.5">
                          {h.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {hookIntro !== 'none' && (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center gap-2">
                      <Type className="w-3.5 h-3.5 text-amber-500" />
                      <input
                        type="text"
                        value={hookText}
                        onChange={(e) => setHookText(e.target.value)}
                        placeholder="Enter hook headline (e.g. WAIT FOR THE END...)"
                        maxLength={80}
                        className="w-full glass h-9 px-3 rounded-xl text-xs bg-transparent text-ink-primary dark:text-ink-dark-primary focus:outline-none border border-white/40"
                      />
                    </div>
                    {/* Viral suggestion chips */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] text-ink-secondary font-medium">Viral suggestions:</span>
                      {hookSuggestions.map((sug) => (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => { if (soundEnabled) playGlassPop(); setHookText(sug); }}
                          className="px-2 py-0.5 rounded-full text-[10px] glass hover:bg-white/40 text-slate-700 dark:text-slate-300 transition-colors"
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: AUTOMATED TEXT-TO-VIDEO EXPLAINER SHORTS */}
            {activeTab === 'explainer' && (
              <div className="space-y-3 bg-purple-500/[0.05] p-3 rounded-2xl border border-purple-500/20">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-purple-600 dark:text-purple-300">
                    <Wand2 className="w-3.5 h-3.5" />
                    Automated Text-to-Video Explainer Engine
                  </span>
                  <span className="text-[10px] font-mono text-purple-400">Procedural 9:16 Short</span>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-medium text-ink-secondary">
                    Topic or Script Idea:
                  </label>
                  <input
                    type="text"
                    value={explainerTopic}
                    onChange={(e) => setExplainerTopic(e.target.value)}
                    placeholder="e.g. How Christopher Nolan shoots on IMAX or Why Oppenheimer was in B&W"
                    className="w-full glass h-9 px-3 rounded-xl text-xs bg-transparent text-ink-primary dark:text-ink-dark-primary focus:outline-none border border-white/40"
                  />
                  {/* Topic shortcuts */}
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'How Christopher Nolan shoots on IMAX',
                      'Why Oppenheimer was shot in B&W',
                      'Quentin Tarantino Dialogue Secret',
                      'Why Film Stock beats Digital Sensors',
                    ].map((topic) => (
                      <button
                        key={topic}
                        type="button"
                        onClick={() => { if (soundEnabled) playGlassPop(); setExplainerTopic(topic); }}
                        className="text-[10px] px-2 py-0.5 rounded-full glass hover:bg-purple-500/20 text-purple-700 dark:text-purple-200"
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] font-medium text-ink-secondary block mb-1">
                      Visual Aesthetic Style:
                    </label>
                    <select
                      value={explainerStyle}
                      onChange={(e) => setExplainerStyle(e.target.value as any)}
                      className="w-full glass h-8 px-2 rounded-lg text-xs bg-transparent text-ink-primary dark:text-ink-dark-primary border border-white/30"
                    >
                      <option value="blueprint" className="dark:bg-slate-900">Technical Blueprint (Cyan HUD & Grid)</option>
                      <option value="film_noir" className="dark:bg-slate-900">Film Noir (Monochrome Archival Reel)</option>
                      <option value="cyberpunk" className="dark:bg-slate-900">Cyberpunk (Neon Glitch Matrix)</option>
                      <option value="retro_vhs" className="dark:bg-slate-900">Retro VHS (1990s Analog Tape)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-ink-secondary block mb-1">
                      Neural Studio Voice:
                    </label>
                    <select
                      value={explainerVoice}
                      onChange={(e) => setExplainerVoice(e.target.value)}
                      className="w-full glass h-8 px-2 rounded-lg text-xs bg-transparent text-ink-primary dark:text-ink-dark-primary border border-white/30"
                    >
                      <option value="en-US-ChristopherNeural" className="dark:bg-slate-900">Christopher (Deep Cinema Narrator)</option>
                      <option value="en-US-GuyNeural" className="dark:bg-slate-900">Guy (Clear Documentary)</option>
                      <option value="en-US-JennyNeural" className="dark:bg-slate-900">Jenny (Expressive & Vibrant)</option>
                      <option value="en-US-AriaNeural" className="dark:bg-slate-900">Aria (Modern Energetic)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[11px] text-ink-secondary">
                    {explainerStatus || 'Generates voice, background score & kinetic animated captions in 9:16.'}
                  </span>
                  <button
                    type="button"
                    disabled={isGeneratingExplainer}
                    onClick={handleExplainerGenerate}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-xs shadow-md hover:opacity-95 transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isGeneratingExplainer ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Rendering Procedural Short...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Generate Explainer Short</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

