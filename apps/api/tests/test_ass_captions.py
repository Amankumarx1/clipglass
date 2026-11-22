import os
import pytest
from schemas.clip import TranscriptWord
from services.ass_caption_service import format_ass_time, generate_ass_subtitles

def test_format_ass_time():
    assert format_ass_time(0.0) == "0:00:00.00"
    assert format_ass_time(65.25) == "0:01:05.25"
    assert format_ass_time(3661.5) == "1:01:01.50"

def test_generate_ass_subtitles_with_hook_title(tmp_path):
    words = [
        TranscriptWord(word="Hello", start=1.0, end=1.5),
        TranscriptWord(word="world", start=1.6, end=2.0),
        TranscriptWord(word="this", start=2.1, end=2.4),
        TranscriptWord(word="is", start=2.5, end=2.7),
        TranscriptWord(word="ClipGlass", start=2.8, end=3.5),
    ]

    out_file = str(tmp_path / "test.ass")
    generate_ass_subtitles(
        words,
        out_file,
        preset="viral_pop",
        clip_offset=1.0,
        hook_title="YOU WILL NOT BELIEVE THIS"
    )

    assert os.path.exists(out_file)
    with open(out_file, "r", encoding="utf-8") as f:
        content = f.read()

    # Validate ASS headers
    assert "[Script Info]" in content
    assert "PlayResX: 1080" in content
    assert "PlayResY: 1920" in content
    assert "[V4+ Styles]" in content
    assert "Style: Default" in content
    assert "Style: HookTitle" in content

    # Validate HookTitle event
    assert "HookTitle" in content
    assert "YOU WILL NOT BELIEVE THIS" in content
    assert "{\\fad(150,250)}" in content

    # Validate Dialogue events and Karaoke tags
    assert "Dialogue:" in content
    assert "{\\k" in content
    assert "ClipGlass" in content

def test_caption_presets(tmp_path):
    presets = ['viral_pop', 'minimalist', 'neon_cyber', 'karaoke', 'headline', 'dynamic_box']
    words = [TranscriptWord(word="Test", start=0.0, end=1.0)]

    for p in presets:
        out_file = str(tmp_path / f"test_{p}.ass")
        generate_ass_subtitles(words, out_file, preset=p)
        assert os.path.exists(out_file)
        with open(out_file, "r", encoding="utf-8") as f:
            c = f.read()
            assert "PlayResX: 1080" in c
            assert "Dialogue:" in c
