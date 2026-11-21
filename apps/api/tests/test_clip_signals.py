import pytest
from services.signal_analysis_service import map_chapters_to_bins, map_heatmap_to_bins

def test_map_chapters_to_bins():
    chapters = [
        {"start_time": 10, "title": "Intro"},
        {"start_time": 50, "title": "Main Topic"}
    ]
    bins = map_chapters_to_bins(chapters, duration_sec=100)
    assert len(bins) == 100
    # Center of chapter boundary should peak at 1.0
    assert bins[10] == 1.0
    assert bins[50] == 1.0
    # Adjacent seconds decay
    assert bins[11] == 0.75
    assert bins[12] == 0.5
    # Non-chapter second should be 0.0
    assert bins[25] == 0.0

def test_map_heatmap_to_bins():
    heatmap = [
        {"start_time": 20, "end_time": 25, "value": 0.5},
        {"start_time": 60, "end_time": 65, "value": 1.0}
    ]
    bins = map_heatmap_to_bins(heatmap, duration_sec=100)
    assert len(bins) == 100
    # Peak at 60s should be normalized to 1.0
    assert bins[62] == 1.0
    # 20s should be 0.5
    assert bins[22] == 0.5
    # Untouched range should be 0.0
    assert bins[5] == 0.0

