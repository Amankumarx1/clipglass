'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Download,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  FileDown,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { subscribeToJobEvents, cancelJob, JobEventData } from '@/lib/api';
import { formatBytes } from '@/lib/formatUtils';
import { GlassModal } from './ui/GlassModal';
import { GlassButton } from './ui/GlassButton';

export const GlassProgressModal: React.FC = () => {
  const { activeJobId, isModalOpen, setIsModalOpen, setActiveJobId } = useAppStore();

  const [jobData, setJobData] = useState<JobEventData>({
    jobId: '',
    state: 'queued',
    percent: 0,
    speed: null,
    eta: null,
    filename: null,
    filesize: null,
  });

  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(900); // 15 mins

  useEffect(() => {
    if (!activeJobId || !isModalOpen) return;

    // If activeJobId is 'demo-job-id' (frontend preview mode)
    if (activeJobId === 'demo-job-id') {
      setJobData({
        jobId: 'demo-job-id',
        state: 'downloading',
        percent: 15,
        speed: '6.4 MB/s',
        eta: 8,
        filename: 'Me at the zoo - Jawed Karim.mp4',
        filesize: 34500000,
      });

      const timer1 = setTimeout(() => {
        setJobData((prev) => ({ ...prev, state: 'downloading', percent: 68, eta: 3 }));
      }, 1500);

      const timer2 = setTimeout(() => {
        setJobData((prev) => ({ ...prev, state: 'merging', percent: 96, speed: null, eta: null }));
      }, 3000);

      const timer3 = setTimeout(() => {
        setJobData((prev) => ({
          ...prev,
          state: 'ready',
          percent: 100,
          filename: 'Me at the zoo - Jawed Karim.mp4',
          filesize: 34500000,
        }));
      }, 4500);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }

    // Real SSE subscription
    const unsubscribe = subscribeToJobEvents(
      activeJobId,
      (data) => {
        setJobData(data);
      },
      (err) => {
        console.warn('SSE subscription notice', err);
      }
    );

    return () => unsubscribe();
  }, [activeJobId, isModalOpen]);

  // 15-minute countdown timer when ready
  useEffect(() => {
    if (jobData.state !== 'ready') return;
    const interval = setInterval(() => {
      setTimeLeftSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [jobData.state]);

  const handleCancel = async () => {
    if (activeJobId && activeJobId !== 'demo-job-id') {
      try {
        await cancelJob(activeJobId);
      } catch (err) {
        console.error(err);
      }
    }
    setIsModalOpen(false);
    setActiveJobId(null);
  };

  const formatCountdown = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s.toString().padStart(2, '0')}`;
  };

  const getStageTitle = () => {
    switch (jobData.state) {
      case 'queued':
        return 'Queueing task...';
      case 'downloading':
        return 'Downloading streams...';
      case 'merging':
        return 'Merging video and audio...';
      case 'converting':
        return 'Transcoding audio tracks...';
      case 'ready':
        return 'Media is ready!';
      case 'failed':
        return 'Processing failed';
      case 'cancelled':
        return 'Job cancelled';
      default:
        return 'Processing...';
    }
  };

  return (
    <GlassModal
      isOpen={isModalOpen}
      onClose={handleCancel}
      title={jobData.state === 'ready' ? 'Download Ready' : 'Processing Media'}
    >
      <div className="flex flex-col gap-5 pt-2">
        {/* State Banner & Animation */}
        <div className="flex items-center gap-3">
          {jobData.state === 'ready' ? (
            <div className="w-10 h-10 rounded-full bg-success/20 text-success flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
            </div>
          ) : jobData.state === 'failed' ? (
            <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center">
              <XCircle className="w-6 h-6" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-infoAction-start/20 text-infoAction-start flex items-center justify-center">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
          )}
          <div>
            <h4 className="font-heading font-bold text-base text-ink-primary dark:text-ink-dark-primary">
              {getStageTitle()}
            </h4>
            <p className="text-xs text-ink-secondary dark:text-ink-dark-secondary">
              {jobData.filename || 'Analyzing and rendering streams...'}
            </p>
          </div>
        </div>

        {/* Liquid Progress Bar */}
        {['queued', 'downloading', 'merging', 'converting'].includes(jobData.state) && (
          <div className="space-y-2">
            <div className="w-full h-3.5 rounded-full bg-slate-200/70 dark:bg-slate-800/80 p-0.5 overflow-hidden shadow-inner">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: `${Math.max(5, jobData.percent)}%` }}
                transition={{ duration: 0.3 }}
                className="h-full rounded-full liquid-progress shadow-sm"
              />
            </div>
            {/* Speed & ETA Indicators */}
            <div className="flex items-center justify-between text-xs font-mono text-ink-tertiary">
              <span>{Math.round(jobData.percent)}% completed</span>
              <div className="flex items-center gap-3">
                {jobData.speed && <span>{jobData.speed}</span>}
                {jobData.eta !== null && jobData.eta !== undefined && (
                  <span>ETA: {jobData.eta}s</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Ready State */}
        {jobData.state === 'ready' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl glass flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileDown className="w-5 h-5 text-primaryAction-start" />
                <div>
                  <p className="text-xs font-semibold text-ink-primary dark:text-ink-dark-primary truncate max-w-[220px]">
                    {jobData.filename}
                  </p>
                  <p className="text-[11px] font-mono text-ink-tertiary">
                    {formatBytes(jobData.filesize)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-mono text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-pill">
                <Clock className="w-3.5 h-3.5" />
                <span>Expires in {formatCountdown(timeLeftSeconds)}</span>
              </div>
            </div>

            <p className="text-xs text-ink-tertiary dark:text-ink-dark-tertiary text-center">
              Files are stored ephemerally and automatically wiped after 15 minutes.
            </p>

            <a
              href={`/api/v1/jobs/${activeJobId}/file`}
              download={jobData.filename || 'download'}
              className="w-full h-13 rounded-pill btn-red-orange btn-gloss text-white font-heading font-bold text-sm md:text-base flex items-center justify-center gap-2 shadow-glow-primary hover:opacity-95 transition-all"
            >
              <Download className="w-5 h-5" />
              Save File ({formatBytes(jobData.filesize)})
            </a>
          </div>
        )}

        {/* Error State */}
        {jobData.state === 'failed' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-400/30 text-rose-950 dark:text-rose-200 text-xs md:text-sm">
              <p className="font-semibold">{jobData.error?.title || 'Download Error'}</p>
              <p className="mt-1 opacity-90">{jobData.error?.explanation || 'An unexpected error occurred while processing.'}</p>
              {jobData.error?.suggestedAction && (
                <p className="mt-2 text-xs font-medium opacity-80">
                  Tip: {jobData.error.suggestedAction}
                </p>
              )}
            </div>

            <GlassButton
              variant="info"
              size="md"
              onClick={handleCancel}
              leftIcon={<RefreshCw className="w-4 h-4" />}
              className="w-full"
            >
              Try Again
            </GlassButton>
          </div>
        )}

        {/* Cancel Action */}
        {['queued', 'downloading', 'merging', 'converting'].includes(jobData.state) && (
          <div className="pt-2">
            <GlassButton
              variant="clear"
              size="sm"
              onClick={handleCancel}
              className="w-full text-xs"
            >
              Cancel Process
            </GlassButton>
          </div>
        )}
      </div>
    </GlassModal>
  );
};

