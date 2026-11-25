import re
import urllib.parse
import socket
import ipaddress
from typing import Dict, Any, List, Optional, Tuple
import yt_dlp
from schemas.inspect import InspectResponse, VideoStreamHeight, AudioStreamInfo, SubtitleInfo, ChapterInfo, FriendlyError
from app.config import settings

ALLOWED_HOSTS = {
    "youtube.com",
    "www.youtube.com",
    "m.youtube.com",
    "music.youtube.com",
    "youtu.be"
}

def is_private_or_restricted_ip(ip_str: str) -> bool:
    """Check if an IP address belongs to loopback, private, link-local, multicast, or cloud metadata."""
    try:
        ip = ipaddress.ip_address(ip_str)
        if ip_str == "169.254.169.254":
            return True
        return (
            ip.is_private or
            ip.is_loopback or
            ip.is_link_local or
            ip.is_multicast or
            ip.is_reserved or
            ip.is_unspecified
        )
    except ValueError:
        return True

STANDARD_HEIGHTS = [2160, 1440, 1080, 720, 480, 360, 240, 144]

FRIENDLY_ERRORS: Dict[str, Dict[str, str]] = {
    "invalid-url": {
        "title": "Invalid YouTube URL",
        "explanation": "The link provided is not a supported YouTube or YouTube Music URL.",
        "suggestedAction": "Check the link format and paste a standard YouTube video, Shorts, or Music link."
    },
    "private": {
        "title": "Private Video",
        "explanation": "This video is marked private by the owner and cannot be accessed.",
        "suggestedAction": "Ensure the video permissions are set to public or unlisted."
    },
    "members-only": {
        "title": "Members-Only Content",
        "explanation": "This video is restricted to paid channel members.",
        "suggestedAction": "Only publicly accessible videos can be processed."
    },
    "age-restricted": {
        "title": "Age-Restricted Content",
        "explanation": "This video requires YouTube account verification due to age gating.",
        "suggestedAction": "Try an un-gated public video or use an unrestricted link."
    },
    "region-blocked": {
        "title": "Region-Restricted Video",
        "explanation": "The uploader has restricted viewing in our server's geographical region.",
        "suggestedAction": "Check if an alternative upload or mirror is available."
    },
    "removed": {
        "title": "Video Unavailable",
        "explanation": "This video has been deleted, taken down, or made unavailable.",
        "suggestedAction": "Please verify that the video still exists on YouTube."
    },
    "live-or-premiere": {
        "title": "Live Stream / Premiere",
        "explanation": "Active live streams and scheduled upcoming premieres cannot be processed.",
        "suggestedAction": "Wait until the live broadcast concludes and the VOD archive is published."
    },
    "too-long": {
        "title": "Duration Limit Exceeded",
        "explanation": f"Video exceeds the maximum supported duration of {settings.MAX_DURATION_SECONDS // 3600} hours.",
        "suggestedAction": "Please choose a video under 3 hours in length."
    },
    "too-large": {
        "title": "File Size Limit Exceeded",
        "explanation": "The estimated file size exceeds our 2 GB single-job processing limit.",
        "suggestedAction": "Try selecting a lower resolution (e.g. 1080p or 720p) or audio-only."
    },
    "rate-limited": {
        "title": "Temporarily Rate-Limited",
        "explanation": "YouTube is temporarily throttling requests from our worker nodes.",
        "suggestedAction": "Please wait 60 seconds and try again."
    },
    "upstream-changed": {
        "title": "Extractor Upstream Notice",
        "explanation": "YouTube recently altered internal player parameters, affecting this stream.",
        "suggestedAction": "Try again shortly. Our automated yt-dlp updater runs continuously."
    }
}

WINDOWS_RESERVED_NAMES = {
    "CON", "PRN", "AUX", "NUL",
    "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9",
    "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9"
}

def sanitize_filename(name: str, max_length: int = 120) -> str:
    """Bulletproof filename sanitization against path traversal, control chars, and OS reserved names."""
    if not name or not isinstance(name, str):
        return "clipglass_media"

    # 1. Replace null bytes, control chars, path separators, and illegal chars with space
    clean = re.sub(r'[\x00-\x1f\x7f]', ' ', name)
    clean = re.sub(r'[\\/*?:"<>|]', ' ', clean)

    # 2. Collapse multiple whitespace and underscores into single space
    clean = re.sub(r'[\s_]+', ' ', clean).strip(' .')

    # 3. Check for Windows reserved device names
    base_name = clean.split('.')[0].upper()
    if base_name in WINDOWS_RESERVED_NAMES or not clean:
        clean = f"clipglass_{clean}" if clean else "clipglass_media"

    return clean[:max_length].strip(' .') or "clipglass_media"

