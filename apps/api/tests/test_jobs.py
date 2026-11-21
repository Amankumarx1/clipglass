import pytest
import sys
from pathlib import Path
from fastapi.testclient import TestClient

api_dir = Path(__file__).resolve().parent.parent
if str(api_dir) not in sys.path:
    sys.path.insert(0, str(api_dir))

from app.main import app

client = TestClient(app)

def test_healthz_endpoint():
    response = client.get("/healthz")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "ytdlpVersion" in data
    assert data["ffmpegAvailable"] is True

def test_job_creation_requires_consent():
    payload = {
        "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "mode": "video",
        "consent": False
    }
    response = client.post("/api/v1/jobs", json=payload)
    assert response.status_code == 400
    data = response.json()
    assert data["detail"]["code"] == "consent-required"

def test_inspect_rejects_ssrf():
    payload = {"url": "http://169.254.169.254/metadata"}
    response = client.post("/api/v1/inspect", json=payload)
    assert response.status_code == 400
    data = response.json()
    assert data["detail"]["code"] == "invalid-url"
