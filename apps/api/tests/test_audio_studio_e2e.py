import pytest
import urllib.parse
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

YOUTUBE_TEST_URL = "https://youtu.be/DXw_OjhxrzQ?si=dB0G4fJqLih8Kg5g"

def test_studio_page_routes():
    # Both /studio and /audio-studio must serve the Simplified Custom Mode Studio with 200 OK
    for route in ["/studio", "/audio-studio"]:
        res = client.get(route)
        assert res.status_code == 200
        assert "Studio" in res.text
        assert "studio.js" in res.text
        assert "Audio Track" in res.text
        assert "Audio Player" in res.text
        assert "Your Effect Chain" in res.text
        assert "Quick Presets" in res.text
        assert "Effect Library" in res.text
        assert "Export Settings" in res.text
        assert "Download Audio" in res.text
        assert "effectSettingsModal" in res.text
        assert "processingModal" in res.text
        assert "completedModal" in res.text
        assert "Intensity" in res.text

def test_studio_inspect_real_youtube_url():
    # Inspect the user-provided YouTube URL
    encoded_url = urllib.parse.quote(YOUTUBE_TEST_URL)
    res = client.get(f"/api/inspect?url={encoded_url}")
    assert res.status_code == 200
    data = res.json()
    assert data["title"] is not None
    assert "Jaadu" in data["title"] or "Darshan Raval" in data["title"]
    assert data["duration"] > 0
    assert data["thumbnail"] is not None

def test_studio_audio_job_creation_and_file():
    # Create audio job for this stream
    job_payload = {
        "url": YOUTUBE_TEST_URL,
        "mode": "audio",
        "format": "mp3",
        "quality": "best",
        "consent": True
    }
    create_res = client.post("/api/v1/jobs", json=job_payload)
    assert create_res.status_code == 200
    job_id = create_res.json()["jobId"]
    assert job_id is not None

    # Check status endpoint
    status_res = client.get(f"/api/v1/jobs/{job_id}/status")
    assert status_res.status_code == 200
    s_data = status_res.json()
    assert s_data["jobId"] == job_id
    assert s_data["state"] in ["queued", "downloading", "converting", "ready"]

def test_studio_all_60_effects_registered_in_js():
    # Verify studio.js has all 60 effects across the 7 categories and quick presets
    js_res = client.get("/static/js/studio.js")
    assert js_res.status_code == 200
    js_text = js_res.text

    # Category 1: Space & Time (6 effects)
    space_effects = ["reverb", "echo", "delay", "slowed_reverb", "reverse", "pre_delay"]
    for eff in space_effects:
        assert f"id: '{eff}'" in js_text, f"Space effect {eff} missing"

    # Category 2: Modulation (8 effects)
    modulation_effects = ["chorus", "flanger", "phaser", "tremolo", "vibrato", "auto_pan", "rotary_speaker", "ring_modulation"]
    for eff in modulation_effects:
        assert f"id: '{eff}'" in js_text, f"Modulation effect {eff} missing"

    # Category 3: Equalizer & Filters (9 effects)
    eq_effects = ["eq", "bass_boost", "treble_boost", "low_pass", "high_pass", "band_pass", "notch_filter", "telephone", "low_pass_sweep"]
    for eff in eq_effects:
        assert f"id: '{eff}'" in js_text, f"EQ effect {eff} missing"

    # Category 4: Dynamics (8 effects)
    dynamics_effects = ["compressor", "limiter", "expander", "noise_gate", "normalize", "auto_gain", "de_esser", "sidechain"]
    for eff in dynamics_effects:
        assert f"id: '{eff}'" in js_text, f"Dynamics effect {eff} missing"

    # Category 5: Creative Effects (14 effects)
    creative_effects = ["distortion", "overdrive", "fuzz", "saturation", "bitcrusher", "vinyl", "lo_fi", "glitch", "radio", "robot_voice", "pitch_shift", "formant_shift", "harmonizer", "vocoder"]
    for eff in creative_effects:
        assert f"id: '{eff}'" in js_text, f"Creative effect {eff} missing"

    # Category 6: Stereo & Spatial (7 effects)
    stereo_effects = ["stereo_widening", "stereo_narrowing", "mono", "balance", "panning", "haas_effect", "binaural"]
    for eff in stereo_effects:
        assert f"id: '{eff}'" in js_text, f"Stereo effect {eff} missing"

    # Category 7: Vocal & Noise Processing (8 effects)
    vocal_effects = ["noise_reduction", "voice_isolation", "hum_removal", "click_removal", "declipper", "vocal_enhancer", "breath_reduction", "pitch_correction"]
    for eff in vocal_effects:
        assert f"id: '{eff}'" in js_text, f"Vocal effect {eff} missing"

    total_expected = len(space_effects) + len(modulation_effects) + len(eq_effects) + len(dynamics_effects) + len(creative_effects) + len(stereo_effects) + len(vocal_effects)
    assert total_expected == 60

    # Verify Quick Presets
    assert "QUICK_PRESETS" in js_text
    assert "clean_audio" in js_text
    assert "deep_bass" in js_text
    assert "dreamy_reverb" in js_text
    assert "club_music" in js_text
    assert "podcast" in js_text
    assert "vintage" in js_text

    # Verify Core Audio Engine primitives
    assert "StudioEngine" in js_text
    assert "renderOfflineAudio" in js_text
    assert "setAuditionMode" in js_text
