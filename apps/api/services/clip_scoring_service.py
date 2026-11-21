import os
import json
import re
import uuid
import httpx
from typing import List, Dict, Any, Optional, Tuple
from schemas.clip import TranscriptSentence, MultimodalSignals, ClipMoment
from app.config import settings

def snap_boundaries_to_sentences(
    start: float,
    end: float,
    sentences: List[TranscriptSentence],
    min_dur: float = 15.0,
    max_dur: float = 75.0
) -> Tuple[float, float, str, List[Any]]:
    """
    Snaps clip boundaries to exact sentence beginnings and sentence endings
    so the speech is never clipped mid-word or mid-thought.
    """
    if not sentences:
        return max(0.0, start), max(start + min_dur, end), "", []

    # Find closest sentence start
    best_start_idx = 0
    min_start_diff = float('inf')
    for idx, s in enumerate(sentences):
        diff = abs(s.start - start)
        if diff < min_start_diff:
            min_start_diff = diff
            best_start_idx = idx

    # Find closest sentence end within bounds
    best_end_idx = best_start_idx
    min_end_diff = float('inf')
    for idx in range(best_start_idx, len(sentences)):
        s = sentences[idx]
        diff = abs(s.end - end)
        dur = s.end - sentences[best_start_idx].start
        if dur >= min_dur and dur <= max_dur:
            if diff < min_end_diff:
                min_end_diff = diff
                best_end_idx = idx

    # If no sentence satisfied duration, choose closest valid end
    if best_end_idx < best_start_idx or (sentences[best_end_idx].end - sentences[best_start_idx].start) < min_dur:
        curr_idx = best_start_idx
        while curr_idx < len(sentences) and (sentences[curr_idx].end - sentences[best_start_idx].start) < min_dur:
            curr_idx += 1
        best_end_idx = min(len(sentences) - 1, curr_idx)

    snapped_start = round(sentences[best_start_idx].start, 2)
    snapped_end = round(sentences[best_end_idx].end, 2)

    # Extract sentences and word items
    chosen_sentences = sentences[best_start_idx : best_end_idx + 1]
    transcript_text = " ".join(s.text for s in chosen_sentences)
    all_words = []
    for s in chosen_sentences:
        all_words.extend(s.words)

    return snapped_start, snapped_end, transcript_text, all_words

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
    scene cuts, chapters, heatmap) when no LLM is configured.
    """
    T = signals.duration_seconds
    if T < min_dur:
        return []

    # Compute composite 1-second score
    composite = [0.0] * T
    for s in range(T):
        h = signals.heatmap[s] if s < len(signals.heatmap) else 0.0
        l = signals.loudness[s] if s < len(signals.loudness) else 0.0
        b = signals.burst[s] if s < len(signals.burst) else 0.0
        c = signals.scene_cuts[s] if s < len(signals.scene_cuts) else 0.0
        ch = signals.chapters[s] if s < len(signals.chapters) else 0.0

        # Weighted blend
        composite[s] = 0.35 * h + 0.25 * l + 0.20 * b + 0.10 * c + 0.10 * ch

    # Sliding window search with window size ~35s
    window_sz = min(T, max(min_dur, 35))
    candidates = []

    for start_sec in range(0, max(1, T - window_sz), 5):
        end_sec = min(T, start_sec + window_sz)
        avg_score = sum(composite[start_sec:end_sec]) / max(1, end_sec - start_sec)
        candidates.append((start_sec, end_sec, avg_score))

    # Sort descending by composite score
    candidates.sort(key=lambda x: x[2], reverse=True)

    # Non-maximum suppression (NMS) to eliminate overlaps > 10s
    chosen_windows = []
    for s, e, score in candidates:
        overlap = False
        for cs, ce, _ in chosen_windows:
            if not (e <= cs or s >= ce):
                overlap = True
                break
        if not overlap:
            chosen_windows.append((s, e, score))
            if len(chosen_windows) >= clip_count:
                break

    clips: List[ClipMoment] = []
    max_score = max((w[2] for w in chosen_windows), default=1.0) or 1.0

    for idx, (raw_s, raw_e, raw_sc) in enumerate(chosen_windows):
        snapped_s, snapped_e, transcript_txt, words = snap_boundaries_to_sentences(
            float(raw_s), float(raw_e), sentences, float(min_dur), float(max_dur)
        )
        norm_score = int(min(98, max(65, (raw_sc / max_score) * 95)))
        cid = uuid.uuid4().hex[:12]

        # Extract opening hook from first words
        first_words = transcript_txt.split()[:7]
        hook = " ".join(first_words).upper() if first_words else "WAIT FOR THIS MOMENT"
        hook = re.sub(r'[^\w\s]', '', hook) or "WAIT FOR THIS MOMENT"

        title = f"{title_prefix}: Part {idx+1}"
        hashtags = ["#shorts", "#viral", "#clip", "#fyp", "#trending"]

        clips.append(ClipMoment(
            clipId=cid,
            start=snapped_s,
            end=snapped_e,
            duration=round(snapped_e - snapped_s, 2),
            score=norm_score,
            hook=hook,
            title=title,
            hashtags=hashtags,
            reason="High audience retention peak and audio energy transition.",
            transcriptText=transcript_txt,
            words=words
        ))

    return clips

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
    validates strict JSON output, and snaps boundaries to sentences.
    Falls back gracefully to heuristic scoring if LLM fails or is unconfigured.
    """
    if not (settings.ANTHROPIC_API_KEY or settings.OPENROUTER_API_KEY or settings.OLLAMA_BASE_URL):
        return heuristic_score_clips(signals, sentences, clip_count, min_dur, max_dur, title_prefix)

    # Prepare formatted transcript timeline
    lines = []
    for s in sentences:
        sec = int(s.start)
        sig_note = ""
        if sec < len(signals.heatmap) and signals.heatmap[sec] > 0.7:
            sig_note += " [HIGH REPLAY PEAK]"
        if sec < len(signals.burst) and signals.burst[sec] > 0.6:
            sig_note += " [AUDIO SPIKE]"
        lines.append(f"[{s.start:.1f}s - {s.end:.1f}s]{sig_note} {s.text}")

    timeline_str = "\n".join(lines[:120])  # Cap context to prevent overflow

    prompt = f"""You are an elite viral video editor scoring candidate clips from a video.
Identify the TOP {clip_count} most viral, self-contained segments suitable for 9:16 vertical Shorts/TikToks.
Requirements:
1. Duration between {min_dur} and {max_dur} seconds.
2. Must have an attention-grabbing opening hook in the first 3 seconds.
3. Must deliver a satisfying insight, punchline, or reaction without cut-off sentences.
4. Output ONLY a valid JSON array of objects with keys:
   - "start": float (seconds)
   - "end": float (seconds)
   - "score": integer 0-100 (viral rating)
   - "hook": string (3-6 words, high-energy teaser in ALL CAPS)
   - "title": string (catchy YouTube Short title)
   - "hashtags": array of 4-5 strings (e.g. ["#shorts", "#story"])
   - "reason": string (1 sentence explaining why this clip is viral)

Transcript Timeline:
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
                        "max_tokens": 1024,
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

        # Parse JSON from response
        match = re.search(r'\[.*\]', response_text, re.DOTALL)
        if match:
            raw_items = json.loads(match.group(0))
            clips: List[ClipMoment] = []
            for item in raw_items[:clip_count]:
                raw_s = float(item.get("start", 0))
                raw_e = float(item.get("end", raw_s + 30))
                snapped_s, snapped_e, transcript_txt, words = snap_boundaries_to_sentences(
                    raw_s, raw_e, sentences, float(min_dur), float(max_dur)
                )

                cid = uuid.uuid4().hex[:12]
                clips.append(ClipMoment(
                    clipId=cid,
                    start=snapped_s,
                    end=snapped_e,
                    duration=round(snapped_e - snapped_s, 2),
                    score=int(item.get("score", 85)),
                    hook=str(item.get("hook", "WAIT FOR THIS")).upper()[:60],
                    title=str(item.get("title", f"{title_prefix}: Highlight"))[:80],
                    hashtags=item.get("hashtags", ["#shorts", "#viral"]),
                    reason=str(item.get("reason", "High retention hook detected."))[:200],
                    transcriptText=transcript_txt,
                    words=words
                ))
            if clips:
                # Sort descending by score
                clips.sort(key=lambda c: c.score, reverse=True)
                return clips

    except Exception as e:
        print(f"LLM scoring exception notice: {e}; falling back to heuristic scorer.")

    return heuristic_score_clips(signals, sentences, clip_count, min_dur, max_dur, title_prefix)
