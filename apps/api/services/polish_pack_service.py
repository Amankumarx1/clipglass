import os
import json
import subprocess
from typing import List, Dict, Any, Optional

POLISH_PACK_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "static", "polish_pack"
)

def get_available_polish_styles() -> List[Dict[str, Any]]:
    """Discovers all pre-rendered polish styles and their manifests."""
    styles = []
    if not os.path.exists(POLISH_PACK_DIR):
        return styles

    for item in os.listdir(POLISH_PACK_DIR):
        item_dir = os.path.join(POLISH_PACK_DIR, item)
        if os.path.isdir(item_dir):
            manifest_path = os.path.join(item_dir, "manifest.json")
            if os.path.exists(manifest_path):
                try:
                    with open(manifest_path, "r", encoding="utf-8") as f:
                        data = json.load(f)
                        data["id"] = item
                        styles.append(data)
                except Exception as e:
                    print(f"Error loading polish manifest for {item}: {e}")

    return styles

def get_style_manifest(style_name: str) -> Optional[Dict[str, Any]]:
    """Retrieves manifest metadata for a specific polish style."""
    if not style_name or style_name == 'none':
        return None

    manifest_path = os.path.join(POLISH_PACK_DIR, style_name, "manifest.json")
    if os.path.exists(manifest_path):
        try:
            with open(manifest_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return None
    return None

def apply_polish_bumpers(
    clip_video_path: str,
    style_name: str,
    out_video_path: str
) -> bool:
    """
    Concatenates pre-rendered intro and outro stings to the rendered 9:16 vertical clip
    using FFmpeg complex filter concat.
    """
    if style_name == 'none' or not style_name:
        return True

    style_dir = os.path.join(POLISH_PACK_DIR, style_name)
    intro_mp4 = os.path.join(style_dir, "intro_sting.mp4")
    outro_mp4 = os.path.join(style_dir, "outro_sting.mp4")

    if not (os.path.exists(intro_mp4) and os.path.exists(outro_mp4)):
        print(f"Polish pack assets missing for {style_name}, skipping bumper application.")
        return False

    temp_concat_path = out_video_path + ".polished.mp4"

    cmd = [
        "ffmpeg", "-y",
        "-i", intro_mp4,
        "-i", clip_video_path,
        "-i", outro_mp4,
        "-filter_complex",
        "[0:v:0][0:a:0][1:v:0][1:a:0][2:v:0][2:a:0]concat=n=3:v=1:a=1[v][a]",
        "-map", "[v]", "-map", "[a]",
        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "fast", "-crf", "22",
        "-c:a", "aac", "-b:a", "192k",
        temp_concat_path
    ]

    try:
        proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=120)
        if proc.returncode == 0 and os.path.exists(temp_concat_path) and os.path.getsize(temp_concat_path) > 1000:
            if os.path.exists(out_video_path):
                os.remove(out_video_path)
            os.rename(temp_concat_path, out_video_path)
            return True
        else:
            print(f"Polish concat warning: {proc.stderr[-300:] if proc.stderr else 'unknown'}")
            return False
    except Exception as e:
        print(f"Polish application error: {e}")
        return False
