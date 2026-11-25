from typing import List, Tuple
from services.face_tracking_service import (
    compute_center_crop_filter,
    compute_split_screen_filter,
    build_reframe_filter as build_service_reframe_filter
)

def build_reframe_filter(
    mode: str,
    width: int = 1920,
    height: int = 1080,
    video_path: str = "",
    start_time: float = 0.0,
    duration: float = 30.0
) -> str:
    """
    Constructs FFmpeg filtergraph to reframe 16:9 media into 9:16 vertical (1080x1920).
    Modes: 'center', 'follow-face', 'split', 'dual-speaker', 'blurred-fill', 'letterbox'.
    """
    if mode in ["split", "dual-speaker"]:
        return compute_split_screen_filter(width, height)
    elif mode == "center" or not video_path:
        return compute_center_crop_filter(width, height)
    else:
        filter_str, _ = build_service_reframe_filter(mode, width, height, video_path, start_time, duration)
        return filter_str
