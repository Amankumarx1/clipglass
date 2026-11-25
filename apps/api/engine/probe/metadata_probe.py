from dataclasses import dataclass, field
from typing import Dict, Any, List, Optional, Tuple
import yt_dlp
from app.config import settings
from schemas.inspect import FriendlyError
from schemas.clip import TranscriptSentence, TranscriptWord
from services.ytdlp_service import validate_youtube_url
from .heatmap_extractor import extract_normalized_heatmap
from .storyboard_diff import extract_storyboard_cuts
from .transcript_extractor import extract_fastpath_transcript

@dataclass
class ProbeResult:
    url: str
    title: str
    channel: str
    duration: int
    chapters: List[Dict[str, Any]] = field(default_factory=list)
    heatmap: List[float] = field(default_factory=list)
    storyboard_cuts: List[float] = field(default_factory=list)
    sentences: List[TranscriptSentence] = field(default_factory=list)
    words: List[TranscriptWord] = field(default_factory=list)
    noise_events: List[Dict[str, Any]] = field(default_factory=list)
    dash_formats: Dict[str, Any] = field(default_factory=dict)
    has_captions: bool = False
    raw_meta: Dict[str, Any] = field(default_factory=dict)

def probe_youtube_video(
    url: str,
    duration_cap_seconds: int = 3600,
    preferred_language: str = "en",
    temp_dir: Optional[str] = None
) -> Tuple[Optional[ProbeResult], Optional[FriendlyError]]:
    """
    Stage 1 Zero-Full-Download Metadata & Signal Probe.
    Downloads 0 MB video. Extracts all essential metadata, timeline signals,
    subtitles, and DASH format mappings.
    """
    is_valid, canonical_url, err = validate_youtube_url(url)
    if not is_valid or not canonical_url:
        return None, err or FriendlyError(
            code="invalid-url",
            title="Invalid YouTube URL",
            explanation="The provided URL is not a recognized or safe YouTube link.",
            suggestedAction="Paste a standard youtube.com/watch?v= or youtu.be/ link."
        )

    ydl_opts: Dict[str, Any] = {
        "noplaylist": True,
        "quiet": True,
        "no_warnings": True,
        "socket_timeout": 20,
        "skip_download": True,
        "extract_flat": False,
    }
    if settings.YOUTUBE_PROXY:
        ydl_opts["proxy"] = settings.YOUTUBE_PROXY
    if settings.YOUTUBE_COOKIES_FILE:
        ydl_opts["cookiefile"] = settings.YOUTUBE_COOKIES_FILE

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            meta = ydl.extract_info(canonical_url, download=False)
            if not meta:
                return None, FriendlyError(
                    code="probe-failed",
                    title="Inspection Failed",
                    explanation="Unable to retrieve video information from YouTube.",
                    suggestedAction="Check if the video is private, unlisted, or region-locked."
                )

            duration = int(float(meta.get("duration") or 0))
            if duration <= 0:
                # Live stream or unknown duration
                duration = min(duration_cap_seconds, 900)

            # Enforce hard duration cap
            effective_duration = min(duration, duration_cap_seconds)

            title = meta.get("title") or "YouTube Video"
            channel = meta.get("channel") or meta.get("uploader") or "Unknown Creator"
            chapters = meta.get("chapters") or []

            # 1. Heatmap Curve (0 MB download)
            heatmap = extract_normalized_heatmap(meta, effective_duration)

            # 2. Storyboard Cuts (Sprite sheet diff, kilobyte-level)
            storyboard_cuts = extract_storyboard_cuts(meta, effective_duration, temp_dir=temp_dir)

            # 3. Fast-Path Transcript (uploader json3/vtt, 0 MB media)
            sentences, words, noise_events = extract_fastpath_transcript(meta, preferred_language=preferred_language)
            has_captions = len(words) > 0

            # 4. DASH stream format selection
            formats = meta.get("formats") or []
            video_dash = None
            audio_dash = None
            worst_audio = None

            for f in formats:
                vcodec = f.get("vcodec") or "none"
                acodec = f.get("acodec") or "none"
                ext = f.get("ext") or ""
                height = f.get("height") or 0

                # Separate DASH video (prefer AVC1/H.264 up to 1080p)
                if vcodec != "none" and acodec == "none":
                    if vcodec.startswith("avc1") and height <= 1080:
                        if not video_dash or height > (video_dash.get("height") or 0):
                            video_dash = f
                    elif not video_dash and height <= 1080:
                        video_dash = f

                # Separate DASH audio (prefer M4A/AAC)
                if acodec != "none" and vcodec == "none":
                    if ext == "m4a":
                        if not audio_dash or (f.get("abr") or 0) > (audio_dash.get("abr") or 0):
                            audio_dash = f
                        if not worst_audio or (f.get("abr") or 999) < (worst_audio.get("abr") or 999):
                            worst_audio = f
                    elif not audio_dash:
                        audio_dash = f

            dash_map = {
                "video": video_dash,
                "audio": audio_dash,
                "worst_audio": worst_audio or audio_dash
            }

            return ProbeResult(
                url=canonical_url,
                title=title,
                channel=channel,
                duration=effective_duration,
                chapters=chapters,
                heatmap=heatmap,
                storyboard_cuts=storyboard_cuts,
                sentences=sentences,
                words=words,
                noise_events=noise_events,
                dash_formats=dash_map,
                has_captions=has_captions,
                raw_meta=meta
            ), None

    except Exception as e:
        return None, FriendlyError(
            code="probe-error",
            title="Probe Error",
            explanation=f"Error analyzing YouTube stream: {str(e)}",
            suggestedAction="Please verify the video URL and your internet connection."
        )
