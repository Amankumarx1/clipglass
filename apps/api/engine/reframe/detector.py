import os
from typing import List, Tuple, Optional
from services.face_tracking_service import track_faces_opencv_or_mediapipe

def detect_face_centers(
    slice_video_path: str,
    duration: float,
    width: int = 1920,
    height: int = 1080
) -> List[Tuple[float, int, int]]:
    """
    Runs face tracking ONLY on the short sliced clip (20-60s) to discover speaker
    positions without ever processing the long full video.
    """
    return track_faces_opencv_or_mediapipe(
        video_path=slice_video_path,
        start_time=0.0,
        duration=duration,
        width=width,
        height=height
    )
