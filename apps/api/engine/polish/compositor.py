import os
from services.polish_pack_service import apply_polish_bumpers

def composite_polish_pack(
    clip_video_path: str,
    style_name: str,
    output_path: str
) -> bool:
    """
    Composites design-time motion graphics, intro/outro stings, and lower-third hook assets
    onto the vertical 1080x1920 clip.
    """
    return apply_polish_bumpers(
        clip_video_path=clip_video_path,
        style_name=style_name,
        out_video_path=output_path
    )
