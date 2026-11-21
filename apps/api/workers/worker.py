"""
ClipGlass Worker Daemon
Processes queued jobs when distributed Redis mode is enabled.
In standalone/single-container mode, the FastAPI in-memory background worker handles jobs directly.
"""
import time
import logging
from app.config import settings

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("clipglass-worker")

def main():
    logger.info("ClipGlass background worker starting...")
    logger.info(f"Target Redis: {settings.REDIS_URL}")
    logger.info(f"Storage Directory: {settings.TEMP_STORAGE_DIR}")

    if not settings.USE_REDIS:
        logger.info("USE_REDIS is set to false. Standalone in-memory processing active in API process.")
        while True:
            time.sleep(3600)

    try:
        import redis
        from rq import Worker, Queue, Connection
        conn = redis.from_url(settings.REDIS_URL)
        with Connection(conn):
            worker = Worker(["default"], connection=conn)
            logger.info("Worker listening for Redis queue tasks...")
            worker.work()
    except Exception as e:
        logger.error(f"Worker runtime notice: {e}")
        while True:
            time.sleep(60)

if __name__ == "__main__":
    main()

