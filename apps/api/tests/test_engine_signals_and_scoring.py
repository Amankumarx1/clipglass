import pytest
from schemas.clip import TranscriptWord, TranscriptSentence
from engine.probe.metadata_probe import ProbeResult
from engine.signals.timeline_aligner import align_timeline_signals, TimelineSignals
from engine.scoring.boundary_snapper import snap_to_sentence_boundaries, enforce_anti_overlap
from engine.scoring.schema import ScoredMoment
from engine.scoring.heuristic_scorer import score_heuristic_moments
from engine.scoring.llm_scorer import score_with_llm
from engine.scoring.reranker import rerank_finalist_moments

def test_timeline_aligner_signal_fusion():
    probe = ProbeResult(
        url="https://youtube.com/watch?v=mock123",
        title="Mock Video",
        channel="Mock Channel",
        duration=60,
        heatmap=[0.2] * 20 + [0.9] * 20 + [0.3] * 20,
        storyboard_cuts=[0.0] * 60,
        chapters=[{"start_time": 10, "title": "Key Concept"}],
        words=[
            TranscriptWord(word="Hello", start=2.0, end=2.5),
            TranscriptWord(word="there", start=2.5, end=3.0),
            # 5-second silence gap
            TranscriptWord(word="Now", start=8.0, end=8.4),  # Burst trigger at sec 8!
            TranscriptWord(word="listen", start=8.4, end=8.8)
        ]
    )

    signals = align_timeline_signals(probe)
    assert signals.duration_seconds == 60
    assert len(signals.composite_energy) == 60
    assert max(signals.composite_energy) <= 1.0
    assert min(signals.composite_energy) >= 0.0

    # Heatmap should be peak at sec 25
    assert signals.heatmap[25] == 0.9
    # Burst should be triggered at sec 8 due to pause from 3.0 to 8.0
    assert signals.burst[8] > 0.5
    # Chapters should peak at sec 10
    assert signals.chapters[10] > 0.8

def test_boundary_snapper_and_duration_bounds():
    sentences = [
        TranscriptSentence(text="Sentence one here.", start=5.0, end=15.0),
        TranscriptSentence(text="Sentence two is the big secret.", start=16.0, end=35.0),
        TranscriptSentence(text="Sentence three concluding.", start=36.0, end=50.0)
    ]
    words = [
        TranscriptWord(word="Sentence", start=5.0, end=5.5),
        TranscriptWord(word="concluding", start=49.0, end=50.0)
    ]

    # Raw window 17.5s -> 34.0s (16.5s duration < min 20s)
    s_start, s_end = snap_to_sentence_boundaries(
        raw_start=17.5,
        raw_end=34.0,
        sentences=sentences,
        words=words,
        min_duration=20.0,
        max_duration=60.0,
        video_duration=100.0
    )
    # Start should snap to 16.0 (start of sentence 2)
    assert s_start == 16.0
    # Duration must be at least min_duration (20.0s)
    assert (s_end - s_start) >= 20.0

def test_anti_overlap_enforcement():
    cand1 = ScoredMoment(
        clip_id="c1", start=10.0, end=40.0, duration=30.0, score=95,
        hook_title="HOOK ONE", title="Title 1", reason="Peak",
        evidence=["Heatmap 95%"]
    )
    # Heavy overlap with cand1 (15.0 to 45.0)
    cand2 = ScoredMoment(
        clip_id="c2", start=15.0, end=45.0, duration=30.0, score=90,
        hook_title="HOOK TWO", title="Title 2", reason="Peak",
        evidence=["Heatmap 90%"]
    )
    # Independent moment (60.0 to 90.0)
    cand3 = ScoredMoment(
        clip_id="c3", start=60.0, end=90.0, duration=30.0, score=88,
        hook_title="HOOK THREE", title="Title 3", reason="Peak",
        evidence=["Heatmap 88%"]
    )

    deduped = enforce_anti_overlap([cand1, cand2, cand3], max_overlap_ratio=0.15)
    ids = [c.clip_id for c in deduped]
    assert "c1" in ids
    assert "c2" not in ids  # Dropped due to overlap with higher-scoring c1
    assert "c3" in ids

def test_heuristic_scorer():
    signals = TimelineSignals(120)
    # Inject peak at 20-50s
    for s in range(20, 50):
        signals.heatmap[s] = 0.85
        signals.speech_rate[s] = 0.8
        signals.composite_energy[s] = 0.8
    signals.burst[20] = 0.9

    words = []
    for i in range(120):
        words.append(TranscriptWord(word=f"word{i}", start=float(i), end=float(i) + 0.8))

    sentences = [
        TranscriptSentence(text="Intro part.", start=0.0, end=19.0),
        TranscriptSentence(text="The secret to winning every time is simple.", start=20.0, end=48.0),
        TranscriptSentence(text="Outro part.", start=49.0, end=100.0)
    ]

    moments = score_heuristic_moments(
        signals=signals,
        sentences=sentences,
        words=words,
        target_duration_min=20,
        target_duration_max=45,
        clip_count=3,
        video_duration=120
    )

    assert len(moments) >= 1
    top = moments[0]
    assert top.score >= 70
    assert top.hook_score >= 70
    assert top.engagement_score >= 70
    assert top.duration >= 20.0
    assert len(top.words) > 0
    assert top.hook_title != ""

@pytest.mark.asyncio
async def test_llm_scorer_fallback():
    signals = TimelineSignals(60)
    for s in range(10, 40):
        signals.heatmap[s] = 0.75
        signals.composite_energy[s] = 0.75
    signals.burst[10] = 0.8
    words = [TranscriptWord(word=f"w{i}", start=float(i), end=float(i)+0.5) for i in range(60)]
    sentences = [TranscriptSentence(text="Test sentence.", start=10.0, end=35.0)]

    # With no API keys in environment, should fall back cleanly without error
    moments = await score_with_llm(
        signals, sentences, words,
        target_duration_min=20, target_duration_max=40, clip_count=2, video_duration=60
    )
    assert len(moments) >= 1
    assert moments[0].score >= 50

def test_reranker_head_to_head():
    m1 = ScoredMoment(
        clip_id="m1", start=10, end=40, duration=30, score=85,
        hook_score=90, engagement_score=85, value_score=80, shareability_score=85,
        hook_title="H1", title="T1", reason="R", evidence=["E1", "E2", "E3"],
        words=[TranscriptWord(word="w", start=10+i*0.35, end=10+i*0.35+0.3) for i in range(80)]  # Good WPS
    )
    m2 = ScoredMoment(
        clip_id="m2", start=60, end=90, duration=30, score=82,
        hook_score=75, engagement_score=70, value_score=70, shareability_score=70,
        hook_title="H2", title="T2", reason="R", evidence=["E1"],
        words=[TranscriptWord(word="w", start=60+i*2.0, end=60+i*2.0+0.5) for i in range(15)]
    )

    reranked = rerank_finalist_moments([m2, m1], top_n=2)
    assert reranked[0].clip_id == "m1"
    assert reranked[0].score == 98
    assert reranked[1].score == 95
