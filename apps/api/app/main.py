import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import settings
from routers import inspect, jobs, health, explainer, clip
from services.sweeper_service import run_cleanup_sweeper, clean_stale_storage_on_startup

@asynccontextmanager
async def lifespan(app: FastAPI):
    clean_stale_storage_on_startup()
    sweeper_task = asyncio.create_task(run_cleanup_sweeper())
    yield
    sweeper_task.cancel()
    try:
        await sweeper_task
    except asyncio.CancelledError:
        pass

app = FastAPI(
    title="ClipGlass API",
    version="1.0.0",
    description="High-performance, ephemeral YouTube extraction and media processing engine",
    lifespan=lifespan
)

allowed_origins = settings.allowed_origins_list or ["http://localhost:3000", "http://127.0.0.1:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    if settings.ENVIRONMENT == "production":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
    return response

app.include_router(health.router)
app.include_router(inspect.router)
app.include_router(jobs.router)
app.include_router(explainer.router)
app.include_router(clip.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)
