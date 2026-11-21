from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Literal, Dict, Any
import re
from .inspect import FriendlyError

class TranscriptWord(BaseModel):
    word: str
    start: float
    end: float

class TranscriptSentence(BaseModel):
    text: str
    start: float
    end: float
    words: List[TranscriptWord] = Field(default_factory=list)

class MultimodalSignals(BaseModel):
    # Normalized 0.0 to 1.0 arrays with 1-second bin resolution
    loudness: List[float] = Field(default_factory=list)
    burst: List[float] = Field(default_factory=list)
    scene_cuts: List[float] = Field(default_factory=list)
    chapters: List[float] = Field(default_factory=list)
    heatmap: List[float] = Field(default_factory=list)
    duration_seconds: int = 0

class ClipMoment(BaseModel):
    clipId: str
    start: float
    end: float
    duration: float
    score: int = Field(..., ge=0, le=100)
    hook: str
    title: str
    hashtags: List[str] = Field(default_factory=list)
    reason: str
    reframeMode: Literal['center', 'follow-face', 'split'] = 'follow-face'
    captionPreset: Literal['viral_pop', 'minimalist', 'neon_cyber', 'karaoke', 'headline'] = 'viral_pop'
    status: Literal['discovered', 'rendering', 'ready', 'failed'] = 'discovered'
    videoUrl: Optional[str] = None
    transcriptText: Optional[str] = None
    words: List[TranscriptWord] = Field(default_factory=list)

class ClipJobCreateRequest(BaseModel):
    url: str = Field(..., max_length=2048)
    minLength: int = Field(20, ge=15, le=90)
    maxLength: int = Field(60, ge=20, le=180)
    clipCount: int = Field(3, ge=1, le=10)
    language: str = Field("en", max_length=10)
    reframeMode: Literal['center', 'follow-face', 'split'] = 'follow-face'
    captionPreset: Literal['viral_pop', 'minimalist', 'neon_cyber', 'karaoke', 'headline'] = 'viral_pop'
    polishStyle: Literal['none', 'caption_news', 'swiss_motion', 'neon_tubes', 'dark_tech'] = 'none'
    consent: bool = Field(..., description="User confirms rights/permission to clip media")

    @field_validator('url')
    @classmethod
    def validate_clip_url(cls, v: str) -> str:
        clean = v.strip()
        if not (clean.startswith("http://") or clean.startswith("https://")):
            raise ValueError("URL must start with http:// or https://")
        return clean

class ClipMomentUpdateRequest(BaseModel):
    start: Optional[float] = None
    end: Optional[float] = None
    hook: Optional[str] = None
    title: Optional[str] = None
    hashtags: Optional[List[str]] = None
    reframeMode: Optional[Literal['center', 'follow-face', 'split']] = None
    captionPreset: Optional[Literal['viral_pop', 'minimalist', 'neon_cyber', 'karaoke', 'headline']] = None
    transcriptText: Optional[str] = None
    words: Optional[List[TranscriptWord]] = None

class ClipJobEventData(BaseModel):
    jobId: str
    stage: Literal['queued', 'ingest', 'transcribe', 'signals', 'scoring', 'ready', 'failed', 'cancelled']
    percent: float = 0.0
    activeStep: str = ""
    eta: Optional[int] = None
    clips: List[ClipMoment] = Field(default_factory=list)
    error: Optional[FriendlyError] = None
