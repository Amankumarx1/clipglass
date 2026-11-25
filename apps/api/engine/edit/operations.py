from pydantic import BaseModel, Field
from typing import Optional, Literal

class EditOperation(BaseModel):
    action: Literal["trim_start", "trim_end", "set_duration", "change_reframe", "change_caption_preset", "patch_caption_text"]
    offset_seconds: Optional[float] = None
    new_value: Optional[str] = None
    message: str = ""