def validate_youtube_url(url: str) -> Tuple[bool, Optional[str], Optional[FriendlyError]]:
    """Strict URL validation preventing SSRF, userinfo spoofing, open redirects, and internal network scans."""
    if not url or not isinstance(url, str):
        return False, None, FriendlyError(code="invalid-url", **FRIENDLY_ERRORS["invalid-url"])

    trimmed = url.strip()
    if len(trimmed) > 2048:
        return False, None, FriendlyError(code="invalid-url", **FRIENDLY_ERRORS["invalid-url"])

    if not trimmed.startswith(("http://", "https://")):
        trimmed = "https://" + trimmed

    try:
        parsed = urllib.parse.urlparse(trimmed)
    except Exception:
        return False, None, FriendlyError(code="invalid-url", **FRIENDLY_ERRORS["invalid-url"])

    # Strict scheme check
    if parsed.scheme not in ("http", "https"):
        return False, None, FriendlyError(code="invalid-url", **FRIENDLY_ERRORS["invalid-url"])

    # Prevent userinfo spoofing (e.g. https://youtube.com@evil.com or https://youtube.com:80@attacker.com)
    if "@" in parsed.netloc or parsed.username or parsed.password:
        return False, None, FriendlyError(code="invalid-url", **FRIENDLY_ERRORS["invalid-url"])

    hostname = (parsed.hostname or "").lower()
    if hostname not in ALLOWED_HOSTS:
        return False, None, FriendlyError(code="invalid-url", **FRIENDLY_ERRORS["invalid-url"])

    # Strict port check: only ports 80 and 443 permitted
    if parsed.port and parsed.port not in (80, 443):
        return False, None, FriendlyError(code="invalid-url", **FRIENDLY_ERRORS["invalid-url"])

    # Resolve hostname via DNS and reject any address in private, loopback, or metadata ranges
    try:
        addr_info = socket.getaddrinfo(hostname, None)
        for _, _, _, _, sockaddr in addr_info:
            ip_str = sockaddr[0]
            if is_private_or_restricted_ip(ip_str):
                return False, None, FriendlyError(code="invalid-url", **FRIENDLY_ERRORS["invalid-url"])
    except Exception:
        return False, None, FriendlyError(code="invalid-url", **FRIENDLY_ERRORS["invalid-url"])

    video_id = None
    path = parsed.path

    if "youtu.be" in hostname:
        video_id = path.lstrip("/").split("/")[0] if path else None
    elif "/watch" in path:
        query = urllib.parse.parse_qs(parsed.query)
        video_id = query.get("v", [None])[0]
    elif "/shorts/" in path:
        parts = path.split("/shorts/")
        if len(parts) > 1:
            video_id = parts[1].split("/")[0]
    elif "/live/" in path:
        parts = path.split("/live/")
        if len(parts) > 1:
            video_id = parts[1].split("/")[0]
    elif "/embed/" in path:
        parts = path.split("/embed/")
        if len(parts) > 1:
            video_id = parts[1].split("/")[0]

    # Video ID MUST strictly match 11-character base64-safe regex
    if not video_id or not re.match(r'^[a-zA-Z0-9_-]{11}$', video_id):
        return False, None, FriendlyError(code="invalid-url", **FRIENDLY_ERRORS["invalid-url"])

    # ALWAYS construct strict canonical URL - NEVER pass arbitrary raw strings to yt-dlp
    canonical_url = f"https://www.youtube.com/watch?v={video_id}"
    return True, canonical_url, None

def map_ytdlp_error(error_str: str) -> FriendlyError:
    lower = error_str.lower()
    if "private video" in lower or "this video is private" in lower:
        return FriendlyError(code="private", **FRIENDLY_ERRORS["private"])
    if "members-only" in lower or "join this channel" in lower:
        return FriendlyError(code="members-only", **FRIENDLY_ERRORS["members-only"])
    if "age-restricted" in lower or "sign in to confirm your age" in lower:
        return FriendlyError(code="age-restricted", **FRIENDLY_ERRORS["age-restricted"])
    if "not available in your country" in lower or "geo-restricted" in lower or "region" in lower:
        return FriendlyError(code="region-blocked", **FRIENDLY_ERRORS["region-blocked"])
    if "video unavailable" in lower or "has been removed" in lower or "does not exist" in lower:
        return FriendlyError(code="removed", **FRIENDLY_ERRORS["removed"])
    if "live event" in lower or "is a live stream" in lower or "premieres in" in lower:
        return FriendlyError(code="live-or-premiere", **FRIENDLY_ERRORS["live-or-premiere"])
    if "too long" in lower:
        return FriendlyError(code="too-long", **FRIENDLY_ERRORS["too-long"])
    if "http error 429" in lower or "rate-limit" in lower or "too many requests" in lower:
        return FriendlyError(code="rate-limited", **FRIENDLY_ERRORS["rate-limited"])
    
    return FriendlyError(code="upstream-changed", **FRIENDLY_ERRORS["upstream-changed"])

