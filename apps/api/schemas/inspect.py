from pydantic import BaseModel, Field
from typing import List, Optional

class InspectRequest(BaseModel):
    url: str = Field(..., max_length=2048, description="The YouTube video URL to inspect")

class VideoStreamHeight(BaseModel):
    height: int
    fps: Optional[int] = 30
    vcodec: Optional[str] = None
    approxSize: Optional[int] = None
    recommended: Optional[bool] = False

class AudioStreamInfo(BaseModel):
    bitrate: Optional[int] = None
    acodec: Optional[str] = None
    ext: Optional[str] = None
    recommended: Optional[bool] = False

class SubtitleInfo(BaseModel):
    lang: str
    name: str

class ChapterInfo(BaseModel):
    title: str
    startTime: float
    endTime: float

class InspectResponse(BaseModel):
    id: str
    title: str
    channel: str
    duration: int
    thumbnail: str
    isLive: bool = False
    availableHeights: List[VideoStreamHeight] = []
    availableAudio: List[AudioStreamInfo] = []
    availableSubtitles: List[SubtitleInfo] = []
    chapters: List[ChapterInfo] = []
    defaultFilename: str

class FriendlyError(BaseModel):
    code: str
    title: str
    explanation: str
    suggestedAction: str

