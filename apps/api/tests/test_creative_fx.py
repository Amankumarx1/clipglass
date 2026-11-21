import pytest
from fastapi.testclient import TestClient
from app.main import app
from schemas.jobs import CreativeFXConfig
from services.creative_fx_service import build_fx_filtergraph, sanitize_hook_text
from services.explainer_service import generate_script_from_topic

client = TestClient(app)

def test_sanitize_hook_text():
    assert sanitize_hook_text(None) == "WAIT FOR THE END..."
    assert sanitize_hook_text("") == "WAIT FOR THE END..."
    assert sanitize_hook_text("Don't miss this: incredible!") == "Dont miss this: incredible!"
    # Test length truncation
    long_txt = "A" * 150
    assert len(sanitize_hook_text(long_txt)) == 80

def test_build_fx_filtergraph_filters():
    # Vintage 35mm
    fx_35 = CreativeFXConfig(filterStyle="vintage_35mm")
    chain_35 = build_fx_filtergraph(fx_35)
    assert any("curves=vintage" in f for f in chain_35)
    assert any("noise=" in f for f in chain_35)

    # Retro VHS
    fx_vhs = CreativeFXConfig(filterStyle="retro_vhs")
    chain_vhs = build_fx_filtergraph(fx_vhs)
    assert any("cross_process" in f for f in chain_vhs)
    assert any("PLAY" in f for f in chain_vhs)

    # Sci-Fi HUD
    fx_hud = CreativeFXConfig(filterStyle="scifi_hud")
    chain_hud = build_fx_filtergraph(fx_hud)
    assert any("drawbox=" in f for f in chain_hud)
    assert any("TARGET LOCK" in f for f in chain_hud)

    # Film Noir
    fx_noir = CreativeFXConfig(filterStyle="film_noir")
    chain_noir = build_fx_filtergraph(fx_noir)
    assert any("hue=s=0" in f for f in chain_noir)

def test_build_fx_filtergraph_hooks():
    fx_slam = CreativeFXConfig(hookIntro="slam_title", hookText="MY VIRAL TITLE")
    chain_slam = build_fx_filtergraph(fx_slam)
    assert any("MY VIRAL TITLE" in f and "between(t,0,3)" in f for f in chain_slam)

    fx_break = CreativeFXConfig(hookIntro="breaking_hook", hookText="DANGER ALERT")
    chain_break = build_fx_filtergraph(fx_break)
    assert any("BREAKING" in f for f in chain_break)

def test_explainer_script_generation():
    script_nolan = generate_script_from_topic("How Christopher Nolan shoots on IMAX")
    assert "70 millimeter IMAX" in script_nolan

    script_opp = generate_script_from_topic("Why Oppenheimer was in black and white")
    assert "Oppenheimer" in script_opp

    script_custom = generate_script_from_topic("The future of quantum computing")
    assert "quantum computing" in script_custom

def test_explainer_endpoint_validation():
    # Test invalid short topic (< 3 chars)
    res_invalid = client.post("/api/v1/explainer/generate", json={"topic": "hi"})
    assert res_invalid.status_code == 422

