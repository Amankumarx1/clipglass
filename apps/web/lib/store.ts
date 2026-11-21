import { create } from 'zustand';
import { VideoMetadata, sampleVideoMetadata } from './mockData';

export type ScreenState = 'home' | 'configure' | 'in_progress' | 'complete';
export type DownloadMode = 'video' | 'video_only' | 'audio';
export type ContainerFormat = 'mp4' | 'webm';
export type AudioFormat = 'mp3' | 'm4a' | 'opus' | 'wav' | 'flac';
export type AudioBitrate = 128 | 192 | 256 | 320;

export interface HistoryItem {
  id: string;
  filename: string;
  filesize: number;
  format: string;
  thumbnail?: string;
  title?: string;
  timestamp: number;
  expiresAt: number;
}

interface AppState {
  screen: ScreenState;
  setScreen: (screen: ScreenState) => void;

  url: string;
  setUrl: (url: string) => void;
  metadata: VideoMetadata | null;
  setMetadata: (meta: VideoMetadata | null) => void;
  isInspecting: boolean;
  setIsInspecting: (val: boolean) => void;
  inspectError: any | null;
  setInspectError: (err: any | null) => void;

  mode: DownloadMode;
  setMode: (mode: DownloadMode) => void;
  selectedHeight: number | string;
  setSelectedHeight: (h: number | string) => void;
  container: ContainerFormat;
  setContainer: (c: ContainerFormat) => void;
  audioFormat: AudioFormat;
  setAudioFormat: (fmt: AudioFormat) => void;
  audioBitrate: number;
  setAudioBitrate: (rate: number) => void;

  // Trimmer (Feature: Timestamp Range Slider)
  trimEnabled: boolean;
  setTrimEnabled: (val: boolean) => void;
  trimStart: string;
  setTrimStart: (val: string) => void;
  trimEnd: string;
  setTrimEnd: (val: string) => void;

  // Audio Mastering (Feature: Loudness Normalization & ID3 tags)
  audioNormalize: boolean;
  setAudioNormalize: (val: boolean) => void;
  artistTag: string;
  setArtistTag: (val: string) => void;
  albumTag: string;
  setAlbumTag: (val: string) => void;
  genreTag: string;
  setGenreTag: (val: string) => void;

  // Creative Shorts Studio & Lemo-Opuscar FX
  filterStyle: 'none' | 'vintage_35mm' | 'retro_vhs' | 'scifi_hud' | 'film_noir';
  setFilterStyle: (style: 'none' | 'vintage_35mm' | 'retro_vhs' | 'scifi_hud' | 'film_noir') => void;
  splitScreen: 'none' | 'audio_nebula' | 'hypnotic_tunnel' | 'liquid_flow';
  setSplitScreen: (split: 'none' | 'audio_nebula' | 'hypnotic_tunnel' | 'liquid_flow') => void;
  hookIntro: 'none' | 'slam_title' | 'glitch_reveal' | 'breaking_hook';
  setHookIntro: (hook: 'none' | 'slam_title' | 'glitch_reveal' | 'breaking_hook') => void;
  hookText: string;
  setHookText: (txt: string) => void;
  aspectRatio: 'original' | '9:16' | '16:9' | '1:1';
  setAspectRatio: (ar: 'original' | '9:16' | '16:9' | '1:1') => void;
  shortsStudioOpen: boolean;
  setShortsStudioOpen: (open: boolean) => void;

  // Additional options
  enableSubtitles: boolean;
  setEnableSubtitles: (val: boolean) => void;
  subtitleLang: string;
  setSubtitleLang: (lang: string) => void;
  embedThumbnail: boolean;
  setEmbedThumbnail: (val: boolean) => void;
  embedMetadata: boolean;
  setEmbedMetadata: (val: boolean) => void;
  customFilename: string;
  setCustomFilename: (name: string) => void;

  consent: boolean;
  setConsent: (val: boolean) => void;

  // Modal legacy compatibility
  isModalOpen: boolean;
  setIsModalOpen: (val: boolean) => void;

  // Presets & Chapters
  selectedPreset: string | null;
  presetFallbackNote: string | null;
  setSelectedPreset: (p: string | null) => void;
  setPresetFallbackNote: (note: string | null) => void;
  applyPreset: (preset: 'best_1080p' | 'podcast' | 'audiophile' | '4k_master' | 'shorts' | 'car' | 'custom') => void;
  activeChapter: string | null;
  setActiveChapter: (ch: string | null) => void;

  // Sensory: Sound Effects Toggle
  soundEnabled: boolean;
  setSoundEnabled: (val: boolean) => void;
  toggleSound: () => void;

