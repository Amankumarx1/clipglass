import pytest
from schemas.clip import ClipMoment
from services.edit_box_service import EditBoxParser

@pytest.fixture
def sample_clip():
    return ClipMoment(
        clipId="testclip123",
        start=10.0,
        end=40.0,
        duration=30.0,
        score=92,
        hookScore=90,
        engagementScore=94,
        valueScore=88,
        shareabilityScore=91,
        hook="CANNOT BELIEVE THIS HAPPENED",
        title="Epic Stream Highlight",
        hashtags=["#stream", "#epic"],
        reason="Peak energy and retention spike",
        evidence=["Heatmap peak 95%", "Audio burst +14dB"],
        reframeMode="follow-face",
        captionPreset="viral_pop"
    )

def test_extend_end(sample_clip):
    res = EditBoxParser.parse_and_apply("make it 5 seconds longer", sample_clip)
    assert res.success is True
    assert res.operation == "extend_end"
    assert sample_clip.end == 45.0
    assert sample_clip.duration == 35.0

def test_trim_end(sample_clip):
    res = EditBoxParser.parse_and_apply("trim 4 seconds off end", sample_clip)
    assert res.success is True
    assert res.operation == "trim_end"
    assert sample_clip.end == 36.0
    assert sample_clip.duration == 26.0

def test_extend_start(sample_clip):
    res = EditBoxParser.parse_and_apply("start 3 seconds earlier", sample_clip)
    assert res.success is True
    assert res.operation == "extend_start"
    assert sample_clip.start == 7.0
    assert sample_clip.duration == 33.0

def test_trim_start(sample_clip):
    res = EditBoxParser.parse_and_apply("start 2s later", sample_clip)
    assert res.success is True
    assert res.operation == "trim_start"
    assert sample_clip.start == 12.0
    assert sample_clip.duration == 28.0

def test_set_duration(sample_clip):
    res = EditBoxParser.parse_and_apply("set duration to 45s", sample_clip)
    assert res.success is True
    assert res.operation == "set_duration"
    assert sample_clip.duration == 45.0
    assert sample_clip.end == 55.0

def test_switch_caption_preset(sample_clip):
    res = EditBoxParser.parse_and_apply("switch style to neon cyber", sample_clip)
    assert res.success is True
    assert res.operation == "set_caption_preset"
    assert sample_clip.captionPreset == "neon_cyber"

def test_switch_reframe_mode(sample_clip):
    res = EditBoxParser.parse_and_apply("change reframe to split screen", sample_clip)
    assert res.success is True
    assert res.operation == "set_reframe_mode"
    assert sample_clip.reframeMode == "split"

def test_rename_title(sample_clip):
    res = EditBoxParser.parse_and_apply("rename to The Ultimate Revelation", sample_clip)
    assert res.success is True
    assert res.operation == "set_title"
    assert sample_clip.title == "the ultimate revelation" or "The Ultimate Revelation" in sample_clip.title

def test_unrecognized_command(sample_clip):
    res = EditBoxParser.parse_and_apply("fly me to the moon", sample_clip)
    assert res.success is False
    assert res.operation == "unknown"
