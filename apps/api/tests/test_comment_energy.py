import os
import json
import pytest
from services.comment_energy_service import (
    score_comment_text_energy,
    extract_timestamps_from_text,
    parse_live_chat_replay_file,
    compute_comment_energy_signal
)
from services.signal_analysis_service import analyze_multimodal_signals
from services.clip_scoring_service import heuristic_score_clips
from schemas.clip import MultimodalSignals, TranscriptSentence, TranscriptWord

def test_comment_text_energy_scoring():
    # Shouting + Hype + Emojis
    hype_text = "LMAOOOO NO WAYYY THAT WAS INSANE 🔥🔥🔥💀💀"
    hype_score = score_comment_text_energy(hype_text)
    assert hype_score >= 0.75

    # Exclamation burst
    excl_text = "WHAT JUST HAPPENED?!?!?! OMG"
    excl_score = score_comment_text_energy(excl_text)
    assert excl_score >= 0.65

    # Calm baseline comment
    calm_text = "Good tutorial, thanks for explaining."
    calm_score = score_comment_text_energy(calm_text)
    assert calm_score < 0.40
    assert hype_score > calm_score

def test_timestamp_extraction_from_comments():
    sample_text = "Best moments: 0:45 funny part, 12:34 epic clutch! and 1:05:20 the finale"
    timestamps = extract_timestamps_from_text(sample_text)
    assert timestamps == [45, 754, 3920]

    # Edge cases
    assert extract_timestamps_from_text("") == []
    assert extract_timestamps_from_text("no timestamps here") == []
    assert extract_timestamps_from_text("meet at 14:30") == [870]

def test_parse_live_chat_replay_file(tmp_path):
    chat_file = tmp_path / "test_stream.live_chat.json"
    actions = [
        {
            "videoOffsetTimeMsec": "15000",
            "replayChatItemAction": {
                "actions": [
                    {
                        "addChatItemAction": {
                            "item": {
                                "liveChatTextMessageRenderer": {
                                    "message": {"runs": [{"text": "POGGERS LMAO 🔥🔥🔥"}]},
                                    "authorName": {"simpleText": "SuperFan"}
                                }
                            }
                        }
                    }
                ]
            }
        },
        {
            "videoOffsetTimeMsec": "45000",
            "replayChatItemAction": {
                "actions": [
                    {
                        "addChatItemAction": {
                            "item": {
                                "liveChatTextMessageRenderer": {
                                    "message": {"runs": [{"text": "W STREAMER LETS GOOO"}]},
                                    "authorName": {"simpleText": "ProGamer"}
                                }
                            }
                        }
                    }
                ]
            }
        }
    ]

    with open(chat_file, "w", encoding="utf-8") as f:
        for a in actions:
            f.write(json.dumps(a) + "\n")

    parsed = parse_live_chat_replay_file(str(chat_file))
    assert len(parsed) == 2
    assert parsed[0]["time_sec"] == 15.0
    assert "POGGERS" in parsed[0]["text"]
    assert parsed[0]["energy"] > 0.6

    assert parsed[1]["time_sec"] == 45.0
    assert "LETS GOOO" in parsed[1]["text"]

def test_compute_comment_energy_signal_peaks():
    duration = 120
    comments = [
        {
            "author": "Viewer1",
            "text": "12:34 wait wait wait this is the wrong video",
            "like_count": 2
        },
        {
            "author": "Viewer2",
            "text": "0:45 BRO HE HIT THE CLIP HOLY SHIT 🔥🔥🔥😱",
            "like_count": 85
        },
        {
            "author": "Viewer3",
            "text": "0:46 LMAOOOOOO NO SHOT",
            "like_count": 40
        }
    ]

    energy_bins, peaks = compute_comment_energy_signal(duration, comments=comments)
    assert len(energy_bins) == duration
    # Peak should be around 45-50s due to clustered high-energy comments with high likes
    assert max(energy_bins[43:52]) > 0.8
    assert len(peaks) >= 1
    assert any("BRO HE HIT THE CLIP" in p["quote"] for p in peaks)

