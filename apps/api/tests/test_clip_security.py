import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_clip_job_requires_consent():
    res = client.post("/api/clip/jobs", json={
        "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "consent": False
    })
    assert res.status_code == 400
    detail = res.json().get("detail", {})
    assert detail.get("code") == "consent-required"

def test_clip_job_invalid_id_format():
    res = client.get("/api/clip/jobs/invalid-job-id-format/clips")
    assert res.status_code == 400

def test_clip_job_nonexistent_returns_404():
    res = client.get("/api/clip/jobs/11112222333344445555666677778888/clips")
    assert res.status_code == 404
