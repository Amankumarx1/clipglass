import asyncio
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException
from app.config import settings
from routers import inspect, jobs, health, explainer, clip, web_pages
from services.sweeper_service import run_cleanup_sweeper, clean_stale_storage_on_startup

BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR / "static"

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
    title="ClipGlass",
    version="2.0.0",
    description="Liquid Glass Media Processing Engine (Pure Python, HTML, CSS, Tailwind)",
    lifespan=lifespan
)

# Mount static files
if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

allowed_origins = [
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    *(settings.allowed_origins_list or [])
]
is_wildcard = "*" in allowed_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if not is_wildcard else ["*"],
    allow_credentials=not is_wildcard,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["Server"] = "ClipGlass"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://cdnjs.cloudflare.com; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com data:; "
        "img-src 'self' data: https: blob:; "
        "media-src 'self' blob: data:; "
        "connect-src 'self' https: wss: ws: http://localhost:* http://127.0.0.1:*; "
        "frame-ancestors 'none';"
    )
    if settings.ENVIRONMENT == "production":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
    return response

@app.exception_handler(StarletteHTTPException)
async def custom_http_exception_handler(request: Request, exc: StarletteHTTPException):
    if exc.status_code == 404 and "text/html" in request.headers.get("accept", ""):
        return web_pages.templates.TemplateResponse(
            request=request, name="404.html", context={"active_page": "404"}, status_code=404
        )
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})

# Web pages & documentation routes
app.include_router(web_pages.router)

# API routes
app.include_router(health.router)
app.include_router(inspect.router)
app.include_router(jobs.router)
app.include_router(explainer.router)
app.include_router(clip.router)

# Direct unversioned /api alias routes
@app.get("/api/inspect")
@app.post("/api/inspect")
async def alias_inspect(request: Request):
    if request.method == "GET":
        url = request.query_params.get("url") or ""
        return await inspect.inspect_get_endpoint(request, url)
    body = await request.json()
    from schemas.inspect import InspectRequest
    return await inspect.inspect_endpoint(request, InspectRequest(**body))

@app.get("/api/audio-stream")
async def alias_audio_stream(request: Request, url: str):
    return await inspect.audio_stream_endpoint(request, url)

@app.get("/api/jobs")
async def alias_list_jobs():
    return await jobs.list_jobs()

@app.post("/api/jobs")
async def alias_create_job(request: Request):
    from schemas.jobs import JobCreateRequest
    body = await request.json()
    return await jobs.create_job(request, JobCreateRequest(**body))

@app.get("/api/jobs/{job_id}/file")
async def alias_download_job_file(job_id: str, request: Request):
    return await jobs.download_job_file(job_id, request)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)
