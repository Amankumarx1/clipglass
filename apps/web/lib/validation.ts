import { z } from 'zod';

export const ALLOWED_HOSTS = [
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtu.be'
];

export const youtubeUrlSchema = z.string().trim().refine((val) => {
  if (!val) return false;
  try {
    const urlStr = val.startsWith('http://') || val.startsWith('https://') ? val : `https://${val}`;
    const parsed = new URL(urlStr);
    const host = parsed.hostname.toLowerCase().replace(/:\d+$/, '');
    return ALLOWED_HOSTS.includes(host);
  } catch {
    return false;
  }
}, {
  message: 'Enter a valid YouTube, YouTube Music, or Shorts link.'
});

export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  const urlStr = trimmed.startsWith('http://') || trimmed.startsWith('https://') ? trimmed : `https://${trimmed}`;

  try {
    const parsed = new URL(urlStr);
    const host = parsed.hostname.toLowerCase().replace(/:\d+$/, '');
    if (!ALLOWED_HOSTS.includes(host)) return null;

    if (host === 'youtu.be') {
      return parsed.pathname.slice(1).split('/')[0] || null;
    }
    if (parsed.pathname.includes('/watch')) {
      return parsed.searchParams.get('v');
    }
    if (parsed.pathname.includes('/shorts/')) {
      return parsed.pathname.split('/shorts/')[1]?.split('/')[0] || null;
    }
    if (parsed.pathname.includes('/live/')) {
      return parsed.pathname.split('/live/')[1]?.split('/')[0] || null;
    }
    if (parsed.pathname.includes('/embed/')) {
      return parsed.pathname.split('/embed/')[1]?.split('/')[0] || null;
    }
  } catch {
    return null;
  }
  return null;
}

export function isValidYouTubeUrl(url: string): boolean {
  return youtubeUrlSchema.safeParse(url).success && extractYouTubeId(url) !== null;
}

