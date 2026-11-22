import pytest
from schemas.clip import TranscriptSentence, TranscriptWord, MultimodalSignals, ClipMoment
from services.clip_scoring_service import (
    snap_boundaries_to_sentences,
    heuristic_score_clips,
    rerank_finalists
)

def test_snap_boundaries_to_sentences():
    # Build a timeline of 4 sentences
    sentences = [
        TranscriptSentence(
            text="First sentence begins here.",
            start=5.0,
            end=12.0,
            words=[TranscriptWord(word="First", start=5.0, end=6.0)]
        ),
        TranscriptSentence(
            text="Second sentence delivers the shocking twist.",
            start=12.2,
            end=25.0,
            words=[TranscriptWord(word="Second", start=12.2, end=13.0)]
        ),
        TranscriptSentence(
            text="Third sentence provides the punchline.",
            start=25.5,
            end=38.0,
            words=[TranscriptWord(word="Third", start=25.5, end=27.0)]
        ),
        TranscriptSentence(
            text="Final wrap up remarks.",
            start=38.5,
            end=45.0,
            words=[TranscriptWord(word="Final", start=38.5, end=40.0)]
        ),
    ]

    # Raw cut asked for 10.0 to 30.0 (which cuts mid-sentence)
    snapped_s, snapped_e, text, words = snap_boundaries_to_sentences(
        start=10.0, end=30.0, sentences=sentences, min_dur=15.0, max_dur=60.0
    )

    # Snapped start should snap to sentence start at 5.0 or 12.2
    assert snapped_s in (5.0, 12.2)
    # Snapped end should snap to exact sentence end at 38.0 (>= 15s duration)
    assert snapped_e in (25.0, 38.0)
    assert (snapped_e - snapped_s) >= 15.0
    assert "sentence" in text

def test_heuristic_score_clips_with_subscores_and_evidence():
    dur = 120
    heatmap = [0.0] * dur
    for s in range(35, 55):
        heatmap[s] = 1.0

    loudness = [0.2] * dur
    for s in range(38, 50):
        loudness[s] = 0.9

    burst = [0.1] * dur
    for s in range(35, 40):
        burst[s] = 0.85

    scene_cuts = [0.0] * dur
    scene_cuts[36] = 1.0
    scene_cuts[44] = 1.0

    signals = MultimodalSignals(
        loudness=loudness,
        burst=burst,
        scene_cuts=scene_cuts,
        chapters=[0.0] * dur,
        heatmap=heatmap,
        duration_seconds=dur
    )

    sentences = [
        TranscriptSentence(
            text="Opening remarks and welcome to the show.",
            start=0.0, end=15.0, words=[TranscriptWord(word="Opening", start=0.0, end=1.0)]
        ),
        TranscriptSentence(
            text="Now here is the main viral revelation that shocked everybody.",
            start=35.0, end=55.0, words=[TranscriptWord(word="Now", start=35.0, end=36.0)]
        ),
        TranscriptSentence(
            text="Closing conclusion of the podcast.",
            start=80.0, end=100.0, words=[TranscriptWord(word="Closing", start=80.0, end=81.0)]
        ),
    ]

    clips = heuristic_score_clips(signals, sentences, clip_count=2, min_dur=15, max_dur=45)
    assert len(clips) >= 1
    top = clips[0]

    # Verify 4 sub-scores are populated
    assert 60 <= top.hookScore <= 100
    assert 60 <= top.engagementScore <= 100
    assert 60 <= top.valueScore <= 100
    assert 60 <= top.shareabilityScore <= 100
    assert 60 <= top.score <= 100

    # Verify evidence badges
    assert len(top.evidence) >= 1
    assert any("Heatmap" in e or "Burst" in e or "scene cuts" in e for e in top.evidence)
    assert top.start <= 40.0
    assert top.end >= 50.0

def test_rerank_finalists_duplicate_elimination():
    c1 = ClipMoment(
        clipId="c1", start=10.0, end=40.0, duration=30.0,
        score=95, hookScore=96, engagementScore=94, valueScore=92, shareabilityScore=98,
        hook="FIRST HOOK", title="First Clip", hashtags=[], reason="r1"
    )
    # c2 overlaps heavily with c1 (start=15.0, end=38.0)
    c2 = ClipMoment(
        clipId="c2", start=15.0, end=38.0, duration=23.0,
        score=90, hookScore=90, engagementScore=90, valueScore=90, shareabilityScore=90,
        hook="SECOND HOOK", title="Second Clip", hashtags=[], reason="r2"
    )
    # c3 is completely independent (start=60.0, end=90.0)
    c3 = ClipMoment(
        clipId="c3", start=60.0, end=90.0, duration=30.0,
        score=88, hookScore=88, engagementScore=88, valueScore=88, shareabilityScore=88,
        hook="THIRD HOOK", title="Third Clip", hashtags=[], reason="r3"
    )

    reranked = rerank_finalists([c1, c2, c3], target_count=2)
    assert len(reranked) == 2
    # c1 and c3 should be kept; c2 dropped due to overlap with c1
    ids = [c.clipId for c in reranked]
    assert "c1" in ids
    assert "c3" in ids
    assert "c2" not in ids
