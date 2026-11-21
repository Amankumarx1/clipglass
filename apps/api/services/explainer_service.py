import os
import re
import uuid
import asyncio
import subprocess
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Tuple
from schemas.explainer import ExplainerGenerateRequest
from schemas.jobs import JobCreateRequest
from services.queue_service import job_manager, JobRecord, compute_peaks_from_file
from app.config import settings

TOPIC_PRESETS = {
    "imax": (
        "Christopher Nolan does not just shoot movies. He bends reality on 70 millimeter IMAX film stock. "
        "Each 15 perf frame delivers eighteen thousand lines of horizontal resolution, making digital cameras look like blurry toys. "
        "When the camera turns, sixty pounds of mechanical glass reels at three hundred feet per minute. "
        "This is pure celluloid power."
    ),
    "oppenheimer": (
        "Why was Oppenheimer shot in black and white? Christopher Nolan created two distinct perspectives. "
        "The color scenes represent J. Robert Oppenheimer's subjective emotional reality. "
        "The black and white scenes represent Lewis Strauss and the objective historical record. "
        "Kodak even had to invent the world's first 65mm black-and-white IMAX film just for this movie."
    ),
    "tarantino": (
        "Quentin Tarantino's secret weapon isn't violence. It is trivial mundane dialogue right before a massacre. "
        "By making hitmen discuss French cheeseburgers or foot massages, the tension becomes unbearable. "
        "When violence finally erupts, the shock value is magnified ten times over."
    ),
    "celluloid": (
        "Digital sensors capture sterile mathematical pixels. Real film stock captures organic silver halide crystals. "
        "Every frame has random grain that human eyes perceive as warmth and natural depth. "
        "That is why top directors still spend millions shooting on real physical film."
    )
}

def generate_script_from_topic(topic: str) -> str:
    topic_lower = topic.lower()
    for key, text in TOPIC_PRESETS.items():
        if key in topic_lower:
            return text

    # Dynamic structured script for custom topics
    clean_topic = re.sub(r'[\x00-\x1f\x7f\\"\']', '', topic).strip()
    return (
        f"Here is the untold truth about {clean_topic}. "
        "Most people only see the surface, but the real secret lies in the execution. "
        "When you break down the mechanics frame by frame, the entire perspective shifts. "
        "Pay close attention to what happens next."
    )

def get_audio_duration(file_path: str) -> float:
    try:
        cmd = [
            "ffprobe", "-v", "error", "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1", file_path
        ]
        proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=10)
        return float(proc.stdout.strip())
    except Exception:
        return 15.0

def build_procedural_video_filter(style: str, sentences: List[Tuple[str, float, float]], total_dur: float) -> str:
    """
    Builds visual filter chain with procedural background and kinetic word captions.
    """
    filters = []

    # 1. Base visual styling
    if style == 'blueprint':
        # Technical blueprint grid: deep cyan tint + drafting border
        filters.append("colorbalance=rs=-0.25:gs=0.08:bs=0.45,eq=contrast=1.2:brightness=-0.05")
        filters.append("drawbox=x=40:y=60:w=1000:h=1800:color=cyan@0.4:t=3")
        filters.append("drawbox=x=48:y=68:w=984:h=1784:color=cyan@0.2:t=1")
        filters.append("drawtext=text='SYSTEM SPEC // BLUEPRINT ARCHIVE':fontsize=26:fontcolor=cyan:x=60:y=85")
        filters.append("drawtext=text='SCALE 1\\:1 // PERSPECTIVE HUD':fontsize=20:fontcolor=cyan@0.8:x=60:y=1820")
    elif style == 'film_noir':
        # Dark high-contrast monochrome with film grain
        filters.append("hue=s=0,eq=contrast=1.45:brightness=-0.06,noise=alls=15:allf=t+u")
        filters.append("drawbox=x=0:y=0:w=1080:h=180:color=black:t=fill")
        filters.append("drawbox=x=0:y=1740:w=1080:h=180:color=black:t=fill")
        filters.append("drawtext=text='ARCHIVAL REEL':fontsize=28:fontcolor=white@0.7:x=60:y=80")
    elif style == 'cyberpunk':
        # Neon violet-cyan high-energy aesthetic
        filters.append("colorbalance=rs=0.15:gs=-0.1:bs=0.35,eq=contrast=1.3:saturation=1.4")
        filters.append("drawbox=x=50:y=50:w=980:h=6:color=magenta@0.8:t=fill")
        filters.append("drawbox=x=50:y=1864:w=980:h=6:color=cyan@0.8:t=fill")
        filters.append("drawtext=text='NEURAL CHRONICLE // CYBER-SYS':fontsize=26:fontcolor=magenta:x=60:y=80")
    elif style == 'retro_vhs':
        # 1990s VHS home tape tracking
        filters.append("curves=cross_process,eq=contrast=1.2:brightness=0.02,noise=alls=10:allf=t+u")
        filters.append("drawtext=text='PLAY \\u25B6 00\\:12\\:48 SP':fontsize=32:fontcolor=white:x=60:y=80:box=1:boxcolor=black@0.6:boxborderw=6")
        filters.append("drawtext=text='CH 03 STEREO':fontsize=26:fontcolor=white@0.8:x=w-240:y=80")

    # 2. Kinetic word-by-word sentence captions
    for text, start, end in sentences:
        safe_txt = re.sub(r'[\x00-\x1f\x7f\\"\']', '', text).strip()
        # Clean text for drawtext
        safe_txt = safe_txt.replace(":", "\\:").replace("%", "\\%")
        # Wrap long text
        words = safe_txt.split()
        if len(words) > 7:
            mid = len(words) // 2
            line1 = " ".join(words[:mid])
            line2 = " ".join(words[mid:])
            filters.append(
                f"drawtext=text='{line1}':fontsize=46:fontcolor=yellow:x=(w-text_w)/2:y=(h-text_h)/2-35:"
                f"enable='between(t,{start:.2f},{end:.2f})':box=1:boxcolor=black@0.75:boxborderw=10"
            )
            filters.append(
                f"drawtext=text='{line2}':fontsize=46:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2+35:"
                f"enable='between(t,{start:.2f},{end:.2f})':box=1:boxcolor=black@0.75:boxborderw=10"
            )
        else:
            filters.append(
                f"drawtext=text='{safe_txt}':fontsize=48:fontcolor=yellow:x=(w-text_w)/2:y=(h-text_h)/2:"
                f"enable='between(t,{start:.2f},{end:.2f})':box=1:boxcolor=black@0.75:boxborderw=12"
            )

    return ",".join(filters)

