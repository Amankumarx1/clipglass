import pytest
import urllib.parse
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

YOUTUBE_TEST_URL = "https://youtu.be/DXw_OjhxrzQ?si=dB0G4fJqLih8Kg5g"

def test_studio_page_routes():
    # Both /studio and /audio-studio must serve the Studio template with 200 OK
    for route in ["/studio", "/audio-studio"]:
        res = client.get(route)
        assert res.status_code == 200
        assert "Studio" in res.text
        assert "studio.js" in res.text
        assert "Auto Mode: AI Audio Intelligence" in res.text
        assert "Dynamic 10-Band EQ" in res.text
        assert "Mastering Bus Compressor" in res.text
        assert "True-Peak Safety Limiter" in res.text
        assert "Loudness &amp; Dynamics" in res.text or "Loudness & Dynamics" in res.text

def test_studio_inspect_real_youtube_url():
    # Inspect the user-provided YouTube URL
    encoded_url = urllib.parse.quote(YOUTUBE_TEST_URL)
    res = client.get(f"/api/inspect?url={encoded_url}")
    assert res.status_code == 200
    data = res.json()
    assert data["title"] is not None
    assert "Jaadu" in data["title"] or "Darshan Raval" in data["title"]
    assert data["duration"] > 0
    assert data["thumbnail"] is not None

def test_studio_audio_job_creation_and_file():
    # Create audio job for this stream
    job_payload = {
        "url": YOUTUBE_TEST_URL,
        "mode": "audio",
        "format": "mp3",
        "quality": "best",
        "consent": True
    }
    create_res = client.post("/api/v1/jobs", json=job_payload)
    assert create_res.status_code == 200
    job_id = create_res.json()["jobId"]
    assert job_id is not None

    # Check status endpoint
    status_res = client.get(f"/api/v1/jobs/{job_id}/status")
    assert status_res.status_code == 200
    s_data = status_res.json()
    assert s_data["jobId"] == job_id
    assert s_data["state"] in ["queued", "downloading", "converting", "ready"]

def test_studio_all_79_modules_registered_in_js():
    # Verify studio.js has all 79 modules (19 manual + 60 automated A01-A60)
    js_res = client.get("/static/js/studio.js")
    assert js_res.status_code == 200
    js_text = js_res.text

    # Verify 19 Manual Modules
    manual_modules = [
        "lush_plate", "cathedral_hall", "ping_pong_delay", "tape_echo",
        "vintage_chorus", "optical_flanger", "harmonic_tremolo",
        "parametric_eq", "warm_pultec", "air_band",
        "bus_compressor", "brickwall_limiter", "optical_leveler",
        "tube_saturation", "bitcrusher",
        "haas_widener", "bass_mono",
        "de_esser", "vocal_clarity"
    ]
    for mod_id in manual_modules:
        assert mod_id in js_text, f"Manual module {mod_id} missing from studio.js"

    # Verify 60 Automated Modules A01 to A60
    for i in range(1, 61):
        code = f"A{i:02d}"
        assert f"code: '{code}'" in js_text or f'code: "{code}"' in js_text, f"Automated module {code} missing from studio.js"

    # Verify Core Specs: Safety Limiter -1.0 dBTP, Master Gain -6.0 dB, Loudness Matched A/B
    assert "-1.0" in js_text  # Safety limiter ceiling
    assert "-6.0" in js_text  # Master gain default
    assert "setAuditionMode" in js_text
    assert "integratedLufs" in js_text
