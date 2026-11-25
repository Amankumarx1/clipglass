from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from schemas.clip import TranscriptWord, TranscriptSentence

class ScoredMoment(BaseModel):
    clip_id: str
    start: float
    end: float
    duration: float
    score: int = Field(..., ge=0, le=100)
    hook_score: int = Field(default=85, ge=0, le=100)
    engagement_score: int = Field(default=85, ge=0, le=100)
    value_score: int = Field(default=85, ge=0, le=100)
    shareability_score: int = Field(default=85, ge=0, le=100)
    hook_title: str
    title: str
    hashtags: List[str] = Field(default_factory=list)
    reason: str
    evidence: List[str] = Field(default_factory=list)
    words: List[TranscriptWord] = Field(default_factory=list)
    transcript_text: str = ""
