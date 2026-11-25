import os
import shutil
import uuid
from typing import List, Tuple, Optional, Callable, Dict, Any
from app.config import settings
from schemas.inspect import FriendlyError
from schemas.clip import ClipMoment, TranscriptWord
from engine.probe.metadata_probe import probe_youtube_video, ProbeResult
from engine.signals.timeline_aligner import align_timeline_signals
from engine.signals.acoustic_energy import stream_audio_energy
from engine.scoring.heuristic_scorer import score_heuristic_moments
from engine.scoring.llm_scorer import score_with_llm
from engine.scoring.reranker import rerank_finalist_moments
from engine.slicer.unified_slicer import slice_winning_moment
from engine.captions.ass_generator import create_kinetic_ass_subtitles
from services.clip_render_service import render_clip_segment, package_clips_zip

def run_zero_download_pipeline(
    url: str,
    job_dir: str,
    target_min: int = 20,
    target_max: int = 60,
    clip_count: int = 5,
    reframe_mode: str = "follow-face",
    caption_preset: str = "viral_pop",
    polish_style: str = "none",
    fast_mode: bool = True,
    deep_audio: bool = False,
    progress_cb: Optional[Callable[[str, float, str, Optional[List[ClipMoment]]], None]] = None,
    cancel_check: Optional[Callable[[], bool]] = None
) -> Tuple[bool, List[ClipMoment], Optional[FriendlyError]]:
    """
    Zero-Full-Download Stream-Slice Auto Clip Engine.
    Executes all 4 stages:
      1. Zero-Video Probe (0 MB video downloaded)
      2. Signal Fusion & Multimodal Scoring
      3. Parallel JIT Byte-Range DASH Slicing
      4. On-Slice Reframe (9:16), ASS Captions, Polish Overlay & Export
    """
    os.makedirs(job_dir, exist_ok=True)

    def report(stage: str, percent: float, step: str, clips: Optional[List[ClipMoment]] = None):
        if progress_cb:
            try:
                progress_cb(stage, percent, step, clips)
            except Exception:
                pass

    if cancel_check and cancel_check():
        return False, [], FriendlyError(code="cancelled", title="Cancelled", explanation="Job cancelled.", suggestedAction="")

    # =========================================================================
    # STAGE 1: Zero-Video Metadata & Signal Probe (0 MB Video)
    # =========================================================================
    report("probe", 10.0, "Probing YouTube metadata and timeline signals (0 MB video)...")

    probe_res, err = probe_youtube_video(
        url=url,
        duration_cap_seconds=settings.CLIP_DURATION_CAP,
        temp_dir=job_dir
    )
    if err or not probe_res:
        return False, [], err or FriendlyError(
            code="probe-failed",
            title="Inspection Failed",
            explanation="Could not probe video signals from YouTube.",
            suggestedAction="Verify link accessibility."
        )

    # Optional acoustic energy pass if captions are missing or deep_audio is requested
    audio_loudness = None
    audio_burst = None
    worst_audio_f = (probe_res.dash_formats or {}).get("worst_audio")
    if (not probe_res.has_captions or deep_audio) and worst_audio_f and worst_audio_f.get("url"):
        report("probe", 20.0, "Streaming low-bitrate audio for energy analysis (0 MB video)...")
        audio_loudness, audio_burst = stream_audio_energy(
            worst_audio_f["url"],
            duration_seconds=probe_res.duration,
            temp_dir=job_dir
        )

    report("probe", 30.0, f"Inspected signals for '{probe_res.title[:35]}...' (0 MB video downloaded)")

    if cancel_check and cancel_check():
        return False, [], None

    # =========================================================================
    # STAGE 2: Signal Fusion, Scoring & Reranking
    # =========================================================================
    report("scoring", 40.0, "Aligning multimodal signals and discovering high-retention moments...")

    signals = align_timeline_signals(
        probe=probe_res,
        audio_loudness=audio_loudness,
        audio_burst=audio_burst
    )

    # Deterministic heuristic fusion + boundary snapping
    finalists = score_heuristic_moments(
        signals=signals,
        sentences=probe_res.sentences,
        words=probe_res.words,
        target_duration_min=target_min,
        target_duration_max=target_max,
        clip_count=clip_count,
        video_duration=probe_res.duration
    )

    # Final pairwise rerank
    reranked = rerank_finalist_moments(finalists, top_n=clip_count)

    # Convert ScoredMoment to system ClipMoment schema
    clips: List[ClipMoment] = []
    for idx, sm in enumerate(reranked):
        c = ClipMoment(
            clipId=sm.clip_id,
            start=sm.start,
            end=sm.end,
            duration=sm.duration,
            score=sm.score,
            hookScore=sm.hook_score,
            engagementScore=sm.engagement_score,
            valueScore=sm.value_score,
            shareabilityScore=sm.shareability_score,
            hook=sm.hook_title,
            title=sm.title,
            hashtags=sm.hashtags,
            reason=sm.reason,
            evidence=sm.evidence,
            reframeMode=reframe_mode,  # type: ignore
            captionPreset=caption_preset,  # type: ignore
            polishStyle=polish_style,  # type: ignore
            status="discovered",
            words=sm.words,
            transcriptText=sm.transcript_text
        )
        clips.append(c)

    report("scoring", 50.0, f"Discovered {len(clips)} winning clip candidates!", clips)

    if cancel_check and cancel_check():
        return False, clips, None

    # =========================================================================
    # STAGE 3 & 4: JIT Byte-Range DASH Slicing & On-Slice 9:16 Render
    # =========================================================================
    step_percent = 40.0 / max(1, len(clips))

    for idx, clip in enumerate(clips):
        if cancel_check and cancel_check():
            return False, clips, None

        curr_p = 50.0 + idx * step_percent
        report("slicing", curr_p, f"Slicing clip {idx+1}/{len(clips)}: {clip.hook[:25]}... (Byte-range only)", clips)

        raw_slice_path = os.path.join(job_dir, f"raw_slice_{clip.clipId}.mp4")

        # Byte-range slice ONLY [start - 2.0, end + 1.0] directly from DASH stream!
        ok_slice, slice_path, s_err = slice_winning_moment(
            url=url,
            start_sec=clip.start,
            end_sec=clip.end,
            output_path=raw_slice_path,
            dash_formats=probe_res.dash_formats,
            pad_pre=2.0,
            pad_post=1.0,
            timeout_seconds=45
        )

        if not ok_slice or not slice_path or not os.path.exists(slice_path):
            clip.status = "failed"
            continue

        clip.status = "rendering"
        report("rendering", curr_p + (step_percent * 0.5), f"Rendering 9:16 vertical clip {idx+1}/{len(clips)}...", clips)

        # On-slice render: face-tracked 9:16 crop, burned kinetic ASS captions, hook title
        # In the padded byte-range slice [start - pad_pre, end + pad_post], the moment starts at pad_offset
        pad_offset = min(2.0, clip.start)
        ok_render, mp4_out, r_err = render_clip_segment(
            source_video=slice_path,
            job_dir=job_dir,
            clip=clip,
            width=1920,
            height=1080,
            seek_start=pad_offset
        )

        if ok_render and mp4_out and os.path.exists(mp4_out):
            clip.status = "ready"
            clip.videoUrl = f"/api/clip/jobs/{os.path.basename(job_dir).replace('clip_', '')}/clips/{clip.clipId}/stream"
            clip.srtUrl = f"/api/clip/jobs/{os.path.basename(job_dir).replace('clip_', '')}/clips/{clip.clipId}/srt"
        else:
            clip.status = "failed"

        # Emit progressive clip update immediately (SupoClip progressive card UX)
        report("rendering", curr_p + step_percent, f"Clip {idx+1} ready!", clips)

    # Package batch ZIP bundle
    ready_clips = [c for c in clips if c.status == "ready"]
    if ready_clips:
        package_clips_zip(job_dir, ready_clips)

    report("ready", 100.0, f"Completed! {len(ready_clips)} clips ready to export.", clips)
    return True, clips, None
