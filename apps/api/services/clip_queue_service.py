import asyncio
import os
import time
import uuid
import shutil
import threading
from typing import Dict, Optional, List, Any
from datetime import datetime, timezone, timedelta
from schemas.clip import (
    ClipJobCreateRequest, ClipJobEventData, ClipMoment,
    ClipMomentUpdateRequest
)
from schemas.inspect import FriendlyError
from services.clip_ingest_service import ingest_video_and_metadata
from services.transcription_service import get_or_create_transcript
from services.signal_analysis_service import analyze_multimodal_signals
from services.clip_scoring_service import score_clips_with_llm
from services.clip_render_service import render_clip_segment, package_clips_zip
from app.config import settings

class ClipJobRecord:
    def __init__(self, job_id: str, request: ClipJobCreateRequest, client_ip: str):
        self.job_id = job_id
        self.request = request
        self.client_ip = client_ip
        self.created_at = datetime.now(timezone.utc)
        self.completed_at: Optional[datetime] = None
        self.expires_at: Optional[datetime] = None
        self.stage: str = "queued"
        self.percent: float = 0.0
        self.active_step: str = "Job queued..."
        self.eta: Optional[int] = None
        self.clips: List[ClipMoment] = []
        self.source_video: Optional[str] = None
        self.source_duration: float = 0.0
        self.source_title: str = ""
        self.error: Optional[FriendlyError] = None
        self.cancelled: bool = False
        self.listeners: List[asyncio.Queue] = []
        self.job_dir = os.path.join(settings.TEMP_STORAGE_DIR, f"clip_{job_id}")

    def to_event_data(self) -> ClipJobEventData:
        return ClipJobEventData(
            jobId=self.job_id,
            stage=self.stage,
            percent=self.percent,
            activeStep=self.active_step,
            eta=self.eta,
            clips=self.clips,
            error=self.error
        )

    def emit_update(self):
        event = self.to_event_data()
        for q in list(self.listeners):
            try:
                q.put_nowait(event)
            except Exception:
                pass

