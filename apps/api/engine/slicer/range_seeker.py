import os
import subprocess
import shutil
from typing import Tuple, Optional, Dict

def slice_with_ffmpeg_range_seek(
    video_url: str,
    audio_url: str,
    start_sec: float,
    end_sec: float,
    output_path: str,
    headers: Optional[Dict[str, str]] = None,
    pad_pre: float = 2.0,
    pad_post: float = 1.0,
    timeout_seconds: int = 60
) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    Direct FFmpeg HTTP range seeking fallback.
    Places `-ss` before `-i` on separate DASH video and audio URLs to trigger
    HTTP Range header seeks, downloading only the padded window.
    """
    if not shutil.which("ffmpeg"):
        return False, None, "ffmpeg executable not found"

    pad_start = max(0.0, start_sec - pad_pre)
    dur = (end_sec + pad_post) - pad_start

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    if os.path.exists(output_path):
        try:
            os.remove(output_path)
        except Exception:
            pass

    header_lines = []
    if headers:
        for k, v in headers.items():
            header_lines.append(f"{k}: {v}\r\n")
    headers_str = "".join(header_lines)

    # First attempt: Lossless stream copy
    cmd = ["ffmpeg", "-y"]
    if headers_str:
        cmd.extend(["-headers", headers_str])
    cmd.extend(["-ss", f"{pad_start:.2f}", "-i", video_url])

    if headers_str:
        cmd.extend(["-headers", headers_str])
    cmd.extend([
        "-ss", f"{pad_start:.2f}", "-i", audio_url,
        "-t", f"{dur:.2f}",
        "-c:v", "copy",
        "-c:a", "aac",
        "-avoid_negative_ts", "make_zero",
        output_path
    ])

    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout_seconds)
        if os.path.exists(output_path) and os.path.getsize(output_path) > 1000:
            return True, output_path, None

        # Fallback: re-encode video fast if stream copy keyframe was misaligned
        cmd_reencode = ["ffmpeg", "-y"]
        if headers_str:
            cmd_reencode.extend(["-headers", headers_str])
        cmd_reencode.extend(["-ss", f"{pad_start:.2f}", "-i", video_url])
        if headers_str:
            cmd_reencode.extend(["-headers", headers_str])
        cmd_reencode.extend([
            "-ss", f"{pad_start:.2f}", "-i", audio_url,
            "-t", f"{dur:.2f}",
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "22",
            "-c:a", "aac",
            output_path
        ])
        proc2 = subprocess.run(cmd_reencode, capture_output=True, text=True, timeout=timeout_seconds)
        if os.path.exists(output_path) and os.path.getsize(output_path) > 1000:
            return True, output_path, None

        return False, None, proc2.stderr or proc2.stdout or "FFmpeg range seek failed"
    except subprocess.TimeoutExpired:
        return False, None, f"FFmpeg range seek timed out after {timeout_seconds}s"
    except Exception as e:
        return False, None, str(e)
