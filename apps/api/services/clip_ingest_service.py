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
        caption_path: Optional[str] = None,
        comments: Optional[List[Dict[str, Any]]] = None,
        live_chat_path: Optional[str] = None,
        is_live: bool = False,
        num_parts: int = 1,
        parts_info: Optional[List[Dict[str, Any]]] = None
    ):
        self.video_path = video_path
        self.duration = duration
        self.title = title
        self.channel = channel
        self.chapters = chapters
        self.heatmap = heatmap
        self.caption_path = caption_path
        self.comments = comments or []
        self.live_chat_path = live_chat_path
        self.is_live = is_live
        self.num_parts = num_parts
        self.parts_info = parts_info or []

def ingest_video_and_metadata(
    url: str,
    job_dir: str,
    duration_cap: int = 3600,
    progress_cb: Optional[Any] = None
) -> Tuple[Optional[IngestResult], Optional[FriendlyError]]:
    """
    Ingests video metadata and streams up to 1080p H.264 + audio,
    extracting chapters, heatmap, comments, and YouTube captions.
    Supports standard videos, finished VODs, and live streams with DVR / chat replay.
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
        "getcomments": True,
        "extractor_args": {"youtube": {"max_comments": ["250", "all", "100", "0"]}},
    }
    if settings.YOUTUBE_PROXY:
        base_opts["proxy"] = settings.YOUTUBE_PROXY
    if settings.YOUTUBE_COOKIES_FILE:
        base_opts["cookiefile"] = settings.YOUTUBE_COOKIES_FILE

    # 2. Extract Metadata First (Check duration cap before downloading)
    comments = []
    is_live = False
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
            is_live = bool(meta.get("is_live") or meta.get("live_status") == "is_live")
            was_live = bool(meta.get("was_live") or meta.get("live_status") == "was_live")

            # Support active live streams and finished live stream VODs:
            if duration <= 0:
                if is_live or was_live or "/live/" in canonical_url:
                    is_live = True
                    # Derive duration from DVR playlist window in formats, or default to 900s (15 min) or duration_cap
                    derived_dur = 900.0
                    formats = meta.get("formats") or []
                    for f in formats:
                        manifest_url = f.get("manifest_url") or f.get("url") or ""
                        dur_match = re.search(r'(?:playlist|manifest)_duration/(\d+)', manifest_url)
                        if dur_match:
                            try:
                                derived_dur = float(dur_match.group(1))
                                break
                            except Exception:
                                pass
                    duration = min(float(duration_cap), derived_dur)
                else:
                    return None, FriendlyError(
                        code="live-stream-unsupported",
                        title="Media Duration Unavailable",
                        explanation="Unable to determine video length. If this is an active broadcast, please ensure DVR playback is enabled.",
                        suggestedAction="Provide a finished recording, VOD, or active DVR live stream."
                    )

            import math
            CHUNK_DURATION_CAP = 14400  # 240 minutes in seconds
            num_parts = max(1, math.ceil(duration / CHUNK_DURATION_CAP))
            parts_info = []
            for p in range(num_parts):
                p_start = p * CHUNK_DURATION_CAP
                p_end = min((p + 1) * CHUNK_DURATION_CAP, duration)
                parts_info.append({
                    "part": p + 1,
                    "startTime": p_start,
                    "endTime": p_end,
                    "duration": p_end - p_start
                })

            chapters = meta.get("chapters") or []
            heatmap = meta.get("heatmap") or []
            raw_comments = meta.get("comments") or []
            if raw_comments:
                comments = list(raw_comments)
            title = sanitize_filename(meta.get("title") or "clipglass_source")
            channel = meta.get("uploader") or meta.get("channel") or "YouTube Creator"
    except Exception as e:
        return None, FriendlyError(
            code="inspect-error",
            title="Inspection Error",
            explanation=str(e)[:200],
            suggestedAction="Please verify the video URL and try again."
        )

    # 3. Zero-Download Fast Ingestion: Fetch subtitles/captions and live chat only (no full video download)
    # The full video is NEVER downloaded to save disk and memory; clips are cut on-demand during render.
    outtmpl = os.path.join(job_dir, "source.%(ext)s")
    sub_opts = dict(base_opts)
    sub_opts.update({
        "outtmpl": outtmpl,
        "skip_download": True,
        "writesubtitles": True,
        "writeautomaticsub": True,
        "subtitleslangs": ["live_chat", "en", "en-US", "hi", "en-IN"],
        "subtitlesformat": "json3/vtt/srt/live_chat",
    })
    try:
        with yt_dlp.YoutubeDL(sub_opts) as ydl:
            ydl.download([canonical_url])
    except Exception:
        # Non-fatal subtitle notice; pipeline gracefully falls back
        pass

    # Detect caption file if downloaded (prefer json3, then vtt, then srt)
    caption_path = None
    candidates = [f for f in os.listdir(job_dir) if f.startswith("source") and f.endswith((".json3", ".vtt", ".srt"))]
    candidates.sort(key=lambda x: (0 if x.endswith(".json3") else 1 if x.endswith(".vtt") else 2))
    if candidates:
        caption_path = os.path.join(job_dir, candidates[0])
    else:
        # If no native YouTube captions exist, fetch a lightweight low-bitrate audio-only stream for Whisper (~2MB)
        audio_outtmpl = os.path.join(job_dir, "source_audio.%(ext)s")
        audio_opts = dict(base_opts)
        audio_opts.update({
            "outtmpl": audio_outtmpl,
            "format": "ba[abr<=48]/ba/worstaudio",
            "writesubtitles": False,
            "writeautomaticsub": False,
        })
        try:
            with yt_dlp.YoutubeDL(audio_opts) as ydl:
                ydl.download([canonical_url])
        except Exception:
            pass

    # Detect live chat replay file if present (prefer completed .json over .part)
    live_chat_path = None
    chat_files = [os.path.join(job_dir, f) for f in os.listdir(job_dir) if "live_chat" in f]
    if chat_files:
        chat_files.sort(key=lambda x: (1 if x.endswith(".part") else 0))
        live_chat_path = chat_files[0]

    return IngestResult(
        video_path=canonical_url,
        duration=duration,
        title=title,
        channel=channel,
        chapters=chapters,
        heatmap=heatmap,
        caption_path=caption_path,
        comments=comments,
        live_chat_path=live_chat_path,
        is_live=is_live,
        num_parts=num_parts,
        parts_info=parts_info
    ), None

