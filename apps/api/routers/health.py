import shutil
import time
from fastapi import APIRouter
import yt_dlp
from services.queue_service import job_manager

router = APIRouter(tags=["Health"])

START_TIME = time.time()

@router.get("/healthz")
@router.get("/health")
@router.get("/api/health")
async def health_check():
    ffmpeg_path = shutil.which("ffmpeg")
    active_jobs = sum(1 for j in job_manager.jobs.values() if j.state in ("queued", "downloading", "merging", "converting"))
    
    return {
        "status": "healthy",
        "uptimeSeconds": int(time.time() - START_TIME),
        "ytdlpVersion": yt_dlp.version.__version__,
        "ffmpegAvailable": ffmpeg_path is not None,
        "activeJobs": active_jobs,
        "totalStoredJobs": len(job_manager.jobs)
    }
