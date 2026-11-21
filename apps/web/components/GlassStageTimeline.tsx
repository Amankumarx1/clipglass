'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Download, FileAudio, Activity, Sparkles, CheckCircle2 } from 'lucide-react';

interface StageTimelineProps {
  stage: 'idle' | 'queued' | 'ingest' | 'transcribe' | 'signals' | 'scoring' | 'ready' | 'failed';
  percent: number;
  activeStep: string;
}

export const GlassStageTimeline: React.FC<StageTimelineProps> = ({ stage, percent, activeStep }) => {
  const steps = [
    { id: 'ingest', label: 'Ingest', icon: Download, desc: 'Streams & Heatmap' },
    { id: 'transcribe', label: 'Transcribe', icon: FileAudio, desc: 'Word Alignment' },
    { id: 'signals', label: 'Signals', icon: Activity, desc: 'Loudness & Cuts' },
    { id: 'scoring', label: 'Scoring', icon: Sparkles, desc: 'Viral Ranking' },
    { id: 'ready', label: 'Ready', icon: CheckCircle2, desc: 'Final Clips' },
  ];

  const getStepStatus = (stepId: string) => {
    const order = ['queued', 'ingest', 'transcribe', 'signals', 'scoring', 'ready'];
    const currentIdx = order.indexOf(stage);
    const stepIdx = order.indexOf(stepId);

    if (stage === 'ready') return 'completed';
    if (stepIdx < currentIdx) return 'completed';
    if (stepIdx === currentIdx) return 'active';
    return 'pending';
  };

  return (
    <div className="w-full glass glass-rim rounded-2xl p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-xs font-mono font-bold text-blue-500 uppercase tracking-wider">
            Live Multimodal Pipeline
          </span>
          <p className="text-sm font-semibold text-ink-primary dark:text-ink-dark-primary">
            {activeStep || 'Analyzing video dynamics...'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
            {Math.round(percent)}%
          </span>
          <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
        </div>
      </div>

      {/* Stage Stepper Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {steps.map((st) => {
          const status = getStepStatus(st.id);
          const Icon = st.icon;

          return (
            <div
              key={st.id}
              className={`p-3 rounded-xl border transition-all flex flex-col justify-between ${
                status === 'completed'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  : status === 'active'
                  ? 'bg-blue-500/20 border-blue-400 dark:border-blue-500 ring-1 ring-blue-400/50 shadow-md text-blue-600 dark:text-blue-300'
                  : 'bg-white/20 dark:bg-white/[0.02] border-white/40 dark:border-white/10 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="p-1.5 rounded-lg bg-black/10 dark:bg-white/10">
                  <Icon className="w-3.5 h-3.5" />
                </span>
                {status === 'completed' && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                {status === 'active' && <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />}
              </div>
              <div>
                <p className="text-xs font-bold truncate">{st.label}</p>
                <p className="text-[10px] opacity-75 truncate">{st.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

