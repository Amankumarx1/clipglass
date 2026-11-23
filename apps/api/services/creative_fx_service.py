import os
import subprocess
import re
import math
from typing import Optional, List
from schemas.jobs import CreativeFXConfig

def sanitize_hook_text(text: Optional[str]) -> str:
    if not text:
        return "WAIT FOR THE END..."
    # Escape quotes, colons, percent signs, and backslashes for FFmpeg drawtext filter
    cleaned = re.sub(r'[\x00-\x1f\x7f"\'\\]', '', text).strip()
    cleaned = cleaned.replace(":", "\\:").replace("%", "\\%")
    return cleaned[:80] or "WAIT FOR THE END..."

def has_audio_stream(file_path: str) -> bool:
    """Check if input file contains an active audio stream."""
    try:
        cmd = [
            "ffprobe", "-v", "error", "-select_streams", "a",
            "-show_entries", "stream=codec_type", "-of", "csv=p=0", file_path
        ]
        proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=10)
        return "audio" in proc.stdout.lower()
    except Exception:
        return True

def build_fx_filtergraph(fx: CreativeFXConfig) -> List[str]:
    """
    Builds video filter arguments for aesthetic styles and kinetic hooks.
    """
    vf_chain = []

    # 1. Aesthetic Film Styles (Lemo-Opuscar inspired)
    if fx.filterStyle == 'vintage_35mm':
        # Warm film color grading, authentic grain, and 35mm stock curve
        vf_chain.append("curves=vintage,noise=alls=12:allf=t+u,eq=contrast=1.08:saturation=1.15")
    elif fx.filterStyle == 'retro_vhs':
        # NTSC color cross-processing, VHS scanlines, and retro OSD tape counter
        vf_chain.append("curves=cross_process,colorchannelmixer=rr=1.08:rb=0.04:br=0.04:bb=1.08,eq=contrast=1.18:brightness=0.02")
        vf_chain.append("drawtext=text='PLAY \\u25B6 00\\:42\\:19 SP':fontsize=28:fontcolor=white:x=40:y=40:box=1:boxcolor=black@0.6:boxborderw=4")
    elif fx.filterStyle == 'scifi_hud':
        # Cool cyan tint and tactical HUD corner targeting brackets
        vf_chain.append("eq=contrast=1.2:saturation=0.85,colorbalance=rs=-0.08:gs=0.08:bs=0.2")
        vf_chain.append("drawbox=x=30:y=30:w=80:h=4:color=cyan@0.85:t=fill,drawbox=x=30:y=30:w=4:h=80:color=cyan@0.85:t=fill")
        vf_chain.append("drawbox=x=w-110:y=30:w=80:h=4:color=cyan@0.85:t=fill,drawbox=x=w-34:y=30:w=4:h=80:color=cyan@0.85:t=fill")
        vf_chain.append("drawtext=text='TARGET LOCK // REC':fontsize=22:fontcolor=cyan:x=40:y=h-60:box=1:boxcolor=black@0.7:boxborderw=4")
    elif fx.filterStyle == 'film_noir':
        # High-contrast crushed monochrome with dark vignette
        vf_chain.append("hue=s=0,curves=strong_contrast,eq=contrast=1.38:brightness=-0.04")

    # 2. Kinetic 3-Second Hooks
    if fx.hookIntro != 'none' and fx.hookIntro:
        hook_txt = sanitize_hook_text(fx.hookText)
        if fx.hookIntro == 'slam_title':
            # Punchy yellow animated title box with drop shadow for the first 3 seconds
            vf_chain.append(
                f"drawtext=text='{hook_txt}':fontsize=52:fontcolor=yellow:x=(w-text_w)/2:y=(h-text_h)/2.2:"
                f"enable='between(t,0,3)':box=1:boxcolor=black@0.75:boxborderw=12"
            )
        elif fx.hookIntro == 'glitch_reveal':
            # Cyan glowing glitch hook
            vf_chain.append(
                f"drawtext=text='{hook_txt}':fontsize=48:fontcolor=cyan:x=(w-text_w)/2:y=(h-text_h)/2:"
                f"enable='between(t,0,3.2)':box=1:boxcolor=black@0.8:boxborderw=10"
            )
        elif fx.hookIntro == 'breaking_hook':
            # Viral breaking news banner
            vf_chain.append(
                f"drawtext=text='\\u26A0 BREAKING ALERT \\u26A0':fontsize=36:fontcolor=red:x=(w-text_w)/2:y=80:enable='between(t,0,3.5)':box=1:boxcolor=black@0.85:boxborderw=8,"
                f"drawtext=text='{hook_txt}':fontsize=46:fontcolor=white:x=(w-text_w)/2:y=140:enable='between(t,0,3.5)':box=1:boxcolor=black@0.75:boxborderw=10"
            )

    return vf_chain

