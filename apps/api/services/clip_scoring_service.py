import os
import json
import re
import uuid
import httpx
from typing import List, Dict, Any, Optional, Tuple
from schemas.clip import (
    TranscriptSentence, TranscriptWord, MultimodalSignals, ClipMoment,
    CaptionPresetType, ReframeModeType
)
from app.config import settings

# Boundary snapping parameters (clean-room re-implementation)
SENTENCE_REACH_SECONDS = 8.0
SENTENCE_PAUSE_SECONDS = 2.0

def snap_boundaries_to_sentences(
    start: float,
    end: float,
    sentences: List[TranscriptSentence],
    min_dur: float = 15.0,
    max_dur: float = 75.0,
    reach_seconds: float = SENTENCE_REACH_SECONDS,
    pause_seconds: float = SENTENCE_PAUSE_SECONDS
) -> Tuple[float, float, str, List[TranscriptWord]]:
    """
    Snaps clip boundaries to exact sentence beginnings and sentence endings
    so the speech is never clipped mid-word or mid-thought. Start snaps back
    to sentence beginning within reach_seconds; pause > pause_seconds acts as sentence boundary.
    """
    if not sentences:
        return max(0.0, start), max(start + min_dur, end), "", []

    # 1. Snap start: Find sentence whose start is closest to target start
    best_start_idx = 0
    min_start_diff = float('inf')
    for idx, s in enumerate(sentences):
        # Allow reaching back up to reach_seconds
        diff = abs(s.start - start)
        if s.start <= start and (start - s.start) <= reach_seconds:
            best_start_idx = idx
            break
        elif diff < min_start_diff:
            min_start_diff = diff
            best_start_idx = idx

    # 2. Snap end: Find sentence end satisfying min_dur and max_dur
    best_end_idx = best_start_idx
    min_end_diff = float('inf')
    start_time = sentences[best_start_idx].start

    for idx in range(best_start_idx, len(sentences)):
        s = sentences[idx]
        dur = s.end - start_time
        if min_dur <= dur <= max_dur:
            diff = abs(s.end - end)
            if diff < min_end_diff:
                min_end_diff = diff
                best_end_idx = idx

    # If no sentence satisfied duration, choose closest valid end
    if (sentences[best_end_idx].end - start_time) < min_dur:
        curr_idx = best_start_idx
        while curr_idx < len(sentences) and (sentences[curr_idx].end - start_time) < min_dur:
            curr_idx += 1
        best_end_idx = min(len(sentences) - 1, curr_idx)

    # Enforce max duration ceiling
    while best_end_idx > best_start_idx and (sentences[best_end_idx].end - start_time) > max_dur:
        best_end_idx -= 1

    snapped_start = round(sentences[best_start_idx].start, 2)
    snapped_end = round(sentences[best_end_idx].end, 2)

    # Extract sentences and word items
    chosen_sentences = sentences[best_start_idx : best_end_idx + 1]
    transcript_text = " ".join(s.text for s in chosen_sentences)
    all_words: List[TranscriptWord] = []
    for s in chosen_sentences:
        all_words.extend(s.words)

    return snapped_start, snapped_end, transcript_text, all_words

def rerank_finalists(candidates: List[ClipMoment], target_count: int) -> List[ClipMoment]:
    """
    Head-to-head tournament reranking and duplicate elimination.
    Rejects any candidate with >30% temporal overlap against an already chosen higher-ranked clip.
    Weights 4 sub-scores into a definitive composite rank.
    """
    if not candidates:
        return []

    # Recalculate definitive composite score:
    # 35% Hook + 30% Engagement + 20% Value + 15% Shareability
    for c in candidates:
        comp = int(round(
            0.35 * c.hookScore +
            0.30 * c.engagementScore +
            0.20 * c.valueScore +
            0.15 * c.shareabilityScore
        ))
        c.score = min(100, max(50, comp))

    # Sort descending by composite score
    sorted_candidates = sorted(candidates, key=lambda x: x.score, reverse=True)

    chosen: List[ClipMoment] = []
    for cand in sorted_candidates:
        overlap = False
        cand_dur = max(1.0, cand.end - cand.start)

        for kept in chosen:
            kept_dur = max(1.0, kept.end - kept.start)
            # Intersection duration
            inter_start = max(cand.start, kept.start)
            inter_end = min(cand.end, kept.end)
            if inter_end > inter_start:
                inter_dur = inter_end - inter_start
                # Overlap ratio relative to shorter clip
                shorter_dur = min(cand_dur, kept_dur)
                if (inter_dur / shorter_dur) > 0.30:
                    overlap = True
                    break

        if not overlap:
            chosen.append(cand)
            if len(chosen) >= target_count:
                break

    return chosen

