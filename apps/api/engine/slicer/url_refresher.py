import time
from typing import Dict, Any, Optional, Tuple
import yt_dlp
from app.config import settings

def refresh_dash_stream_urls(url: str) -> Tuple[Optional[str], Optional[str], Optional[Dict[str, str]]]:
    """
    Extracts fresh, signed YouTube DASH video and audio stream URLs directly
    via yt-dlp metadata extraction to recover from HTTP 403 Forbidden or expired tokens.
    """
    ydl_opts: Dict[str, Any] = {
        "noplaylist": True,
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
        "socket_timeout": 15
    }
    if settings.YOUTUBE_PROXY:
        ydl_opts["proxy"] = settings.YOUTUBE_PROXY
    if settings.YOUTUBE_COOKIES_FILE:
        ydl_opts["cookiefile"] = settings.YOUTUBE_COOKIES_FILE

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            meta = ydl.extract_info(url, download=False)
            if not meta:
                return None, None, None

            formats = meta.get("formats") or []
            v_url = None
            a_url = None
            headers = meta.get("http_headers") or {}

            # Find best DASH video <= 1080p
            for f in formats:
                vcodec = f.get("vcodec") or "none"
                acodec = f.get("acodec") or "none"
                height = f.get("height") or 0
                if vcodec != "none" and acodec == "none":
                    if vcodec.startswith("avc1") and height <= 1080:
                        v_url = f.get("url")
                        break
                    elif not v_url and height <= 1080:
                        v_url = f.get("url")

            # Find best DASH audio
            for f in formats:
                vcodec = f.get("vcodec") or "none"
                acodec = f.get("acodec") or "none"
                if acodec != "none" and vcodec == "none":
                    if f.get("ext") == "m4a":
                        a_url = f.get("url")
                        break
                    elif not a_url:
                        a_url = f.get("url")

            return v_url, a_url, headers
    except Exception:
        return None, None, None
