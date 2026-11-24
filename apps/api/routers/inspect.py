import time
from collections import defaultdict
from typing import Dict, Tuple
from fastapi import APIRouter, HTTPException, Request, Response, status
from schemas.inspect import InspectRequest, InspectResponse, FriendlyError
import re
import urllib.parse
from services.ytdlp_service import inspect_video, extract_subtitles_text, sanitize_filename
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