def apply_post_processing_fx(
    input_file: str,
    output_file: str,
    fx: CreativeFXConfig
) -> bool:
    """
    Applies creative visual filters, split-screen retention bottom stack,
    blurred 9:16 vertical framing, and kinetic hooks using FFmpeg.
    """
    if (fx.filterStyle == 'none' and 
        fx.splitScreen == 'none' and 
        fx.hookIntro == 'none' and 
        fx.aspectRatio == 'original'):
        return False

    has_audio = has_audio_stream(input_file)
    vf_chain = build_fx_filtergraph(fx)

    # CASE A: Split-Screen Retention Visualizer (9:16 vertical stack, Top: Video, Bottom: Procedural Visualizer)
    if fx.splitScreen != 'none':
        # Select bottom procedural visualizer
        if fx.splitScreen in ('audio_nebula', 'audio_reactive') and has_audio:
            # Real-time audio waveform spectrum
            filter_complex = (
                "[0:v]scale=1080:960:force_original_aspect_ratio=decrease,pad=1080:960:(ow-iw)/2:(oh-ih)/2:black[top];"
                "[0:a]showwaves=s=1080x960:mode=cline:colors=cyan|purple:rate=30[bottom];"
                "[top][bottom]vstack=inputs=2[stacked]"
            )
        elif fx.splitScreen == 'hypnotic_tunnel':
            # Infinite procedural fractal tunnel loop
            filter_complex = (
                "[0:v]scale=1080:960:force_original_aspect_ratio=decrease,pad=1080:960:(ow-iw)/2:(oh-ih)/2:black[top];"
                "mandelbrot=size=1080x960:rate=30[bottom];"
                "[top][bottom]vstack=inputs=2[stacked]"
            )
        else:
            # Procedural liquid flow / color gradient loop
            filter_complex = (
                "[0:v]scale=1080:960:force_original_aspect_ratio=decrease,pad=1080:960:(ow-iw)/2:(oh-ih)/2:black[top];"
                "testsrc=size=1080x960:rate=30,hue=H=2*PI*t:s=1[bottom];"
                "[top][bottom]vstack=inputs=2[stacked]"
            )

        if vf_chain:
            filter_complex += f";[stacked]{','.join(vf_chain)}[v]"
        else:
            filter_complex = filter_complex.replace("[stacked]", "[v]")

        cmd = [
            "ffmpeg", "-y", "-i", input_file,
            "-filter_complex", filter_complex,
            "-map", "[v]"
        ]
        if has_audio:
            cmd.extend(["-map", "0:a?", "-c:a", "aac", "-b:a", "192k"])
        cmd.extend([
            "-c:v", "libx264", "-preset", "fast", "-crf", "22",
            output_file
        ])

    # CASE B: 9:16 Vertical Framing with Blurred Background
    elif fx.aspectRatio == '9:16':
        vf_base = (
            "[0:v]split[bg_in][fg_in];"
            "[bg_in]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=25:5[bg];"
            "[fg_in]scale=1080:1920:force_original_aspect_ratio=decrease[fg];"
            "[bg][fg]overlay=(W-w)/2:(H-h)/2[framed]"
        )
        if vf_chain:
            vf_base += f";[framed]{','.join(vf_chain)}[v]"
        else:
            vf_base = vf_base.replace("[framed]", "[v]")

        cmd = [
            "ffmpeg", "-y", "-i", input_file,
            "-filter_complex", vf_base,
            "-map", "[v]"
        ]
        if has_audio:
            cmd.extend(["-map", "0:a?", "-c:a", "copy"])
        cmd.extend([
            "-c:v", "libx264", "-preset", "fast", "-crf", "22",
            output_file
        ])

    # CASE C: Standard In-Place Filters (Cinematic aesthetics + hooks)
    else:
        vf_arg = ",".join(vf_chain) if vf_chain else "null"
        cmd = [
            "ffmpeg", "-y", "-i", input_file,
            "-vf", vf_arg,
            "-c:v", "libx264", "-preset", "fast", "-crf", "22"
        ]
        if has_audio:
            cmd.extend(["-c:a", "copy"])
        cmd.append(output_file)

    try:
        proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=240)
        return proc.returncode == 0 and os.path.exists(output_file) and os.path.getsize(output_file) > 1000
    except Exception as e:
        print(f"Creative FX error: {e}")
        return False
