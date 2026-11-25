import pytest
from unittest.mock import MagicMock, patch
from engine.probe.heatmap_extractor import extract_normalized_heatmap
from engine.probe.storyboard_diff import extract_storyboard_cuts
from engine.probe.transcript_extractor import parse_json3_subtitles, parse_vtt_subtitles, extract_fastpath_transcript
from engine.probe.metadata_probe import probe_youtube_video, ProbeResult

def test_heatmap_extractor_normalization():
    raw_meta = {
        "heatmap": [
            {"start_time": 0.0, "end_time": 10.0, "value": 10.0},
            {"start_time": 10.0, "end_time": 20.0, "value": 50.0},
            {"start_time": 20.0, "end_time": 30.0, "value": 100.0},
            {"start_time": 30.0, "end_time": 40.0, "value": 20.0},
        ]
    }
    curve = extract_normalized_heatmap(raw_meta, duration_seconds=40)
    assert len(curve) == 40
    # Values should be between 0.0 and 1.0
    assert min(curve) >= 0.0
    assert max(curve) <= 1.0
    # Peak at 20-30s
    assert curve[20] > curve[0]

def test_heatmap_extractor_empty_fallback():
    curve = extract_normalized_heatmap({}, duration_seconds=30)
    assert len(curve) == 30
    assert all(v == 0.05 for v in curve)

def test_transcript_extractor_json3():
    raw_json = {
        "events": [
            {
                "tStartMs": 1000,
                "dDurationMs": 2500,
                "segs": [
                    {"utf8": "Hello "},
                    {"utf8": "world", "tOffsetMs": 800},
                    {"utf8": " [Music]"}
                ]
            },
            {
                "tStartMs": 4000,
                "dDurationMs": 1500,
                "segs": [
                    {"utf8": "[Applause] "},
                    {"utf8": "welcome back"}
                ]
            }
        ]
    }
    sentences, words, noise = parse_json3_subtitles(raw_json)
    assert len(sentences) == 2
    assert any(w.word == "Hello" for w in words)
    assert any(w.word == "world" for w in words)
    assert any(w.word == "welcome" for w in words)
    # Check noise markers extracted
    tags = [n["tag"] for n in noise]
    assert "music" in tags
    assert "applause" in tags

def test_transcript_extractor_vtt():
    vtt = """WEBVTT
Kind: captions
Language: en

00:00:01.000 --> 00:00:03.500
<c>This is a</c> <c>test</c> video

00:00:03.500 --> 00:00:06.000
[Music] With some background beats
"""
    sentences, words, noise = parse_vtt_subtitles(vtt)
    assert len(sentences) == 2
    assert words[0].word == "This"
    assert any(n["tag"] == "music" for n in noise)

def test_storyboard_cuts_fallback():
    meta = {
        "chapters": [
            {"start_time": 0, "title": "Intro"},
            {"start_time": 15, "title": "Hook"},
            {"start_time": 30, "title": "Main"}
        ]
    }
    cuts = extract_storyboard_cuts(meta, duration_seconds=45)
    assert len(cuts) == 45
    assert cuts[15] == 0.85
    assert cuts[30] == 0.85

def test_metadata_probe_mocked(tmp_path):
    mock_meta = {
        "title": "Zero Download Test",
        "uploader": "Test Channel",
        "duration": 7200,  # 2 hours, should be capped to 3600
        "chapters": [{"start_time": 0, "title": "Start"}],
        "heatmap": [{"start_time": 0.0, "value": 1.0}],
        "formats": [
            {"format_id": "137", "vcodec": "avc1.640028", "acodec": "none", "height": 1080, "ext": "mp4"},
            {"format_id": "140", "vcodec": "none", "acodec": "mp4a.40.2", "abr": 128, "ext": "m4a"},
            {"format_id": "139", "vcodec": "none", "acodec": "mp4a.40.2", "abr": 48, "ext": "m4a"},
        ],
        "subtitles": {
            "en": [{"ext": "vtt", "url": "https://example.com/sub.vtt"}]
        }
    }

    mock_ydl = MagicMock()
    mock_ydl.__enter__.return_value = mock_ydl
    mock_ydl.extract_info.return_value = mock_meta

    with patch("engine.probe.metadata_probe.yt_dlp.YoutubeDL", return_value=mock_ydl):
        res, err = probe_youtube_video("https://www.youtube.com/watch?v=dQw4w9WgXcQ", duration_cap_seconds=3600)
        assert err is None
        assert res is not None
        assert res.title == "Zero Download Test"
        assert res.channel == "Test Channel"
        assert res.duration == 3600  # Capped duration
        assert res.dash_formats["video"]["height"] == 1080
        assert res.dash_formats["audio"]["ext"] == "m4a"
        assert res.dash_formats["worst_audio"]["abr"] == 48
