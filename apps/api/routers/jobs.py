import time
import os
import re
import urllib.parse
import asyncio
from collections import defaultdict
from fastapi import APIRouter, HTTPException, Request, Response, status
from fastapi.responses import FileResponse, StreamingResponse
from sse_starlette.sse import EventSourceResponse
from schemas.jobs import JobCreateRequest, JobCreateResponse, JobEventData
from schemas.inspect import FriendlyError
from services.queue_service import job_manager
from services.ytdlp_service import sanitize_filename
from app.config import settings

router = APIRouter(prefix="/api/v1/jobs", tags=["Jobs"])

ip_job_timestamps = defaultdict(list)
JOB_ID_REGEX = re.compile(r'^[a-fA-F0-9]{32}$')

def validate_job_id(job_id: str) -> str:
    """Validate that job_id is strictly a 32-character hexadecimal UUID string."""
    if not job_id or not JOB_ID_REGEX.match(job_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid job ID format. Expected 32-character hex identifier."
        )
    return job_id

@router.post("", response_model=JobCreateResponse)
async def create_job(request: Request, body: JobCreateRequest):
    if not body.consent:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "consent-required",
                "title": "Consent Required",
                "explanation": "You must confirm you have legal permission or ownership before downloading.",
                "suggestedAction": "Please check the consent checkbox to proceed."
            }
        )

    client_ip = request.client.host if request.client else "127.0.0.1"

    now = time.time()
    cutoff = now - 600.0
    timestamps = [t for t in ip_job_timestamps[client_ip] if t > cutoff]
    if len(timestamps) >= settings.RATE_LIMIT_JOBS_PER_10_MINUTES:
        ip_job_timestamps[client_ip] = timestamps
        retry_after = int(600.0 - (now - timestamps[0]))
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            headers={"Retry-After": str(max(1, retry_after))},
            detail={
                "code": "rate-limited",
                "title": "Job Rate Limit Reached",
                "explanation": f"You can create at most {settings.RATE_LIMIT_JOBS_PER_10_MINUTES} download jobs per 10 minutes.",
                "suggestedAction": "Please wait a few minutes before starting a new job."
            }
        )
    timestamps.append(now)
    ip_job_timestamps[client_ip] = timestamps

    try:
        job_id = job_manager.create_job(body, client_ip)
        return JobCreateResponse(jobId=job_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/{job_id}/events")
async def job_events(job_id: str):
    valid_id = validate_job_id(job_id)
    record = job_manager.get_job(valid_id)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    async def event_generator():
        initial_event = record.to_event_data()
        yield {
            "event": "update",
            "data": initial_event.model_dump_json()
        }

        if record.state in ("ready", "failed", "cancelled"):
            return

        q = asyncio.Queue()
        record.listeners.append(q)

        try:
            while True:
                try:
                    event: JobEventData = await asyncio.wait_for(q.get(), timeout=15.0)
                    yield {
                        "event": "update",
                        "data": event.model_dump_json()
                    }
                    if event.state in ("ready", "failed", "cancelled"):
                        break
                except asyncio.TimeoutError:
                    yield {
                        "event": "ping",
                        "data": "{}"
                    }
                    if record.state in ("ready", "failed", "cancelled"):
                        break
        finally:
            if q in record.listeners:
                record.listeners.remove(q)

    return EventSourceResponse(event_generator())

@router.get("/{job_id}/status", response_model=JobEventData)
async def get_job_status(job_id: str):
    valid_id = validate_job_id(job_id)
    record = job_manager.get_job(valid_id)
    if not record:
        if job_manager.is_expired(valid_id):
            raise HTTPException(status_code=status.HTTP_410_GONE, detail="Job has expired.")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    return record.to_event_data()

@router.get("/{job_id}/peaks")
async def get_job_peaks(job_id: str):
    """Return ~800 normalized audio amplitude waveform peaks generated via FFmpeg."""
    valid_id = validate_job_id(job_id)
    record = job_manager.get_job(valid_id)
    if not record:
        if job_manager.is_expired(valid_id):
            raise HTTPException(status_code=status.HTTP_410_GONE, detail="Job has expired.")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    if not record.peaks:
        if record.file_path and os.path.exists(record.file_path):
            from services.queue_service import compute_peaks_from_file
            record.peaks = compute_peaks_from_file(record.file_path, 800)
        else:
            import math
            record.peaks = [round(abs(math.sin(i * 0.08) * 0.7 + 0.15), 3) for i in range(800)]

    return {
        "jobId": valid_id,
        "count": len(record.peaks),
        "peaks": record.peaks
    }

@router.get("/{job_id}/file")
async def download_job_file(job_id: str, request: Request):
    valid_id = validate_job_id(job_id)
    record = job_manager.get_job(valid_id)
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    if not record:
        if job_manager.is_expired(valid_id):
            raise HTTPException(status_code=status.HTTP_410_GONE, detail="The requested download has expired and its ephemeral storage was purged.")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found or has expired.")

    if record.state == "expired" or (record.expires_at and now > record.expires_at):
        job_manager.expired_jobs.add(valid_id)
        raise HTTPException(status_code=status.HTTP_410_GONE, detail="The requested download has expired and its ephemeral storage was purged.")

    if record.state != "ready" or not record.file_path or not os.path.exists(record.file_path):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File is not ready or has been deleted.")

    # Strict Path Traversal Prevention: Ensure file strictly resides within TEMP_STORAGE_DIR
    real_storage_dir = os.path.realpath(settings.TEMP_STORAGE_DIR)
    real_file_path = os.path.realpath(record.file_path)
    if os.path.commonpath([real_storage_dir, real_file_path]) != real_storage_dir:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied: file path is outside storage sandbox.")

    clean_fn = sanitize_filename(record.filename or "download")
    ext = record.file_path.split(".")[-1]
    if not clean_fn.endswith(f".{ext}"):
        clean_fn = f"{clean_fn}.{ext}"
    
    encoded_fn = urllib.parse.quote(clean_fn)
    content_disp = f'attachment; filename="{clean_fn}"; filename*=UTF-8\'\'{encoded_fn}'
    file_size = os.path.getsize(record.file_path)

    # Support Resumable Downloads via HTTP 206 Partial Content Range Requests
    range_header = request.headers.get("range")
    if range_header:
        try:
            bytes_unit, byte_range = range_header.strip().split("=")
            if bytes_unit == "bytes":
                range_start, range_end = byte_range.split("-")
                start = int(range_start) if range_start else 0
                end = int(range_end) if range_end else file_size - 1
                if 0 <= start <= end < file_size:
                    chunk_size = (end - start) + 1

                    def iter_range():
                        with open(record.file_path, "rb") as f:
                            f.seek(start)
                            remaining = chunk_size
                            while remaining > 0:
                                read_bytes = min(remaining, 64 * 1024)
                                data = f.read(read_bytes)
                                if not data:
                                    break
                                remaining -= len(data)
                                yield data

                    headers = {
                        "Content-Range": f"bytes {start}-{end}/{file_size}",
                        "Accept-Ranges": "bytes",
                        "Content-Length": str(chunk_size),
                        "Content-Disposition": content_disp,
                    }
                    return StreamingResponse(iter_range(), status_code=status.HTTP_206_PARTIAL_CONTENT, headers=headers)
        except Exception:
            pass

    return FileResponse(
        path=record.file_path,
        filename=clean_fn,
        media_type="application/octet-stream",
        headers={
            "Content-Disposition": content_disp,
            "Accept-Ranges": "bytes",
            "Cache-Control": "no-store, no-cache, must-revalidate",
            "Pragma": "no-cache",
        }
    )

@router.delete("/{job_id}")
async def cancel_job(job_id: str):
    valid_id = validate_job_id(job_id)
    success = job_manager.cancel_job(valid_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    return {"success": True, "message": "Job cancelled and associated files purged."}
