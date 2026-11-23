import os
from typing import List, Optional
from schemas.clip import TranscriptWord, CaptionPresetType

def format_ass_time(seconds: float) -> str:
    """Formats float seconds into ASS timestamp format: H:MM:SS.cs"""
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    cs = int(round((seconds - int(seconds)) * 100))
    if cs >= 100:
        cs = 99
    return f"{h}:{m:02d}:{s:02d}.{cs:02d}"

def generate_ass_subtitles(
    words: List[TranscriptWord],
    out_path: str,
    preset: str = 'viral_pop',
    clip_offset: float = 0.0,
    hook_title: Optional[str] = None,
    hook_duration: float = 3.5
) -> str:
    """
    Generates a word-synced Advanced SubStation Alpha (.ass) subtitle file
    with styled typography, active karaoke highlights, and opening hook title banner.
    Target resolution: 1080x1920 (9:16 vertical).
    """
    # 1. Preset Style Configurations
    # Color format in ASS is &HAABBGGRR& (Hex alpha-blue-green-red)
    styles = {
        'viral_pop': {
            'font': 'Arial',
            'fontsize': 48,
            'primary_color': '&H00FFFFFF&',    # White
            'secondary_color': '&H0000FFFF&',  # Yellow highlight
            'outline_color': '&H00000000&',    # Black outline
            'back_color': '&H80000000&',
            'bold': 1,
            'outline': 4,
            'shadow': 2,
            'margin_v': 260,
            'alignment': 2,                    # Bottom center (safe zone above TikTok/Shorts UI)
        },
        'minimalist': {
            'font': 'Helvetica',
            'fontsize': 40,
            'primary_color': '&H00F0F0F0&',
            'secondary_color': '&H0000D2FF&',  # Cyan
            'outline_color': '&H00101010&',
            'back_color': '&H90000000&',
            'bold': 0,
            'outline': 1.5,
            'shadow': 0,
            'margin_v': 240,
            'alignment': 2,
        },
        'neon_cyber': {
            'font': 'Arial',
            'fontsize': 46,
            'primary_color': '&H00FFFF00&',    # Cyan
            'secondary_color': '&H00FF00FF&',  # Magenta
            'outline_color': '&H00330033&',
            'back_color': '&H00000000&',
            'bold': 1,
            'outline': 3.5,
            'shadow': 3,
            'margin_v': 260,
            'alignment': 2,
        },
        'karaoke': {
            'font': 'Arial',
            'fontsize': 50,
            'primary_color': '&H00FFFFFF&',
            'secondary_color': '&H0000FF00&',  # Bright Green
            'outline_color': '&H00000000&',
            'back_color': '&H80000000&',
            'bold': 1,
            'outline': 4,
            'shadow': 2,
            'margin_v': 270,
            'alignment': 2,
        },
        'headline': {
            'font': 'Impact',
            'fontsize': 54,
            'primary_color': '&H0000FFFF&',    # Yellow
            'secondary_color': '&H00FFFFFF&',
            'outline_color': '&H00000000&',
            'back_color': '&H99000000&',
            'bold': 1,
            'outline': 4.5,
            'shadow': 1,
            'margin_v': 290,
            'alignment': 2,
        },
        'dynamic_box': {
            'font': 'Arial',
            'fontsize': 44,
            'primary_color': '&H00000000&',    # Dark text
            'secondary_color': '&H00111111&',
            'outline_color': '&H00FFFFFF&',    # White solid box border
            'back_color': '&H00FFFFFF&',       # Opaque white background box
            'bold': 1,
            'outline': 0,
            'shadow': 0,
            'margin_v': 260,
            'alignment': 2,
        },
        'glitch_cyber': {
            'font': 'Courier New',
            'fontsize': 46,
            'primary_color': '&H0000FFCC&',    # Neon Mint Cyan
            'secondary_color': '&H00CC00FF&',  # Magenta glitch
            'outline_color': '&H00110022&',
            'back_color': '&H00000000&',
            'bold': 1,
            'outline': 3.5,
            'shadow': 2,
            'margin_v': 255,
            'alignment': 2,
        },
        'gold_luxury': {
            'font': 'Georgia',
            'fontsize': 48,
            'primary_color': '&H0045D4FF&',    # Warm Golden amber
            'secondary_color': '&H00FFFFFF&',
            'outline_color': '&H00101525&',
            'back_color': '&H80000000&',
            'bold': 1,
            'outline': 3,
            'shadow': 3,
            'margin_v': 260,
            'alignment': 2,
        },
        'comic_pop': {
            'font': 'Arial Black',
            'fontsize': 52,
            'primary_color': '&H0000E5FF&',    # Vibrant Yellow-Orange
            'secondary_color': '&H00FFFFFF&',
            'outline_color': '&H00000000&',
            'back_color': '&H99000000&',
            'bold': 1,
            'outline': 5,
            'shadow': 4,
            'margin_v': 280,
            'alignment': 2,
        },
        'cinematic_sub': {
            'font': 'Helvetica',
            'fontsize': 42,
            'primary_color': '&H00FFFFFF&',
            'secondary_color': '&H0020D8FF&',  # Warm subtitle yellow
            'outline_color': '&H00000000&',
            'back_color': '&HA0000000&',
            'bold': 0,
            'outline': 2,
            'shadow': 1,
            'margin_v': 230,
            'alignment': 2,
        }
    }

    conf = styles.get(preset, styles['viral_pop'])

    header = f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,{conf['font']},{conf['fontsize']},{conf['primary_color']},{conf['secondary_color']},{conf['outline_color']},{conf['back_color']},{conf['bold']},0,0,0,100,100,1,0,1,{conf['outline']},{conf['shadow']},{conf['alignment']},50,50,{conf['margin_v']},1
Style: HookTitle,Impact,52,&H00FFFFFF&,&H0000FFFF&,&H00000000&,&H90000000&,1,0,0,0,100,100,1,0,1,4.5,2.5,8,50,50,280,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""

    events = []

    # 1. Opening Hook Title Banner (burned at Top Center for first 3.5s)
    if hook_title and hook_title.strip():
        clean_hook = hook_title.strip().upper()
        h_start = "0:00:00.00"
        h_end = format_ass_time(hook_duration)
        # Fade in 150ms, fade out 250ms
        events.append(f"Dialogue: 1,{h_start},{h_end},HookTitle,,0,0,0,,{{\\fad(150,250)}}{clean_hook}")

    # 2. Group words into chunks of 3-5 words for viral fast-paced display
    chunk_size = 4
    for i in range(0, len(words), chunk_size):
        chunk = words[i : i + chunk_size]
        if not chunk:
            continue

        c_start = max(0.0, chunk[0].start - clip_offset)
        c_end = max(c_start + 0.3, chunk[-1].end - clip_offset)

        # Word-level timing highlights
        dialogue_text = ""
        for w in chunk:
            dur_cs = max(10, int(round((w.end - w.start) * 100)))
            clean_w = w.word.replace('{', '').replace('}', '').strip()
            # ASS Karaoke tag \k<duration_in_centiseconds>
            dialogue_text += f"{{\\k{dur_cs}}}{clean_w} "

        dialogue_text = dialogue_text.strip()
        start_str = format_ass_time(c_start)
        end_str = format_ass_time(c_end)

        events.append(f"Dialogue: 0,{start_str},{end_str},Default,,0,0,0,,{dialogue_text}")

    full_ass_content = header + "\n".join(events) + "\n"

    with open(out_path, "w", encoding="utf-8") as f:
        f.write(full_ass_content)

    return out_path
