import uuid
import re
from typing import List, Dict, Any, Optional
from schemas.clip import TranscriptSentence, TranscriptWord
from engine.signals.timeline_aligner import TimelineSignals
from .schema import ScoredMoment
from .boundary_snapper import snap_to_sentence_boundaries, enforce_anti_overlap

HOOK_KEYWORDS = re.compile(r'\b(secret|never|how to|why|reason|stop|mistake|crazy|insane|truth|hack|rule|formula|trick|first time)\b', re.IGNORECASE)

def score_heuristic_moments(
    signals: TimelineSignals,
    sentences: List[TranscriptSentence],
    words: List[TranscriptWord],
    target_duration_min: int = 20,
    target_duration_max: int = 60,
    clip_count: int = 5,
    video_duration: int = 3600
) -> List[ScoredMoment]:
    """
    Deterministic multimodal heuristic fusion scorer.
    Combines heatmap peaks, acoustic bursts, and speech density to identify and rank
    winning short-form moments with zero external API dependencies.
    """
    dur = min(video_duration, signals.duration_seconds)
    if dur < target_duration_min:
        return []

    window_dur = int((target_duration_min + target_duration_max) / 2)
    step = 4  # 4-second sliding resolution
    raw_candidates: List[ScoredMoment] = []

    for t_start in range(0, max(1, dur - target_duration_min), step):
        t_end = min(dur, t_start + window_dur)
        w_len = t_end - t_start
        if w_len < target_duration_min:
            continue

        # 1. Hook Score (First 4 seconds energy)
        hook_sub = signals.composite_energy[t_start:min(dur, t_start + 4)]
        hook_burst = max(signals.burst[t_start:min(dur, t_start + 4)] or [0.0])
        hook_val = sum(hook_sub) / max(1, len(hook_sub))
        hook_score = int(min(100, max(50, (hook_val * 60 + hook_burst * 40))))

        # 2. Engagement Score (Mean heatmap + speech stability across window)
        w_hm = signals.heatmap[t_start:t_end]
        w_sr = signals.speech_rate[t_start:t_end]
        mean_hm = sum(w_hm) / max(1, len(w_hm))
        mean_sr = sum(w_sr) / max(1, len(w_sr))
        eng_score = int(min(100, max(50, (mean_hm * 55 + mean_sr * 45))))

        # 3. Value Score (Sentence density and content)
        w_words = [w for w in words if t_start <= w.start <= t_end]
        transcript_text = " ".join(w.word for w in w_words)
        has_hook_words = bool(HOOK_KEYWORDS.search(transcript_text))
        wps = len(w_words) / max(1.0, w_len)
        val_score = int(min(100, max(50, (wps * 22 + (20 if has_hook_words else 0) + mean_hm * 25))))

        # 4. Shareability Score (Peak energy and burst climax)
        peak_hm = max(w_hm or [0.0])
        peak_burst = max(signals.burst[t_start:t_end] or [0.0])
        share_score = int(min(100, max(50, (peak_hm * 50 + peak_burst * 50))))

        # 5. Composite Score
        composite = int(
            hook_score * 0.35 +
            eng_score * 0.30 +
            val_score * 0.20 +
            share_score * 0.15
        )

        # Snap to sentence boundaries
        snapped_start, snapped_end = snap_to_sentence_boundaries(
            raw_start=float(t_start),
            raw_end=float(t_end),
            sentences=sentences,
            words=words,
            min_duration=float(target_duration_min),
            max_duration=float(target_duration_max),
            video_duration=float(dur)
        )
        snapped_dur = round(snapped_end - snapped_start, 2)

        # Slice matching words
        moment_words = [w for w in words if snapped_start <= w.start <= snapped_end]
        moment_text = " ".join(w.word for w in moment_words)

        # Build hook title
        first_few = [w.word for w in moment_words[:6]]
        hook_title = " ".join(first_few).upper() if first_few else "WATCH THIS MOMENT"
        hook_title = re.sub(r'[^A-Z0-9\s]', '', hook_title)[:32]

        evidence = []
        if mean_hm > 0.4:
            evidence.append(f"Heatmap Peak {int(mean_hm * 100)}%")
        if hook_burst > 0.3:
            evidence.append("Acoustic Burst Onset")
        if has_hook_words:
            evidence.append("High-Intent Keyword")
        evidence.append("Sentence-Boundary Snapped")

        hashtags = ["#viral", "#shorts", "#trending", "#fyp"]

        raw_candidates.append(ScoredMoment(
            clip_id=uuid.uuid4().hex[:10],
            start=snapped_start,
            end=snapped_end,
            duration=snapped_dur,
            score=composite,
            hook_score=hook_score,
            engagement_score=eng_score,
            value_score=val_score,
            shareability_score=share_score,
            hook_title=hook_title or "KEY MOMENT",
            title=f"Highlight ({int(snapped_start)}s - {int(snapped_end)}s)",
            hashtags=hashtags,
            reason="High audience retention and dynamic acoustic energy burst.",
            evidence=evidence,
            words=moment_words,
            transcript_text=moment_text
        ))

    # Anti-overlap enforcement
    deduped = enforce_anti_overlap(raw_candidates, max_overlap_ratio=0.15)
    return deduped[:clip_count]