  // Session History Drawer
  isHistoryOpen: boolean;
  setIsHistoryOpen: (val: boolean) => void;
  sessionHistory: HistoryItem[];
  addSessionHistory: (item: HistoryItem) => void;
  removeSessionHistory: (id: string) => void;

  // Live Job State
  activeJobId: string | null;
  setActiveJobId: (id: string | null) => void;
  jobPercent: number;
  setJobPercent: (p: number) => void;
  jobStage: 'queued' | 'downloading' | 'merging' | 'ready' | 'failed';
  setJobStage: (s: 'queued' | 'downloading' | 'merging' | 'ready' | 'failed') => void;
  jobSpeed: string;
  setJobSpeed: (s: string) => void;
  jobEta: string;
  setJobEta: (eta: string) => void;
  finalFilename: string;
  setFinalFilename: (f: string) => void;
  finalFilesize: number;
  setFinalFilesize: (sz: number) => void;

  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  screen: 'home',
  setScreen: (screen) => set({ screen }),

  url: '',
  setUrl: (url) => set({ url }),
  metadata: null,
  setMetadata: (metadata) => {
    set({
      metadata,
      selectedHeight: 'best',
      customFilename: metadata?.defaultFilename || 'building-a-better-workspace',
      trimStart: '00:00',
      trimEnd: '12:48',
      screen: metadata ? 'configure' : 'home'
    });
  },
  isInspecting: false,
  setIsInspecting: (isInspecting) => set({ isInspecting }),
  inspectError: null,
  setInspectError: (inspectError) => set({ inspectError }),

  mode: 'video',
  setMode: (mode) => set({ mode }),
  selectedHeight: 'best',
  setSelectedHeight: (selectedHeight) => set({ selectedHeight }),
  container: 'mp4',
  setContainer: (container) => set({ container }),
  audioFormat: 'mp3',
  setAudioFormat: (audioFormat) => set({ audioFormat }),
  audioBitrate: 320,
  setAudioBitrate: (audioBitrate) => set({ audioBitrate }),

  trimEnabled: false,
  setTrimEnabled: (trimEnabled) => set({ trimEnabled }),
  trimStart: '00:00',
  setTrimStart: (trimStart) => set({ trimStart }),
  trimEnd: '12:48',
  setTrimEnd: (trimEnd) => set({ trimEnd }),

  audioNormalize: true,
  setAudioNormalize: (audioNormalize) => set({ audioNormalize }),
  artistTag: 'Creator Channel',
  setArtistTag: (artistTag) => set({ artistTag }),
  albumTag: 'ClipGlass Audio',
  setAlbumTag: (albumTag) => set({ albumTag }),
  genreTag: 'Podcast',
  setGenreTag: (genreTag) => set({ genreTag }),

  filterStyle: 'none',
  setFilterStyle: (filterStyle) => set({ filterStyle }),
  splitScreen: 'none',
  setSplitScreen: (splitScreen) => set({ splitScreen }),
  hookIntro: 'none',
  setHookIntro: (hookIntro) => set({ hookIntro }),
  hookText: 'WAIT FOR THE END...',
  setHookText: (hookText) => set({ hookText }),
  aspectRatio: 'original',
  setAspectRatio: (aspectRatio) => set({ aspectRatio }),
  shortsStudioOpen: false,
  setShortsStudioOpen: (shortsStudioOpen) => set({ shortsStudioOpen }),

  enableSubtitles: false,
  setEnableSubtitles: (enableSubtitles) => set({ enableSubtitles }),
  subtitleLang: 'en',
  setSubtitleLang: (subtitleLang) => set({ subtitleLang }),
  embedThumbnail: true,
  setEmbedThumbnail: (embedThumbnail) => set({ embedThumbnail }),
  embedMetadata: true,
  setEmbedMetadata: (embedMetadata) => set({ embedMetadata }),
  customFilename: 'building-a-better-workspace',
  setCustomFilename: (customFilename) => set({ customFilename }),

  consent: true,
  setConsent: (consent) => set({ consent }),

