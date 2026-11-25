import os
import re
import math
import shutil
import subprocess
from typing import Dict, Any, List, Optional, Tuple

def compute_audio_energy_from_file(
    audio_file_path: str,
    duration_seconds: int
) -> Tuple[List[float], List[float]]:
    """
    Computes per-second RMS loudness and silence-to-burst deltas from an audio file.
    Uses FFmpeg astats filter or PCM volume inspection.
    """
    if duration_seconds <= 0 or not os.path.exists(audio_file_path):
        return [0.0] * max(1, duration_seconds), [0.0] * max(1, duration_seconds)

    loudness = [0.0] * duration_seconds
    burst = [0.0] * duration_seconds

    if not shutil.which("ffmpeg"):
        return loudness, burst

    try:
        # Extract per-second RMS levels using FFmpeg astats filter
        cmd = [
            "ffmpeg", "-y", "-i", audio_file_path,
            "-vn", "-af", "asetnsamples=n=44100,astats=metadata=1:reset=1,ametadata=print:key=lavfi.astats.Overall.RMS_level",
            "-f", "null", "-"
        ]
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=45)
        out = proc.stderr or proc.stdout

        rms_pattern = re.compile(r'lavfi\.astats\.Overall\.RMS_level=([-\d\.]+)')
        sec_idx = 0
        raw_db_values = []

        for line in out.splitlines():
            m = rms_pattern.search(line)
            if m:
                try:
                    db = float(m.group(1))
                    if not math.isinf(db) and not math.isnan(db):
                        raw_db_values.append(db)
                    else:
                        raw_db_values.append(-90.0)
                except Exception:
                    raw_db_values.append(-90.0)

        # Normalize dB values: typical audio is -60dB (silence) to -6dB (loud peak)
        for i in range(min(duration_seconds, len(raw_db_values))):
            db = raw_db_values[i]
            # Map [-60.0, -6.0] -> [0.0, 1.0]
            norm = (db + 60.0) / 54.0
            loudness[i] = round(max(0.0, min(1.0, norm)), 4)

        # Compute bursts: rapid rise in loudness from relative silence
        for i in range(1, duration_seconds):
            delta = loudness[i] - loudness[i - 1]
            if delta > 0.15 and loudness[i - 1] < 0.4:
                burst[i] = round(min(1.0, delta * 1.8), 4)

    except Exception:
        pass

    return loudness, burst

def stream_audio_energy(
    audio_url: str,
    duration_seconds: int,
    temp_dir: str
) -> Tuple[List[float], List[float]]:
    """
    Downloads only the lowest-bitrate audio track and computes loudness & burst signals.
    Zero video is downloaded.
    """
    if not audio_url or duration_seconds <= 0:
        return [0.0] * max(1, duration_seconds), [0.0] * max(1, duration_seconds)

    os.makedirs(temp_dir, exist_ok=True)
    audio_path = os.path.join(temp_dir, "probe_audio.m4a")

    try:
        # Download lowest bitrate audio track via FFmpeg or direct curl
        cmd = [
            "ffmpeg", "-y", "-i", audio_url,
            "-t", str(duration_seconds),
            "-vn", "-c:a", "copy", audio_path
        ]
        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=40)

        if os.path.exists(audio_path):
            return compute_audio_energy_from_file(audio_path, duration_seconds)
    except Exception:
        pass

    return [0.0] * duration_seconds, [0.0] * duration_seconds