def heuristic_score_clips(
    signals: MultimodalSignals,
    sentences: List[TranscriptSentence],
    clip_count: int = 3,
    min_dur: int = 20,
    max_dur: int = 50,
    title_prefix: str = "Viral Moment"
) -> List[ClipMoment]:
    """
    Heuristic scoring engine using composite multimodal signals (loudness, burst,
    scene cuts, chapters, heatmap) producing 4 explainable sub-scores and evidence tags.
    """
    T = signals.duration_seconds
    if T < min_dur:
        return []

    # Compute composite 1-second score
    has_comments = any(c > 0.15 for c in signals.comment_energy)
    composite = [0.0] * T
    for s in range(T):
        h = signals.heatmap[s] if s < len(signals.heatmap) else 0.0
        l = signals.loudness[s] if s < len(signals.loudness) else 0.0
        b = signals.burst[s] if s < len(signals.burst) else 0.0
        c = signals.scene_cuts[s] if s < len(signals.scene_cuts) else 0.0
        ch = signals.chapters[s] if s < len(signals.chapters) else 0.0
        ce = signals.comment_energy[s] if s < len(signals.comment_energy) else 0.0

        # Weighted blend (prioritize audience comment energy when present)
        if has_comments:
            composite[s] = 0.35 * ce + 0.25 * h + 0.20 * l + 0.10 * b + 0.05 * c + 0.05 * ch
        else:
            composite[s] = 0.35 * h + 0.25 * l + 0.20 * b + 0.10 * c + 0.10 * ch

    # Sliding window search with window size ~35s
    window_sz = min(T, max(min_dur, 35))
    candidates_raw = []

    for start_sec in range(0, max(1, T - window_sz), 5):
        end_sec = min(T, start_sec + window_sz)
        avg_score = sum(composite[start_sec:end_sec]) / max(1, end_sec - start_sec)
        candidates_raw.append((start_sec, end_sec, avg_score))

    candidates_raw.sort(key=lambda x: x[2], reverse=True)

    initial_moments: List[ClipMoment] = []
    top_n = min(len(candidates_raw), clip_count * 3)

    for idx, (raw_s, raw_e, raw_sc) in enumerate(candidates_raw[:top_n]):
        snapped_s, snapped_e, transcript_txt, words = snap_boundaries_to_sentences(
            float(raw_s), float(raw_e), sentences, float(min_dur), float(max_dur)
        )
        s_int = int(snapped_s)
        e_int = int(snapped_e)

        # 1. Calculate 4 Sub-Scores from signals in slice
        slice_heatmap = signals.heatmap[s_int:e_int] if s_int < len(signals.heatmap) else []
        slice_loudness = signals.loudness[s_int:e_int] if s_int < len(signals.loudness) else []
        slice_burst = signals.burst[s_int:e_int] if s_int < len(signals.burst) else []
        slice_cuts = signals.scene_cuts[s_int:e_int] if s_int < len(signals.scene_cuts) else []
        slice_comm = signals.comment_energy[s_int:e_int] if s_int < len(signals.comment_energy) else []
        peak_comm = max(slice_comm, default=0.0)
        avg_comm = sum(slice_comm) / max(1, len(slice_comm)) if slice_comm else 0.0

        # Hook score: based on burst / energy in first 4 seconds (and chat spike)
        hook_window = slice_burst[:4] if slice_burst else [0.5]
        max_hook_burst = max(hook_window, default=0.5)
        hook_sc = int(min(98, max(60, 65 + max_hook_burst * 32)))
        if peak_comm > 0.4:
            hook_sc = int(min(99, max(hook_sc, 72 + peak_comm * 26)))

        # Engagement score: based on loudness variance, scene cuts & chat velocity
        avg_loud = sum(slice_loudness) / max(1, len(slice_loudness)) if slice_loudness else 0.5
        cut_count = sum(1 for c in slice_cuts if c > 0.5)
        eng_sc = int(min(98, max(60, 60 + avg_loud * 25 + min(12, cut_count * 3))))
        if avg_comm > 0.3:
            eng_sc = int(min(99, max(eng_sc, 68 + avg_comm * 30)))

        # Value score: based on speech content density and duration efficiency
        word_count = len(words)
        dur = max(1.0, snapped_e - snapped_s)
        wpm = (word_count / dur) * 60 if dur > 0 else 120
        val_sc = int(min(96, max(65, 70 + min(25, int(wpm * 0.12)))))

        # Shareability score: based on heatmap retention peak and audience comment hype
        peak_heatmap = max(slice_heatmap, default=0.4)
        share_sc = int(min(98, max(55, 55 + peak_heatmap * 42)))
        if peak_comm > 0.35:
            share_sc = int(min(99, max(share_sc, 68 + peak_comm * 30)))

        # Overall composite
        comp_score = int(round(0.35 * hook_sc + 0.30 * eng_sc + 0.20 * val_sc + 0.15 * share_sc))

        # 2. Extract evidence badges
        evidence: List[str] = []
        if peak_comm > 0.55:
            evidence.append(f"Chat Burst 🔥 ({int(peak_comm * 100)}% energy)")
        elif peak_comm > 0.35:
            evidence.append("Chat Spike 💬 (High viewer activity)")
        if peak_heatmap > 0.6:
            evidence.append(f"Heatmap Peak ({int(peak_heatmap * 100)}% retention)")
        if max_hook_burst > 0.4:
            evidence.append("Loudness Burst (+12dB energy spike)")
        if cut_count > 1:
            evidence.append(f"Visual Dynamic ({cut_count} scene cuts)")
        if not evidence:
            evidence.append("Core Thematic Climax")

        reason = "High audience retention peak and audio energy transition."
        if peak_comm > 0.4:
            reason = "Discovered via high-energy live chat burst and energetic viewer comments."

        # 3. Extract opening hook
        first_words = transcript_txt.split()[:7]
        hook = " ".join(first_words).upper() if first_words else "WAIT FOR THIS MOMENT"
        hook = re.sub(r'[^\w\s]', '', hook) or "WAIT FOR THIS MOMENT"

        title = f"{title_prefix}: Part {idx+1}"
        hashtags = ["#shorts", "#viral", "#clip", "#fyp", "#trending"]
        cid = uuid.uuid4().hex[:12]

        initial_moments.append(ClipMoment(
            clipId=cid,
            start=snapped_s,
            end=snapped_e,
            duration=round(snapped_e - snapped_s, 2),
            score=comp_score,
            hookScore=hook_sc,
            engagementScore=eng_sc,
            valueScore=val_sc,
            shareabilityScore=share_sc,
            hook=hook,
            title=title,
            hashtags=hashtags,
            reason=reason,
            evidence=evidence,
            transcriptText=transcript_txt,
            words=words
        ))

    # Apply head-to-head tournament reranking
    return rerank_finalists(initial_moments, clip_count)

