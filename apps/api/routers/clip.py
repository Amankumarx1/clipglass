import os
import re
import time
import shutil
import asyncio
from collections import defaultdict
from fastapi import APIRouter, Request, HTTPException, status, Header, UploadFile, File, Form
from fastapi.responses import FileResponse, StreamingResponse
from sse_starlette.sse import EventSourceResponse
from schemas.clip import (
    ClipJobCreateRequest, ClipJobEventData, ClipMoment,
    ClipMomentUpdateRequest, ClipFeedbackRequest, EditBoxCommandRequest
)
from services.clip_queue_service import clip_job_manager
from services.clip_render_service import render_clip_segment, package_clips_zip
from services.edit_box_service import EditBoxParser
from services.polish_pack_service import get_available_polish_styles
from services.ytdlp_service import validate_youtube_url
from services.security_service import get_real_client_ip
from app.config import settings

router = APIRouter(prefix="/api/clip", tags=["Auto Clip"])

JOB_ID_REGEX = re.compile(r'^[a-fA-F0-9]{32}$')
CLIP_ID_REGEX = re.compile(r'^[a-zA-Z0-9_-]{1,32}$')

ip_clip_timestamps = defaultdict(list)

def validate_job_id(job_id: str) -> str:
    if not job_id or not JOB_ID_REGEX.match(job_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid clip job ID format."
        )
    return job_id

def validate_clip_id(cid: str) -> str:
    if not cid or not CLIP_ID_REGEX.match(cid):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid clip moment ID format."
        )
    return cid

@router.get("/polish-styles")
async def list_polish_styles():
    """Returns available pre-rendered design-time Polish Pack styles."""
    styles = get_available_polish_styles()
    return {"styles": styles}

@router.post("/jobs")
async def create_clip_job(request: Request, body: ClipJobCreateRequest):
    if not body.consent:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "consent-required",
                "title": "Consent Required",
                "explanation": "You must confirm you own this video or have legal permission to clip it.",
                "suggestedAction": "Check the consent checkbox to proceed."
            }
        )

    client_ip = get_real_client_ip(request)

    # Rate Limiting: Prevent DoS from rapid repeated clipping requests
    now = time.time()
    cutoff = now - 600.0
    timestamps = [t for t in ip_clip_timestamps[client_ip] if t > cutoff]
    if len(timestamps) >= settings.RATE_LIMIT_JOBS_PER_10_MINUTES:
        ip_clip_timestamps[client_ip] = timestamps
        retry_after = int(600.0 - (now - timestamps[0]))
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            headers={"Retry-After": str(max(1, retry_after))},
            detail={
                "code": "rate-limited",
                "title": "Job Rate Limit Reached",
                "explanation": f"You can create at most {settings.RATE_LIMIT_JOBS_PER_10_MINUTES} Auto Clip jobs per 10 minutes.",
                "suggestedAction": "Please wait a few minutes before starting a new job."
            }
        )
    timestamps.append(now)
    ip_clip_timestamps[client_ip] = timestamps

    # Bulletproof SSRF & Domain Validation: ensure URL is public YouTube and not private IP / userinfo spoof
    is_valid, canonical_url, err = validate_youtube_url(body.url)
    if not is_valid or not canonical_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=err.model_dump() if err else {
                "code": "invalid-media-url",
                "title": "Invalid Media URL",
                "explanation": "Auto Clip currently supports public YouTube videos (youtube.com or youtu.be).",
                "suggestedAction": "Please paste a valid YouTube video link."
            }
        )
    body.url = canonical_url

    try:
        job_id = clip_job_manager.create_job(body, client_ip)
        return {"jobId": job_id, "message": "Auto Clip job initiated."}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/upload")
async def upload_clip_job(
    request: Request,
    file: UploadFile = File(...),
    consent: bool = Form(True),
    clipCount: int = Form(3),
    minLength: int = Form(15),
    maxLength: int = Form(60),
    reframeMode: str = Form("follow-face"),
    captionPreset: str = Form("viral_pop")
):
    if not consent:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "consent-required",
                "title": "Consent Required",
                "explanation": "You must confirm you own this video or have legal permission to clip it.",
                "suggestedAction": "Check the consent checkbox to proceed."
            }
        )

    client_ip = get_real_client_ip(request)
    now = time.time()
    cutoff = now - 600.0
    timestamps = [t for t in ip_clip_timestamps[client_ip] if t > cutoff]
    if len(timestamps) >= settings.RATE_LIMIT_JOBS_PER_10_MINUTES:
        ip_clip_timestamps[client_ip] = timestamps
        retry_after = int(600.0 - (now - timestamps[0]))
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            headers={"Retry-After": str(max(1, retry_after))},
            detail={
                "code": "rate-limited",
                "title": "Job Rate Limit Reached",
                "explanation": f"You can create at most {settings.RATE_LIMIT_JOBS_PER_10_MINUTES} Auto Clip jobs per 10 minutes.",
                "suggestedAction": "Please wait a few minutes before starting a new job."
            }
        )
    timestamps.append(now)
    ip_clip_timestamps[client_ip] = timestamps

    # Create temporary storage for uploaded video
    import uuid
    safe_filename = re.sub(r'[^a-zA-Z0-9_\-\.]', '_', file.filename or "uploaded.mp4")
    temp_dir = os.path.join(settings.TEMP_STORAGE_DIR, f"clip_upload_{uuid.uuid4().hex[:8]}")
    os.makedirs(temp_dir, exist_ok=True)
    temp_video_path = os.path.join(temp_dir, safe_filename)

    with open(temp_video_path, "wb") as f_out:
        shutil.copyfileobj(file.file, f_out)

    req_body = ClipJobCreateRequest(
        url=f"local://{safe_filename}",
        clipCount=clipCount,
        minLength=minLength,
        maxLength=maxLength,
        reframeMode=reframeMode,
        captionPreset=captionPreset,
        consent=consent
    )

    try:
        job_id = clip_job_manager.create_job(
            req_body, client_ip,
            source_video=temp_video_path,
            source_title=safe_filename
        )
        return {"jobId": job_id, "message": "Auto Clip job initiated from file upload."}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/jobs/{job_id}/cancel")
