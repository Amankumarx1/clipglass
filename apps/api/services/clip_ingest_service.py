import os
import re
from typing import Dict, Any, List, Optional, Tuple
import yt_dlp
from schemas.inspect import FriendlyError
from services.ytdlp_service import validate_youtube_url, sanitize_filename
from app.config import settings

class IngestResult:
    def __init__(
        self,
        video_path: str,
        duration: float,
        title: str,
        channel: str,
        chapters: List[Dict[str, Any]],
        heatmap: List[Dict[str, Any]],
        caption_path: Optional[str] = None
    ):
        self.video_path = video_path
        self.duration = duration
        self.title = title
        self.channel = channel
        self.chapters = chapters
        self.heatmap = heatmap
        self.caption_path = caption_path

def ingest_video_and_metadata(
    url: str,
    job_dir: str,
    duration_cap: int = 3600,
    progress_cb: Optional[Any] = None
) -> Tuple[Optional[IngestResult], Optional[FriendlyError]]:
    """
    Ingests video metadata and streams up to 1080p H.264 + audio,
    extracting chapters, heatmap, and YouTube captions.
    """
    # 1. SSRF and Domain Validation
    is_valid, canonical_url, err = validate_youtube_url(url)
    if not is_valid or not canonical_url:
        return None, err or FriendlyError(
            code="invalid-url",
            title="Invalid URL",
            explanation="The provided URL is not a recognized or safe YouTube video link.",
            suggestedAction="Paste a standard youtube.com/watch?v= or youtu.be/ link."
        )

    os.makedirs(job_dir, exist_ok=True)

    base_opts: Dict[str, Any] = {
        "noplaylist": True,
        "quiet": True,
        "no_warnings": True,
        "socket_timeout": 20,
    }
    if settings.YOUTUBE_PROXY:
        base_opts["proxy"] = settings.YOUTUBE_PROXY
    if settings.YOUTUBE_COOKIES_FILE:
        base_opts["cookiefile"] = settings.YOUTUBE_COOKIES_FILE

    # 2. Extract Metadata First (Check duration cap before downloading)
    try:
        with yt_dlp.YoutubeDL(base_opts) as ydl:
            meta = ydl.extract_info(canonical_url, download=False)
            if not meta:
                return None, FriendlyError(
                    code="metadata-failed",
                    title="Metadata Fetch Failed",
                    explanation="Unable to retrieve video information from YouTube.",
                    suggestedAction="Check if the video is private or region-restricted."
                )

            duration = float(meta.get("duration") or 0)
            if duration <= 0:
                return None, FriendlyError(
                    code="live-stream-unsupported",
                    title="Live Streams Unsupported",
                    explanation="Auto Clip requires fixed-length recorded videos, not live streams.",
                    suggestedAction="Provide a finished recording or VOD."
                )

            if duration > duration_cap:
                max_mins = duration_cap // 60
                return None, FriendlyError(
                    code="duration-exceeded",
                    title="Video Exceeds Duration Limit",
                    explanation=f"This video is {duration/60:.1f} minutes long. Auto Clip supports up to {max_mins} minutes.",
                    suggestedAction=f"Choose a video under {max_mins} minutes or trim the segment first."
                )

            chapters = meta.get("chapters") or []
            heatmap = meta.get("heatmap") or []
            title = sanitize_filename(meta.get("title") or "clipglass_source")
            channel = meta.get("uploader") or meta.get("channel") or "YouTube Creator"
    except Exception as e:
        return None, FriendlyError(
            code="inspect-error",
            title="Inspection Error",
            explanation=str(e)[:200],
            suggestedAction="Please verify the video URL and try again."
        )

    # 3. Download Source Video + Audio + Captions
    video_out = os.path.join(job_dir, "source.mp4")
    outtmpl = os.path.join(job_dir, "source.%(ext)s")

    download_opts = dict(base_opts)
    download_opts.update({
        "outtmpl": outtmpl,
        "format": "bv*[height<=1080][ext=mp4]+ba[ext=m4a]/b[height<=1080][ext=mp4]/best[height<=1080]",
        "merge_output_format": "mp4",
        "writesubtitles": True,
        "writeautomaticsub": True,
        "subtitleslangs": ["en.*", "en"],
        "subtitlesformat": "json3/vtt/srt",
    })

    if progress_cb:
        download_opts["progress_hooks"] = [progress_cb]

    try:
        with yt_dlp.YoutubeDL(download_opts) as ydl:
            ydl.download([canonical_url])

        # Verify source video exists
        if not os.path.exists(video_out):
            # Check if any .mp4 exists in job_dir
            mp4_files = [f for f in os.listdir(job_dir) if f.endswith(".mp4")]
            if mp4_files:
                video_out = os.path.join(job_dir, mp4_files[0])
            else:
                return None, FriendlyError(
                    code="download-failed",
                    title="Source Download Failed",
                    explanation="Could not download video and audio streams for clipping.",
                    suggestedAction="Try another YouTube URL."
                )

        # Detect caption file if downloaded
        caption_path = None
        for f in os.listdir(job_dir):
            if f.startswith("source") and f.endswith((".json3", ".vtt", ".srt")):
                caption_path = os.path.join(job_dir, f)
                break

        return IngestResult(
            video_path=video_out,
            duration=duration,
            title=title,
            channel=channel,
            chapters=chapters,
            heatmap=heatmap,
            caption_path=caption_path
        ), None

    except Exception as e:
        return None, FriendlyError(
            code="download-error",
            title="Download Processing Error",
            explanation=str(e)[:250],
            suggestedAction="Please retry shortly."
        )
