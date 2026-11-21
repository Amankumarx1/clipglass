'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Check,
  ArrowDown,
  Clock,
  Gauge,
  XCircle,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { cancelJob, subscribeToJobEvents } from '@/lib/api';

export const Screen03InProgress: React.FC = () => {
  const {
    activeJobId,
    customFilename,
    jobPercent,
    setJobPercent,
    jobStage,
    setJobStage,
    jobSpeed,
    setJobSpeed,
    jobEta,
    setJobEta,
    setScreen,
  } = useAppStore();

  const filename = customFilename.endsWith('.mp4') ? customFilename : `${customFilename}.mp4`;

  // Only transition when a real download job was initiated
  useEffect(() => {
    if (!activeJobId) {
      // Static demo display matching master reference image: 68%, 8.4 MB/s, ETA 00:42
      setJobPercent(68);
      setJobStage('downloading');
      setJobSpeed('8.4 MB/s');
      setJobEta('ETA 00:42');
      return;
    }

    // Real SSE subscription for live processing
    const unsubscribe = subscribeToJobEvents(
      activeJobId,
      (data) => {
        setJobPercent(Math.round(data.percent));
        if (['merging', 'converting', 'trimming', 'embedding'].includes(data.state)) {
          setJobStage('merging');
        } else if (data.state === 'downloading') {
          setJobStage('downloading');
        } else if (data.state === 'ready') {
          setJobStage('ready');
          setScreen('complete');
        } else if (data.state === 'queued') {
          setJobStage('queued');
        }

        if (data.speed) setJobSpeed(data.speed);
        if (data.eta !== null && data.eta !== undefined) setJobEta(`ETA 00:${data.eta.toString().padStart(2, '0')}`);
      },
      (err) => console.warn('SSE notice', err)
    );

    return () => unsubscribe();
  }, [activeJobId, setJobPercent, setJobStage, setJobSpeed, setJobEta, setScreen]);

  const handleCancel = async () => {
    if (activeJobId) {
      try {
        await cancelJob(activeJobId);
      } catch (e) {
        console.error(e);
      }
    }
    setScreen('configure');
  };

  // SVG Circular progress computation
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (jobPercent / 100) * circumference;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Blurred Backdrop showing Screen 02 behind */}
      <div
        onClick={handleCancel}
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-md transition-all"
      />

      {/* Floating Glass Modal Dialog matching reference */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="relative w-full max-w-lg glass glass-rim rounded-[36px] p-6 sm:p-8 shadow-2xl z-10 flex flex-col gap-6"
      >
        {/* Top Right Close Button */}
        <button
          type="button"
          onClick={handleCancel}
          aria-label="Cancel"
          className="absolute top-5 right-5 w-8 h-8 rounded-full glass glass-rim flex items-center justify-center text-ink-secondary hover:text-ink-primary dark:text-ink-dark-secondary transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Circular Progress & Header Info */}
        <div className="flex items-center gap-5">
          {/* Circular Liquid Progress Ring */}
          <div className="relative w-24 h-24 flex items-center justify-center flex-shrink-0">
            {/* Center Dark Mode Ambient Radial Glow */}
            <div className="absolute inset-2 rounded-full bg-infoAction-start/20 blur-md pointer-events-none -z-0" />
            <svg className="w-full h-full transform -rotate-90 relative z-10">
              {/* Background track */}
              <circle
                cx="48"
                cy="48"
                r={radius}
                className="stroke-slate-200/60 dark:stroke-slate-800/80"
                strokeWidth="7"
                fill="transparent"
              />
              {/* Animated Progress Stroke */}
              <circle
                cx="48"
                cy="48"
                r={radius}
                className="stroke-infoAction-start transition-all duration-300 dark:drop-shadow-[0_0_8px_rgba(42,168,255,0.9)]"
                strokeWidth="7"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            {/* Center Percentage */}
            <span className="absolute font-heading font-bold text-lg text-ink-primary dark:text-white font-mono z-20">
              {jobPercent}%
            </span>
          </div>

          {/* Heading & Filename */}
          <div className="flex flex-col gap-1">
            <h3 className="font-heading font-bold text-lg md:text-xl text-ink-primary dark:text-ink-dark-primary lowercase tracking-tight">
              preparing your file
            </h3>
            <p className="text-xs md:text-sm font-mono text-ink-secondary dark:text-ink-dark-secondary truncate max-w-[240px]">
              {filename}
            </p>
          </div>
        </div>

        {/* 4 Connected Timeline Stages */}
        <div className="pt-2">
          <div className="relative flex items-center justify-between">
            {/* Horizontal Timeline Connector Bar */}
            <div className="absolute top-3.5 left-6 right-6 h-[2px] bg-slate-300/60 dark:bg-slate-700/60 -z-0">
              <div
                className="h-full bg-infoAction-start dark:shadow-[0_0_10px_rgba(42,168,255,0.8)] transition-all duration-500"
                style={{
                  width:
                    jobStage === 'ready'
                      ? '100%'
                      : jobStage === 'merging'
                      ? '70%'
                      : jobStage === 'downloading'
                      ? '35%'
                      : '10%',
                }}
              />
            </div>

            {/* Stage 1: Queued (Completed) */}
            <div className="flex flex-col items-center gap-1.5 z-10">
              <div className="w-7 h-7 rounded-full bg-infoAction-start text-white flex items-center justify-center shadow-sm dark:shadow-[0_0_12px_rgba(42,168,255,0.7)]">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <span className="text-[11px] font-semibold text-ink-primary dark:text-ink-dark-primary">
                Queued
              </span>
            </div>

            {/* Stage 2: Downloading (Active) */}
            <div className="flex flex-col items-center gap-1.5 z-10">
              <div className="w-7 h-7 rounded-full bg-infoAction-start text-white flex items-center justify-center shadow-sm dark:shadow-[0_0_15px_rgba(42,168,255,0.85)] animate-pulse">
                <ArrowDown className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <span className="text-[11px] font-semibold text-infoAction-start">
                Downloading
              </span>
            </div>

            {/* Stage 3: Merging */}
            <div className="flex flex-col items-center gap-1.5 z-10">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${
                  jobStage === 'merging' || jobStage === 'ready'
                    ? 'bg-infoAction-start border-infoAction-start text-white'
                    : 'glass border-slate-300 dark:border-slate-600 text-transparent'
                }`}
              >
                {jobStage === 'merging' ? (
                  <div className="w-2 h-2 rounded-full bg-white animate-ping" />
                ) : jobStage === 'ready' ? (
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                ) : null}
              </div>
              <span className="text-[11px] font-semibold text-ink-tertiary">
                Merging
              </span>
            </div>

            {/* Stage 4: Ready */}
            <div className="flex flex-col items-center gap-1.5 z-10">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${
                  jobStage === 'ready'
                    ? 'bg-success border-success text-white'
                    : 'glass border-slate-300 dark:border-slate-600 text-transparent'
                }`}
              >
                {jobStage === 'ready' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
              <span className="text-[11px] font-semibold text-ink-tertiary">
                Ready
              </span>
            </div>
          </div>
        </div>

        {/* Speed & ETA stats */}
        <div className="flex items-center justify-center gap-6 py-2 px-4 rounded-2xl glass text-xs font-mono font-medium text-ink-secondary dark:text-ink-dark-secondary">
          <span className="flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-infoAction-start" />
            {jobSpeed}
          </span>
          <span className="text-ink-tertiary/40">|</span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-audioAction-start" />
            {jobEta}
          </span>
        </div>

        {/* Cancel Download Button */}
        <button
          type="button"
          onClick={handleCancel}
          className="w-full h-11 rounded-pill glass glass-rim text-xs md:text-sm font-semibold text-ink-secondary dark:text-ink-dark-secondary hover:text-ink-primary dark:hover:text-ink-dark-primary hover:border-white transition-all flex items-center justify-center gap-2"
        >
          <XCircle className="w-4 h-4 text-ink-tertiary" />
          <span>Cancel download</span>
        </button>
      </motion.div>
    </div>
  );
};
