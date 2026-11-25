import os
from typing import Tuple, Optional, Dict, Any
from .dash_slicer import slice_with_ytdlp_sections
from .range_seeker import slice_with_ffmpeg_range_seek
from .url_refresher import refresh_dash_stream_urls

def slice_winning_moment(
    url: str,
    start_sec: float,
    end_sec: float,
    output_path: str,
    dash_formats: Optional[Dict[str, Any]] = None,
    pad_pre: float = 2.0,
    pad_post: float = 1.0,
    timeout_seconds: int = 60
) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    Zero-Full-Download JIT DASH Slicer.
    Primary: yt-dlp --download-sections with separate DASH format selection.
    Fallback: Automatic 403 Forbidden signed URL refresh + direct FFmpeg range seek.
    Guarantees that 0 MB of outside video is downloaded.
    """
    # 1. Primary backend: yt-dlp section range slicing
    ok, path, err = slice_with_ytdlp_sections(
        url=url,
        start_sec=start_sec,
        end_sec=end_sec,
        output_path=output_path,
        pad_pre=pad_pre,
        pad_post=pad_post,
        timeout_seconds=timeout_seconds
    )
    if ok and path:
        return True, path, None

    # 2. Fallback backend: Refresh signed URLs and perform direct FFmpeg HTTP range seek
    v_url = None
    a_url = None
    headers = None

    if dash_formats:
        v_url = (dash_formats.get("video") or {}).get("url")
        a_url = (dash_formats.get("audio") or {}).get("url")

    # If stream URLs are missing or primary failed with 403/Forbidden, refresh signed tokens
    if not v_url or not a_url or (err and ("403" in err or "Forbidden" in err or "expired" in err)):
        fresh_v, fresh_a, fresh_hdrs = refresh_dash_stream_urls(url)
        if fresh_v and fresh_a:
            v_url, a_url, headers = fresh_v, fresh_a, fresh_hdrs

    if v_url and a_url:
        ok_ff, path_ff, err_ff = slice_with_ffmpeg_range_seek(
            video_url=v_url,
            audio_url=a_url,
            start_sec=start_sec,
            end_sec=end_sec,
            output_path=output_path,
            headers=headers,
            pad_pre=pad_pre,
            pad_post=pad_post,
            timeout_seconds=timeout_seconds
        )
        if ok_ff and path_ff:
            return True, path_ff, None
        return False, None, err_ff or err

    return False, None, err or "Both DASH slice backends failed to extract byte-range"
