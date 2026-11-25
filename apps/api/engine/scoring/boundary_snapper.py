from typing import List, Tuple
from schemas.clip import TranscriptSentence, TranscriptWord
from .schema import ScoredMoment

def snap_to_sentence_boundaries(
    raw_start: float,
    raw_end: float,
    sentences: List[TranscriptSentence],
    words: List[TranscriptWord],
    min_duration: float = 20.0,
    max_duration: float = 60.0,
    video_duration: float = 3600.0
) -> Tuple[float, float]:
    """
    Snaps raw segment start and end points to natural sentence boundaries
    and pauses, while strictly respecting min and max duration bounds.
    """
    raw_start = max(0.0, min(raw_start, video_duration - min_duration))
    raw_end = max(raw_start + min_duration, min(raw_end, video_duration))

    best_start = raw_start
    best_end = raw_end

    if sentences:
        # 1. Snap start to nearest sentence start (within +/- 4.0s)
        candidates_start = [s.start for s in sentences if abs(s.start - raw_start) <= 4.0]
        if candidates_start:
            # Prefer sentence start slightly before or very close to raw_start
            best_start = min(candidates_start, key=lambda s: abs(s - raw_start))

        # 2. Snap end to nearest sentence end (within +/- 5.0s)
        candidates_end = [s.end for s in sentences if s.end > best_start and abs(s.end - raw_end) <= 5.0]
        if candidates_end:
            best_end = min(candidates_end, key=lambda e: abs(e - raw_end))
    elif words:
        # Snap to nearest word boundaries if only words exist
        w_starts = [w.start for w in words if abs(w.start - raw_start) <= 2.5]
        if w_starts:
            best_start = min(w_starts, key=lambda s: abs(s - raw_start))
        w_ends = [w.end for w in words if w.end > best_start and abs(w.end - raw_end) <= 3.0]
        if w_ends:
            best_end = min(w_ends, key=lambda e: abs(e - raw_end))

    # 3. Enforce duration bounds strictly
    dur = best_end - best_start
    if dur < min_duration:
        best_end = min(video_duration, best_start + min_duration)
    elif dur > max_duration:
        best_end = best_start + max_duration

    return round(best_start, 2), round(best_end, 2)

def enforce_anti_overlap(
    candidates: List[ScoredMoment],
    max_overlap_ratio: float = 0.15
) -> List[ScoredMoment]:
    """
    Eliminates overlapping finalists: no two returned clips share more than
    15% of their duration or 5 seconds.
    """
    # Sort candidates by overall composite score descending
    sorted_candidates = sorted(candidates, key=lambda c: c.score, reverse=True)
    accepted: List[ScoredMoment] = []

    for cand in sorted_candidates:
        overlap_found = False
        c_dur = max(1.0, cand.end - cand.start)

        for acc in accepted:
            # Overlap interval [max(c.start, acc.start), min(c.end, acc.end)]
            overlap_start = max(cand.start, acc.start)
            overlap_end = min(cand.end, acc.end)
            overlap_len = max(0.0, overlap_end - overlap_start)

            if overlap_len > 0:
                acc_dur = max(1.0, acc.end - acc.start)
                ratio_c = overlap_len / c_dur
                ratio_acc = overlap_len / acc_dur
                if ratio_c > max_overlap_ratio or ratio_acc > max_overlap_ratio or overlap_len >= 6.0:
                    overlap_found = True
                    break

        if not overlap_found:
            accepted.append(cand)

    return accepted
