from typing import List, Tuple

def hard_cut_speaker_switching(
    raw_points: List[Tuple[float, int, int]],
    frame_width: int = 1920,
    cut_threshold_ratio: float = 0.25
) -> List[Tuple[float, int, int]]:
    """
    Enforces the Clips Kitty Hard-Cut Speaker Switching rule:
    When the active speaker changes across a multi-speaker frame (delta X > 25%),
    the crop snaps instantly on a hard cut, rather than executing a dizzying pan.
    """
    if not raw_points:
        return []

    cut_threshold = frame_width * cut_threshold_ratio
    result: List[Tuple[float, int, int]] = []
    prev_x = raw_points[0][1]

    for t, x, w in raw_points:
        delta = abs(x - prev_x)
        if delta > cut_threshold:
            # Snap immediately to new speaker center (hard-cut)
            curr_x = x
        else:
            # Mild smooth within single speaker zone
            curr_x = int(0.7 * prev_x + 0.3 * x)

        result.append((t, curr_x, w))
        prev_x = curr_x

    return result
