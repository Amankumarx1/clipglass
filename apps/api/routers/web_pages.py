from pathlib import Path
from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

router = APIRouter(include_in_schema=False)

BASE_DIR = Path(__file__).resolve().parent.parent
TEMPLATES_DIR = BASE_DIR / "templates"
templates = Jinja2Templates(directory=str(TEMPLATES_DIR))

# 01. Home / Index
@router.get("/", response_class=HTMLResponse)
async def home_page(request: Request):
    return templates.TemplateResponse(request=request, name="index.html", context={"active_page": "home"})

# 02. Downloader
@router.get("/downloader", response_class=HTMLResponse)
async def downloader_page(request: Request):
    return templates.TemplateResponse(request=request, name="downloader.html", context={"active_page": "downloader"})

# 03. Audio Studio (supports both /studio and /audio-studio)
@router.get("/studio", response_class=HTMLResponse)
@router.get("/audio-studio", response_class=HTMLResponse)
async def audio_studio_page(request: Request):
    return templates.TemplateResponse(request=request, name="audio_studio.html", context={"active_page": "studio"})

# 04. Video Trimmer
@router.get("/video-trimmer", response_class=HTMLResponse)
@router.get("/trimmer", response_class=HTMLResponse)
async def video_trimmer_page(request: Request):
    return templates.TemplateResponse(request=request, name="video_trimmer.html", context={"active_page": "video_trimmer"})

# 05. Auto Clip Studio
@router.get("/auto-clip", response_class=HTMLResponse)
async def auto_clip_page(request: Request):
    return templates.TemplateResponse(request=request, name="auto_clip.html", context={"active_page": "auto_clip"})

# 06. Auto Clip Editor
@router.get("/auto-clip/editor", response_class=HTMLResponse)
@router.get("/auto-clip/edit/{clip_id}", response_class=HTMLResponse)
async def auto_clip_editor_page(request: Request, clip_id: str = None):
    return templates.TemplateResponse(request=request, name="auto_clip_editor.html", context={"active_page": "auto_clip_editor", "clip_id": clip_id})

# 07. Queue Manager / Jobs
@router.get("/jobs", response_class=HTMLResponse)
async def jobs_page(request: Request):
    return templates.TemplateResponse(request=request, name="jobs.html", context={"active_page": "jobs"})

# 08. Job Details
@router.get("/jobs/{job_id}", response_class=HTMLResponse)
async def job_details_page(request: Request, job_id: str):
    return templates.TemplateResponse(request=request, name="job_details.html", context={"active_page": "jobs", "job_id": job_id})

# 09. Recent Downloads
@router.get("/recent", response_class=HTMLResponse)
async def recent_page(request: Request):
    return templates.TemplateResponse(request=request, name="recent.html", context={"active_page": "recent"})

# 10. Settings
@router.get("/settings", response_class=HTMLResponse)
async def settings_page(request: Request):
    return templates.TemplateResponse(request=request, name="settings.html", context={"active_page": "settings"})

# 11. FAQ
@router.get("/faq", response_class=HTMLResponse)
async def faq_page(request: Request):
    return templates.TemplateResponse(request=request, name="faq.html", context={"active_page": "faq"})

# 12. How It Works
@router.get("/how-it-works", response_class=HTMLResponse)
async def how_it_works_page(request: Request):
    return templates.TemplateResponse(request=request, name="how_it_works.html", context={"active_page": "how_it_works"})

# 13. Terms of Service
@router.get("/terms", response_class=HTMLResponse)
async def terms_page(request: Request):
    return templates.TemplateResponse(request=request, name="terms.html", context={"active_page": "terms"})

# 14. Privacy Policy
@router.get("/privacy", response_class=HTMLResponse)
async def privacy_page(request: Request):
    return templates.TemplateResponse(request=request, name="privacy.html", context={"active_page": "privacy"})

# 15. Copyright & DMCA
@router.get("/copyright", response_class=HTMLResponse)
async def copyright_page(request: Request):
    return templates.TemplateResponse(request=request, name="copyright.html", context={"active_page": "copyright"})

# 16. Design Showcase
@router.get("/design", response_class=HTMLResponse)
async def design_page(request: Request):
    return templates.TemplateResponse(request=request, name="design.html", context={"active_page": "design"})

# 17. 404 Page
@router.get("/404", response_class=HTMLResponse)
async def not_found_page(request: Request):
    return templates.TemplateResponse(request=request, name="404.html", context={"active_page": "404"}, status_code=404)