def inspect_video(url: str) -> Tuple[Optional[InspectResponse], Optional[FriendlyError]]:
    is_valid, canonical_url, err = validate_youtube_url(url)
    if not is_valid:
        return None, err

    ydl_opts: Dict[str, Any] = {
        "noplaylist": True,
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
        "socket_timeout": 20,
    }
    if settings.YOUTUBE_PROXY:
        ydl_opts["proxy"] = settings.YOUTUBE_PROXY
    if settings.YOUTUBE_COOKIES_FILE:
        ydl_opts["cookiefile"] = settings.YOUTUBE_COOKIES_FILE

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(canonical_url, download=False)
            if not info:
                return None, FriendlyError(code="removed", **FRIENDLY_ERRORS["removed"])

            if info.get("is_live"):
                return None, FriendlyError(code="live-or-premiere", **FRIENDLY_ERRORS["live-or-premiere"])

            duration = info.get("duration", 0)
            if duration and duration > settings.MAX_DURATION_SECONDS:
                return None, FriendlyError(code="too-long", **FRIENDLY_ERRORS["too-long"])

            title = info.get("title", "Untitled Video")
            channel = info.get("channel") or info.get("uploader") or "Unknown Channel"
            thumbnail = info.get("thumbnail") or ""
            video_id = info.get("id", "")

            formats = info.get("formats", [])
            height_map: Dict[int, Dict[str, Any]] = {}
            audio_map: Dict[int, Dict[str, Any]] = {}
            best_audio_size = 0

            for f in formats:
                h = f.get("height")
                fps = f.get("fps") or 30
                vcodec = f.get("vcodec")
                acodec = f.get("acodec")
                filesize = f.get("filesize") or f.get("filesize_approx")

                if h and vcodec and vcodec != "none":
                    if h not in height_map or (filesize and not height_map[h].get("filesize")):
                        height_map[h] = {
                            "height": h,
                            "fps": fps,
                            "vcodec": vcodec.split(".")[0] if vcodec else None,
                            "filesize": filesize
                        }

                if acodec and acodec != "none" and (not vcodec or vcodec == "none"):
                    if filesize and filesize > best_audio_size:
                        best_audio_size = filesize

                abr = f.get("abr")
                if abr and acodec and acodec != "none":
                    rounded_abr = int(round(abr / 10.0) * 10)
                    if rounded_abr not in audio_map:
                        audio_map[rounded_abr] = {
                            "bitrate": rounded_abr,
                            "acodec": acodec.split(".")[0] if acodec else None,
                            "ext": f.get("ext", "m4a")
                        }

            if not best_audio_size and duration:
                best_audio_size = int((160 * 1000 * duration) / 8)

            available_heights: List[VideoStreamHeight] = []
            found_heights = sorted(height_map.keys(), reverse=True)
            used_found = set()
            for std_h in STANDARD_HEIGHTS:
                matched_h = None
                if std_h in found_heights and std_h not in used_found:
                    matched_h = std_h
                else:
                    candidates = [fh for fh in found_heights if fh not in used_found and abs(fh - std_h) <= max(35, int(std_h * 0.08))]
                    if candidates:
                        matched_h = min(candidates, key=lambda x: abs(x - std_h))
                if matched_h is not None:
                    used_found.add(matched_h)
                    h_info = height_map[matched_h]
                    size = h_info.get("filesize")
                    if not size and duration:
                        bitrate_est = std_h * 2500
                        size = int((bitrate_est * duration) / 8)
                    available_heights.append(VideoStreamHeight(
                        height=std_h,
                        fps=h_info.get("fps", 30),
                        vcodec=h_info.get("vcodec"),
                        approxSize=size,
                        recommended=(std_h == 1080)
                    ))

            if available_heights:
                if not any(h.recommended for h in available_heights):
                    available_heights[0].recommended = True
            elif found_heights:
                top_h = found_heights[0]
                available_heights.append(VideoStreamHeight(
                    height=top_h,
                    fps=height_map[top_h].get("fps", 30),
                    vcodec=height_map[top_h].get("vcodec"),
                    approxSize=height_map[top_h].get("filesize"),
                    recommended=True
                ))

            available_audio: List[AudioStreamInfo] = [
                AudioStreamInfo(bitrate=160, acodec="opus", ext="opus", recommended=True),
                AudioStreamInfo(bitrate=128, acodec="aac", ext="m4a"),
                AudioStreamInfo(bitrate=320, acodec="mp3", ext="mp3"),
                AudioStreamInfo(bitrate=256, acodec="mp3", ext="mp3"),
                AudioStreamInfo(bitrate=192, acodec="mp3", ext="mp3"),
            ]

            subtitles: List[SubtitleInfo] = []
            sub_dict = info.get("subtitles", {})
            auto_sub_dict = info.get("automatic_captions", {})
            all_subs = {**sub_dict, **auto_sub_dict}
            for code, data in list(all_subs.items())[:12]:
                name = code.upper()
                if isinstance(data, list) and len(data) > 0 and "name" in data[0]:
                    name = data[0]["name"]
                subtitles.append(SubtitleInfo(lang=code, name=name))

            chapters_list: List[ChapterInfo] = []
            raw_chapters = info.get("chapters") or []
            for ch in raw_chapters:
                ch_title = ch.get("title") or "Chapter"
                st = float(ch.get("start_time") or 0)
                et = float(ch.get("end_time") or 0)
                if et > st:
                    chapters_list.append(ChapterInfo(title=ch_title, startTime=st, endTime=et))

            clean_title = sanitize_filename(title)

            return InspectResponse(
                id=video_id,
                title=title,
                channel=channel,
                duration=duration,
                thumbnail=thumbnail,
                isLive=False,
                availableHeights=available_heights,
                availableAudio=available_audio,
                availableSubtitles=subtitles,
                chapters=chapters_list,
                defaultFilename=clean_title,
                audioSize=best_audio_size
            ), None

    except yt_dlp.utils.DownloadError as e:
        return None, map_ytdlp_error(str(e))
    except Exception as e:
        return None, map_ytdlp_error(str(e))


