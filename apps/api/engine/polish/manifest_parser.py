import os
import json
from typing import Dict, Any, Optional, List
from services.polish_pack_service import get_available_polish_styles, get_style_manifest, POLISH_PACK_DIR

def load_polish_manifest(style_name: str) -> Optional[Dict[str, Any]]:
    """Loads standardized manifest.json for a pre-rendered Polish Pack asset."""
    return get_style_manifest(style_name)

def list_all_polish_styles() -> List[Dict[str, Any]]:
    """Returns all available design-time motion graphic presets."""
    return get_available_polish_styles()