class ClipJobManager:
    def __init__(self):
        self.jobs: Dict[str, ClipJobRecord] = {}
        self.active_jobs_per_ip: Dict[str, int] = {}
        self._lock = threading.Lock()

    def create_job(self, request: ClipJobCreateRequest, client_ip: str) -> str:
        job_id = uuid.uuid4().hex
        record = ClipJobRecord(job_id, request, client_ip)
        os.makedirs(record.job_dir, exist_ok=True)

        with self._lock:
            # 1 active job per IP limit rule
            ip_count = self.active_jobs_per_ip.get(client_ip, 0)
            if ip_count >= 1:
                raise ValueError("An active clipping job is already running for this IP. Please wait for it to complete.")

            active_total = sum(1 for j in self.jobs.values() if j.stage not in ("ready", "failed", "cancelled"))
            if active_total >= settings.MAX_CONCURRENT_JOBS:
                raise ValueError("Server capacity is currently full. Please try again in a few moments.")

            self.jobs[job_id] = record
            self.active_jobs_per_ip[client_ip] = ip_count + 1

        asyncio.create_task(self._run_pipeline_async(record))
        return job_id

    def get_job(self, job_id: str) -> Optional[ClipJobRecord]:
        return self.jobs.get(job_id)

    def cancel_job(self, job_id: str) -> bool:
        record = self.jobs.get(job_id)
        if not record:
            return False
        record.cancelled = True
        record.stage = "cancelled"
        record.active_step = "Job cancelled by user."
        record.emit_update()
        self._cleanup_job_files(record)
        return True

    def _cleanup_job_files(self, record: ClipJobRecord):
        try:
            if os.path.exists(record.job_dir):
                shutil.rmtree(record.job_dir, ignore_errors=True)
        except Exception:
            pass
        with self._lock:
            if record.client_ip in self.active_jobs_per_ip:
                self.active_jobs_per_ip[record.client_ip] = max(0, self.active_jobs_per_ip[record.client_ip] - 1)

    async def _run_pipeline_async(self, record: ClipJobRecord):
        loop = asyncio.get_running_loop()
        try:
            await loop.run_in_executor(None, self._execute_pipeline, record)
        except Exception as e:
            record.stage = "failed"
            record.error = FriendlyError(
                code="pipeline-failure",
                title="Auto Clip Pipeline Error",
                explanation=str(e)[:300],
                suggestedAction="Please try again or try another video link."
            )
            record.emit_update()
            self._cleanup_job_files(record)

    def _execute_pipeline(self, record: ClipJobRecord):
        req = record.request

        # 1. Ingestion Stage
        record.stage = "ingest"
        record.percent = 10.0
        record.active_step = "Ingesting video metadata and streams..."
        record.emit_update()

        def ingest_progress(d):
            if record.cancelled:
                raise Exception("Job cancelled by user.")
            if d.get("status") == "downloading":
                total = d.get("total_bytes") or d.get("total_bytes_estimate") or 1
                dl = d.get("downloaded_bytes", 0)
                record.percent = round(10.0 + (dl / total) * 25.0, 1)
                record.emit_update()

        ingest_res, err = ingest_video_and_metadata(
            req.url, record.job_dir, duration_cap=settings.CLIP_DURATION_CAP, progress_cb=ingest_progress
        )
        if err or not ingest_res:
            record.stage = "failed"
            record.error = err or FriendlyError(code="ingest-error", title="Ingest Failed", explanation="Failed to ingest media.", suggestedAction="Try again.")
            record.emit_update()
            self._cleanup_job_files(record)
            return

        record.source_video = ingest_res.video_path
        record.source_duration = ingest_res.duration
        record.source_title = ingest_res.title

        # 2. Transcription Stage
        record.stage = "transcribe"
        record.percent = 40.0
        record.active_step = "Transcribing speech and aligning word timestamps..."
        record.emit_update()

        sentences = get_or_create_transcript(record.job_dir, ingest_res.video_path, ingest_res.caption_path)

        # 3. Multimodal Signals Stage
        record.stage = "signals"
        record.percent = 60.0
        record.active_step = "Analyzing audio loudness, scene changes & retention heatmap..."
        record.emit_update()

        signals = analyze_multimodal_signals(
            ingest_res.video_path,
            ingest_res.duration,
            ingest_res.chapters,
            ingest_res.heatmap
        )

        # 4. LLM / Heuristic Scoring Stage
        record.stage = "scoring"
        record.percent = 80.0
        record.active_step = "Scoring viral hooks and snapping sentence boundaries..."
        record.emit_update()

        # Run async scoring in new event loop if needed
        async def run_scoring():
            return await score_clips_with_llm(
                signals, sentences,
                clip_count=req.clipCount,
                min_dur=req.minLength,
                max_dur=req.maxLength,
                title_prefix=ingest_res.title
            )

        new_loop = asyncio.new_event_loop()
        clips = new_loop.run_until_complete(run_scoring())
        new_loop.close()

        # Propagate user default reframe and caption preset to clips
        for c in clips:
            c.reframeMode = req.reframeMode
            c.captionPreset = req.captionPreset

        record.clips = clips
        record.stage = "ready"
        record.percent = 100.0
        record.active_step = f"Discovered {len(clips)} viral clips ready for review!"
        record.completed_at = datetime.now(timezone.utc)
        record.expires_at = record.completed_at + timedelta(seconds=settings.FILE_TTL_SECONDS)
        record.emit_update()

        # Decrement active IP job counter so user can render or perform other actions
        with self._lock:
            if record.client_ip in self.active_jobs_per_ip:
                self.active_jobs_per_ip[record.client_ip] = max(0, self.active_jobs_per_ip[record.client_ip] - 1)

clip_job_manager = ClipJobManager()