def extract_subtitles_text(url: str, lang: str = "en", fmt: str = "srt") -> Tuple[Optional[str], Optional[str], Optional[FriendlyError]]:
    """Download and return raw subtitle text (SRT/VTT) directly without video download."""
    is_valid, canonical_url, err = validate_youtube_url(url)
    if not is_valid or not canonical_url:
        return None, None, err

    # Sanitize and validate subtitle language code
    if not lang or not re.match(r'^[a-zA-Z0-9_-]{2,10}$', lang):
        lang = "en"

    # Restrict subtitle format to allowed safe list
    safe_fmt = fmt.lower() if fmt and fmt.lower() in ("srt", "vtt", "txt") else "srt"
    ydl_fmt = "srt" if safe_fmt == "txt" else safe_fmt

    import tempfile
    import os

    with tempfile.TemporaryDirectory() as temp_dir:
        out_tmpl = os.path.join(temp_dir, "%(title)s.%(ext)s")
        ydl_opts = {
            "skip_download": True,
            "writesubtitles": True,
            "writeautomaticsub": True,
            "subtitleslangs": [lang],
            "subtitlesformat": ydl_fmt,
            "outtmpl": out_tmpl,
            "quiet": True,
            "no_warnings": True,
            "socket_timeout": 20,
        }
        if settings.YOUTUBE_PROXY:
            ydl_opts["proxy"] = settings.YOUTUBE_PROXY
        if settings.YOUTUBE_COOKIES_FILE:
            ydl_opts["cookiefile"] = settings.YOUTUBE_COOKIES_FILE

        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(canonical_url, download=True)
                title = sanitize_filename(info.get("title", "subtitles"))
                
                # Find downloaded sub file safely within temp_dir
                for fname in os.listdir(temp_dir):
                    if fname.endswith(f".{ydl_fmt}") or fname.endswith(".srt") or fname.endswith(".vtt"):
                        fpath = os.path.join(temp_dir, fname)
                        if os.path.commonpath([temp_dir, fpath]) == temp_dir and os.path.isfile(fpath):
                            with open(fpath, "r", encoding="utf-8", errors="replace") as sf:
                                content = sf.read()
                                return content, f"{title}_{lang}.{safe_fmt}", None

                # Fallback if no matching file generated
                return None, None, FriendlyError(
                    code="no-subtitles",
                    title="Subtitles Unavailable",
                    explanation=f"No captions found for language code '{lang}'.",
                    suggestedAction="Try choosing another subtitle language or auto-generated English."
                )
        except Exception as e:
            return None, None, map_ytdlp_error(str(e))
