from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Literal, Dict, Any
import re
from .inspect import FriendlyError

CaptionPresetType = Literal[
    'viral_pop', 'minimalist', 'neon_cyber', 'karaoke', 'headline', 'dynamic_box',
    'glitch_cyber', 'gold_luxury', 'comic_pop', 'cinematic_sub'
]
ReframeModeType = Literal['center', 'follow-face', 'split', 'dual-speaker', 'blurred-fill', 'letterbox', 'pip']
PlatformPresetType = Literal['shorts', 'reels', 'tiktok', 'custom']
PolishStyleType = Literal['none', 'caption_news', 'swiss_motion', 'neon_tubes', 'dark_tech']

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
    hookScore: int = Field(default=85, ge=0, le=100)
    engagementScore: int = Field(default=85, ge=0, le=100)
    valueScore: int = Field(default=85, ge=0, le=100)
    shareabilityScore: int = Field(default=85, ge=0, le=100)
    hook: str
    title: str
    hashtags: List[str] = Field(default_factory=list)
    reason: str
    evidence: List[str] = Field(default_factory=list)
    reframeMode: ReframeModeType = 'follow-face'
    captionPreset: CaptionPresetType = 'viral_pop'
    platformPreset: PlatformPresetType = 'shorts'
    polishStyle: PolishStyleType = 'none'
    status: Literal['discovered', 'rendering', 'ready', 'failed'] = 'discovered'
    videoUrl: Optional[str] = None
    transcriptText: Optional[str] = None
    words: List[TranscriptWord] = Field(default_factory=list)
    feedback: Optional[Literal['up', 'down']] = None

class ClipJobCreateRequest(BaseModel):
    url: str = Field(..., max_length=2048)
    minLength: int = Field(20, ge=5, le=90)
    maxLength: int = Field(60, ge=10, le=180)
    clipCount: int = Field(3, ge=1, le=10)
    language: str = Field("en", max_length=10)
    reframeMode: ReframeModeType = 'follow-face'
    captionPreset: CaptionPresetType = 'viral_pop'
    platformPreset: PlatformPresetType = 'shorts'
    polishStyle: PolishStyleType = 'none'
    consent: bool = Field(..., description="User confirms rights/permission to clip media")

    @field_validator('url')
    @classmethod
    def validate_clip_url(cls, v: str) -> str:
        clean = v.strip()
        if not (clean.startswith("http://") or clean.startswith("https://") or clean.startswith("local://")):
            raise ValueError("URL must start with http://, https://, or local://")
        return clean

class ClipMomentUpdateRequest(BaseModel):
    start: Optional[float] = None
    end: Optional[float] = None
    hook: Optional[str] = None
    title: Optional[str] = None
    hashtags: Optional[List[str]] = None
    reframeMode: Optional[ReframeModeType] = None
    captionPreset: Optional[CaptionPresetType] = None
    platformPreset: Optional[PlatformPresetType] = None
    polishStyle: Optional[PolishStyleType] = None
    transcriptText: Optional[str] = None
    words: Optional[List[TranscriptWord]] = None
    command: Optional[str] = None
    feedback: Optional[Literal['up', 'down']] = None

class ClipFeedbackRequest(BaseModel):
    thumb: Literal['up', 'down']

class EditBoxCommandRequest(BaseModel):
    command: str = Field(..., min_length=1, max_length=256)

class EditBoxOperationResult(BaseModel):
    success: bool
    operation: str
    delta: Optional[float] = None
    newStart: float
    newEnd: float
    newDuration: float
    message: str

class ClipJobEventData(BaseModel):
    jobId: str
    stage: Literal['queued', 'ingest', 'transcribe', 'signals', 'scoring', 'ready', 'failed', 'cancelled']
    percent: float = 0.0
    activeStep: str = ""
    eta: Optional[int] = None
    clips: List[ClipMoment] = Field(default_factory=list)
    error: Optional[FriendlyError] = None
