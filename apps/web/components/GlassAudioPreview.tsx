'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Sparkles, Music } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { playGlassTick } from '@/lib/soundEffects';

interface GlassAudioPreviewProps {
  jobId?: string | null;
  mode?: 'compact' | 'full';
}

export const GlassAudioPreview: React.FC<GlassAudioPreviewProps> = ({ jobId: propJobId, mode = 'compact' }) => {
  const { activeJobId, soundEnabled } = useAppStore();
  const targetJobId = propJobId !== undefined ? propJobId : activeJobId;

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(30);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [peaks, setPeaks] = useState<number[]>([]);
  const [loadingPeaks, setLoadingPeaks] = useState(false);

  // Fetch real ~800 peaks from backend if jobId is present
  useEffect(() => {
    if (!targetJobId) {
      // Deterministic decorative peaks for preview
      const fallback = Array.from({ length: 48 }, (_, i) =>
        Math.max(0.15, Math.abs(Math.sin(i * 0.25) * 0.75 + Math.cos(i * 0.4) * 0.25))
      );
      setPeaks(fallback);
      return;
    }

    setLoadingPeaks(true);
    fetch(`/api/v1/jobs/${targetJobId}/peaks`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.peaks) && data.peaks.length > 0) {
          // Downsample or slice to ~64-80 bars for visual display clarity
          const raw = data.peaks as number[];
          const barCount = 64;
          const step = Math.max(1, Math.floor(raw.length / barCount));
          const downsampled: number[] = [];
          for (let i = 0; i < raw.length && downsampled.length < barCount; i += step) {
            downsampled.push(raw[i]);
          }
          setPeaks(downsampled);
        } else {
          setPeaks(Array.from({ length: 48 }, (_, i) => Math.max(0.2, Math.abs(Math.sin(i * 0.2)))));
        }
      })
      .catch(() => {
        setPeaks(Array.from({ length: 48 }, (_, i) => Math.max(0.2, Math.abs(Math.sin(i * 0.2)))));
      })
      .finally(() => setLoadingPeaks(false));
  }, [targetJobId]);

  const togglePlay = () => {
    if (soundEnabled) playGlassTick();
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.duration && !isNaN(audioRef.current.duration)) {
        setDuration(audioRef.current.duration);
      }
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = ratio * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const next = !isMuted;
    audioRef.current.muted = next;
    setIsMuted(next);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
      audioRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const audioSrc = targetJobId ? `/api/v1/jobs/${targetJobId}/file` : undefined;

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (mode === 'full') {
    return (
      <div className="w-full glass glass-rim rounded-2xl p-4 flex flex-col gap-3 shadow-lg select-none">
        {audioSrc && (
          <audio
            ref={audioRef}
            src={audioSrc}
            preload="metadata"
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => setIsPlaying(false)}
          />
        )}

        <div className="flex items-center justify-between text-xs font-semibold text-ink-primary dark:text-ink-dark-primary">
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-audioAction-start" />
            <span>Audition Master Audio</span>
          </div>
          <span className="font-mono text-[11px] text-ink-tertiary">
            {formatSeconds(currentTime)} / {formatSeconds(duration)}
          </span>
        </div>

        {/* Interactive Waveform Seeking Track */}
        <div
          onClick={handleSeek}
          className="relative w-full h-12 flex items-center gap-1 cursor-pointer group py-2"
          title="Click to seek"
        >
          {peaks.map((p, idx) => {
            const barRatio = idx / peaks.length;
            const currentRatio = duration > 0 ? currentTime / duration : 0;
            const isPassed = barRatio <= currentRatio;

            return (
              <div
                key={idx}
                className="flex-1 rounded-full transition-all duration-150"
                style={{
                  height: `${Math.max(15, p * 100)}%`,
                  backgroundColor: isPassed
                    ? '#7C4DFF'
                    : 'rgba(255, 255, 255, 0.25)',
                }}
              />
            );
          })}
        </div>

        {/* Controls: Play/Pause, Seek, Volume Slider */}
        <div className="flex items-center justify-between pt-1 border-t border-white/20">
          <button
            type="button"
            onClick={togglePlay}
            className="h-9 px-4 rounded-pill btn-purple btn-gloss text-white text-xs font-semibold flex items-center gap-2 shadow-sm"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isPlaying ? 'Pause' : 'Play Audio'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleMute}
              className="p-1.5 rounded-full hover:bg-white/10 text-ink-secondary"
            >
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 h-1.5 accent-audioAction-start cursor-pointer"
            />
          </div>
        </div>
      </div>
    );
  }

  // Compact mode overlay on thumbnail
  return (
    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between glass glass-rim rounded-pill px-3 py-1.5 z-10 shadow-md">
      {audioSrc && (
        <audio
          ref={audioRef}
          src={audioSrc}
          preload="metadata"
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setIsPlaying(false)}
        />
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={togglePlay}
          className="w-7 h-7 rounded-full bg-infoAction-start text-white flex items-center justify-center shadow-sm hover:scale-105 transition-transform"
          aria-label={isPlaying ? 'Pause audio preview' : 'Play audio preview'}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
        </button>

        <span className="text-[11px] font-mono font-bold text-white drop-shadow-sm">
          {formatSeconds(currentTime)} / {formatSeconds(duration)}
        </span>
      </div>

      <div
        onClick={handleSeek}
        className="flex items-center gap-0.5 h-4 cursor-pointer"
      >
        {peaks.slice(0, 24).map((h, i) => {
          const ratio = i / 24;
          const currentRatio = duration > 0 ? currentTime / duration : 0;
          return (
            <div
              key={i}
              className="w-0.5 rounded-full transition-all duration-200"
              style={{
                height: isPlaying ? `${Math.max(25, h * 100)}%` : '35%',
                backgroundColor: ratio <= currentRatio ? '#5CE1FF' : 'rgba(255,255,255,0.7)',
              }}
            />
          );
        })}
      </div>
    </div>
  );
};
