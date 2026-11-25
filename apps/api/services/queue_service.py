import asyncio
import os
import time
import uuid
import shutil
import threading
from typing import Dict, Optional, Any, Callable
from datetime import datetime, timezone, timedelta
import yt_dlp
from schemas.jobs import JobCreateRequest, JobEventData
from schemas.inspect import FriendlyError
from services.ytdlp_service import sanitize_filename, map_ytdlp_error, validate_youtube_url
from services.creative_fx_service import apply_post_processing_fx
from app.config import settings

class JobRecord:
    def __init__(self, job_id: str, request: JobCreateRequest, client_ip: str):
        self.job_id = job_id
        self.request = request
        self.client_ip = client_ip
        self.created_at = datetime.now(timezone.utc)
        self.completed_at: Optional[datetime] = None
        self.expires_at: Optional[datetime] = None
        self.state: str = "queued"
        self.percent: float = 0.0
        self.speed: Optional[str] = None
        self.eta: Optional[int] = None
        self.file_path: Optional[str] = None
        self.filename: Optional[str] = None
        self.filesize: Optional[int] = None
        self.error: Optional[FriendlyError] = None
        self.cancelled: bool = False
        self.peaks: Optional[list[float]] = None
        self.listeners: list[asyncio.Queue] = []
        self.job_dir = os.path.join(settings.TEMP_STORAGE_DIR, job_id)

    def to_event_data(self) -> JobEventData:
        expires_str = self.expires_at.isoformat() if self.expires_at else None
        return JobEventData(
            jobId=self.job_id,
            state=self.state,
            percent=self.percent,
            speed=self.speed,
            eta=self.eta,
            filename=self.filename,
            filesize=self.filesize,
            expiresAt=expires_str,
            error=self.error
        )

    def emit_update(self):
        event = self.to_event_data()
        for q in list(self.listeners):
            try:
                q.put_nowait(event)
            except Exception:
                pass


