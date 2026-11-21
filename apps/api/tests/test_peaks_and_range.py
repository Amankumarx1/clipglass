import pytest
from fastapi.testclient import TestClient
from app.main import app
from services.queue_service import job_manager

client = TestClient(app)

def test_peaks_endpoint_not_found():
    response = client.get("/api/v1/jobs/0123456789abcdef0123456789abcdef/peaks")
    assert response.status_code == 404

def test_expired_file_returns_410():
    fake_job_id = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
    job_manager.expired_jobs.add(fake_job_id)
    response = client.get(f"/api/v1/jobs/{fake_job_id}/file")
    assert response.status_code == 410
    assert "expired" in response.json()["detail"].lower()

