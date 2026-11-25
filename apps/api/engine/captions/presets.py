from typing import Dict, Any

PRESET_STYLES: Dict[str, Dict[str, Any]] = {
    'viral_pop': {
        'name': 'Viral Pop',
        'font': 'Arial',
        'fontsize': 48,
        'primary_color': '&H00FFFFFF&',    # White
        'secondary_color': '&H0000FFFF&',  # Yellow highlight
        'outline_color': '&H00000000&',    # Black outline
        'back_color': '&H80000000&',
        'bold': 1,
        'outline': 4,
        'shadow': 2,
        'margin_v': 260,
        'alignment': 2,
    },
    'minimalist': {
        'name': 'Clean Minimalist',
        'font': 'Helvetica',
        'fontsize': 40,
        'primary_color': '&H00F0F0F0&',
        'secondary_color': '&H0000D2FF&',  # Cyan
        'outline_color': '&H00101010&',
        'back_color': '&H90000000&',
        'bold': 0,
        'outline': 1.5,
        'shadow': 0,
        'margin_v': 240,
        'alignment': 2,
    },
    'neon_cyber': {
        'name': 'Neon Cyber',
        'font': 'Arial',
        'fontsize': 46,
        'primary_color': '&H00FFFF00&',    # Cyan
        'secondary_color': '&H00FF00FF&',  # Magenta
        'outline_color': '&H00330033&',
        'back_color': '&H00000000&',
        'bold': 1,
        'outline': 3.5,
        'shadow': 3,
        'margin_v': 260,
        'alignment': 2,
    },
    'karaoke': {
        'name': 'Karaoke Highlight',
        'font': 'Impact',
        'fontsize': 52,
        'primary_color': '&H00FFFFFF&',
        'secondary_color': '&H0000FF00&',  # Green highlight
        'outline_color': '&H00000000&',
        'back_color': '&H80000000&',
        'bold': 1,
        'outline': 4.5,
        'shadow': 2,
        'margin_v': 280,
        'alignment': 2,
    },
    'headline': {
        'name': 'Bold Headline',
        'font': 'Impact',
        'fontsize': 54,
        'primary_color': '&H0000FFFF&',    # Yellow
        'secondary_color': '&H00FFFFFF&',
        'outline_color': '&H00000000&',
        'back_color': '&HA0000000&',
        'bold': 1,
        'outline': 5,
        'shadow': 3,
        'margin_v': 300,
        'alignment': 2,
    }
}