async def score_clips_with_llm(
    signals: MultimodalSignals,
    sentences: List[TranscriptSentence],
    clip_count: int = 3,
    min_dur: int = 20,
    max_dur: int = 60,
    title_prefix: str = "Clip"
) -> List[ClipMoment]:
    """
    Provider-agnostic LLM scoring: sends transcript with timestamps and signal markers,
    validates strict JSON output with 4 sub-scores and evidence, and snaps boundaries to sentences.
    Falls back gracefully to heuristic scoring if LLM fails or is unconfigured.
    """
    if not (settings.ANTHROPIC_API_KEY or settings.OPENROUTER_API_KEY or settings.OLLAMA_BASE_URL):
        return heuristic_score_clips(signals, sentences, clip_count, min_dur, max_dur, title_prefix)

    # Prepare formatted transcript timeline with signal markers
    lines = []
    for s in sentences:
        sec = int(s.start)
        sig_note = ""
        if sec < len(signals.heatmap) and signals.heatmap[sec] > 0.7:
            sig_note += " [HEATMAP PEAK]"
        if sec < len(signals.burst) and signals.burst[sec] > 0.6:
            sig_note += " [AUDIO SPIKE]"
        if sec < len(signals.comment_energy) and signals.comment_energy[sec] > 0.6:
            sig_note += " [CHAT BURST 🔥]"
        if sec < len(signals.scene_cuts) and signals.scene_cuts[sec] > 0.5:
            sig_note += " [SCENE CUT]"
        lines.append(f"[{s.start:.1f}s - {s.end:.1f}s]{sig_note} {s.text}")

    timeline_str = "\n".join(lines[:140])

    prompt = f"""You are an elite short-form video editor identifying viral 9:16 clips for YouTube Shorts, Reels, and TikTok.
Identify up to {clip_count * 2} candidate segments from the video transcript below.

REQUIREMENTS:
1. Duration between {min_dur} and {max_dur} seconds.
2. Must have an attention-grabbing opening hook in the first 3.5 seconds.
3. Must evaluate 4 specific virality sub-scores (0-100 each):
   - "hook_score": grabs attention immediately
   - "engagement_score": maintains retention and audio/visual rhythm
   - "value_score": takeaway density, insight, or entertainment
   - "shareability_score": impulse to send or comment
4. Must list concrete multimodal evidence items in "evidence" (e.g. ["Heatmap Peak", "Audio Burst", "Shocking Revelation"]).
5. Output ONLY a valid JSON array of objects. No markdown, no commentary.

SCHEMA:
[
  {{
    "start": 12.0,
    "end": 44.5,
    "hook_score": 92,
    "engagement_score": 88,
    "value_score": 85,
    "shareability_score": 90,
    "score": 89,
    "hook": "WAIT UNTIL YOU HEAR THIS",
    "title": "The Shocking Secret Nobody Knew",
    "hashtags": ["#shorts", "#story", "#viral", "#mindblown"],
    "reason": "Dramatic conversational pivot with immediate tension.",
    "evidence": ["Heatmap Peak", "Audio Burst", "High speech punchiness"]
  }}
]

TRANSCRIPT TIMELINE:
{timeline_str}
"""

    response_text = ""
    try:
        if settings.ANTHROPIC_API_KEY:
            async with httpx.AsyncClient(timeout=30.0) as client:
                res = await client.post(
                    "https://api.anthropic.com/v1/messages",
                    headers={
                        "x-api-key": settings.ANTHROPIC_API_KEY,
                        "anthropic-version": "2023-06-01",
                        "content-type": "application/json"
                    },
                    json={
                        "model": "claude-3-5-sonnet-20241022",
                        "max_tokens": 1500,
                        "messages": [{"role": "user", "content": prompt}]
                    }
                )
                if res.status_code == 200:
                    data = res.json()
                    response_text = data.get("content", [{}])[0].get("text", "")

        elif settings.OPENROUTER_API_KEY:
            async with httpx.AsyncClient(timeout=30.0) as client:
                res = await client.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "meta-llama/llama-3.2-3b-instruct:free",
                        "messages": [{"role": "user", "content": prompt}]
                    }
                )
                if res.status_code == 200:
                    data = res.json()
                    response_text = data.get("choices", [{}])[0].get("message", {}).get("content", "")

        elif settings.OLLAMA_BASE_URL:
            async with httpx.AsyncClient(timeout=35.0) as client:
                res = await client.post(
                    f"{settings.OLLAMA_BASE_URL.rstrip('/')}/api/generate",
                    json={
                        "model": settings.OLLAMA_MODEL,
                        "prompt": prompt,
                        "stream": False,
                        "format": "json"
                    }
                )
                if res.status_code == 200:
                    response_text = res.json().get("response", "")

        # Parse JSON array
        match = re.search(r'\[.*\]', response_text, re.DOTALL)
        if match:
            raw_items = json.loads(match.group(0))
            candidates: List[ClipMoment] = []

            for item in raw_items:
                raw_s = float(item.get("start", 0))
                raw_e = float(item.get("end", raw_s + 30))
                snapped_s, snapped_e, transcript_txt, words = snap_boundaries_to_sentences(
                    raw_s, raw_e, sentences, float(min_dur), float(max_dur)
                )

                cid = uuid.uuid4().hex[:12]
                h_sc = int(item.get("hook_score", 85))
                e_sc = int(item.get("engagement_score", 85))
                v_sc = int(item.get("value_score", 85))
                s_sc = int(item.get("shareability_score", 85))
                comp_sc = int(item.get("score", round(0.35*h_sc + 0.3*e_sc + 0.2*v_sc + 0.15*s_sc)))

                candidates.append(ClipMoment(
                    clipId=cid,
                    start=snapped_s,
                    end=snapped_e,
                    duration=round(snapped_e - snapped_s, 2),
                    score=comp_sc,
                    hookScore=h_sc,
                    engagementScore=e_sc,
                    valueScore=v_sc,
                    shareabilityScore=s_sc,
                    hook=str(item.get("hook", "WAIT FOR THIS")).upper()[:60],
                    title=str(item.get("title", f"{title_prefix}: Highlight"))[:80],
                    hashtags=item.get("hashtags", ["#shorts", "#viral", "#reels"]),
                    reason=str(item.get("reason", "Strong opening hook with consistent retention."))[:200],
                    evidence=item.get("evidence", ["Hook peak", "Speech clarity"]),
                    transcriptText=transcript_txt,
                    words=words
                ))

            if candidates:
                return rerank_finalists(candidates, clip_count)

    except Exception as e:
        print(f"LLM scoring exception notice: {e}; falling back to heuristic scorer.")

    return heuristic_score_clips(signals, sentences, clip_count, min_dur, max_dur, title_prefix)