async def cancel_clip_job(job_id: str):
    valid_id = validate_job_id(job_id)
    success = clip_job_manager.cancel_job(valid_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Clip job not found or already ended.")
    return {"message": "Clip job cancelled.", "jobId": valid_id}

@router.get("/jobs/{job_id}/events")
async def clip_job_events(job_id: str):
    valid_id = validate_job_id(job_id)
    record = clip_job_manager.get_job(valid_id)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Clip job not found.")

    async def event_generator():
        initial = record.to_event_data()
        yield {"event": "update", "data": initial.model_dump_json()}

        if record.stage in ("ready", "failed", "cancelled"):
            return

        q = asyncio.Queue()
        record.listeners.append(q)
        try:
            while True:
                try:
                    event = await asyncio.wait_for(q.get(), timeout=15.0)
                    yield {"event": "update", "data": event.model_dump_json()}
                    if event.stage in ("ready", "failed", "cancelled"):
                        break
                except asyncio.TimeoutError:
                    yield {"event": "ping", "data": "keep-alive"}
        finally:
            if q in record.listeners:
                record.listeners.remove(q)

    return EventSourceResponse(event_generator())

@router.get("/jobs/{job_id}/clips")
async def get_job_clips(job_id: str):
    valid_id = validate_job_id(job_id)
    record = clip_job_manager.get_job(valid_id)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Clip job not found.")
    return {"jobId": valid_id, "stage": record.stage, "clips": record.clips, "error": record.error}

@router.patch("/jobs/{job_id}/clips/{cid}")
async def update_clip_moment(job_id: str, cid: str, body: ClipMomentUpdateRequest):
    valid_id = validate_job_id(job_id)
    valid_cid = validate_clip_id(cid)
    record = clip_job_manager.get_job(valid_id)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Clip job not found.")

    matched_clip = next((c for c in record.clips if c.clipId == valid_cid), None)
    if not matched_clip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Clip moment not found.")

    cmd_result = None
    if body.command:
        cmd_result = EditBoxParser.parse_and_apply(body.command, matched_clip)

    if body.start is not None: matched_clip.start = body.start
    if body.end is not None: matched_clip.end = body.end
    if body.start is not None or body.end is not None:
        matched_clip.duration = round(matched_clip.end - matched_clip.start, 2)
    if body.hook is not None: matched_clip.hook = body.hook
    if body.title is not None: matched_clip.title = body.title
    if body.hashtags is not None: matched_clip.hashtags = body.hashtags
    if body.reframeMode is not None: matched_clip.reframeMode = body.reframeMode
    if body.captionPreset is not None: matched_clip.captionPreset = body.captionPreset
    if body.platformPreset is not None: matched_clip.platformPreset = body.platformPreset
    if body.polishStyle is not None: matched_clip.polishStyle = body.polishStyle
    if body.transcriptText is not None: matched_clip.transcriptText = body.transcriptText
    if body.words is not None: matched_clip.words = body.words
    if body.feedback is not None: matched_clip.feedback = body.feedback

    # Invalidate rendered status on boundary or style edits
    matched_clip.status = 'discovered'
    matched_clip.videoUrl = None

    record.emit_update()
    return {
        "message": "Clip updated successfully",
        "clip": matched_clip,
        "commandResult": cmd_result
    }

@router.post("/jobs/{job_id}/clips/{cid}/command")
async def execute_edit_box_command(job_id: str, cid: str, body: EditBoxCommandRequest):
    """Executes a plain-language edit box command on a clip candidate."""
    valid_id = validate_job_id(job_id)
    valid_cid = validate_clip_id(cid)
    record = clip_job_manager.get_job(valid_id)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Clip job not found.")

    matched_clip = next((c for c in record.clips if c.clipId == valid_cid), None)
    if not matched_clip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Clip moment not found.")

    cmd_result = EditBoxParser.parse_and_apply(body.command, matched_clip)
    if cmd_result.success:
        matched_clip.status = 'discovered'
        matched_clip.videoUrl = None
        record.emit_update()

    return {"result": cmd_result, "clip": matched_clip}

@router.post("/jobs/{job_id}/clips/{cid}/feedback")
async def record_clip_feedback(job_id: str, cid: str, body: ClipFeedbackRequest):
    """Records local thumbs up / thumbs down feedback on a clip."""
    valid_id = validate_job_id(job_id)
    valid_cid = validate_clip_id(cid)
    record = clip_job_manager.get_job(valid_id)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Clip job not found.")

    matched_clip = next((c for c in record.clips if c.clipId == valid_cid), None)
    if not matched_clip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Clip moment not found.")

    matched_clip.feedback = body.thumb
    record.emit_update()
    return {"message": "Feedback recorded", "clipId": valid_cid, "thumb": body.thumb}

@router.post("/jobs/{job_id}/clips/{cid}/render")
async def render_clip(job_id: str, cid: str):
    valid_id = validate_job_id(job_id)
    valid_cid = validate_clip_id(cid)
    record = clip_job_manager.get_job(valid_id)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Clip job not found.")

    matched_clip = next((c for c in record.clips if c.clipId == valid_cid), None)
    if not matched_clip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Clip moment not found.")

    if not record.source_video or not os.path.exists(record.source_video):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Source video is not available.")

    matched_clip.status = 'rendering'
    record.emit_update()

    success, mp4_path, err_msg = render_clip_segment(
        record.source_video,
        record.job_dir,
        matched_clip
    )

    if not success or not mp4_path:
        matched_clip.status = 'failed'
        record.emit_update()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Render failed: {err_msg}")

    matched_clip.status = 'ready'
    matched_clip.videoUrl = f"/api/clip/jobs/{job_id}/clips/{valid_cid}/download"
    record.emit_update()

    return {"message": "Clip rendered successfully", "clip": matched_clip}

@router.get("/jobs/{job_id}/clips/{cid}/download")
async def download_clip(job_id: str, cid: str, range: str = Header(None)):
    valid_id = validate_job_id(job_id)
    valid_cid = validate_clip_id(cid)
    record = clip_job_manager.get_job(valid_id)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Clip job not found.")

    mp4_filename = f"clip_{valid_cid}.mp4"
    real_job_dir = os.path.realpath(record.job_dir)
    file_path = os.path.realpath(os.path.join(record.job_dir, mp4_filename))

    # Strict Path Traversal Prevention
    if os.path.commonpath([real_job_dir, file_path]) != real_job_dir:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied: file path outside storage sandbox.")

    if not os.path.exists(file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rendered clip file not found.")

    file_size = os.path.getsize(file_path)

    # HTTP Range Request handling (206 Partial Content) for resumable video streaming
    if range:
        range_match = re.match(r"bytes=(\d+)-(\d*)", range)
        if range_match:
            start_b = int(range_match.group(1))
            end_b = int(range_match.group(2)) if range_match.group(2) else file_size - 1
            if start_b <= end_b and end_b < file_size:
                length = end_b - start_b + 1

                def iter_chunk():
                    with open(file_path, "rb") as f:
                        f.seek(start_b)
                        bytes_left = length
                        while bytes_left > 0:
                            chunk_sz = min(bytes_left, 64 * 1024)
                            data = f.read(chunk_sz)
                            if not data:
                                break
                            bytes_left -= len(data)
                            yield data

                headers = {
                    "Content-Range": f"bytes {start_b}-{end_b}/{file_size}",
                    "Accept-Ranges": "bytes",
                    "Content-Length": str(length),
                    "Content-Type": "video/mp4",
                    "Content-Disposition": f'inline; filename="{mp4_filename}"',
                }
                return StreamingResponse(iter_chunk(), status_code=status.HTTP_206_PARTIAL_CONTENT, headers=headers)

    return FileResponse(
        file_path,
        media_type="video/mp4",
        filename=mp4_filename,
        headers={"Accept-Ranges": "bytes"}
    )

@router.get("/jobs/{job_id}/export-all")
async def export_all_clips(job_id: str):
    valid_id = validate_job_id(job_id)
    record = clip_job_manager.get_job(valid_id)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Clip job not found.")

    # Render any unrendered clips first
    for clip in record.clips:
        if clip.status != 'ready':
            success, _, _ = render_clip_segment(record.source_video, record.job_dir, clip)
            if success:
                clip.status = 'ready'

    zip_path = package_clips_zip(record.job_dir, record.clips)
    if not zip_path or not os.path.exists(zip_path):
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to assemble ZIP export bundle.")

    return FileResponse(
        zip_path,
        media_type="application/zip",
        filename=f"clipglass_{job_id[:8]}_all_clips.zip"
    )
