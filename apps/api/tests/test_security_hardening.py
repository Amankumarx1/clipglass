import pytest
import os
import re
from fastapi.testclient import TestClient
from app.main import app
from services.ass_caption_service import generate_ass_subtitles
from services.creative_fx_service import sanitize_hook_text
from schemas.clip import TranscriptWord
from app.config import settings

client = TestClient(app)

def test_security_headers_present():
    """Verify essential security headers (nosniff, frame denial, CSP, etc.) are injected."""
    res = client.get("/health")
    assert res.status_code == 200
    assert res.headers.get("X-Content-Type-Options") == "nosniff"
    assert res.headers.get("X-Frame-Options") == "DENY"
    assert res.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"
    assert "Content-Security-Policy" in res.headers
    assert "default-src 'self'" in res.headers["Content-Security-Policy"]
    assert "frame-ancestors 'none'" in res.headers["Content-Security-Policy"]

def test_clip_job_ssrf_prevention():
    """Verify that malicious URLs (userinfo spoofing, non-YouTube domains, internal IP ranges) are rejected."""
    # Userinfo spoofing
    payload_spoof = {
        "url": "https://youtube.com:80@attacker.com/watch?v=12345678901",
        "consent": True
    }
    res1 = client.post("/api/clip/jobs", json=payload_spoof)
    assert res1.status_code == 400

    # Non-YouTube domain
    payload_evil = {
        "url": "https://evil.com/video.mp4",
        "consent": True
    }
    res2 = client.post("/api/clip/jobs", json=payload_evil)
    assert res2.status_code == 400

    # Localhost / internal network SSRF
    payload_local = {
        "url": "http://127.0.0.1:8000/internal",
        "consent": True
    }
    res3 = client.post("/api/clip/jobs", json=payload_local)
    assert res3.status_code == 400

def test_clip_job_path_traversal_prevention():
    """Verify that path traversal sequences and invalid clip IDs are strictly blocked."""
    # 1. Path traversal in URL path is normalized/rejected (404 or 400)
    res1 = client.get("/api/clip/jobs/../../../etc/passwd/clips/1/download")
    assert res1.status_code in (400, 404)

    fake_job_id = "0123456789abcdef0123456789abcdef"
    res2 = client.get(f"/api/clip/jobs/{fake_job_id}/clips/..%2f..%2fetc/download")
    assert res2.status_code in (400, 404)

    # 2. Invalid clip ID characters (preventing directory traversal / injection)
    res3 = client.get(f"/api/clip/jobs/{fake_job_id}/clips/invalid*chars/download")
    assert res3.status_code == 400

    res4 = client.get(f"/api/clip/jobs/{fake_job_id}/clips/bad..id/download")
    assert res4.status_code == 400

def test_ass_caption_injection_sanitization(tmp_path):
    """Verify that hook title and word inputs cannot inject ASS override tags or multi-line events."""
    out_file = str(tmp_path / "test.ass")
    malicious_hook = "VIRAL HOOK\n[Events]\nDialogue: 0,0:00:00.00,0:00:10.00,Default,,0,0,0,,{\\r}PWNED"
    words = [TranscriptWord(word="test{\\b1}bold", start=0.5, end=1.0, score=0.9)]
    
    generate_ass_subtitles(words, out_file, hook_title=malicious_hook)
    assert os.path.exists(out_file)

    with open(out_file, "r", encoding="utf-8") as f:
        content = f.read()

    # Verify no raw unescaped newlines inside the hook text injected a secondary [Events] section
    assert content.count("[Events]") == 1
    # Verify curly braces were stripped from hook
    assert "{\\r}" not in content
    # Verify curly braces were stripped from words
    assert "{\\b1}" not in content

def test_creative_fx_hook_sanitization():
    """Verify that colons, percents, quotes, and backslashes in hook text are escaped or stripped."""
    text = 'ALERT: 100% "CRAZY" \\test/'
    sanitized = sanitize_hook_text(text)
    assert '"' not in sanitized
    assert "'" not in sanitized
    assert "\\" not in sanitized.replace("\\:", "").replace("\\%", "")
    assert "\\:" in sanitized
    assert "\\%" in sanitized
