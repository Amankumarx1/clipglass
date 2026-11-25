from typing import Dict, Any, List
import math

def extract_normalized_heatmap(meta: Dict[str, Any], duration_seconds: int) -> List[float]:
    """
    Extracts and normalizes the YouTube Most-Replayed heatmap curve into a continuous
    per-second float array [0.0, 1.0] for the entire duration.
    Zero video or audio download required.
    """
    if duration_seconds <= 0:
        return []

    heatmap_points = meta.get("heatmap") or []
    if not heatmap_points:
        # Fallback to neutral baseline if video has no heatmap
        return [0.05] * duration_seconds

    # Extract time-value pairs
    times = []
    values = []
    for pt in heatmap_points:
        st = float(pt.get("start_time", 0.0))
        val = float(pt.get("value", 0.0))
        times.append(st)
        values.append(val)

    if not times:
        return [0.05] * duration_seconds

    # Normalize values between 0.0 and 1.0
    max_val = max(values) if values else 1.0
    min_val = min(values) if values else 0.0
    val_range = max_val - min_val if max_val > min_val else 1.0

    normalized_raw = [(v - min_val) / val_range for v in values]

    # Interpolate to 1-second continuous grid
    res: List[float] = [0.0] * duration_seconds
    n_pts = len(times)

    for sec in range(duration_seconds):
        t = float(sec)
        if t <= times[0]:
            res[sec] = round(normalized_raw[0], 4)
        elif t >= times[-1]:
            res[sec] = round(normalized_raw[-1], 4)
        else:
            # Binary search / linear search for surrounding points
            idx = 0
            while idx < n_pts - 1 and times[idx + 1] < t:
                idx += 1
            t0, t1 = times[idx], times[idx + 1]
            v0, v1 = normalized_raw[idx], normalized_raw[idx + 1]
            if t1 > t0:
                alpha = (t - t0) / (t1 - t0)
                interp = v0 + alpha * (v1 - v0)
            else:
                interp = v0
            res[sec] = round(max(0.0, min(1.0, interp)), 4)

    return res
