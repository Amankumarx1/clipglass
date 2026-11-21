import os
import subprocess
import pytest
from schemas.clip import ClipMoment, TranscriptWord
from services.clip_render_service import render_clip_segment, package_clips_zip

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
        hook="WAIT FOR THIS",
        title="Epic Test Moment",
        hashtags=["#test", "#clip"],
        reason="Peak energy segment.",
        reframeMode="follow-face",
        captionPreset="viral_pop",
        words=words
    )

    # 3. Render 9:16 vertical segment with ASS burning
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