def compute_peaks_from_file(file_path: str, num_peaks: int = 800) -> list[float]:
    import subprocess
    import struct
    import math
    try:
        cmd = [
            "ffmpeg", "-nostdin", "-threads", "1", "-i", file_path,
            "-ac", "1", "-f", "s16le", "-acodec", "pcm_s16le", "-"
        ]
        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
        raw_data, _ = proc.communicate(timeout=15)
        if raw_data:
            count = len(raw_data) // 2
            if count > 0:
                step = max(1, count // num_peaks)
                peaks = []
                max_val = 32768.0
                for i in range(0, min(count, num_peaks * step), step):
                    chunk = raw_data[i * 2 : (i + step) * 2]
                    if not chunk:
                        break
                    samples = struct.unpack(f"<{len(chunk)//2}h", chunk)
                    peak = max(abs(s) for s in samples) / max_val
                    peaks.append(round(min(1.0, max(0.04, peak)), 3))
                while len(peaks) < num_peaks:
                    peaks.append(0.05)
                return peaks[:num_peaks]
    except Exception:
        pass
    import math
    return [round(abs(math.sin(i * 0.08) * 0.7 + 0.15), 3) for i in range(num_peaks)]

class JobManager:
    def __init__(self):
        self.jobs: Dict[str, JobRecord] = {}
        self.active_jobs_per_ip: Dict[str, int] = {}
        self.expired_jobs: set[str] = set()
        self._lock = threading.Lock()

    def is_expired(self, job_id: str) -> bool:
        return job_id in self.expired_jobs

    def create_job(self, request: JobCreateRequest, client_ip: str) -> str:
        job_id = uuid.uuid4().hex
        record = JobRecord(job_id, request, client_ip)
        os.makedirs(record.job_dir, exist_ok=True)

        with self._lock:
            ip_count = self.active_jobs_per_ip.get(client_ip, 0)
            if ip_count >= settings.MAX_JOBS_PER_IP:
                raise ValueError("Too many concurrent jobs for this IP address.")

            active_total = sum(1 for j in self.jobs.values() if j.state in ("queued", "downloading", "merging", "converting"))
            if active_total >= settings.MAX_CONCURRENT_JOBS:
                raise ValueError("Server job capacity is currently full. Please try again shortly.")

            self.jobs[job_id] = record
            self.active_jobs_per_ip[client_ip] = ip_count + 1

        asyncio.create_task(self._run_job_async(record))
        return job_id

    def get_job(self, job_id: str) -> Optional[JobRecord]:
        return self.jobs.get(job_id)

    def cancel_job(self, job_id: str) -> bool:
        record = self.jobs.get(job_id)
        if not record:
            return False
        record.cancelled = True
        record.state = "cancelled"
        record.emit_update()
        self._cleanup_job_files(record)
        return True

    def _cleanup_job_files(self, record: JobRecord):
        try:
            if os.path.exists(record.job_dir):
                shutil.rmtree(record.job_dir, ignore_errors=True)
        except Exception:
            pass
        with self._lock:
            if record.client_ip in self.active_jobs_per_ip:
                self.active_jobs_per_ip[record.client_ip] = max(0, self.active_jobs_per_ip[record.client_ip] - 1)

    async def _run_job_async(self, record: JobRecord):
        loop = asyncio.get_running_loop()
        try:
            # Enforce hard execution timeout preventing hanging worker threads
            max_timeout = settings.MAX_DURATION_SECONDS + 300
            await asyncio.wait_for(
                loop.run_in_executor(None, self._execute_download, record),
                timeout=max_timeout
            )
        except asyncio.TimeoutError:
            record.state = "failed"
            record.error = FriendlyError(
                code="timeout",
                title="Processing Timeout",
                explanation="Job exceeded the maximum processing time limit.",
                suggestedAction="Try downloading a shorter segment or selecting audio only."
            )
            record.emit_update()
            self._cleanup_job_files(record)
        except Exception as e:
            record.state = "failed"
            record.error = map_ytdlp_error(str(e))
            record.emit_update()
            self._cleanup_job_files(record)

    def _execute_download(self, record: JobRecord):
        req = record.request
        is_valid, canonical_url, err = validate_youtube_url(req.url)
        if not is_valid or not canonical_url:
            record.state = "failed"
            record.error = err
            record.emit_update()
            return

        record.state = "downloading"
        record.percent = 1.0
        record.emit_update()

        outtmpl = os.path.join(record.job_dir, "%(title).100s.%(ext)s")

        ydl_opts: Dict[str, Any] = {
            "outtmpl": outtmpl,
            "noplaylist": True,
            "restrictfilenames": True,
            "quiet": True,
            "no_warnings": True,
            "socket_timeout": 20,
            "max_filesize": settings.MAX_FILE_SIZE_BYTES,
        }

        if settings.YOUTUBE_PROXY:
            ydl_opts["proxy"] = settings.YOUTUBE_PROXY
        if settings.YOUTUBE_COOKIES_FILE:
            ydl_opts["cookiefile"] = settings.YOUTUBE_COOKIES_FILE

        def progress_hook(d: Dict[str, Any]):
            if record.cancelled:
                raise Exception("Download cancelled by user.")

            status = d.get("status")
            if status == "downloading":
                total = d.get("total_bytes") or d.get("total_bytes_estimate") or 0
                downloaded = d.get("downloaded_bytes", 0)
                if total > 0:
                    record.percent = round(min(98.0, (downloaded / total) * 95.0), 1)
                
                speed_bytes = d.get("speed")
                if speed_bytes:
                    if speed_bytes > 1024 * 1024:
                        record.speed = f"{speed_bytes / (1024*1024):.1f} MB/s"
                    else:
                        record.speed = f"{speed_bytes / 1024:.0f} KB/s"
                
                record.eta = d.get("eta")
                record.emit_update()
            elif status == "finished":
                record.state = "merging"
                record.percent = 96.0
                record.speed = None
                record.eta = None
                record.emit_update()

        ydl_opts["progress_hooks"] = [progress_hook]

        postprocessor_args: list[str] = []

        # 1. Frame-accurate Segment Trimming, Section Removing & Splitting
        if req.trim and req.trim.enabled:
            def parse_sec(t_str: Optional[str]) -> Optional[float]:
                if not t_str:
                    return None
                try:
                    parts = t_str.strip().split(":")
                    if len(parts) == 3:
                        return float(parts[0]) * 3600 + float(parts[1]) * 60 + float(parts[2])
                    elif len(parts) == 2:
                        return float(parts[0]) * 60 + float(parts[1])
                    return float(t_str)
                except Exception:
                    return None

            s_sec = parse_sec(req.trim.startTime) or 0.0
            e_sec = parse_sec(req.trim.endTime)
            op = getattr(req.trim, 'operation', 'trim') or 'trim'

            if op == "remove" and e_sec is not None and e_sec > s_sec:
                try:
                    ydl_opts["download_ranges"] = yt_dlp.utils.download_range_func(None, [(0, s_sec), (e_sec, 999999)])
                    ydl_opts["force_keyframes_at_cuts"] = True
                except Exception:
                    pass
            elif e_sec is not None and e_sec > s_sec:
                try:
                    ydl_opts["download_ranges"] = yt_dlp.utils.download_range_func(None, [(s_sec, e_sec)])
                    ydl_opts["force_keyframes_at_cuts"] = True
                except Exception:
                    if req.trim.startTime:
                        postprocessor_args.extend(["-ss", str(req.trim.startTime)])
                    if req.trim.endTime:
                        postprocessor_args.extend(["-to", str(req.trim.endTime)])
            else:
                if req.trim.startTime:
                    postprocessor_args.extend(["-ss", str(req.trim.startTime)])
                if req.trim.endTime:
                    postprocessor_args.extend(["-to", str(req.trim.endTime)])

        # 2. Audio Loudness Normalization (EBU R128)
        if req.mastering and req.mastering.normalizeLoudness and req.mode == "audio":
            postprocessor_args.extend(["-af", "loudnorm=I=-14:LRA=11:TP=-1.5"])

        # 3. Custom Metadata Tags
        if req.mastering and req.mode == "audio":
            if req.mastering.artist:
                postprocessor_args.extend(["-metadata", f"artist={req.mastering.artist}"])
            if req.mastering.album:
                postprocessor_args.extend(["-metadata", f"album={req.mastering.album}"])
            if req.mastering.genre:
                postprocessor_args.extend(["-metadata", f"genre={req.mastering.genre}"])

        if postprocessor_args:
            ydl_opts["postprocessor_args"] = {"ffmpeg": postprocessor_args}

        postprocessors = []

        if req.mode == "video":
            h = req.height or 1080
            container = req.container or "mp4"
            ydl_opts["format"] = f"bv*[height<={h}]+ba/b[height<={h}]"
            ydl_opts["merge_output_format"] = container
            if req.embedMetadata:
                postprocessors.append({"key": "FFmpegMetadata"})
            if req.thumbnail:
                ydl_opts["writethumbnail"] = True
                postprocessors.append({"key": "EmbedThumbnail"})

        elif req.mode == "video_only":
            h = req.height or 1080
            container = req.container or "mp4"
            ydl_opts["format"] = f"bv*[height<={h}]"
            ydl_opts["merge_output_format"] = container

        elif req.mode == "audio":
            ydl_opts["format"] = "ba/b"
            audio_format = req.audioFormat or "mp3"
            
            if audio_format in ("m4a", "opus") and not (req.mastering and req.mastering.normalizeLoudness):
                postprocessors.append({
                    "key": "FFmpegExtractAudio",
                    "preferredcodec": audio_format,
                    "nopostoverwrites": False
                })
            else:
                quality = str(req.audioBitrate or 320) if audio_format == "mp3" else "0"
                postprocessors.append({
                    "key": "FFmpegExtractAudio",
                    "preferredcodec": audio_format,
                    "preferredquality": quality
                })

            if req.embedMetadata:
                postprocessors.append({"key": "FFmpegMetadata"})
            if req.thumbnail and audio_format in ("mp3", "m4a", "flac"):
                ydl_opts["writethumbnail"] = True
                postprocessors.append({"key": "EmbedThumbnail"})

        if req.subtitles and req.subtitles.langs:
            ydl_opts["writesubtitles"] = True
            ydl_opts["subtitleslangs"] = req.subtitles.langs
            ydl_opts["subtitlesformat"] = req.subtitles.format

        if postprocessors:
            ydl_opts["postprocessors"] = postprocessors

        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(canonical_url, download=True)
                if not info:
                    raise Exception("Unable to extract video streams.")

                files = [
                    f for f in os.listdir(record.job_dir)
                    if os.path.isfile(os.path.join(record.job_dir, f)) and not f.endswith((".part", ".ytdl", ".temp"))
                ]
                if not files:
                    raise Exception("Processed file could not be generated.")

                chosen_file = max(files, key=lambda f: os.path.getsize(os.path.join(record.job_dir, f)))
                file_path = os.path.join(record.job_dir, chosen_file)

                ext = chosen_file.split(".")[-1]
                custom_name = sanitize_filename(req.filename) if req.filename else sanitize_filename(info.get("title", "clipglass"))
                final_name = f"{custom_name}.{ext}"

                final_path = os.path.join(record.job_dir, final_name)
                if file_path != final_path:
                    if os.path.exists(final_path):
                        os.remove(final_path)
                    os.rename(file_path, final_path)
                    file_path = final_path

                # Apply Creative Video FX (Film Filters, Split-Screen Retention, Hooks, 9:16 Shorts Framing)
                if req.fx and (req.fx.filterStyle != 'none' or req.fx.splitScreen != 'none' or req.fx.hookIntro != 'none' or req.fx.aspectRatio != 'original'):
                    record.state = "merging"
                    record.percent = 97.0
                    record.emit_update()

                    fx_dir = os.path.dirname(file_path)
                    fx_name = f"fx_{os.path.basename(file_path)}"
                    fx_path = os.path.join(fx_dir, fx_name)
                    success = apply_post_processing_fx(file_path, fx_path, req.fx)
                    if success and os.path.exists(fx_path) and os.path.getsize(fx_path) > 1000:
                        try:
                            os.remove(file_path)
                        except Exception:
                            pass
                        os.rename(fx_path, file_path)

                record.file_path = file_path
                record.filename = final_name
                record.filesize = os.path.getsize(file_path)
                record.state = "ready"
                record.percent = 100.0
                record.completed_at = datetime.now(timezone.utc)
                record.expires_at = record.completed_at + timedelta(seconds=settings.FILE_TTL_SECONDS)
                if record.file_path:
                    try:
                        record.peaks = compute_peaks_from_file(record.file_path, 800)
                    except Exception:
                        pass
                record.emit_update()

        except Exception as e:
            if record.cancelled:
                record.state = "cancelled"
            else:
                record.state = "failed"
                record.error = map_ytdlp_error(str(e))
            record.emit_update()
            self._cleanup_job_files(record)

job_manager = JobManager()
