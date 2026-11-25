import os
import pytest
from engine.reframe.speaker_switch import hard_cut_speaker_switching
from engine.reframe.crop_calculator import build_reframe_filter
from engine.captions.ass_generator import create_kinetic_ass_subtitles
from engine.captions.presets import PRESET_STYLES
from engine.edit.nl_compiler import compile_natural_language_edit
from schemas.clip import ClipMoment, TranscriptWord

def test_hard_cut_speaker_switching():
    # Frame 1: Speaker 1 at x=300
    # Frame 2: Speaker 1 slight head tilt to x=320 (delta 20 < 480 -> smoothed)
    # Frame 3: Speaker 2 speaks across the table at x=1400 (delta 1080 > 480 -> hard cut snap!)
    raw = [
        (0.0, 300, 400),
        (0.5, 320, 400),
        (1.0, 1400, 400)
    ]
    switched = hard_cut_speaker_switching(raw, frame_width=1920, cut_threshold_ratio=0.25)
    assert len(switched) == 3
    # Frame 2 should be mildly smoothed
    assert 300 <= switched[1][1] <= 320
    # Frame 3 must snap immediately to 1400 without progressive panning
    assert switched[2][1] == 1400

def test_reframe_filter_builder():
    filter_center = build_reframe_filter("center", 1920, 1080)
    assert "scale=1080:1920" in filter_center

    filter_split = build_reframe_filter("split", 1920, 1080)
    assert "vstack" in filter_split

def test_kinetic_ass_subtitles(tmp_path):
    out_ass = str(tmp_path / "test.ass")
    words = [
        TranscriptWord(word="Watch", start=1.0, end=1.5),
        TranscriptWord(word="this", start=1.5, end=2.0),
        TranscriptWord(word="now", start=2.0, end=2.8),
    ]

    create_kinetic_ass_subtitles(
        words=words,
        out_path=out_ass,
        preset="viral_pop",
        clip_offset=0.0,
        hook_title="HOOK TITLE",
        duration=3.0
    )

    assert os.path.exists(out_ass)
    with open(out_ass, "r", encoding="utf-8") as f:
        content = f.read()
    assert "[Script Info]" in content
    assert "HOOK TITLE" in content
    assert "Watch" in content

def test_nl_edit_compiler():
    clip = ClipMoment(
        clipId="test01",
        start=10.0,
        end=40.0,
        duration=30.0,
        score=90,
        hook="Test Hook",
        title="Test Title",
        reason="Peak"
    )

    # 1. Trim 3s off end
    res1 = compile_natural_language_edit("trim 3s off the end", clip)
    assert res1.success is True
    assert clip.end == 37.0
    assert clip.duration == 27.0

    # 2. Change caption preset to neon_cyber
    res2 = compile_natural_language_edit("make captions neon_cyber", clip)
    assert res2.success is True
    assert clip.captionPreset == "neon_cyber"
