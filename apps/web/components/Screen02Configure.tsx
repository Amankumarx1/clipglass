'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Video,
  Music,
  Clock,
  User,
  Sparkles,
  FileText,
  ChevronDown,
  Download,
  Check,
  Square,
  Volume2,
  Sliders,
} from 'lucide-react';
import { useAppStore, DownloadMode, ContainerFormat } from '@/lib/store';
import { sampleVideoMetadata } from '@/lib/mockData';
import { createJob } from '@/lib/api';
import { playGlassTick, playGlassPop } from '@/lib/soundEffects';
import { GlassHeader } from './GlassHeader';
import { GlassAudioPreview } from './GlassAudioPreview';
import { GlassTrimmer } from './GlassTrimmer';
import { GlassPresets } from './GlassPresets';
import { GlassShortsStudio } from './GlassShortsStudio';
import { GlassChapters } from './GlassChapters';
import { GlassSubtitles } from './GlassSubtitles';
import { Glass3DCard } from './Glass3DCard';

export const Screen02Configure: React.FC = () => {
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
    embedThumbnail,
    setEmbedThumbnail,
    embedMetadata,
    setEmbedMetadata,
    customFilename,
    setCustomFilename,
    consent,
    setConsent,
    soundEnabled,
    trimEnabled,
    trimStart,
    trimEnd,
    audioNormalize,
    setAudioNormalize,
    artistTag,
    setArtistTag,
    albumTag,
    setAlbumTag,
    filterStyle,
    splitScreen,
    hookIntro,
    hookText,
    aspectRatio,
    setScreen,
    setActiveJobId,
    setJobPercent,
    setJobStage,
    setJobSpeed,
    setJobEta,
  } = useAppStore();

  const data = metadata || sampleVideoMetadata;
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showMastering, setShowMastering] = useState(false);

  const handleStartProcess = async (chosenMode: DownloadMode) => {
    if (!consent) return;
    if (soundEnabled) playGlassTick();
    setMode(chosenMode);

    setJobPercent(12);
    setJobStage('downloading');
    setJobSpeed('8.4 MB/s');
    setJobEta('ETA 00:42');
    setScreen('in_progress');

    try {
      if (url) {
        const parsedHeight = selectedHeight === 'best' 
          ? 1080 
          : (parseInt(String(selectedHeight).replace(/\D/g, ''), 10) || 1080);

        const jobId = await createJob({
          url,
          mode: chosenMode,
          height: parsedHeight,
          container,
          audioFormat: chosenMode === 'audio' ? audioFormat : undefined,
          audioBitrate: chosenMode === 'audio' ? audioBitrate : undefined,
          subtitles: enableSubtitles ? { langs: [subtitleLang || 'en'], format: 'srt' } : undefined,
          trim: trimEnabled ? { enabled: true, startTime: trimStart, endTime: trimEnd } : undefined,
          mastering: chosenMode === 'audio' ? {
            normalizeLoudness: audioNormalize,
            artist: artistTag,
            album: albumTag,
          } : undefined,
          fx: (chosenMode !== 'audio' && (filterStyle !== 'none' || splitScreen !== 'none' || hookIntro !== 'none' || aspectRatio !== 'original')) ? {
            filterStyle,
            splitScreen,
            hookIntro,
            hookText,
            aspectRatio,
          } : undefined,
          thumbnail: embedThumbnail,
          embedMetadata,
          filename: customFilename,
          consent: true,
        });
        setActiveJobId(jobId);
      }
    } catch (e) {
      console.warn('Real job start notice:', e);
    }
  };

  const dynamicHeights = metadata?.availableHeights && metadata.availableHeights.length > 0
    ? [
        { id: 'best', label: 'Best available' },
        ...metadata.availableHeights.map((h) => ({
          id: `${h.height}p`,
          label: `${h.height}p`,
          numeric: h.height,
        })),
      ]
    : [
        { id: 'best', label: 'Best available' },
        { id: '1080p', label: '1080p', numeric: 1080 },
        { id: '720p', label: '720p', numeric: 720 },
        { id: '480p', label: '480p', numeric: 480 },
        { id: '360p', label: '360p', numeric: 360 },
      ];

  const audioBitrates = [
    { bitrate: 320, label: '320 kbps (HQ)' },
    { bitrate: 256, label: '256 kbps' },
    { bitrate: 192, label: '192 kbps' },
    { bitrate: 128, label: '128 kbps' },
  ];

  // Dynamic estimated size
  const computeEstimatedSize = () => {
    if (mode === 'audio') {
      const durationSec = data.duration || 768;
      const rate = audioBitrate || 320;
      const bytes = (rate * 1000 * durationSec) / 8;
      return `~${Math.round(bytes / (1024 * 1024))} MB`;
    }
    const currentHeightStr = String(selectedHeight).replace('p', '');
    const matchedStream = metadata?.availableHeights?.find(
      (h) => String(h.height) === currentHeightStr
    );
    if (matchedStream?.approxSize) {
      return `~${Math.round(matchedStream.approxSize / (1024 * 1024))} MB`;
    }
    return '~248 MB';
  };

  return (
    <div className="w-full max-w-4xl mx-auto glass glass-rim rounded-[36px] shadow-2xl overflow-hidden flex flex-col justify-between min-h-[580px] md:min-h-[640px]">
      <GlassHeader />

      <div className="p-6 md:p-8 flex-1 flex flex-col gap-6">
        {/* Top: Thumbnail Preview with Audio Preview Overlay & Video Metadata */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* 16:9 Thumbnail with Audio Preview Player */}
          <div className="relative aspect-video w-full sm:w-64 rounded-2xl overflow-hidden glass shadow-md flex-shrink-0 group">
            <img
              src={data.thumbnail}
              alt={data.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            {/* Audio Preview Overlay */}
            <GlassAudioPreview />

            {/* Duration Badge */}
            <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-pill bg-black/75 backdrop-blur-md text-white text-[11px] font-mono font-medium shadow-md">
              12:48
            </div>
          </div>

          {/* Title, Creator, Duration */}
          <div className="flex flex-col gap-1.5">
            <h2 className="font-heading font-bold text-xl md:text-2xl text-ink-primary dark:text-ink-dark-primary tracking-tight">
              {data.title}
            </h2>
            <div className="flex items-center gap-4 text-xs md:text-sm text-ink-secondary dark:text-ink-dark-secondary font-medium">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-ink-tertiary" />
                {data.channel}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-ink-tertiary" />
                12 min 48 sec
              </span>
            </div>
          </div>
        </div>

        {/* Center Grid: Controls Left, Estimated Size Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (8 cols): Mode, Quality, Formats, Trimmer, Switches */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            {/* Quick 1-Click Studio Presets */}
            <GlassPresets />

            {/* Feature: Lemo-Opuscar Shorts & Creative Code Studio */}
            <GlassShortsStudio />

            {/* Output Mode Segmented Control */}
            <div className="inline-flex p-1 rounded-pill glass glass-rim w-fit select-none">
              <button
                type="button"
                onClick={() => {
                  if (soundEnabled) playGlassTick();
                  setMode('video');
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-pill text-xs font-semibold transition-all ${
                  mode === 'video'
                    ? 'btn-blue btn-gloss text-white shadow-[0_0_16px_rgba(47,107,255,0.6)]'
                    : 'text-ink-secondary dark:text-slate-300 hover:text-ink-primary dark:hover:text-white'
                }`}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Video + Audio</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (soundEnabled) playGlassTick();
                  setMode('video_only');
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-pill text-xs font-semibold transition-all ${
                  mode === 'video_only'
                    ? 'btn-blue btn-gloss text-white shadow-[0_0_16px_rgba(47,107,255,0.6)]'
                    : 'text-ink-secondary dark:text-slate-300 hover:text-ink-primary dark:hover:text-white'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span>Video only</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (soundEnabled) playGlassTick();
                  setMode('audio');
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-pill text-xs font-semibold transition-all ${
                  mode === 'audio'
                    ? 'btn-blue btn-gloss text-white shadow-[0_0_16px_rgba(47,107,255,0.6)]'
                    : 'text-ink-secondary dark:text-slate-300 hover:text-ink-primary dark:hover:text-white'
                }`}
              >
                <Music className="w-3.5 h-3.5" />
                <span>Audio only</span>
              </button>
            </div>

            {/* Quality / Bitrate Chips Row */}
            <div className="flex flex-wrap items-center gap-2 select-none">
              {mode === 'audio' ? (
                audioBitrates.map((b) => {
                  const isActive = (audioBitrate || 320) === b.bitrate;
                  return (
                    <button
                      key={b.bitrate}
                      type="button"
                      onClick={() => {
                        if (soundEnabled) playGlassTick();
                        setAudioBitrate(b.bitrate);
                      }}
                      className={`h-9 px-4 rounded-pill text-xs font-semibold transition-all flex items-center justify-center ${
                        isActive
                          ? 'btn-purple btn-gloss text-white shadow-glow-audio'
                          : 'glass glass-rim text-ink-primary dark:text-ink-dark-primary hover:bg-white/50'
                      }`}
                    >
                      {b.label}
                    </button>
                  );
                })
              ) : (
                dynamicHeights.map((q) => {
                  const isActive =
                    (selectedHeight === 'best' && q.id === 'best') ||
                    String(selectedHeight).replace('p', '') === String(q.id).replace('p', '');
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => {
                        if (soundEnabled) playGlassTick();
                        setSelectedHeight(q.id);
                      }}
                      className={`h-9 px-4 rounded-pill text-xs font-semibold transition-all flex items-center justify-center ${
                        isActive
                          ? 'btn-blue btn-gloss text-white shadow-glow-info'
                          : 'glass glass-rim text-ink-primary dark:text-ink-dark-primary hover:bg-white/50'
                      }`}
                    >
                      {q.label}
                    </button>
                  );
                })
              )}
            </div>

            {/* Dropdown & Filename Row */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              <div className="sm:col-span-4 relative">
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="w-full h-11 px-4 glass glass-rim rounded-field flex items-center justify-between text-xs font-semibold text-ink-primary dark:text-ink-dark-primary"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-ink-secondary" />
                    {mode === 'audio' ? (audioFormat || 'mp3').toUpperCase() : container.toUpperCase()}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-ink-secondary" />
                </button>

                {dropdownOpen && (
                  <div className="absolute top-full left-0 mt-1.5 w-full glass glass-rim rounded-2xl p-1.5 shadow-xl z-20">
                    {mode === 'audio' ? (
                      <>
                        {(['mp3', 'm4a', 'opus', 'wav', 'flac'] as const).map((fmt) => (
                          <button
                            key={fmt}
                            type="button"
                            onClick={() => {
                              setAudioFormat(fmt);
                              setDropdownOpen(false);
                            }}
                            className={`w-full px-3 py-2 text-left text-xs font-semibold rounded-xl hover:bg-white/50 ${
                              audioFormat === fmt ? 'text-primaryAction-middle font-bold' : ''
                            }`}
                          >
                            {fmt.toUpperCase()}
                          </button>
                        ))}
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setContainer('mp4');
                            setDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2 text-left text-xs font-semibold rounded-xl hover:bg-white/50 ${
                            container === 'mp4' ? 'text-primaryAction-middle font-bold' : ''
                          }`}
                        >
                          MP4 (Universal)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setContainer('webm');
                            setDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2 text-left text-xs font-semibold rounded-xl hover:bg-white/50 ${
                            container === 'webm' ? 'text-primaryAction-middle font-bold' : ''
                          }`}
                        >
                          WebM (Modern)
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="sm:col-span-8 relative flex items-center glass glass-rim rounded-field h-11 px-4">
                <Sparkles className="w-3.5 h-3.5 text-infoAction-start mr-2 flex-shrink-0" />
                <input
                  type="text"
                  value={customFilename}
                  onChange={(e) => setCustomFilename(e.target.value)}
                  className="w-full bg-transparent text-xs font-sans text-ink-primary dark:text-ink-dark-primary focus:outline-none"
                  placeholder="Filename..."
                />
                <ChevronDown className="w-3.5 h-3.5 text-ink-secondary ml-2 flex-shrink-0" />
              </div>
            </div>

            {/* Feature 1: Timestamp Range Trimmer */}
            <GlassTrimmer />

            {/* Feature 2: Video Chapters & 1-Click Segment Extraction */}
            <GlassChapters chapters={data.chapters} />

            {/* Feature 3: Audio Mastering & ID3 Tags (Expandable) */}
            {mode === 'audio' && (
              <div className="glass glass-rim rounded-2xl p-4 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => setShowMastering(!showMastering)}
                  className="flex items-center justify-between w-full text-xs font-bold text-ink-primary dark:text-ink-dark-primary"
                >
                  <span className="flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-audioAction-start" />
                    Audio Mastering & ID3 Tags
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showMastering ? 'rotate-180' : ''}`} />
                </button>

                {showMastering && (
                  <div className="pt-2 border-t border-white/40 dark:border-white/10 space-y-3">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-ink-secondary">EBU R128 Loudness Normalization (-14 LUFS)</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (soundEnabled) playGlassPop();
                          setAudioNormalize(!audioNormalize);
                        }}
                        className={`w-8 h-4 rounded-pill p-0.5 flex items-center transition-colors ${
                          audioNormalize ? 'bg-audioAction-start' : 'bg-slate-300 dark:bg-slate-700'
                        }`}
                      >
                        <div className={`w-3 h-3 rounded-full bg-white transition-transform ${audioNormalize ? 'translate-x-4' : ''}`} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <input
                        type="text"
                        value={artistTag}
                        onChange={(e) => setArtistTag(e.target.value)}
                        placeholder="Artist tag"
                        className="glass h-8 px-3 rounded-lg text-xs bg-transparent focus:outline-none"
                      />
                      <input
                        type="text"
                        value={albumTag}
                        onChange={(e) => setAlbumTag(e.target.value)}
                        placeholder="Album tag"
                        className="glass h-8 px-3 rounded-lg text-xs bg-transparent focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Switches Row: Subtitles, Thumbnail, Embed metadata */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-1 select-none">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-ink-secondary dark:text-ink-dark-secondary">
                <button
                  type="button"
                  onClick={() => {
                    if (soundEnabled) playGlassPop();
                    setEnableSubtitles(!enableSubtitles);
                  }}
                  className={`w-9 h-5 rounded-pill p-0.5 flex items-center transition-colors ${
                    enableSubtitles ? 'bg-infoAction-start dark:shadow-[0_0_12px_rgba(47,107,255,0.7)]' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <motion.div
                    animate={{ x: enableSubtitles ? 16 : 0 }}
                    className="w-4 h-4 rounded-full bg-white shadow-sm"
                  />
                </button>
                <span>Subtitles</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-ink-secondary dark:text-ink-dark-secondary">
                <button
                  type="button"
                  onClick={() => {
                    if (soundEnabled) playGlassPop();
                    setEmbedThumbnail(!embedThumbnail);
                  }}
                  className={`w-9 h-5 rounded-pill p-0.5 flex items-center transition-colors ${
                    embedThumbnail ? 'bg-infoAction-start dark:shadow-[0_0_12px_rgba(47,107,255,0.7)]' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <motion.div
                    animate={{ x: embedThumbnail ? 16 : 0 }}
                    className="w-4 h-4 rounded-full bg-white shadow-sm"
                  />
                </button>
                <span>Thumbnail</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-ink-secondary dark:text-ink-dark-secondary">
                <button
                  type="button"
                  onClick={() => {
                    if (soundEnabled) playGlassPop();
                    setEmbedMetadata(!embedMetadata);
                  }}
                  className={`w-9 h-5 rounded-pill p-0.5 flex items-center transition-colors ${
                    embedMetadata ? 'bg-infoAction-start dark:shadow-[0_0_12px_rgba(47,107,255,0.7)]' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <motion.div
                    animate={{ x: embedMetadata ? 16 : 0 }}
                    className="w-4 h-4 rounded-full bg-white shadow-sm"
                  />
                </button>
                <span>Embed metadata</span>
              </label>
            </div>

            {/* Feature 4: Subtitles Language & Format Downloader */}
            <GlassSubtitles />
          </div>

          {/* Right Column (4 cols): Estimated Size & Consent Card */}
          <div className="lg:col-span-4">
            <Glass3DCard intensity={6} glowColor="rgba(47, 107, 255, 0.25)">
              <div className="glass glass-rim rounded-2xl p-5 flex flex-col gap-3">
                <span className="text-[11px] font-semibold text-ink-secondary uppercase tracking-wider">
                  Estimated size
                </span>
                <div className="font-heading font-bold text-3xl text-ink-primary dark:text-ink-dark-primary font-mono tracking-tight">
                  {computeEstimatedSize()}
                </div>

                {/* Checkbox Permission */}
                <div
                  onClick={() => {
                    if (soundEnabled) playGlassPop();
                    setConsent(!consent);
                  }}
                  className="flex items-start gap-2.5 mt-2 pt-3 border-t border-white/40 dark:border-white/10 cursor-pointer select-none"
                >
                  <div className="mt-0.5 text-infoAction-start flex-shrink-0">
                    {consent ? (
                      <div className="w-4 h-4 rounded-md bg-infoAction-start text-white flex items-center justify-center dark:shadow-[0_0_10px_rgba(47,107,255,0.7)]">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    ) : (
                      <Square className="w-4 h-4 text-ink-tertiary" />
                    )}
                  </div>
                  <span className="text-xs text-ink-secondary dark:text-ink-dark-secondary leading-snug">
                    I own this content or have permission to reuse it.
                  </span>
                </div>
              </div>
            </Glass3DCard>
          </div>
        </div>

        {/* Bottom Actions Row: Red-orange Download video, Purple Extract audio */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 mt-auto">
          <button
            type="button"
            onClick={() => handleStartProcess('video')}
            className="w-full sm:flex-1 h-12 rounded-pill btn-red-orange btn-gloss text-white font-heading font-bold text-sm flex items-center justify-center gap-2 shadow-glow-primary hover:opacity-95 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Download video</span>
          </button>

          <button
            type="button"
            onClick={() => handleStartProcess('audio')}
            className="w-full sm:flex-1 h-12 rounded-pill btn-purple btn-gloss text-white font-heading font-bold text-sm flex items-center justify-center gap-2 shadow-glow-audio hover:opacity-95 transition-all"
          >
            <Music className="w-4 h-4" />
            <span>Extract audio</span>
          </button>
        </div>
      </div>
    </div>
  );
};
