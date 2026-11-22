import re
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Literal
from .inspect import FriendlyError

TIMESTAMP_REGEX = re.compile(r'^(\d{1,2}:)?\d{1,2}:\d{2}(\.\d{1,3})?$')

class SubtitleConfig(BaseModel):
    langs: List[str] = Field(default_factory=list, max_length=10)
    format: Literal['srt', 'vtt'] = 'srt'

    @field_validator('langs')
    @classmethod
    def validate_langs(cls, v: List[str]) -> List[str]:
        cleaned = []
        for code in v:
            if re.match(r'^[a-zA-Z0-9_-]{2,10}$', code):
                cleaned.append(code)
        return cleaned

class TrimConfig(BaseModel):
    enabled: bool = False
    startTime: Optional[str] = Field(None, max_length=20)  # e.g. "00:01:15" or "75"
    endTime: Optional[str] = Field(None, max_length=20)    # e.g. "00:03:40" or "220"

    @field_validator('startTime', 'endTime')
    @classmethod
    def validate_timestamp(cls, v: Optional[str]) -> Optional[str]:
        if not v:
            return None
        v_clean = v.strip()
        # Accept HH:MM:SS or MM:SS or integer/float seconds
        if TIMESTAMP_REGEX.match(v_clean):
            return v_clean
        try:
            val = float(v_clean)
            if 0 <= val <= 86400:
                return str(int(val)) if val.is_integer() else f"{val:.2f}"
        except ValueError:
            pass
        raise ValueError("Invalid timestamp format. Expected HH:MM:SS, MM:SS, or seconds.")

class AudioMasteringConfig(BaseModel):
    normalizeLoudness: bool = False  # EBU R128 (-14 LUFS)
    artist: Optional[str] = Field(None, max_length=100)
    album: Optional[str] = Field(None, max_length=100)
    genre: Optional[str] = Field(None, max_length=50)

    @field_validator('artist', 'album', 'genre')
    @classmethod
    def sanitize_metadata_tag(cls, v: Optional[str]) -> Optional[str]:
        if not v:
            return None
        # Strip all ASCII control characters, newlines, and dangerous quotes/backslashes
        cleaned = re.sub(r'[\x00-\x1f\x7f\\"\';]', '', v).strip()
        return cleaned[:100] if cleaned else None

class CreativeFXConfig(BaseModel):
    # 1. Aesthetic film filters
    filterStyle: Literal['none', 'vintage_35mm', 'retro_vhs', 'scifi_hud', 'film_noir'] = 'none'
    # 2. Split-screen retention bottom visualizer
    splitScreen: Literal['none', 'audio_nebula', 'hypnotic_tunnel', 'liquid_flow'] = 'none'
    # 3. Kinetic 3-second opening hook
    hookIntro: Literal['none', 'slam_title', 'glitch_reveal', 'breaking_hook'] = 'none'
    hookText: Optional[str] = Field(None, max_length=120)
    # 4. Aspect Ratio framing
    aspectRatio: Literal['original', '9:16', '16:9', '1:1'] = 'original'

class JobCreateRequest(BaseModel):
    url: str = Field(..., max_length=2048)
    mode: Literal['video', 'video_only', 'audio', 'video+audio'] = 'video'
    height: Optional[int] = Field(1080, ge=144, le=4320)
    container: Literal['mp4', 'webm'] = 'mp4'
    audioFormat: Literal['mp3', 'm4a', 'opus', 'wav', 'flac'] = 'mp3'
    audioBitrate: Optional[int] = Field(320, ge=32, le=320)
    format: Optional[str] = None
    quality: Optional[str] = None
    subtitles: Optional[SubtitleConfig] = None
    trim: Optional[TrimConfig] = None
    mastering: Optional[AudioMasteringConfig] = None
    fx: Optional[CreativeFXConfig] = None
    thumbnail: bool = False
    embedThumbnail: bool = False
    embedMetadata: bool = True
    filename: Optional[str] = Field(None, max_length=120)
    consent: bool = Field(..., description="Must be true to acknowledge legal permission")
    turnstileToken: Optional[str] = Field(None, max_length=2048)

    @field_validator('mode')
    @classmethod
    def normalize_mode(cls, v: str) -> str:
        if v == 'video+audio':
            return 'video'
        return v

    @field_validator('filename')
    @classmethod
    def sanitize_input_filename(cls, v: Optional[str]) -> Optional[str]:
        if not v:
            return None
        cleaned = re.sub(r'[\x00-\x1f\x7f\\/*?:"<>|]', '', v).strip(' .')
        return cleaned[:100] if cleaned else None

class JobCreateResponse(BaseModel):
    jobId: str

class JobEventData(BaseModel):
    jobId: str
    state: Literal['queued', 'downloading', 'merging', 'converting', 'ready', 'failed', 'cancelled']
    percent: float = 0.0
    speed: Optional[str] = None
    eta: Optional[int] = None
    filename: Optional[str] = None
    filesize: Optional[int] = None
    expiresAt: Optional[str] = None
    error: Optional[FriendlyError] = None
