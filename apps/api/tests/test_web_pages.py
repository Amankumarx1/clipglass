import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

# 01. Home / Index
def test_home_page():
    response = client.get("/")
    assert response.status_code == 200
    assert "ClipGlass" in response.text
    assert "paste a link. pick a quality." in response.text

# 02. Downloader
def test_downloader_page():
    response = client.get("/downloader")
    assert response.status_code == 200
    assert "Universal Downloader" in response.text
    assert "downloaderUrlInput" in response.text
    assert "Paste Link" in response.text
    assert "handleDownloaderPasteClick" in response.text
    assert "consentCheck" in response.text
    assert "inspectBtn" in response.text
    assert "startVideoBtn" in response.text
    assert "startAudioBtn" in response.text
    assert "downloadCompletedFile" in response.text

# 03. Audio Studio
def test_audio_studio_page():
    # Test both /studio and legacy alias /audio-studio
    for route in ["/studio", "/audio-studio"]:
        response = client.get(route)
        assert response.status_code == 200
        assert "Studio" in response.text
        assert "+ Import Song" in response.text
        assert "audioFileInput" in response.text
        assert "audioImportDrawer" in response.text
        assert "Upload from PC" in response.text
        assert "quickAudioUrlInput" in response.text
        assert "fetchAudioFromUrl" in response.text
        assert "toggleAutoEffectSelection" in response.text
        assert "From Downloader &amp; History" in response.text or "From Downloader & History" in response.text

# 04. Video Trimmer
def test_video_trimmer_page():
    for route in ["/video-trimmer", "/trimmer"]:
        response = client.get(route)
        assert response.status_code == 200
        assert "Precision Video Trimmer" in response.text
        assert "+ Import Video" in response.text
        assert "videoFileInput" in response.text
        assert "videoImportDrawer" in response.text
        assert "trimmerVideoTitle" in response.text
        assert "trimmerTag" in response.text
        assert "trimmerVideoMeta" in response.text
        assert "vImportTabPcBtn" in response.text
        assert "vImportTabDownloaderBtn" in response.text
        assert "vImportTabUrlBtn" in response.text
        assert "cutModeCopyBtn" in response.text
        assert "cutModeEncodeBtn" in response.text
        assert "fetchVideoFromUrl" in response.text

# 05. Auto Clip Studio
def test_auto_clip_page():
    response = client.get("/auto-clip")
    assert response.status_code == 200
    assert "Auto Clip &amp; Shorts Studio" in response.text or "Auto Clip" in response.text
    assert "Upload Video from PC" in response.text
    assert "clipFileInput" in response.text
    assert "clipPcContainer" in response.text
    assert "aspectRatioGroup" in response.text
    assert "setAspectRatio" in response.text
    assert "clipConsentCheckbox" in response.text
    assert "selectionZoomOverlay" in response.text
    assert "selectionZoomCard" in response.text
    assert "openSelectionZoomOverlay" in response.text
    assert "zoomCaptionDisplay" in response.text
    assert "zoomGuideOverlay" in response.text

# 06. Auto Clip Editor
def test_auto_clip_editor_page():
    for route in ["/auto-clip/editor", "/auto-clip/edit/CLG-9988"]:
        response = client.get(route)
        assert response.status_code == 200
        assert "Auto Clip Editor" in response.text
        assert "9:16 SAFE ZONE" in response.text
        assert "exportClipBtn" in response.text
        assert "tabBtnCaption" in response.text
        assert "tabBtnStyle" in response.text
        assert "tabBtnEffects" in response.text

# 07. Queue Manager / Jobs
def test_jobs_page():
    response = client.get("/jobs")
    assert response.status_code == 200
    assert "Queue &amp; Job Manager" in response.text or "Queue & Job Manager" in response.text
    assert "filterBtn-all" in response.text
    assert "filterBtn-download" in response.text
    assert "filterBtn-audio" in response.text
    assert "filterBtn-trim" in response.text
    assert "filterBtn-autoclip" in response.text

# 08. Job Details
def test_job_details_page():
    response = client.get("/jobs/CLG-7364")
    assert response.status_code == 200
    assert "Job Details" in response.text
    assert "CLG-7364" in response.text
    assert "Processing Pipeline" in response.text
    assert "downloadJobResultBtn" in response.text
    assert "cancelJobBtn" in response.text

# 09. Recent Downloads
def test_recent_page():
    response = client.get("/recent")
    assert response.status_code == 200
    assert "Recent Session Downloads" in response.text
    assert "tab-all" in response.text
    assert "tab-audio" in response.text
    assert "tab-video" in response.text
    assert "recentSearchInput" in response.text

# 10. Settings
def test_settings_page():
    response = client.get("/settings")
    assert response.status_code == 200
    assert "Settings &amp; Preferences" in response.text or "Settings & Preferences" in response.text
    assert "soundBtn-on" in response.text
    assert "soundBtn-off" in response.text
    assert "res-1080p" in response.text
    assert "fmt-mp4" in response.text
    assert "abr-320k" in response.text

# 11. FAQ
def test_faq_page():
    response = client.get("/faq")
    assert response.status_code == 200
    assert "Frequently Asked Questions" in response.text

# 12. How It Works
def test_how_it_works_page():
    response = client.get("/how-it-works")
    assert response.status_code == 200
    assert "How It Works" in response.text
    assert "Import Media" in response.text

# 13. Terms of Service
def test_terms_page():
    response = client.get("/terms")
    assert response.status_code == 200
    assert "Terms of Service" in response.text
    assert "Acceptance of Terms" in response.text

# 14. Privacy Policy
def test_privacy_page():
    response = client.get("/privacy")
    assert response.status_code == 200
    assert "Privacy Policy" in response.text
    assert "15-Minute" in response.text

# 15. Copyright & DMCA
def test_copyright_page():
    response = client.get("/copyright")
    assert response.status_code == 200
    assert "Copyright &amp; DMCA Compliance" in response.text or "Copyright" in response.text
    assert "DMCA" in response.text

# 16. Design Showcase
def test_design_page():
    response = client.get("/design")
    assert response.status_code == 200
    assert "Design Showcase" in response.text
    assert "Liquid Glass 2.0" in response.text

def test_static_css_and_js():
    css_res = client.get("/static/css/liquid-glass.css")
    assert css_res.status_code == 200
    assert ".glass" in css_res.text

    js_res = client.get("/static/js/navbar.js")
    assert js_res.status_code == 200
    assert "playGlassTick" in js_res.text

# 17. 404 Page
def test_not_found_page():
    res = client.get("/404")
    assert res.status_code == 404
    assert "404" in res.text
    assert "vanished" in res.text or "Back to Home" in res.text

    # Unknown HTML route returns 404 page
    res_html = client.get("/some-random-unknown-page", headers={"accept": "text/html"})
    assert res_html.status_code == 404
    assert "404" in res_html.text
