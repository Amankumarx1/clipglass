import { create } from 'zustand';
import { ClipMoment } from './clipApi';

export interface ClipStoreState {
  url: string;
  setUrl: (url: string) => void;
  activeJobId: string | null;
  setActiveJobId: (id: string | null) => void;
  stage: 'idle' | 'queued' | 'ingest' | 'transcribe' | 'signals' | 'scoring' | 'ready' | 'failed';
  setStage: (stage: 'idle' | 'queued' | 'ingest' | 'transcribe' | 'signals' | 'scoring' | 'ready' | 'failed') => void;
  percent: number;
  setPercent: (p: number) => void;
  activeStep: string;
  setActiveStep: (step: string) => void;
  clips: ClipMoment[];
  setClips: (clips: ClipMoment[]) => void;
  updateLocalClip: (cid: string, updates: Partial<ClipMoment>) => void;
  selectedClipId: string | null;
  setSelectedClipId: (cid: string | null) => void;
  isCaptionDrawerOpen: boolean;
  setIsCaptionDrawerOpen: (open: boolean) => void;
  minLength: number;
  setMinLength: (len: number) => void;
  maxLength: number;
  setMaxLength: (len: number) => void;
  clipCount: number;
  setClipCount: (count: number) => void;
  reframeMode: 'center' | 'follow-face' | 'split';
  setReframeMode: (mode: 'center' | 'follow-face' | 'split') => void;
  captionPreset: 'viral_pop' | 'minimalist' | 'neon_cyber' | 'karaoke' | 'headline';
  setCaptionPreset: (preset: 'viral_pop' | 'minimalist' | 'neon_cyber' | 'karaoke' | 'headline') => void;
  polishStyle: 'none' | 'caption_news' | 'swiss_motion' | 'neon_tubes' | 'dark_tech';
  setPolishStyle: (style: 'none' | 'caption_news' | 'swiss_motion' | 'neon_tubes' | 'dark_tech') => void;
  consent: boolean;
  setConsent: (consent: boolean) => void;
  error: any | null;
  setError: (err: any | null) => void;
  reset: () => void;
}

export const useClipStore = create<ClipStoreState>((set) => ({
  url: '',
  setUrl: (url) => set({ url }),
  activeJobId: null,
  setActiveJobId: (activeJobId) => set({ activeJobId }),
  stage: 'idle',
  setStage: (stage) => set({ stage }),
  percent: 0,
  setPercent: (percent) => set({ percent }),
  activeStep: '',
  setActiveStep: (activeStep) => set({ activeStep }),
  clips: [],
  setClips: (clips) => set({ clips }),
  updateLocalClip: (cid, updates) => set((state) => ({
    clips: state.clips.map((c) => c.clipId === cid ? { ...c, ...updates } : c)
  })),
  selectedClipId: null,
  setSelectedClipId: (selectedClipId) => set({ selectedClipId }),
  isCaptionDrawerOpen: false,
  setIsCaptionDrawerOpen: (isCaptionDrawerOpen) => set({ isCaptionDrawerOpen }),
  minLength: 20,
  setMinLength: (minLength) => set({ minLength }),
  maxLength: 60,
  setMaxLength: (maxLength) => set({ maxLength }),
  clipCount: 3,
  setClipCount: (clipCount) => set({ clipCount }),
  reframeMode: 'follow-face',
  setReframeMode: (reframeMode) => set({ reframeMode }),
  captionPreset: 'viral_pop',
  setCaptionPreset: (captionPreset) => set({ captionPreset }),
  polishStyle: 'none',
  setPolishStyle: (polishStyle) => set({ polishStyle }),
  consent: true,
  setConsent: (consent) => set({ consent }),
  error: null,
  setError: (error) => set({ error }),
  reset: () => set({
    stage: 'idle',
    percent: 0,
    activeStep: '',
    clips: [],
    selectedClipId: null,
    isCaptionDrawerOpen: false,
    error: null
  })
}));

