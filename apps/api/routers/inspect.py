import os
import subprocess
import time
from collections import defaultdict
from typing import Dict, Tuple
from fastapi import APIRouter, HTTPException, Request, Response, status
from fastapi.responses import StreamingResponse
from schemas.inspect import InspectRequest, InspectResponse, FriendlyError
import re
import urllib.parse
import yt_dlp
from services.ytdlp_service import inspect_video, extract_subtitles_text, sanitize_filename, validate_youtube_url
from services.security_service import get_real_client_ip
from app.config import settings

router = APIRouter(prefix="/api/v1", tags=["Inspect"])

ip_inspect_timestamps = defaultdict(list)

# In-Memory Cache: { canonical_url: (InspectResponse, timestamp) }
METADATA_CACHE: Dict[str, Tuple[InspectResponse, float]] = {}
CACHE_TTL_SECONDS = 600.0  # 10 minutes

@router.post(
    "/inspect",
    response_model=InspectResponse,
    responses={
        400: {"model": FriendlyError, "description": "Invalid URL or parameters"},
        429: {"model": FriendlyError, "description": "Rate limit exceeded"},
        500: {"model": FriendlyError, "description": "Extraction error"}
    }
)
async def inspect_endpoint(request: Request, body: InspectRequest):
    client_ip = get_real_client_ip(request)

    now = time.time()
    cutoff = now - 60.0
    timestamps = [t for t in ip_inspect_timestamps[client_ip] if t > cutoff]
    if len(timestamps) >= settings.RATE_LIMIT_INSPECT_PER_MINUTE:
        ip_inspect_timestamps[client_ip] = timestamps
        retry_after = int(60.0 - (now - timestamps[0]))
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            headers={"Retry-After": str(max(1, retry_after))},
            detail={
                "code": "rate-limited",
                "title": "Too Many Requests",
                "explanation": f"You have reached the maximum rate of {settings.RATE_LIMIT_INSPECT_PER_MINUTE} inspect queries per minute.",
                "suggestedAction": "Please wait a moment before inspecting another video."
            }
        )
    timestamps.append(now)
    ip_inspect_timestamps[client_ip] = timestamps

    # Check cache first
    cached = METADATA_CACHE.get(body.url)
    if cached and (now - cached[1]) < CACHE_TTL_SECONDS:
        return cached[0]

    data, err = inspect_video(body.url)
    if err:
        status_code = status.HTTP_400_BAD_REQUEST
        if err.code == "rate-limited":
            status_code = status.HTTP_429_TOO_MANY_REQUESTS
        elif err.code in ("private", "members-only", "age-restricted", "region-blocked"):
            status_code = status.HTTP_403_FORBIDDEN
        elif err.code == "removed":
            status_code = status.HTTP_404_NOT_FOUND
        
        raise HTTPException(status_code=status_code, detail=err.model_dump())

    # Cache response
    if data:
        METADATA_CACHE[body.url] = (data, now)

    return data


@router.get(
    "/inspect",
    response_model=InspectResponse,
    responses={
        400: {"model": FriendlyError, "description": "Invalid URL or parameters"},
        429: {"model": FriendlyError, "description": "Rate limit exceeded"},
        500: {"model": FriendlyError, "description": "Extraction error"}
    }
)
async def inspect_get_endpoint(request: Request, url: str):
    return await inspect_endpoint(request, InspectRequest(url=url))



