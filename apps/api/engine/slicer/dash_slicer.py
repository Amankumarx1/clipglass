import os
import subprocess
import shutil
from typing import Tuple, Optional
from app.config import settings

def slice_with_ytdlp_sections(
    url: str,
    start_sec: float,
    end_sec: float,
    output_path: str,
    pad_pre: float = 2.0,
    pad_post: float = 1.0,
    timeout_seconds: int = 60
) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    Primary JIT byte-range DASH slicer using yt-dlp --download-sections.
    Downloads ONLY [pad_start, pad_end] directly from YouTube DASH streams.
    Never downloads the full video.
    """
    pad_start = max(0.0, start_sec - pad_pre)
    pad_end = end_sec + pad_post

    # Format section string for yt-dlp: *START-END (in seconds or HH:MM:SS)
    section_arg = f"*{pad_start:.2f}-{pad_end:.2f}"

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    if os.path.exists(output_path):
        try:
            os.remove(output_path)
        except Exception:
            pass

    cmd = [
        "yt-dlp",
        "--download-sections", section_arg,
        "-f", "bestvideo[height<=1080][vcodec^=avc1]+bestaudio[ext=m4a]/bestvideo[height<=1080]+bestaudio/best",
        "--force-keyframes-at-cuts",
        "--no-playlist",
        "--quiet",
        "--no-warnings",
        "--socket-timeout", "20",
        "-o", output_path,
        url
    ]

    if settings.YOUTUBE_PROXY:
        cmd.extend(["--proxy", settings.YOUTUBE_PROXY])
    if settings.YOUTUBE_COOKIES_FILE:
        cmd.extend(["--cookies", settings.YOUTUBE_COOKIES_FILE])

    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout_seconds)
        if os.path.exists(output_path) and os.path.getsize(output_path) > 1000:
            return True, output_path, None

        err = proc.stderr or proc.stdout or "yt-dlp section download returned no file"
        return False, None, err
    except subprocess.TimeoutExpired:
        return False, None, f"yt-dlp section slice timed out after {timeout_seconds}s"
    except Exception as e:
        return False, None, str(e)
