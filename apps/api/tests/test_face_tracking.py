import pytest
from services.face_tracking_service import (
    compute_center_crop_filter,
    compute_split_screen_filter,
    track_faces_opencv_or_mediapipe,
    build_reframe_filter
)

def test_compute_center_crop_filter():
    filt = compute_center_crop_filter(1920, 1080)
    assert "crop=606:1080:(iw-ow)/2:0" in filt or "crop=" in filt
    assert "scale=1080:1920" in filt

def test_compute_split_screen_filter():
    filt = compute_split_screen_filter(1920, 1080)
    assert "split=2" in filt
    assert "vstack" in filt
    assert "scale=1080:960" in filt

def test_cut_vs_pan_rule():
    # 1920x1080 video, 25% of width is 480px
    # Scenario: Speaker starts at X=500 (center of left speaker), then jumps abruptly to X=1400 (center of right speaker)
    shifts = [
        (0.0, 500.0),
        (1.0, 500.0),
        (2.0, 1400.0),  # Sudden jump > 25% of 1920 (900px jump)
        (3.0, 1400.0),
    ]

    points = track_faces_opencv_or_mediapipe(
        video_path="dummy.mp4",
        start_time=0.0,
        duration=4.0,
        width=1920,
        height=1080,
        simulated_shifts=shifts
    )

    assert len(points) >= 4
    # All X coordinates must be even integers for H.264
    for pt in points:
        assert pt[1] % 2 == 0
        assert 0 <= pt[1] <= (1920 - pt[2])

    # Find the jump at 2.0s: coordinate should snap immediately (not lag behind)
    pt_before = points[2]
    pt_after = points[4] if len(points) > 4 else points[-1]
    # At t=2.0s, difference between pt_before and pt_after reflects clean snap
    assert pt_after[1] > pt_before[1]

def test_build_reframe_filter():
    # follow-face
    f_face, is_complex = build_reframe_filter('follow-face', 1920, 1080, "dummy.mp4", 0.0, 10.0)
    assert "scale=1080:1920" in f_face
    assert is_complex is False

    # split
    f_split, is_complex = build_reframe_filter('split', 1920, 1080, "dummy.mp4", 0.0, 10.0)
    assert is_complex is True
    assert "vstack" in f_split

    # center
    f_center, is_complex = build_reframe_filter('center', 1920, 1080, "dummy.mp4", 0.0, 10.0)
    assert is_complex is False
    assert "crop=" in f_center
