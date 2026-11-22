from pathlib import Path
from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

router = APIRouter(include_in_schema=False)

BASE_DIR = Path(__file__).resolve().parent.parent
TEMPLATES_DIR = BASE_DIR / "templates"
templates = Jinja2Templates(directory=str(TEMPLATES_DIR))

@router.get("/", response_class=HTMLResponse)
async def home_page(request: Request):
    return templates.TemplateResponse(request=request, name="index.html", context={"active_page": "home"})

@router.get("/downloader", response_class=HTMLResponse)
async def downloader_page(request: Request):
    return templates.TemplateResponse(request=request, name="downloader.html", context={"active_page": "downloader"})

@router.get("/studio", response_class=HTMLResponse)
@router.get("/audio-studio", response_class=HTMLResponse)
async def audio_studio_page(request: Request):
    return templates.TemplateResponse(request=request, name="audio_studio.html", context={"active_page": "studio"})

@router.get("/video-trimmer", response_class=HTMLResponse)
async def video_trimmer_page(request: Request):
    return templates.TemplateResponse(request=request, name="video_trimmer.html", context={"active_page": "video_trimmer"})

@router.get("/auto-clip", response_class=HTMLResponse)
async def auto_clip_page(request: Request):
    return templates.TemplateResponse(request=request, name="auto_clip.html", context={"active_page": "auto_clip"})

@router.get("/jobs", response_class=HTMLResponse)
async def jobs_page(request: Request):
    return templates.TemplateResponse(request=request, name="jobs.html", context={"active_page": "jobs"})

@router.get("/recent", response_class=HTMLResponse)
async def recent_page(request: Request):
    return templates.TemplateResponse(request=request, name="recent.html", context={"active_page": "recent"})

@router.get("/settings", response_class=HTMLResponse)
async def settings_page(request: Request):
    return templates.TemplateResponse(request=request, name="settings.html", context={"active_page": "settings"})

@router.get("/faq", response_class=HTMLResponse)
async def faq_page(request: Request):
    return templates.TemplateResponse(request=request, name="faq.html", context={"active_page": "faq"})