def test_multimodal_signals_comment_energy_fusion():
    comments = [
        {"author": "LiveUser", "text": "0:30 CRAZY MOMENT 🔥🔥🔥", "like_count": 20}
    ]
    signals = analyze_multimodal_signals(
        video_path="https://www.youtube.com/watch?v=sample123",
        duration=90.0,
        chapters=[],
        heatmap=[],
        comments=comments
    )

    assert len(signals.comment_energy) == 90
    assert max(signals.comment_energy[28:38]) > 0.6
    # Bursts should be synthesized from the energetic comment spike
    assert max(signals.burst[28:38]) >= 0.6

def test_heuristic_clipping_ranks_energetic_comment_first():
    duration = 150
    comment_bins = [0.0] * duration
    # Energetic spike between 40s and 65s
    for s in range(40, 65):
        comment_bins[s] = 0.95

    signals = MultimodalSignals(
        loudness=[0.5] * duration,
        burst=[0.2] * duration,
        scene_cuts=[0.0] * duration,
        chapters=[0.0] * duration,
        heatmap=[0.3] * duration,
        comment_energy=comment_bins,
        duration_seconds=duration
    )

    sentences = [
        TranscriptSentence(
            text="Welcome to the livestream everyone today is gonna be quiet.",
            start=0.0, end=15.0,
            words=[TranscriptWord(word="Welcome", start=0.0, end=1.0)]
        ),
        TranscriptSentence(
            text="Wait a second look at this crazy encounter right now holy cow!",
            start=42.0, end=70.0,
            words=[TranscriptWord(word="Wait", start=42.0, end=43.0)]
        ),
        TranscriptSentence(
            text="And that wraps up today's broadcast thank you all for watching.",
            start=110.0, end=130.0,
            words=[TranscriptWord(word="And", start=110.0, end=111.0)]
        )
    ]

    clips = heuristic_score_clips(signals, sentences, clip_count=2, min_dur=20, max_dur=45)
    assert len(clips) >= 1
    top_clip = clips[0]

    # The top ranked clip must overlap the energetic chat spike (40-65s)
    assert 35.0 <= top_clip.start <= 50.0
    # Must have Chat Burst evidence badge
    assert any("Chat Burst" in e or "Chat Spike" in e for e in top_clip.evidence)
    assert top_clip.score >= 85

def test_ingest_supports_live_streams_with_dvr(monkeypatch, tmp_path):
    from services.clip_ingest_service import ingest_video_and_metadata

    mock_meta = {
        "title": "GTA 6 Live Stream",
        "uploader": "StreamerDude",
        "duration": None,
        "is_live": True,
        "live_status": "is_live",
        "formats": [
            {
                "url": "https://manifest.googlevideo.com/api/manifest/hls_variant/.../playlist_duration/1200/manifest_duration/1200/file/index.m3u8"
            }
        ],
        "comments": [
            {"author": "Chatter", "text": "10:30 CRAZY SHOT 🔥", "like_count": 15}
        ]
    }

    class MockYoutubeDL:
        def __init__(self, opts=None):
            self.opts = opts or {}
        def __enter__(self):
            return self
        def __exit__(self, exc_type, exc_val, exc_tb):
            pass
        def extract_info(self, url, download=False):
            return dict(mock_meta)
        def download(self, urls):
            pass

    monkeypatch.setattr("yt_dlp.YoutubeDL", MockYoutubeDL)

    res, err = ingest_video_and_metadata("https://www.youtube.com/live/Bm8PmWwBxu4", str(tmp_path), duration_cap=3600)
    assert err is None
    assert res is not None
    assert res.is_live is True
    assert res.duration == 1200.0
    assert len(res.comments) == 1
    assert "GTA 6 Live Stream" in res.title
