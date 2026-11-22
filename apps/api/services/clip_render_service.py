import os
import subprocess
import json
import zipfile
from typing import Optional, List, Dict, Any, Tuple
from schemas.clip import ClipMoment, TranscriptWord
from services.ass_caption_service import generate_ass_subtitles
from services.face_tracking_service import build_reframe_filter
from services.polish_pack_service import apply_polish_bumpers

_DETECTED_ENCODER = None

def get_best_h264_encoder() -> str:
    """
    Detects hardware video encoder (NVENC, QSV, AMF, VAAPI), falling back to CPU libx264.
    """
    global _DETECTED_ENCODER
    if _DETECTED_ENCODER is not None:
        return _DETECTED_ENCODER

    candidates = ["h264_nvenc", "h264_qsv", "h264_amf", "h264_vaapi"]
    try:
        proc = subprocess.run(["ffmpeg", "-encoders"], stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True, timeout=5)
        for enc in candidates:
            if enc in proc.stdout:
                # Test if the hardware encoder actually initializes successfully
                test_cmd = ["ffmpeg", "-y", "-f", "lavfi", "-i", "nullsrc=s=64x64:d=0.1", "-c:v", enc, "-f", "null", "-"]
                test_proc = subprocess.run(test_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=5)
                if test_proc.returncode == 0:
                    _DETECTED_ENCODER = enc
                    return enc
    except Exception:
        pass

    _DETECTED_ENCODER = "libx264"
    return "libx264"

def generate_srt_subtitles(words: List[TranscriptWord], out_path: str, clip_offset: float = 0.0):
    """Generates standard .srt companion subtitle file."""
    def to_srt_time(sec: float) -> str:
        h = int(sec // 3600)
        m = int((sec % 3600) // 60)
        s = int(sec % 60)
        ms = int(round((sec - int(sec)) * 1000))
        return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"

    lines = []
    chunk_size = 5
    counter = 1
    for i in range(0, len(words), chunk_size):
        chunk = words[i : i + chunk_size]
        if not chunk:
            continue
        c_start = max(0.0, chunk[0].start - clip_offset)
        c_end = max(c_start + 0.5, chunk[-1].end - clip_offset)
        txt = " ".join(w.word for w in chunk).strip()

        lines.append(f"{counter}\n{to_srt_time(c_start)} --> {to_srt_time(c_end)}\n{txt}\n")
        counter += 1

    with open(out_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

def render_clip_segment(
    source_video: str,
    job_dir: str,
    clip: ClipMoment,
    width: int = 1920,
    height: int = 1080
) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    Renders trimmed, reframed 9:16 vertical video with burned ASS subtitles, opening hook title,
    optional design-time Polish Pack bumpers, and metadata JSON.
    Returns (success, mp4_path, error_str).
    """
    out_filename = f"clip_{clip.clipId}.mp4"
    out_path = os.path.join(job_dir, out_filename)
    ass_filename = f"subs_{clip.clipId}.ass"
    ass_path = os.path.join(job_dir, ass_filename)
    srt_path = os.path.join(job_dir, f"clip_{clip.clipId}.srt")
    meta_path = os.path.join(job_dir, f"clip_{clip.clipId}.json")

    dur = max(1.0, clip.end - clip.start)

    # 1. Generate Word-Synced Subtitles with Opening Hook Title Banner
    words_to_burn = clip.words if clip.words else []
    generate_ass_subtitles(
        words_to_burn,
        ass_path,
        preset=clip.captionPreset,
        clip_offset=clip.start,
        hook_title=clip.hook,
        hook_duration=3.5
    )
    generate_srt_subtitles(words_to_burn, srt_path, clip_offset=clip.start)

    # 2. Write comprehensive metadata.json
    metadata_content = {
        "clipId": clip.clipId,
        "title": clip.title,
        "hook": clip.hook,
        "hashtags": clip.hashtags,
        "reason": clip.reason,
        "evidence": clip.evidence,
        "score": clip.score,
        "hookScore": clip.hookScore,
        "engagementScore": clip.engagementScore,
        "valueScore": clip.valueScore,
        "shareabilityScore": clip.shareabilityScore,
        "duration": round(dur, 2),
        "start": clip.start,
        "end": clip.end,
        "reframeMode": clip.reframeMode,
        "captionPreset": clip.captionPreset,
        "platformPreset": clip.platformPreset,
        "polishStyle": clip.polishStyle
    }
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(metadata_content, f, indent=2)

    # 3. Assemble FFmpeg filter graph
    reframe_filter, is_complex = build_reframe_filter(
        clip.reframeMode, width, height, source_video, clip.start, dur
    )

    encoder = get_best_h264_encoder()

    # Pass relative ass path to avoid Windows backslash / colon escaping issues in FFmpeg
    rel_ass = ass_filename.replace('\\', '/')

    if is_complex:
        # Split screen has [v] output tag
        filter_complex = f"{reframe_filter};[v]ass={rel_ass}[final_v]"
        cmd = [
            "ffmpeg", "-y",
            "-ss", str(clip.start), "-t", str(dur),
            "-i", os.path.basename(source_video),
            "-filter_complex", filter_complex,
            "-map", "[final_v]", "-map", "0:a?",
            "-c:v", encoder,
            "-c:a", "aac", "-b:a", "192k",
            out_filename
        ]
    else:
        # Simple vf chain
        vf_chain = f"{reframe_filter},ass={rel_ass}"
        cmd = [
            "ffmpeg", "-y",
            "-ss", str(clip.start), "-t", str(dur),
            "-i", os.path.basename(source_video),
            "-vf", vf_chain,
            "-c:v", encoder,
            "-c:a", "aac", "-b:a", "192k",
            out_filename
        ]

    if encoder == "libx264":
        cmd.extend(["-preset", "fast", "-crf", "22"])

    try:
        # Run inside job_dir so relative file paths resolve cleanly
        proc = subprocess.run(cmd, cwd=job_dir, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=180)
        if proc.returncode == 0 and os.path.exists(out_path) and os.path.getsize(out_path) > 1000:
            # 4. Apply Polish Pack Bumpers if requested
            if clip.polishStyle and clip.polishStyle != 'none':
                apply_polish_bumpers(out_path, clip.polishStyle, out_path)

            return True, out_path, None
        else:
            err_msg = proc.stderr[-400:] if proc.stderr else "FFmpeg failed without stderr."
            return False, None, err_msg
    except Exception as e:
        return False, None, str(e)

def package_clips_zip(job_dir: str, clips: List[ClipMoment]) -> Optional[str]:
    """
    Bundles all rendered MP4 clips, SRT subtitle files, and metadata JSON into a single ZIP.
    """
    zip_filename = "clipglass_auto_clips.zip"
    zip_path = os.path.join(job_dir, zip_filename)

    try:
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for clip in clips:
                mp4_file = f"clip_{clip.clipId}.mp4"
                srt_file = f"clip_{clip.clipId}.srt"
                json_file = f"clip_{clip.clipId}.json"

                for fname in (mp4_file, srt_file, json_file):
                    fpath = os.path.join(job_dir, fname)
                    if os.path.exists(fpath):
                        zipf.write(fpath, arcname=fname)

        if os.path.exists(zip_path) and os.path.getsize(zip_path) > 100:
            return zip_path
    except Exception as e:
        print(f"Zip packaging error: {e}")

    return None
