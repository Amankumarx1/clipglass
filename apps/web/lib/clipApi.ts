export interface TranscriptWord {
  word: string;
  start: number;
  end: number;
}

export interface ClipMoment {
  clipId: string;
  start: number;
  end: number;
  duration: number;
  score: number;
  hook: string;
  title: string;
  hashtags: string[];
  reason: string;
  reframeMode: 'center' | 'follow-face' | 'split';
  captionPreset: 'viral_pop' | 'minimalist' | 'neon_cyber' | 'karaoke' | 'headline';
  status: 'discovered' | 'rendering' | 'ready' | 'failed';
  videoUrl?: string | null;
  transcriptText?: string;
  words?: TranscriptWord[];
}

export interface ClipJobEventData {
  jobId: string;
  stage: 'queued' | 'ingest' | 'transcribe' | 'signals' | 'scoring' | 'ready' | 'failed' | 'cancelled';
  percent: number;
  activeStep: string;
  eta?: number | null;
  clips: ClipMoment[];
  error?: any | null;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export async function createClipJob(payload: {
  url: string;
  minLength?: number;
  maxLength?: number;
  clipCount?: number;
  language?: string;
  reframeMode?: string;
  captionPreset?: string;
  polishStyle?: string;
  consent: boolean;
}): Promise<string> {
  const res = await fetch(`${API_BASE}/api/clip/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw data?.detail || { code: 'clip-job-failed', title: 'Job Creation Error', explanation: 'Failed to start Auto Clip job.' };
  }
  return data.jobId;
}

export function subscribeToClipJobEvents(
  jobId: string,
  onUpdate: (data: ClipJobEventData) => void,
  onError: (err: any) => void
): () => void {
  let eventSource: EventSource | null = null;
  let pollingInterval: any = null;
  let isClosed = false;

  const startPolling = () => {
    if (pollingInterval || isClosed) return;
    pollingInterval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/clip/jobs/${jobId}/clips`);
        if (!res.ok) return;
        const data = await res.json();
        onUpdate({
          jobId,
          stage: data.stage,
          percent: data.stage === 'ready' ? 100 : 50,
          activeStep: data.stage,
          clips: data.clips || [],
        });
        if (['ready', 'failed', 'cancelled'].includes(data.stage)) {
          clearInterval(pollingInterval);
        }
      } catch (e) {}
    }, 2000);
  };

  try {
    eventSource = new EventSource(`${API_BASE}/api/clip/jobs/${jobId}/events`);
    eventSource.addEventListener('update', (e) => {
      try {
        const data: ClipJobEventData = JSON.parse(e.data);
        onUpdate(data);
        if (['ready', 'failed', 'cancelled'].includes(data.stage)) {
          eventSource?.close();
        }
      } catch (err) {}
    });
    eventSource.onerror = () => {
      eventSource?.close();
      startPolling();
    };
  } catch (err) {
    startPolling();
  }

  return () => {
    isClosed = true;
    if (eventSource) eventSource.close();
    if (pollingInterval) clearInterval(pollingInterval);
  };
}

export async function updateClipMoment(
  jobId: string,
  cid: string,
  update: Partial<ClipMoment>
): Promise<ClipMoment> {
  const res = await fetch(`${API_BASE}/api/clip/jobs/${jobId}/clips/${cid}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(update),
  });
  const data = await res.json();
  if (!res.ok) throw data?.detail || new Error('Failed to update clip moment');
  return data.clip;
}

export async function renderClip(jobId: string, cid: string): Promise<ClipMoment> {
  const res = await fetch(`${API_BASE}/api/clip/jobs/${jobId}/clips/${cid}/render`, {
    method: 'POST',
  });
  const data = await res.json();
  if (!res.ok) throw data?.detail || new Error('Failed to render clip');
  return data.clip;
}

export function getClipDownloadUrl(jobId: string, cid: string): string {
  return `${API_BASE}/api/clip/jobs/${jobId}/clips/${cid}/download`;
}

export function getExportAllUrl(jobId: string): string {
  return `${API_BASE}/api/clip/jobs/${jobId}/export-all`;
}
