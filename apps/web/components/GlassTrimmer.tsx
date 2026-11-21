'use client';

import React from 'react';
import { Scissors, Clock, AlertTriangle, Sparkles } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { playGlassPop } from '@/lib/soundEffects';

function timeToSeconds(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.trim().split(':').map((p) => parseFloat(p) || 0);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return parseFloat(timeStr) || 0;
}

function secondsToTime(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export const GlassTrimmer: React.FC = () => {
  const {
    metadata,
    trimEnabled,
    setTrimEnabled,
    trimStart,
    setTrimStart,
    trimEnd,
    setTrimEnd,
    soundEnabled,
    setSelectedPreset,
  } = useAppStore();

  const totalDuration = metadata?.duration || 768; // default to 12:48 (768s)

  const startSec = Math.min(totalDuration, Math.max(0, timeToSeconds(trimStart)));
  const endSec = Math.min(totalDuration, Math.max(startSec, timeToSeconds(trimEnd) || totalDuration));
  const trimmedDurationSec = Math.max(0, endSec - startSec);

  const isValidRange = startSec < endSec && endSec <= totalDuration;

  const handleToggle = () => {
    if (soundEnabled) playGlassPop();
    const next = !trimEnabled;
    setTrimEnabled(next);
    setSelectedPreset('custom');
    if (next && (!trimEnd || trimEnd === '00:00')) {
      setTrimEnd(secondsToTime(totalDuration));
    }
  };

  const handleStartSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (val < endSec) {
      setTrimStart(secondsToTime(val));
      setSelectedPreset('custom');
    }
  };

  const handleEndSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (val > startSec) {
      setTrimEnd(secondsToTime(val));
      setSelectedPreset('custom');
    }
  };

  return (
    <div className="glass glass-rim rounded-2xl p-4 flex flex-col gap-3 select-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primaryAction-start/15 flex items-center justify-center text-primaryAction-start">
            <Scissors className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-xs font-heading font-bold text-ink-primary dark:text-ink-dark-primary flex items-center gap-1.5">
              Frame-Accurate Video Trimmer
              {trimEnabled && isValidRange && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold">
                  {secondsToTime(trimmedDurationSec)} clip
                </span>
              )}
            </span>
            <p className="text-[11px] text-ink-tertiary">
              Fast byte-range slice with yt-dlp & FFmpeg keyframe cut
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggle}
          className={`w-9 h-5 rounded-pill p-0.5 flex items-center transition-colors ${
            trimEnabled ? 'bg-primaryAction-start' : 'bg-slate-300 dark:bg-slate-700'
          }`}
        >
          <div
            className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
              trimEnabled ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {trimEnabled && (
        <div className="pt-2 border-t border-white/40 dark:border-white/10 flex flex-col gap-3">
          {/* Dual range scrubber slider track */}
          <div className="relative w-full h-6 flex items-center px-1">
            <div className="absolute left-0 right-0 h-2 bg-slate-200 dark:bg-slate-800 rounded-full" />
            <div
              className="absolute h-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
              style={{
                left: `${(startSec / totalDuration) * 100}%`,
                width: `${Math.max(2, ((endSec - startSec) / totalDuration) * 100)}%`,
              }}
            />
            {/* Start Slider Handle */}
            <input
              type="range"
              min={0}
              max={totalDuration}
              step={1}
              value={startSec}
              onChange={handleStartSlider}
              className="absolute inset-0 w-full opacity-0 cursor-ew-resize z-20"
            />
            {/* End Slider Handle */}
            <input
              type="range"
              min={0}
              max={totalDuration}
              step={1}
              value={endSec}
              onChange={handleEndSlider}
              className="absolute inset-0 w-full opacity-0 cursor-ew-resize z-30"
            />
          </div>

          {/* Time inputs */}
          <div className="grid grid-cols-2 gap-3 items-center">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold text-ink-secondary uppercase tracking-wider pl-1">
                Start Cut (hh:mm:ss)
              </span>
              <div className="relative flex items-center glass rounded-xl h-9 px-3">
                <Clock className="w-3.5 h-3.5 text-ink-tertiary mr-2 shrink-0" />
                <input
                  type="text"
                  value={trimStart}
                  onChange={(e) => {
                    setTrimStart(e.target.value);
                    setSelectedPreset('custom');
                  }}
                  placeholder="00:00"
                  className="w-full bg-transparent text-xs font-mono text-ink-primary dark:text-ink-dark-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold text-ink-secondary uppercase tracking-wider pl-1">
                End Cut (hh:mm:ss)
              </span>
              <div className="relative flex items-center glass rounded-xl h-9 px-3">
                <Clock className="w-3.5 h-3.5 text-ink-tertiary mr-2 shrink-0" />
                <input
                  type="text"
                  value={trimEnd}
                  onChange={(e) => {
                    setTrimEnd(e.target.value);
                    setSelectedPreset('custom');
                  }}
                  placeholder={secondsToTime(totalDuration)}
                  className="w-full bg-transparent text-xs font-mono text-ink-primary dark:text-ink-dark-primary focus:outline-none"
                />
              </div>
            </div>
          </div>

          {!isValidRange && (
            <div className="flex items-center gap-1.5 text-[11px] text-rose-500 font-medium px-1">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>Start time must be strictly before end time and within video duration ({secondsToTime(totalDuration)}).</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