  selectedPreset: null,
  presetFallbackNote: null,
  setSelectedPreset: (selectedPreset) => set({ selectedPreset }),
  setPresetFallbackNote: (presetFallbackNote) => set({ presetFallbackNote }),
  applyPreset: (preset) => {
    if (preset === 'best_1080p') {
      set((state) => {
        const has1080 = state.metadata?.availableHeights?.some((h) => h.height === 1080);
        const topH = state.metadata?.availableHeights?.[0]?.height;
        const targetH = has1080 ? '1080p' : topH ? `${topH}p` : '1080p';
        const note = !has1080 && topH && topH < 1080 ? `1080p unavailable; fell back to ${topH}p.` : null;
        return {
          selectedPreset: 'best_1080p',
          presetFallbackNote: note,
          mode: 'video',
          selectedHeight: targetH,
          container: 'mp4',
          embedMetadata: true,
        };
      });
    } else if (preset === 'podcast') {
      set({
        selectedPreset: 'podcast',
        presetFallbackNote: null,
        mode: 'audio',
        audioFormat: 'mp3',
        audioBitrate: 320,
        audioNormalize: true,
        embedMetadata: true,
        embedThumbnail: true,
      });
    } else if (preset === 'audiophile') {
      set({
        selectedPreset: 'audiophile',
        presetFallbackNote: null,
        mode: 'audio',
        audioFormat: 'flac',
        embedMetadata: true,
        embedThumbnail: true,
      });
    } else if (preset === '4k_master') {
      set((state) => {
        const has4K = state.metadata?.availableHeights?.some((h) => h.height >= 2160);
        const topH = state.metadata?.availableHeights?.[0]?.height;
        const note = !has4K && topH ? `4K (2160p) unavailable on this source; fell back to maximum available ${topH}p.` : null;
        return {
          selectedPreset: '4k_master',
          presetFallbackNote: note,
          mode: 'video',
          selectedHeight: has4K ? '2160p' : 'best',
          container: 'mp4',
          embedMetadata: true,
          embedThumbnail: true,
        };
      });
    } else if (preset === 'shorts') {
      set({
        selectedPreset: 'shorts',
        presetFallbackNote: null,
        mode: 'video',
        selectedHeight: '1080p',
        container: 'mp4',
        trimEnabled: true,
        embedMetadata: true,
        aspectRatio: '9:16',
        filterStyle: 'vintage_35mm',
        splitScreen: 'audio_nebula',
        hookIntro: 'slam_title',
        hookText: 'WAIT FOR THE END...',
        shortsStudioOpen: true,
      });
    } else if (preset === 'car') {
      set({
        selectedPreset: 'car',
        presetFallbackNote: null,
        mode: 'audio',
        audioFormat: 'mp3',
        audioBitrate: 192,
        embedMetadata: true,
        embedThumbnail: true,
      });
    } else if (preset === 'custom') {
      set({
        selectedPreset: 'custom',
        presetFallbackNote: null,
      });
    }
  },
  activeChapter: null,
  setActiveChapter: (activeChapter) => set({ activeChapter }),

  isModalOpen: false,
  setIsModalOpen: (isModalOpen) => set({ isModalOpen }),

  soundEnabled: true,
  setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
  toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),

  isHistoryOpen: false,
  setIsHistoryOpen: (isHistoryOpen) => set({ isHistoryOpen }),
  sessionHistory: typeof window !== 'undefined' ? (() => {
    try {
      const raw = sessionStorage.getItem('clipglass_history');
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  })() : [],
  addSessionHistory: (item) =>
    set((state) => {
      const updated = [item, ...state.sessionHistory.filter((h) => h.id !== item.id)].slice(0, 8);
      try { sessionStorage.setItem('clipglass_history', JSON.stringify(updated)); } catch {}
      return { sessionHistory: updated };
    }),
  removeSessionHistory: (id) =>
    set((state) => {
      const updated = state.sessionHistory.filter((h) => h.id !== id);
      try { sessionStorage.setItem('clipglass_history', JSON.stringify(updated)); } catch {}
      return { sessionHistory: updated };
    }),

  activeJobId: null,
  setActiveJobId: (activeJobId) => set({ activeJobId }),
  jobPercent: 68,
  setJobPercent: (jobPercent) => set({ jobPercent }),
  jobStage: 'downloading',
  setJobStage: (jobStage) => set({ jobStage }),
  jobSpeed: '8.4 MB/s',
  setJobSpeed: (jobSpeed) => set({ jobSpeed }),
  jobEta: 'ETA 00:42',
  setJobEta: (jobEta) => set({ jobEta }),
  finalFilename: 'building-a-better-workspace.mp4',
  setFinalFilename: (finalFilename) => set({ finalFilename }),
  finalFilesize: 248 * 1024 * 1024,
  setFinalFilesize: (finalFilesize) => set({ finalFilesize }),

  theme: 'light',
  setTheme: (theme) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('clipglass_theme', theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    set({ theme });
  },
  toggleTheme: () => {
    set((state) => {
      const nextTheme = state.theme === 'light' ? 'dark' : 'light';
      if (typeof window !== 'undefined') {
        localStorage.setItem('clipglass_theme', nextTheme);
        if (nextTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      return { theme: nextTheme };
    });
  }
}));
