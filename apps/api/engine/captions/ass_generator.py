from typing import List, Optional
from schemas.clip import TranscriptWord
from services.ass_caption_service import generate_ass_subtitles, format_ass_time
from .presets import PRESET_STYLES

def create_kinetic_ass_subtitles(
    words: List[TranscriptWord],
    out_path: str,
    preset: str = 'viral_pop',
    clip_offset: float = 0.0,
    hook_title: Optional[str] = None,
    hook_duration: float = 3.5,
    duration: float = 30.0
) -> str:
    """
    Generates word-synced animated ASS subtitles targeting 1080x1920 (9:16).
    Emits kinetic bounce, word-level highlights, and opening hook title banner.
    """
    return generate_ass_subtitles(
        words=words,
        out_path=out_path,
        preset=preset,
        clip_offset=clip_offset,
        hook_title=hook_title,
        hook_duration=hook_duration,
        duration=duration
    )