async def synthesize_speech(text: str, voice: str, out_path: str) -> bool:
    try:
        import edge_tts
        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(out_path)
        return os.path.exists(out_path) and os.path.getsize(out_path) > 100
    except Exception as e:
        print(f"Edge-TTS synthesis error: {e}")
        # Fallback using ffmpeg tone synthesis
        cmd = [
            "ffmpeg", "-y", "-f", "lavfi", "-i", "sine=frequency=300:duration=10",
            "-c:a", "libmp3lame", out_path
        ]
        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return os.path.exists(out_path)

async def generate_explainer_short(req: ExplainerGenerateRequest, client_ip: str) -> Tuple[str, float]:
    """
    Generates a full 9:16 vertical procedural animated explainer short from scratch.
    """
    job_id = uuid.uuid4().hex
    job_dir = os.path.join(settings.TEMP_STORAGE_DIR, job_id)
    os.makedirs(job_dir, exist_ok=True)

    # 1. Script formulation
    script = req.script if (req.script and len(req.script.strip()) > 10) else generate_script_from_topic(req.topic)

    # 2. TTS Voiceover Synthesis
    voice_path = os.path.join(job_dir, "voice.mp3")
    await synthesize_speech(script, req.voice, voice_path)

    # 3. Measure duration and sentence timing
    audio_dur = get_audio_duration(voice_path)
    total_dur = min(float(req.duration), max(audio_dur + 1.0, 10.0))

    # Split script into timing slices
    raw_sentences = [s.strip() for s in re.split(r'[.!?]+', script) if s.strip()]
    if not raw_sentences:
        raw_sentences = [script]
    
    sec_per_sentence = audio_dur / max(1, len(raw_sentences))
    sentences_timed = []
    for i, s in enumerate(raw_sentences):
        st = i * sec_per_sentence
        en = min(audio_dur + 0.5, (i + 1) * sec_per_sentence)
        sentences_timed.append((s, st, en))

    # 4. Generate Procedural Video with FFmpeg
    vf_chain = build_procedural_video_filter(req.style, sentences_timed, total_dur)
    final_filename = f"Explainer_{re.sub(r'[^a-zA-Z0-9_]', '_', req.topic)[:30]}.mp4"
    final_output_path = os.path.join(job_dir, final_filename)

    # Ambient soundtrack generation pad
    ambient_chord = "0.035*sin(2*PI*110*t)+0.022*sin(2*PI*164.81*t)+0.018*sin(2*PI*220*t)"

    cmd = [
        "ffmpeg", "-y",
        "-f", "lavfi", "-i", f"color=c=0x060814:s=1080x1920:d={total_dur}:r=30",
        "-i", voice_path,
        "-f", "lavfi", "-i", f"aevalsrc={ambient_chord}:d={total_dur}:s=44100",
        "-filter_complex",
        f"[0:v]{vf_chain}[v];[1:a][2:a]amix=inputs=2:duration=first:weights=1.0 0.35[a]",
        "-map", "[v]", "-map", "[a]",
        "-c:v", "libx264", "-preset", "fast", "-crf", "22",
        "-c:a", "aac", "-b:a", "192k",
        "-t", str(total_dur),
        final_output_path
    ]

    proc = await asyncio.to_thread(subprocess.run, cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if proc.returncode != 0 or not os.path.exists(final_output_path):
        raise RuntimeError(f"FFmpeg explainer generation failed: {proc.stderr.decode('utf-8', errors='ignore')}")

    # 5. Register with JobManager so it integrates into screen 03/04
    job_req = JobCreateRequest(
        url=f"https://www.youtube.com/watch?v=explainer_{job_id[:8]}",
        mode="video",
        filename=final_filename.replace(".mp4", ""),
        consent=True
    )
    record = JobRecord(job_id, job_req, client_ip)
    record.file_path = final_output_path
    record.filename = final_filename
    record.filesize = os.path.getsize(final_output_path)
    record.state = "ready"
    record.percent = 100.0
    record.completed_at = datetime.now(timezone.utc)
    record.expires_at = record.completed_at + timedelta(seconds=settings.FILE_TTL_SECONDS)
    try:
        record.peaks = compute_peaks_from_file(final_output_path, 800)
    except Exception:
        pass

    with job_manager._lock:
        job_manager.jobs[job_id] = record

    return job_id, total_dur, script

