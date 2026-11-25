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

def generate_srt_subtitles(words: List[TranscriptWord], out_path: str, clip_offset: float = 0.0, fallback_text: Optional[str] = None, duration: float = 30.0):
    """Generates standard .srt companion subtitle file, synthesizing rhythmic phrases if words are missing."""
    def to_srt_time(sec: float) -> str:
        h = int(sec // 3600)
        m = int((sec % 3600) // 60)
        s = int(sec % 60)
        ms = int(round((sec - int(sec)) * 1000))
        return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"

    processed_words = list(words) if words else []
    if len(processed_words) == 0:
        base_h = fallback_text or "THIS MOMENT CHANGED EVERYTHING"
        sample_phrases = [
            base_h,
            "WAIT FOR THE DROP 🔥",
            "VIRAL RETENTION JUMPED +400%",
            "THE EXACT BLUEPRINT YOU NEED",
            "KEEP VIEWERS HOOKED TO THE END",
            "DROP A COMMENT IF YOU AGREE 💬",
            "TAP FOLLOW FOR PART 2 🚀"
        ]
        t = 0.0
        p_idx = 0
        total_dur = max(duration, 30.0)
        while t < total_dur:
            phrase = sample_phrases[p_idx % len(sample_phrases)]
            tokens = phrase.split()
            w_dur = 2.4 / max(1, len(tokens))
            for i, tok in enumerate(tokens):
                w_s = t + (i * w_dur)
                w_e = w_s + w_dur
                processed_words.append(TranscriptWord(word=tok, start=round(w_s, 2), end=round(w_e, 2)))
            t += 2.8
            p_idx += 1

    actual_offset = clip_offset
    if processed_words and clip_offset > 5.0 and processed_words[0].start < clip_offset * 0.5:
        actual_offset = 0.0

    lines = []
    chunk_size = 5
    counter = 1
    for i in range(0, len(processed_words), chunk_size):
        chunk = processed_words[i : i + chunk_size]
        if not chunk:
            continue
        c_start = max(0.0, chunk[0].start - actual_offset)
        c_end = max(c_start + 0.5, chunk[-1].end - actual_offset)
        txt = " ".join(w.word for w in chunk).strip()

        lines.append(f"{counter}\n{to_srt_time(c_start)} --> {to_srt_time(c_end)}\n{txt}\n")
        counter += 1

    with open(out_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

def download_clip_section(
    url: str,
    job_dir: str,
    clip_id: str,
    start: float,
    end: float
) -> Optional[str]:
    """
    Downloads ONLY the requested 30-60 second section directly from YouTube on-demand,
    bypassing full video download and saving 98%+ bandwidth and memory.
    """
    import yt_dlp
    from yt_dlp.utils import download_range_func
    from app.config import settings

    outtmpl = os.path.join(job_dir, f"raw_section_{clip_id}.%(ext)s")
    base_opts: Dict[str, Any] = {
        "outtmpl": outtmpl,
        "format": "bv*[height<=1080]+ba/b[height<=1080]/best",
        "merge_output_format": "mp4",
        "download_ranges": download_range_func(None, [(start, end)]),
        "force_keyframes_at_cuts": True,
        "quiet": True,
        "no_warnings": True,
        "socket_timeout": 30,
        "noplaylist": True,
    }
    if settings.YOUTUBE_PROXY:
        base_opts["proxy"] = settings.YOUTUBE_PROXY
    if settings.YOUTUBE_COOKIES_FILE:
        base_opts["cookiefile"] = settings.YOUTUBE_COOKIES_FILE

    try:
        with yt_dlp.YoutubeDL(base_opts) as ydl:
            ydl.download([url])
    except Exception as e:
        print(f"Error downloading clip section {clip_id}: {e}")

    # Find resulting downloaded section file
    candidates = [os.path.join(job_dir, f) for f in os.listdir(job_dir) if f.startswith(f"raw_section_{clip_id}") and not f.endswith(".part")]
    candidates.sort(key=lambda x: (0 if x.endswith(".mp4") else 1))
    if candidates:
        return candidates[0]

    # Live Stream / HLS fallback: Extract stream URL and trim directly with FFmpeg
    try:
        with yt_dlp.YoutubeDL({"quiet": True, "noplaylist": True, "socket_timeout": 15}) as ydl:
            info = ydl.extract_info(url, download=False)
            stream_url = None
            if info:
                formats = info.get("formats") or []
                for f in reversed(formats):
                    u = f.get("url") or f.get("manifest_url")
                    if u and ("m3u8" in u or "googlevideo" in u):
                        stream_url = u
                        break
                if not stream_url:
                    stream_url = info.get("url")

            if stream_url:
                dur = max(1.0, end - start)
                fb_out = os.path.join(job_dir, f"raw_section_{clip_id}.mp4")
                cmd = [
                    "ffmpeg", "-nostdin", "-threads", "2",
                    "-ss", str(start), "-t", str(dur),
                    "-i", stream_url,
                    "-c:v", "libx264", "-preset", "ultrafast", "-c:a", "aac",
                    "-y", fb_out
                ]
                subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=45)
                if os.path.exists(fb_out) and os.path.getsize(fb_out) > 1000:
                    return fb_out
    except Exception as e:
        print(f"Fallback stream trim notice for clip {clip_id}: {e}")

    return None

def render_clip_segment(
    source_video: str,
    job_dir: str,
    clip: ClipMoment,
    width: int = 1920,
    height: int = 1080,
    seek_start: Optional[float] = None
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

    # 0. Zero-Download On-Demand Slicing: If source is remote YouTube URL, fetch ONLY this clip's time range
    actual_source = source_video
    cleanup_temp_source = False
    source_is_remote = source_video.startswith("http://") or source_video.startswith("https://")

    if source_is_remote:
        sec_path = download_clip_section(source_video, job_dir, clip.clipId, clip.start, clip.end)
        if not sec_path or not os.path.exists(sec_path):
            return False, None, f"Failed to download video stream section for clip {clip.clipId}"
        actual_source = sec_path
        cleanup_temp_source = True

    # 1. Generate Word-Synced Subtitles with Opening Hook Title Banner
    words_to_burn = clip.words if clip.words else []
    generate_ass_subtitles(
        words_to_burn,
        ass_path,
        preset=clip.captionPreset,
        clip_offset=clip.start,
        hook_title=clip.hook,
        hook_duration=3.5,
        duration=dur
    )
    generate_srt_subtitles(
        words_to_burn,
        srt_path,
        clip_offset=clip.start,
        fallback_text=clip.hook or clip.title,
        duration=dur
    )

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

    # 3. Assemble FFmpeg filter graph (Probe source dimensions to handle any resolution cleanly)
    real_w, real_h = width, height
    try:
        probe = subprocess.run(
            ["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=s=x:p=0", actual_source],
            capture_output=True, text=True, timeout=5
        )
        if probe.stdout.strip():
            parts = probe.stdout.strip().split('x')
            if len(parts) == 2:
                real_w, real_h = int(parts[0]), int(parts[1])
    except Exception:
        pass

    if seek_start is not None:
        input_start = str(seek_start)
    else:
        input_start = "0" if source_is_remote else str(clip.start)
    input_file = os.path.abspath(actual_source)

    reframe_filter, is_complex = build_reframe_filter(
        clip.reframeMode, real_w, real_h, actual_source, float(input_start), dur
    )

    encoder = get_best_h264_encoder()

    # Pass relative ass path to avoid Windows backslash / colon escaping issues in FFmpeg
    rel_ass = ass_filename.replace('\\', '/')

    if is_complex:
        # Split screen has [v] output tag
        filter_complex = f"{reframe_filter};[v]ass={rel_ass}[final_v]"
        cmd = [
            "ffmpeg", "-y",
            "-ss", input_start, "-t", str(dur),
            "-i", input_file,
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
            "-ss", input_start, "-t", str(dur),
            "-i", input_file,
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
    finally:
        if cleanup_temp_source and actual_source and os.path.exists(actual_source):
            try:
                os.remove(actual_source)
            except Exception:
                pass

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
