import os
import json
import uuid
import httpx
from typing import List, Dict, Any, Optional
from schemas.clip import TranscriptSentence, TranscriptWord
from engine.signals.timeline_aligner import TimelineSignals
from .schema import ScoredMoment
from .heuristic_scorer import score_heuristic_moments
from .boundary_snapper import snap_to_sentence_boundaries, enforce_anti_overlap

LLM_SYSTEM_PROMPT = """You are a senior short-form video editor specializing in YouTube Shorts, TikTok, and Instagram Reels.
Your task is to analyze the timestamped transcript and multimodal engagement signals to find the absolute strongest, high-retention clips.
Criteria:
1. Hook (first 3-4s must grip attention immediately with curiosity or surprise).
2. Standalone Cohesion (the clip must make complete sense without requiring the full video).
3. Pacing & Energy (select moments with continuous speech cadence and audience peaks).
Respond ONLY with a valid JSON array of clip objects adhering strictly to the schema."""

async def score_with_llm(
    signals: TimelineSignals,
    sentences: List[TranscriptSentence],
    words: List[TranscriptWord],
    target_duration_min: int = 20,
    target_duration_max: int = 60,
    clip_count: int = 5,
    video_duration: int = 3600
) -> List[ScoredMoment]:
    """
    Multimodal LLM scoring engine with automatic fallback to deterministic heuristic fusion.
    Supports Anthropic API, OpenRouter, or local Ollama.
    """
    anthropic_key = os.getenv("ANTHROPIC_API_KEY")
    openrouter_key = os.getenv("OPENROUTER_API_KEY")
    ollama_host = os.getenv("OLLAMA_HOST")

    # If no LLM key is configured, immediately run deterministic heuristic scorer
    if not anthropic_key and not openrouter_key and not ollama_host:
        return score_heuristic_moments(
            signals, sentences, words,
            target_duration_min, target_duration_max, clip_count, video_duration
        )

    # Format transcript summary with signals
    transcript_blocks = []
    for s in sentences:
        sec = int(s.start)
        hm = signals.heatmap[sec] if sec < len(signals.heatmap) else 0.0
        burst = signals.burst[sec] if sec < len(signals.burst) else 0.0
        note = []
        if hm > 0.5:
            note.append(f"Heatmap Peak {int(hm * 100)}%")
        if burst > 0.3:
            note.append("Energy Burst")
        note_str = f" [{', '.join(note)}]" if note else ""
        transcript_blocks.append(f"[{s.start:.1f}s - {s.end:.1f}s]{note_str} {s.text}")

    user_prompt = f"""Video Duration: {video_duration}s
Target Clip Duration: {target_duration_min} to {target_duration_max} seconds.
Find top {clip_count} viral moments.

Transcript with Aligned Engagement Signals:
{chr(10).join(transcript_blocks[:150])}

Output JSON schema:
[
  {{
    "start": 15.0,
    "end": 45.0,
    "score": 92,
    "hook_score": 95,
    "engagement_score": 90,
    "value_score": 88,
    "shareability_score": 93,
    "hook_title": "THE SHOCKING TRUTH",
    "title": "Why Everyone Got This Wrong",
    "hashtags": ["#viral", "#shorts"],
    "reason": "Explosive curiosity hook with punchy payoff.",
    "evidence": ["Heatmap Peak 85%", "Sentence Snapped"]
  }}
]"""

    try:
        raw_reply = None
        async with httpx.AsyncClient(timeout=15.0) as client:
            if anthropic_key:
                resp = await client.post(
                    "https://api.anthropic.com/v1/messages",
                    headers={
                        "x-api-key": anthropic_key,
                        "anthropic-version": "2023-06-01",
                        "content-type": "application/json"
                    },
                    json={
                        "model": "claude-3-5-sonnet-20241022",
                        "max_tokens": 1500,
                        "system": LLM_SYSTEM_PROMPT,
                        "messages": [{"role": "user", "content": user_prompt}]
                    }
                )
                if resp.status_code == 200:
                    raw_reply = resp.json()["content"][0]["text"]
            elif openrouter_key:
                resp = await client.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {openrouter_key}",
                        "content-type": "application/json"
                    },
                    json={
                        "model": "anthropic/claude-3.5-sonnet",
                        "messages": [
                            {"role": "system", "content": LLM_SYSTEM_PROMPT},
                            {"role": "user", "content": user_prompt}
                        ]
                    }
                )
                if resp.status_code == 200:
                    raw_reply = resp.json()["choices"][0]["message"]["content"]
            elif ollama_host:
                resp = await client.post(
                    f"{ollama_host.rstrip('/')}/api/generate",
                    json={
                        "model": "llama3.2",
                        "prompt": f"{LLM_SYSTEM_PROMPT}\n\n{user_prompt}",
                        "stream": False,
                        "format": "json"
                    }
                )
                if resp.status_code == 200:
                    raw_reply = resp.json().get("response")

        if raw_reply:
            # Parse JSON from reply
            clean_json_str = raw_reply.strip()
            if "```json" in clean_json_str:
                clean_json_str = clean_json_str.split("```json")[1].split("```")[0].strip()
            elif "```" in clean_json_str:
                clean_json_str = clean_json_str.split("```")[1].split("```")[0].strip()

            parsed = json.loads(clean_json_str)
            if isinstance(parsed, list):
                candidates = []
                for item in parsed:
                    r_start = float(item.get("start", 0))
                    r_end = float(item.get("end", r_start + target_duration_min))

                    # Snap boundaries
                    s_start, s_end = snap_to_sentence_boundaries(
                        raw_start=r_start,
                        raw_end=r_end,
                        sentences=sentences,
                        words=words,
                        min_duration=float(target_duration_min),
                        max_duration=float(target_duration_max),
                        video_duration=float(video_duration)
                    )

                    moment_words = [w for w in words if s_start <= w.start <= s_end]
                    moment_text = " ".join(w.word for w in moment_words)

                    candidates.append(ScoredMoment(
                        clip_id=uuid.uuid4().hex[:10],
                        start=s_start,
                        end=s_end,
                        duration=round(s_end - s_start, 2),
                        score=int(item.get("score", 90)),
                        hook_score=int(item.get("hook_score", 90)),
                        engagement_score=int(item.get("engagement_score", 90)),
                        value_score=int(item.get("value_score", 90)),
                        shareability_score=int(item.get("shareability_score", 90)),
                        hook_title=item.get("hook_title") or "KEY MOMENT",
                        title=item.get("title") or "Viral Highlight",
                        hashtags=item.get("hashtags") or ["#viral", "#shorts"],
                        reason=item.get("reason") or "Strong opening hook with clear narrative arc.",
                        evidence=item.get("evidence") or ["LLM Multimodal Selection", "Sentence Snapped"],
                        words=moment_words,
                        transcript_text=moment_text
                    ))

                deduped = enforce_anti_overlap(candidates, max_overlap_ratio=0.15)
                if deduped:
                    return deduped[:clip_count]
    except Exception:
        pass

    # Automatic fallback
    return score_heuristic_moments(
        signals, sentences, words,
        target_duration_min, target_duration_max, clip_count, video_duration
    )
