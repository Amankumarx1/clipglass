import asyncio
import os
import shutil
import time
from datetime import datetime, timezone
from app.config import settings
from services.queue_service import job_manager

def clean_stale_storage_on_startup():
    """Clear all stale ephemeral folders and files on startup so the disk can never bloat."""
    if os.path.exists(settings.TEMP_STORAGE_DIR):
        for item in os.listdir(settings.TEMP_STORAGE_DIR):
            item_path = os.path.join(settings.TEMP_STORAGE_DIR, item)
            try:
                if os.path.isdir(item_path):
                    shutil.rmtree(item_path, ignore_errors=True)
                else:
                    os.remove(item_path)
            except Exception:
                pass

async def run_cleanup_sweeper():
    while True:
        try:
            await asyncio.sleep(60)
            now = datetime.now(timezone.utc)

            expired_ids = []
            for jid, job in list(job_manager.jobs.items()):
                if job.expires_at and now > job.expires_at:
                    expired_ids.append(jid)
                elif job.state in ("failed", "cancelled") and (now - job.created_at).total_seconds() > 300:
                    expired_ids.append(jid)

            for jid in expired_ids:
                job_manager.expired_jobs.add(jid)
                job = job_manager.jobs.pop(jid, None)
                if job:
                    job_manager._cleanup_job_files(job)

            if os.path.exists(settings.TEMP_STORAGE_DIR):
                for folder in os.listdir(settings.TEMP_STORAGE_DIR):
                    folder_path = os.path.join(settings.TEMP_STORAGE_DIR, folder)
                    if os.path.isdir(folder_path):
                        mtime = os.path.getmtime(folder_path)
                        if time.time() - mtime > settings.FILE_TTL_SECONDS:
                            shutil.rmtree(folder_path, ignore_errors=True)

        except asyncio.CancelledError:
            break
        except Exception:
            pass