@router.get("/subtitles/download")
async def download_subtitles_endpoint(request: Request, url: str, lang: str = "en", format: str = "srt"):
    client_ip = get_real_client_ip(request)
    now = time.time()
    cutoff = now - 60.0
    timestamps = [t for t in ip_inspect_timestamps[client_ip] if t > cutoff]
    if len(timestamps) >= settings.RATE_LIMIT_INSPECT_PER_MINUTE:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "code": "rate-limited",
                "title": "Too Many Requests",
                "explanation": "Subtitle download rate limit exceeded. Please wait a moment."
            }
        )
    timestamps.append(now)
    ip_inspect_timestamps[client_ip] = timestamps

    # Strict parameter sanitization
    if not re.match(r'^[a-zA-Z0-9_-]{2,10}$', lang):
        lang = "en"
    safe_format = format.lower() if format and format.lower() in ("srt", "vtt", "txt") else "srt"

    content, filename, err = extract_subtitles_text(url, lang=lang, fmt=safe_format)
    if err or not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=err.model_dump() if err else {
                "code": "no-subtitles",
                "title": "Subtitles Unavailable",
                "explanation": "Could not download subtitles for this video."
            }
        )

    clean_fn = sanitize_filename(filename or "subtitles.srt")
    if not clean_fn.endswith(f".{safe_format}"):
        clean_fn = f"{clean_fn}.{safe_format}"
    encoded_fn = urllib.parse.quote(clean_fn)
    content_disp = f'attachment; filename="{clean_fn}"; filename*=UTF-8\'\'{encoded_fn}'

    return Response(
        content=content,
        media_type="text/plain; charset=utf-8",
        headers={
            "Content-Disposition": content_disp,
            "Cache-Control": "no-store, no-cache, must-revalidate",
        }
    )


@router.get("/audio-stream")
async def audio_stream_endpoint(request: Request, url: str):
    """
    Stream audio directly from a YouTube or media URL as MP3 for live Studio playback.
    """
    if not url:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing url parameter")

    is_valid, canonical_url, err = validate_youtube_url(url)
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err.model_dump() if err else "Invalid URL")

    # 1. Check if an active/ready job already has this audio downloaded
    try:
        from services.queue_service import queue_service
        for job_id, rec in queue_service.jobs.items():
            if rec.request and rec.request.url == url and rec.state == "ready" and rec.file_path and os.path.exists(rec.file_path):
                from fastapi.responses import FileResponse
                return FileResponse(
                    path=rec.file_path,
                    media_type="audio/mpeg",
                    headers={
                        "Content-Disposition": 'inline; filename="stream.mp3"',
                        "Accept-Ranges": "bytes",
                        "Cache-Control": "no-cache",
                    }
                )
    except Exception:
        pass

    # 2. Extract direct audio format using yt-dlp
    ydl_opts = {
        "noplaylist": True,
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
        "socket_timeout": 15,
    }
    if settings.YOUTUBE_PROXY:
        ydl_opts["proxy"] = settings.YOUTUBE_PROXY
    if settings.YOUTUBE_COOKIES_FILE:
        ydl_opts["cookiefile"] = settings.YOUTUBE_COOKIES_FILE

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(canonical_url, download=False)
            if not info:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video stream not found")

            formats = [f for f in info.get("formats", []) if f.get("vcodec") == "none" and f.get("url")]
            if not formats:
                formats = [f for f in info.get("formats", []) if f.get("url")]

            if not formats:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No suitable audio format found")

            audio_source_url = formats[-1]["url"]

            # Stream transcoded MP3 via FFmpeg
            cmd = [
                "ffmpeg", "-y",
                "-reconnect", "1", "-reconnect_streamed", "1",
                "-reconnect_delay_max", "5",
                "-ss", "0",
                "-i", audio_source_url,
                "-t", "420",
                "-vn",
                "-f", "mp3",
                "-acodec", "libmp3lame",
                "-b:a", "192k",
                "pipe:1"
            ]

            proc = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.DEVNULL,
                bufsize=64 * 1024
            )

            def iter_audio():
                try:
                    while True:
                        chunk = proc.stdout.read(64 * 1024)
                        if not chunk:
                            break
                        yield chunk
                finally:
                    try:
                        proc.kill()
                    except Exception:
                        pass

            return StreamingResponse(
                iter_audio(),
                media_type="audio/mpeg",
                headers={
                    "Content-Disposition": 'inline; filename="stream.mp3"',
                    "Accept-Ranges": "bytes",
                    "Cache-Control": "no-cache",
                }
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Audio streaming error: {str(e)}")


