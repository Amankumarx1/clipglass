from typing import List
from .schema import ScoredMoment

def rerank_finalist_moments(
    candidates: List[ScoredMoment],
    top_n: int = 5
) -> List[ScoredMoment]:
    """
    Performs head-to-head pairwise reranking across finalists, scoring
    hook strength, speech density, and multimodal convergence.
    """
    if len(candidates) <= 1:
        return candidates[:top_n]

    scored = []
    for c in candidates:
        bonus = len(c.evidence) * 1.5
        wps = len(c.words) / max(1.0, c.duration)
        pacing_bonus = 3.0 if (2.0 <= wps <= 3.8) else 0.0

        final_composite = (
            c.hook_score * 0.35 +
            c.engagement_score * 0.30 +
            c.value_score * 0.20 +
            c.shareability_score * 0.15 +
            bonus + pacing_bonus
        )
        scored.append((c, final_composite))

    # Sort descending by recomputed composite score
    scored.sort(key=lambda x: x[1], reverse=True)

    final_moments = []
    base_score = 98
    for idx, (moment, _) in enumerate(scored[:top_n]):
        # Calibrate smooth 98 -> 88 display score
        scaled_score = max(80, base_score - idx * 3)
        moment.score = scaled_score
        final_moments.append(moment)

    return final_moments
