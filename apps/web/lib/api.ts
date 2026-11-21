import { VideoMetadata, FriendlyError } from './mockData';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export interface JobEventData {
  jobId: string;
  state: 'queued' | 'downloading' | 'merging' | 'converting' | 'ready' | 'failed' | 'cancelled';
  percent: number;
  speed?: string | null;
  eta?: number | null;
  filename?: string | null;
  filesize?: number | null;
  expiresAt?: string | null;
  error?: FriendlyError | null;
}

export async function inspectUrl(url: string): Promise<VideoMetadata> {
  const res = await fetch(`${API_BASE}/api/v1/inspect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw data?.detail || { code: 'inspect-error', title: 'Inspection Failed', explanation: 'Could not fetch video info.' };
  }
  return data;
}

export interface CreativeFXPayload {
  filterStyle?: 'none' | 'vintage_35mm' | 'retro_vhs' | 'scifi_hud' | 'film_noir';
  splitScreen?: 'none' | 'audio_nebula' | 'hypnotic_tunnel' | 'liquid_flow';
  hookIntro?: 'none' | 'slam_title' | 'glitch_reveal' | 'breaking_hook';
  hookText?: string;
  aspectRatio?: 'original' | '9:16' | '16:9' | '1:1';
}

export async function createJob(payload: {
  url: string;
  mode: string;
  height?: number;
  container?: string;
  audioFormat?: string;
  audioBitrate?: number;
  subtitles?: { langs: string[]; format: string } | null;
  trim?: { enabled: boolean; startTime?: string; endTime?: string };
  mastering?: { normalizeLoudness?: boolean; artist?: string; album?: string; genre?: string };
  fx?: CreativeFXPayload;
  thumbnail?: boolean;
  embedMetadata?: boolean;
  filename?: string;
  consent: boolean;
}): Promise<string> {
  const res = await fetch(`${API_BASE}/api/v1/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw data?.detail || { code: 'job-create-error', title: 'Job Creation Error', explanation: 'Failed to initiate job.' };
  }
  return data.jobId;
}

export async function generateExplainerShort(payload: {
  topic: string;
  script?: string;
  style?: 'blueprint' | 'film_noir' | 'cyberpunk' | 'retro_vhs';
  voice?: string;
  duration?: number;
}): Promise<{ jobId: string; topic: string; style: string; script: string; duration: number }> {
  const res = await fetch(`${API_BASE}/api/v1/explainer/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw data?.detail || { code: 'explainer-error', title: 'Explainer Generation Error', explanation: 'Failed to generate explainer short.' };
  }
  return data;
}

export async function cancelJob(jobId: string): Promise<void> {
  await fetch(`${API_BASE}/api/v1/jobs/${jobId}`, {
    method: 'DELETE',
  });
}

export function subscribeToJobEvents(
  jobId: string,
  onUpdate: (data: JobEventData) => void,
  onError: (err: any) => void
): () => void {
  let eventSource: EventSource | null = null;
  let pollingInterval: any = null;
  let isClosed = false;

  const startPolling = () => {
    if (pollingInterval || isClosed) return;
    pollingInterval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/jobs/${jobId}/status`);
        if (!res.ok) throw new Error('Status poll failed');
        const data: JobEventData = await res.json();
        onUpdate(data);
        if (['ready', 'failed', 'cancelled'].includes(data.state)) {
          clearInterval(pollingInterval);
        }
      } catch (err) {
        // Continue polling until resolved
      }
    }, 2000);
  };

  try {
    eventSource = new EventSource(`${API_BASE}/api/v1/jobs/${jobId}/events`);

    eventSource.addEventListener('update', (e) => {
      try {
        const data: JobEventData = JSON.parse(e.data);
        onUpdate(data);
        if (['ready', 'failed', 'cancelled'].includes(data.state)) {
          eventSource?.close();
        }
      } catch (err) {
        console.error('Error parsing SSE event data', err);
      }
    });

    eventSource.onerror = () => {
      eventSource?.close();
      // Graceful fallback to polling if SSE drops
      startPolling();
    };
  } catch {
    startPolling();
  }

  return () => {
    isClosed = true;
    if (eventSource) eventSource.close();
    if (pollingInterval) clearInterval(pollingInterval);
  };
}

