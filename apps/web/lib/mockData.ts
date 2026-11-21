export interface VideoStreamHeight {
  height: number;
  fps?: number;
  vcodec?: string;
  approxSize?: number;
  recommended?: boolean;
}

export interface AudioStreamInfo {
  bitrate?: number;
  acodec?: string;
  ext?: string;
  recommended?: boolean;
}

export interface SubtitleInfo {
  lang: string;
  name: string;
}

export interface ChapterInfo {
  title: string;
  startTime: number;
  endTime: number;
}

export interface VideoMetadata {
  id: string;
  title: string;
  channel: string;
  duration: number;
  thumbnail: string;
  isLive?: boolean;
  availableHeights: VideoStreamHeight[];
  availableAudio: AudioStreamInfo[];
  availableSubtitles: SubtitleInfo[];
  chapters?: ChapterInfo[];
  defaultFilename: string;
}

export interface FriendlyError {
  code: string;
  title: string;
  explanation: string;
  suggestedAction: string;
}

export const sampleVideoMetadata: VideoMetadata = {
  id: 'workspace-demo',
  title: 'Building a Better Workspace',
  channel: 'Creator Channel',
  duration: 768, // 12 min 48 sec
  thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80',
  isLive: false,
  availableHeights: [
    { height: 2160, fps: 60, approxSize: 980000000 },
    { height: 1440, fps: 60, approxSize: 520000000 },
    { height: 1080, fps: 60, approxSize: 260000000, recommended: true },
    { height: 720, fps: 30, approxSize: 135000000 },
    { height: 480, fps: 30, approxSize: 72000000 },
    { height: 360, fps: 30, approxSize: 42000000 },
    { height: 240, fps: 30, approxSize: 24000000 },
    { height: 144, fps: 30, approxSize: 12000000 },
  ],
  availableAudio: [
    { bitrate: 160, acodec: 'opus', ext: 'opus', recommended: true },
    { bitrate: 128, acodec: 'aac', ext: 'm4a' },
    { bitrate: 320, acodec: 'mp3', ext: 'mp3' },
    { bitrate: 256, acodec: 'mp3', ext: 'mp3' },
    { bitrate: 192, acodec: 'mp3', ext: 'mp3' },
  ],
  availableSubtitles: [
    { lang: 'en', name: 'English' },
    { lang: 'es', name: 'Spanish' },
    { lang: 'fr', name: 'French' },
    { lang: 'de', name: 'German' },
  ],
  chapters: [
    { title: '01. Intro & Setup', startTime: 0, endTime: 145 },
    { title: '02. Liquid Glass Materials', startTime: 145, endTime: 390 },
    { title: '03. Audio Normalization & ID3', startTime: 390, endTime: 580 },
    { title: '04. Summary & Best Practices', startTime: 580, endTime: 768 },
  ],
  defaultFilename: 'building-a-better-workspace'
};
