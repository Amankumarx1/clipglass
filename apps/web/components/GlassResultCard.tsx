'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Sparkles,
  Download,
  Music,
  Video,
  Info,
  CheckSquare,
  Square,
  ShieldCheck,
} from 'lucide-react';
import { useAppStore, DownloadMode, ContainerFormat, AudioFormat, AudioBitrate } from '@/lib/store';
import { formatDuration, formatBytes, sanitizeClientFilename } from '@/lib/formatUtils';
import { createJob } from '@/lib/api';
import { GlassCard } from './ui/GlassCard';
import { GlassTabs } from './ui/GlassTabs';
import { GlassChips } from './ui/GlassChips';
import { GlassInput } from './ui/GlassInput';
import { GlassDropdown } from './ui/GlassDropdown';
import { GlassSwitchGroup } from './ui/GlassSwitchGroup';
import { GlassButton } from './ui/GlassButton';

export const GlassResultCard: React.FC = () => {
  const {
    url,
    metadata,
    mode,
    setMode,
    selectedHeight,
    setSelectedHeight,
    container,
    setContainer,
    audioFormat,
    setAudioFormat,
    audioBitrate,
    setAudioBitrate,
    enableSubtitles,
    setEnableSubtitles,
    subtitleLang,
    setSubtitleLang,
    embedThumbnail,
    setEmbedThumbnail,
    embedMetadata,
    setEmbedMetadata,
    customFilename,
    setCustomFilename,
    consent,
    setConsent,
    setActiveJobId,
    setIsModalOpen,
  } = useAppStore();

  const [isStartingJob, setIsStartingJob] = useState(false);
  const [consentError, setConsentError] = useState(false);

  if (!metadata) return null;

  // Compute live estimated size
  const selectedStream = metadata.availableHeights.find((h) => h.height === selectedHeight);
  let liveEstimatedSize: number | undefined = selectedStream?.approxSize;
  if (mode === 'audio') {
    // Audio estimate: ~1.5MB per minute for 192kbps, ~2.4MB/min for 320
    const bitRateNum = audioBitrate || 320;
    liveEstimatedSize = Math.round(((bitRateNum * 1000) / 8) * (metadata.duration || 60));
  }

  const handleStartDownload = async (chosenMode: DownloadMode) => {
    if (!consent) {
      setConsentError(true);
      return;
    }
    setConsentError(false);
    setIsStartingJob(true);

    try {
      const jobId = await createJob({
        url,
        mode: chosenMode,
        height: selectedHeight === 'best' ? 1080 : Number(selectedHeight),
        container,
        audioFormat,
        audioBitrate,
        subtitles: enableSubtitles ? { langs: [subtitleLang], format: 'srt' } : null,
        thumbnail: embedThumbnail,
        embedMetadata,
        filename: customFilename.trim() || metadata.defaultFilename,
        consent: true,
      });

      setActiveJobId(jobId);
      setIsModalOpen(true);
    } catch (err: any) {
      console.error('Job creation failed:', err);
      // Fallback preview mode for local demo if backend is offline
      setActiveJobId('demo-job-id');
      setIsModalOpen(true);
    } finally {
      setIsStartingJob(false);
    }
  };

  // Video height chip options
  const heightOptions = metadata.availableHeights.map((h) => ({
    id: h.height,
    label: `${h.height}p`,
    sublabel: formatBytes(h.approxSize),
    recommended: h.recommended,
  }));

  // Audio bitrate chip options
  const audioOptions = [
    { id: 160, label: 'Original', sublabel: 'Opus/M4A', recommended: true },
    { id: 320, label: '320 kbps', sublabel: 'MP3 High' },
    { id: 256, label: '256 kbps', sublabel: 'MP3 Med' },
    { id: 192, label: '192 kbps', sublabel: 'MP3 Standard' },
    { id: 128, label: '128 kbps', sublabel: 'MP3 Fast' },
  ];

  const containerOptions = [
    { value: 'mp4', label: 'MP4 (Universal)', description: 'Best compatibility on all devices' },
    { value: 'webm', label: 'WebM (Modern)', description: 'Recommended for 1440p and 4K' },
  ];

  const audioFormatOptions = [
    { value: 'mp3', label: 'MP3 (MPEG Audio)', description: 'Universal compatibility' },
    { value: 'm4a', label: 'M4A (Apple AAC)', description: 'Original stream, pristine sound' },
    { value: 'opus', label: 'Opus (Original)', description: 'Original YouTube stream quality' },
    { value: 'flac', label: 'FLAC (Lossless)', description: 'Lossless studio container' },
    { value: 'wav', label: 'WAV (Waveform)', description: 'Uncompressed audio' },
  ];

  const extraTiles = [
    {
      id: 'thumbnail',
      icon: 'star' as const,
      label: 'Cover Art',
      active: embedThumbnail,
      tooltip: 'Embed high-res video thumbnail',
    },
    {
      id: 'subtitles',
      icon: 'plus' as const,
      label: 'Subtitles',
      active: enableSubtitles,
      tooltip: 'Extract closed captions / SRT',
    },
    {
      id: 'metadata',
      icon: 'menu' as const,
      label: 'Metadata',
      active: embedMetadata,
      tooltip: 'Embed ID3 tags, title and artist',
    },
  ];

  const handleTileToggle = (id: string) => {
    if (id === 'thumbnail') setEmbedThumbnail(!embedThumbnail);
    if (id === 'subtitles') setEnableSubtitles(!enableSubtitles);
    if (id === 'metadata') setEmbedMetadata(!embedMetadata);
  };

  return (
    <motion.section
      initial={{ opacity: 0, scale: 0.98, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="w-full max-w-4xl mx-auto px-4 mb-14"
    >
      <GlassCard className="shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Thumbnail Preview */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden glass shadow-md group">
              {metadata.thumbnail ? (
                <img
                  src={metadata.thumbnail}
                  alt={metadata.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-ink-tertiary">
                  <Video className="w-10 h-10" />
                </div>
              )}
              {/* Duration Chip */}
              <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-pill bg-slate-950/75 backdrop-blur-md text-white text-xs font-mono font-medium flex items-center gap-1.5 shadow-md">
                <Clock className="w-3 h-3 text-amber-300" />
                <span>{formatDuration(metadata.duration)}</span>
              </div>
            </div>

            {/* Video Details */}
            <div className="px-1">
              <h2 className="font-heading font-bold text-base md:text-lg text-ink-primary dark:text-ink-dark-primary line-clamp-2 leading-tight">
                {metadata.title}
              </h2>
              <p className="mt-1 text-xs md:text-sm text-ink-secondary dark:text-ink-dark-secondary font-medium flex items-center gap-2">
                <span>{metadata.channel}</span>
                <span className="w-1 h-1 rounded-full bg-ink-tertiary" />
                <span className="font-mono text-xs">{formatDuration(metadata.duration)}</span>
              </p>
            </div>
          </div>

          {/* Right Column: Configuration & Actions */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            {/* Mode Tabs */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <GlassTabs
                tabs={[
                  { id: 'video', label: 'Video', icon: <Video className="w-4 h-4" /> },
                  { id: 'audio', label: 'Audio Only', icon: <Music className="w-4 h-4" /> },
                ]}
                activeTab={mode}
                onChange={(id) => setMode(id as DownloadMode)}
              />

              {/* Live Size Estimate */}
              <div className="px-3.5 py-1.5 rounded-pill glass text-xs font-mono font-semibold text-ink-secondary dark:text-ink-dark-secondary flex items-center gap-1.5">
                <span className="text-[10px] uppercase text-ink-tertiary">Est:</span>
                <span className="text-primaryAction-start font-bold">{formatBytes(liveEstimatedSize)}</span>
              </div>
            </div>

            {/* Quality & Format Options */}
            {mode === 'video' ? (
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-semibold text-ink-secondary dark:text-ink-dark-secondary uppercase tracking-wider pl-1 mb-2 block">
                    Select Resolution
                  </span>
                  <GlassChips
                    options={heightOptions}
                    selectedId={selectedHeight}
                    onChange={(id) => setSelectedHeight(id as number)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <GlassDropdown
                    label="Container Format"
                    options={containerOptions}
                    value={container}
                    onChange={(val) => setContainer(val as ContainerFormat)}
                  />
                  <div>
                    <span className="text-xs font-semibold text-ink-secondary dark:text-ink-dark-secondary uppercase tracking-wider pl-1 mb-1.5 block">
                      Custom Filename
                    </span>
                    <GlassInput
                      variant="sparkle"
                      value={customFilename}
                      onChange={(e) => setCustomFilename(e.target.value)}
                      onActionClick={() => setCustomFilename(sanitizeClientFilename(metadata.defaultFilename))}
                      actionTooltip="Reset to clean video title"
                      placeholder="Enter filename..."
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2 pl-1 pr-1">
                    <span className="text-xs font-semibold text-ink-secondary dark:text-ink-dark-secondary uppercase tracking-wider">
                      Audio Quality & Bitrate
                    </span>
                    <span className="text-[11px] text-ink-tertiary flex items-center gap-1" title="YouTube streams AAC/Opus ~160kbps">
                      <Info className="w-3 h-3 text-infoAction-start" />
                      Original is best
                    </span>
                  </div>
                  <GlassChips
                    options={audioOptions}
                    selectedId={audioBitrate}
                    onChange={(id) => setAudioBitrate(id as AudioBitrate)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <GlassDropdown
                    label="Audio Format"
                    options={audioFormatOptions}
                    value={audioFormat}
                    onChange={(val) => setAudioFormat(val as AudioFormat)}
                  />
                  <div>
                    <span className="text-xs font-semibold text-ink-secondary dark:text-ink-dark-secondary uppercase tracking-wider pl-1 mb-1.5 block">
                      Custom Filename
                    </span>
                    <GlassInput
                      variant="sparkle"
                      value={customFilename}
                      onChange={(e) => setCustomFilename(e.target.value)}
                      onActionClick={() => setCustomFilename(sanitizeClientFilename(metadata.defaultFilename))}
                      actionTooltip="Reset to clean title"
                      placeholder="Enter audio name..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Quick Extras switch group */}
            <GlassSwitchGroup tiles={extraTiles} onToggle={handleTileToggle} />

            {/* Subtitle language dropdown if enabled */}
            <AnimatePresence>
              {enableSubtitles && metadata.availableSubtitles.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <GlassDropdown
                    label="Subtitle Language"
                    options={metadata.availableSubtitles.map((s) => ({
                      value: s.lang,
                      label: `${s.name} (${s.lang.toUpperCase()})`,
                    }))}
                    value={subtitleLang}
                    onChange={setSubtitleLang}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Consent Requirement Checkbox */}
            <div
              onClick={() => setConsent(!consent)}
              className={`p-3.5 rounded-2xl glass transition-all cursor-pointer select-none flex items-start gap-3 ${
                consentError && !consent
                  ? 'border-rose-400 bg-rose-500/10 ring-2 ring-rose-500/40'
                  : 'hover:bg-white/40 dark:hover:bg-white/10'
              }`}
            >
              <div className="mt-0.5 text-primaryAction-start flex-shrink-0">
                {consent ? (
                  <CheckSquare className="w-5 h-5 text-success stroke-[2.5]" />
                ) : (
                  <Square className="w-5 h-5 text-ink-tertiary" />
                )}
              </div>
              <div className="text-xs text-ink-secondary dark:text-ink-dark-secondary">
                <p className="font-semibold text-ink-primary dark:text-ink-dark-primary flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-success" />
                  Legal Ownership & Consent Acknowledgment
                </p>
                <p className="mt-0.5 opacity-90 leading-relaxed">
                  I confirm that I own this content, it is licensed for reuse (e.g. Creative Commons), or I have explicit permission from the rights owner.
                </p>
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <GlassButton
                variant="primary"
                size="lg"
                isLoading={isStartingJob && mode === 'video'}
                onClick={() => handleStartDownload('video')}
                leftIcon={<Download className="w-4 h-4" />}
                className="w-full sm:flex-1"
              >
                Download Video ({selectedHeight}p)
              </GlassButton>

              <GlassButton
                variant="audio"
                size="lg"
                isLoading={isStartingJob && mode === 'audio'}
                onClick={() => handleStartDownload('audio')}
                leftIcon={<Music className="w-4 h-4" />}
                className="w-full sm:flex-1"
              >
                Extract Audio ({audioFormat.toUpperCase()})
              </GlassButton>
            </div>
          </div>
        </div>
      </GlassCard>
    </motion.section>
  );
};

