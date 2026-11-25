import os
import subprocess
import pytest
from fastapi.testclient import TestClient
from app.main import app
from schemas.clip import ClipMoment, TranscriptWord, ClipJobCreateRequest
from services.clip_render_service import render_clip_segment, package_clips_zip
from services.clip_queue_service import clip_job_manager

client = TestClient(app)

def test_clip_pipeline_render_and_zip(tmp_path):
    job_dir = str(tmp_path)
    source_video = os.path.join(job_dir, "source.mp4")

    # 1. Create synthetic 1920x1080 4-second video with tone audio
    cmd_src = [
        "ffmpeg", "-y",
        "-f", "lavfi", "-i", "testsrc=size=1920x1080:rate=30:duration=4",
        "-f", "lavfi", "-i", "sine=frequency=440:duration=4",
        "-c:v", "libx264", "-c:a", "aac", source_video
    ]
    subprocess.run(cmd_src, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    assert os.path.exists(source_video)

    # 2. Build ClipMoment
    words = [
        TranscriptWord(word="Wait", start=1.0, end=1.5),
        TranscriptWord(word="for", start=1.5, end=2.0),
        TranscriptWord(word="the", start=2.0, end=2.5),
        TranscriptWord(word="end", start=2.5, end=3.5),
    ]
    clip = ClipMoment(
        clipId="testclip01",
        start=1.0,
        end=3.8,
        duration=2.8,
        score=94,
        hookScore=96,
        engagementScore=92,
        valueScore=90,
        shareabilityScore=95,
        hook="WAIT FOR THIS",
        title="Epic Test Moment",
        hashtags=["#test", "#clip"],
        reason="Peak energy segment.",
        evidence=["Heatmap peak 95%", "Audio burst +14dB"],
        reframeMode="follow-face",
        captionPreset="viral_pop",
        words=words
    )

    # 3. Render 9:16 vertical segment with ASS burning and opening hook
    ok, mp4_path, err = render_clip_segment(source_video, job_dir, clip, width=1920, height=1080)
    assert ok is True
    assert mp4_path is not None
    assert os.path.exists(mp4_path)
    assert os.path.getsize(mp4_path) > 1000

    # 4. Verify 1080x1920 vertical resolution
    probe = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0",
         "-show_entries", "stream=width,height", "-of", "csv=s=x:p=0", mp4_path],
        capture_output=True, text=True
    )
    res_str = probe.stdout.strip()
    assert res_str == "1080x1920"

    # 5. Verify companion SRT and metadata JSON
    srt_file = os.path.join(job_dir, "clip_testclip01.srt")
    json_file = os.path.join(job_dir, "clip_testclip01.json")
    assert os.path.exists(srt_file)
    assert os.path.exists(json_file)

    # 6. Test ZIP bundle packaging
    zip_path = package_clips_zip(job_dir, [clip])
    assert zip_path is not None
    assert os.path.exists(zip_path)
    assert os.path.getsize(zip_path) > 500

def test_api_polish_styles_endpoint():
    res = client.get("/api/clip/polish-styles")
    assert res.status_code == 200
    data = res.json()
    assert "styles" in data
    assert len(data["styles"]) >= 4

def test_api_job_consent_validation():
    # Attempt job creation without consent
    res = client.post("/api/clip/jobs", json={
        "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "consent": False
    })
    assert res.status_code == 400
    assert "Consent Required" in res.text

def test_api_feedback_and_edit_box():
    # Setup dummy job in manager
    req = ClipJobCreateRequest(
        url="https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        consent=True
    )
    job_id = clip_job_manager.create_job(req, "127.0.0.1")
    rec = clip_job_manager.get_job(job_id)

    clip = ClipMoment(
        clipId="cid99",
        start=10.0,
        end=35.0,
        duration=25.0,
        score=90,
        hook="INITIAL HOOK",
        title="Initial Title",
        reason="test"
    )
    rec.clips.append(clip)

    # Test feedback endpoint
    fb_res = client.post(f"/api/clip/jobs/{job_id}/clips/cid99/feedback", json={"thumb": "up"})
    assert fb_res.status_code == 200
    assert fb_res.json()["thumb"] == "up"
    assert clip.feedback == "up"

    # Test edit box command endpoint
    cmd_res = client.post(f"/api/clip/jobs/{job_id}/clips/cid99/command", json={"command": "make it 5s longer"})
    assert cmd_res.status_code == 200
    res_data = cmd_res.json()
    assert res_data["result"]["success"] is True
    assert clip.duration == 30.0
    assert clip.end == 40.0

