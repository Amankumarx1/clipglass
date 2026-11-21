import pytest
from schemas.clip import TranscriptSentence, TranscriptWord, MultimodalSignals
from services.clip_scoring_service import snap_boundaries_to_sentences, heuristic_score_clips

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

def test_heuristic_score_clips():
    # 120-second video with peak signals at 40s
    dur = 120
    heatmap = [0.0] * dur
    for s in range(35, 55):
        heatmap[s] = 1.0

    loudness = [0.2] * dur
    for s in range(38, 50):
        loudness[s] = 0.9

    signals = MultimodalSignals(
        loudness=loudness,
        burst=[0.1] * dur,
        scene_cuts=[0.0] * dur,
        chapters=[0.0] * dur,
        heatmap=heatmap,
        duration_seconds=dur
    )

    sentences = [
        TranscriptSentence(
            text="Opening remarks and welcome.",
            start=0.0, end=15.0, words=[]
        ),
        TranscriptSentence(
            text="Now here is the main viral revelation.",
            start=35.0, end=55.0, words=[]
        ),
        TranscriptSentence(
            text="Closing conclusion of the podcast.",
            start=80.0, end=100.0, words=[]
        ),
    ]

    clips = heuristic_score_clips(signals, sentences, clip_count=2, min_dur=15, max_dur=45)
    assert len(clips) >= 1
    # Top clip should identify the peak around 35-55s
    top = clips[0]
    assert top.score >= 80
    assert top.start <= 40.0
    assert top.end >= 50.0
    assert len(top.hashtags) > 0

