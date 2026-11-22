import os
import pytest
from services.polish_pack_service import (
    get_available_polish_styles,
    get_style_manifest,
    apply_polish_bumpers
)

def test_get_available_polish_styles():
    styles = get_available_polish_styles()
    assert len(styles) >= 4
    style_ids = [s["id"] for s in styles]
    assert "caption_news" in style_ids
    assert "swiss_motion" in style_ids
    assert "neon_tubes" in style_ids
    assert "dark_tech" in style_ids

def test_get_style_manifest():
    m = get_style_manifest("caption_news")
    assert m is not None
    assert m["style"] == "caption_news"
    assert m["width"] == 1080
    assert m["height"] == 1920
    assert "keying" in m
    assert "safe_zones" in m