def test_api_clip_upload_and_cancel(tmp_path):
    video_path = tmp_path / "sample_upload.mp4"
    cmd = [
        "ffmpeg", "-y", "-f", "lavfi", "-i", "testsrc=size=320x240:rate=10:duration=1",
        "-c:v", "libx264", str(video_path)
    ]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)

    with open(video_path, "rb") as f:
        res = client.post(
            "/api/clip/upload",
            files={"file": ("sample_upload.mp4", f, "video/mp4")},
            data={"consent": "true", "clipCount": "2", "minLength": "10", "maxLength": "30"}
        )
    assert res.status_code == 200
    data = res.json()
    assert "jobId" in data
    job_id = data["jobId"]

    # Test cancel endpoint
    cancel_res = client.post(f"/api/clip/jobs/{job_id}/cancel")
    assert cancel_res.status_code == 200
    assert cancel_res.json()["message"] == "Clip job cancelled."

def test_api_trim_upload(tmp_path):
    video_path = tmp_path / "test_trim.mp4"
    cmd = [
        "ffmpeg", "-y", "-f", "lavfi", "-i", "testsrc=size=320x240:rate=10:duration=3",
        "-c:v", "libx264", str(video_path)
    ]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)

    with open(video_path, "rb") as f:
        res = client.post(
            "/api/v1/jobs/trim-upload",
            files={"file": ("test_trim.mp4", f, "video/mp4")},
            data={"startTime": "00:00:01", "endTime": "00:00:02", "mode": "copy"}
        )
    assert res.status_code == 200
    assert res.headers["content-type"] == "video/mp4"
    assert len(res.content) > 500

def test_download_clip_renders_on_demand(tmp_path):
    clip_job_manager.active_jobs_per_ip["127.0.0.1"] = 0
    # Setup job with a local synthesized video
    video_path = tmp_path / "source.mp4"
    cmd = [
        "ffmpeg", "-y", "-f", "lavfi", "-i", "testsrc=size=320x240:rate=10:duration=3",
        "-f", "lavfi", "-i", "sine=frequency=440:duration=3",
        "-c:v", "libx264", "-c:a", "aac", str(video_path)
    ]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)

    req = ClipJobCreateRequest(
        url="local://sample",
        consent=True
    )
    job_id = clip_job_manager.create_job(req, "127.0.0.1")
    rec = clip_job_manager.get_job(job_id)
    rec.job_dir = str(tmp_path)
    rec.source_video = str(video_path)

    cid = "ondemand01"
    clip = ClipMoment(
        clipId=cid,
        start=0.5,
        end=2.5,
        duration=2.0,
        score=92,
        hook="ON DEMAND HOOK",
        title="On Demand Test",
        reason="Testing on-demand rendering on download",
        status="discovered"
    )
    rec.clips.append(clip)

    # Calling download before render must render on-demand and return 200 instead of 404
    res = client.get(f"/api/clip/jobs/{job_id}/clips/{cid}/download")
    assert res.status_code == 200
    assert res.headers["content-type"] == "video/mp4"
    assert len(res.content) > 1000
    assert clip.status == "ready"
    clip_job_manager.active_jobs_per_ip["127.0.0.1"] = 0

def test_inspect_video_supports_long_duration_and_live(monkeypatch):
    from services.ytdlp_service import inspect_video

    # 1. 300 minutes (18000s > 240 mins) with 11-char YouTube ID
    mock_meta_long = {
        "id": "dQw4w9WgXcQ",
        "title": "Ultra Long 5-Hour Stream",
        "channel": "LongChannel",
        "duration": 18000,
        "is_live": False,
        "formats": []
    }
    class MockYTDL:
        def __init__(self, opts=None): pass
        def __enter__(self): return self
        def __exit__(self, *args): pass
        def extract_info(self, url, download=False): return dict(mock_meta_long)

    monkeypatch.setattr("yt_dlp.YoutubeDL", MockYTDL)
    res, err = inspect_video("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
    assert err is None
    assert res is not None
    assert res.duration == 18000
    assert res.isLive is False

    # 2. Live stream with 11-char YouTube ID
    mock_meta_live = {
        "id": "Bm8PmWwBxu4",
        "title": "Live Stream Broadcast",
        "channel": "LiveGamer",
        "duration": None,
        "is_live": True,
        "live_status": "is_live",
        "formats": []
    }
    class MockYTDLLive:
        def __init__(self, opts=None): pass
        def __enter__(self): return self
        def __exit__(self, *args): pass
        def extract_info(self, url, download=False): return dict(mock_meta_live)

    monkeypatch.setattr("yt_dlp.YoutubeDL", MockYTDLLive)
    res_live, err_live = inspect_video("https://www.youtube.com/live/Bm8PmWwBxu4")
    assert err_live is None
    assert res_live is not None
    assert res_live.isLive is True
    assert res_live.duration > 0
