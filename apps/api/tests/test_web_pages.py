import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_home_page():
    response = client.get("/")
    assert response.status_code == 200
    assert "ClipGlass" in response.text
    assert "paste a link. pick a quality." in response.text

def test_downloader_page():
    response = client.get("/downloader")
    assert response.status_code == 200
    assert "Universal Downloader" in response.text
    assert "downloaderUrlInput" in response.text
    assert "Paste Link" in response.text
    assert "handleDownloaderPasteClick" in response.text

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
        assert "From Downloader &amp; History" in response.text or "From Downloader & History" in response.text

def test_video_trimmer_page():
    response = client.get("/video-trimmer")
    assert response.status_code == 200
    assert "Precision Video Trimmer" in response.text
    assert "+ Import Video" in response.text
    assert "videoFileInput" in response.text
    assert "videoImportDrawer" in response.text
    assert "Upload from PC" in response.text
    assert "quickVideoUrlInput" in response.text
    assert "fetchVideoFromUrl" in response.text

def test_auto_clip_page():
    response = client.get("/auto-clip")
    assert response.status_code == 200
    assert "Auto Clip &amp; Shorts Studio" in response.text or "Auto Clip" in response.text
    assert "Upload Video from PC" in response.text
    assert "clipFileInput" in response.text
    assert "clipPcContainer" in response.text

def test_jobs_page():
    response = client.get("/jobs")
    assert response.status_code == 200
    assert "Queue &amp; Job Manager" in response.text or "Queue & Job Manager" in response.text

def test_recent_page():
    response = client.get("/recent")
    assert response.status_code == 200
    assert "Recent Session Downloads" in response.text

def test_settings_page():
    response = client.get("/settings")
    assert response.status_code == 200
    assert "Settings &amp; Preferences" in response.text or "Settings & Preferences" in response.text

def test_faq_page():
    response = client.get("/faq")
    assert response.status_code == 200
    assert "Frequently Asked Questions" in response.text

def test_static_css_and_js():
    css_res = client.get("/static/css/liquid-glass.css")
    assert css_res.status_code == 200
    assert ".glass" in css_res.text

    js_res = client.get("/static/js/navbar.js")
    assert js_res.status_code == 200
    assert "playGlassTick" in js_res.text
