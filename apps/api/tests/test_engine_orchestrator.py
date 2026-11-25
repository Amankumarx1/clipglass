import os
import subprocess
import pytest
from unittest.mock import patch, MagicMock
from schemas.clip import TranscriptWord, TranscriptSentence
from engine.probe.metadata_probe import ProbeResult
from engine.pipeline.orchestrator import run_zero_download_pipeline

def test_run_zero_download_pipeline_mocked(tmp_path):
    job_dir = str(tmp_path)
    synth_slice = os.path.join(job_dir, "synthetic_slice.mp4")

    # Create 35-second synthetic video as mock sliced byte-range
    cmd = [
        "ffmpeg", "-y",
        "-f", "lavfi", "-i", "testsrc=size=1920x1080:rate=30:duration=35",
        "-f", "lavfi", "-i", "sine=frequency=440:duration=35",
        "-c:v", "libx264", "-c:a", "aac", synth_slice
    ]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    assert os.path.exists(synth_slice)

    mock_probe = ProbeResult(
        url="https://youtube.com/watch?v=mocktest",
        title="Zero Download Mock Title",
        channel="Mock Creator",
        duration=60,
        heatmap=[0.2] * 20 + [0.9] * 20 + [0.3] * 20,
        storyboard_cuts=[0.0] * 60,
        chapters=[{"start_time": 0, "title": "Intro"}, {"start_time": 20, "title": "Highlight"}],
        words=[
            TranscriptWord(word="Wait", start=20.0, end=20.5),
            TranscriptWord(word="for", start=20.5, end=21.0),
            TranscriptWord(word="the", start=21.0, end=21.5),
            TranscriptWord(word="drop", start=21.5, end=22.5),
        ],
        sentences=[
            TranscriptSentence(text="Wait for the drop.", start=20.0, end=22.5, words=[
                TranscriptWord(word="Wait", start=20.0, end=20.5),
                TranscriptWord(word="for", start=20.5, end=21.0),
                TranscriptWord(word="the", start=21.0, end=21.5),
                TranscriptWord(word="drop", start=21.5, end=22.5),
            ])
        ],
        dash_formats={
            "video": {"height": 1080, "url": "https://video.mock"},
            "audio": {"ext": "m4a", "url": "https://audio.mock"}
        },
        has_captions=True
    )

    events_received = []
    def progress_tracker(stage, percent, step, clips):
        events_received.append((stage, percent, step))

    # Mock probe and slice
    with patch("engine.pipeline.orchestrator.probe_youtube_video", return_value=(mock_probe, None)):
        with patch("engine.pipeline.orchestrator.slice_winning_moment", return_value=(True, synth_slice, None)):
            ok, clips, err = run_zero_download_pipeline(
                url="https://youtube.com/watch?v=mocktest",
                job_dir=job_dir,
                target_min=20,
                target_max=40,
                clip_count=2,
                reframe_mode="center",
                caption_preset="viral_pop",
                polish_style="none",
                progress_cb=progress_tracker
            )

            assert ok is True
            assert err is None
            assert len(clips) >= 1
            top_clip = clips[0]
            assert top_clip.status == "ready"
            assert top_clip.videoUrl is not None
            assert top_clip.srtUrl is not None
            assert top_clip.score >= 50

            # Check stages in progress events
            stages = [e[0] for e in events_received]
            assert "probe" in stages
            assert "scoring" in stages
            assert "slicing" in stages
            assert "rendering" in stages
            assert "ready" in stages
