from pydantic import BaseModel, Field
from typing import Optional, Literal

class ExplainerGenerateRequest(BaseModel):
    topic: str = Field(..., min_length=3, max_length=200)
    script: Optional[str] = Field(None, max_length=2000)
    style: Literal['blueprint', 'film_noir', 'cyberpunk', 'retro_vhs'] = 'blueprint'
    voice: Literal['en-US-ChristopherNeural', 'en-US-GuyNeural', 'en-US-JennyNeural', 'en-US-AriaNeural'] = 'en-US-ChristopherNeural'
    duration: int = Field(30, ge=10, le=60)
    includeMusic: bool = True

class ExplainerGenerateResponse(BaseModel):
    jobId: str
    topic: str
    style: str
    script: str
    duration: float
    message: str = "Explainer short generated successfully"

