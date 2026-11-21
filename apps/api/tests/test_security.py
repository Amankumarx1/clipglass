import pytest
from fastapi.testclient import TestClient
from app.main import app
from services.ytdlp_service import validate_youtube_url, sanitize_filename
from schemas.jobs import JobCreateRequest, TrimConfig, AudioMasteringConfig

client = TestClient(app)

# -------------------------------------------------------------
# 1. SSRF & URL Host Bypass Attack Surface Tests
# -------------------------------------------------------------
@pytest.mark.parametrize("malicious_url", [
    "http://127.0.0.1:8000/api/v1/jobs",
    "http://localhost:8000/secret",
    "http://169.254.169.254/latest/meta-data/",
    "http://[::1]/",
    "file:///etc/passwd",
    "file:///C:/Windows/win.ini",
    "gopher://attacker.com:1234/_evil",
    "data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==",
    "http://youtube.com@attacker.com/watch?v=dQw4w9WgXcQ",
    "https://youtube.com:80@malicious.site/watch?v=dQw4w9WgXcQ",
    "https://user:pass@www.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://fakeyoutube.com/watch?v=dQw4w9WgXcQ",
    "https://www.youtube.com.attacker.com/watch?v=dQw4w9WgXcQ",
    "https://evil-youtube.com/shorts/dQw4w9WgXcQ",
    "https://www.youtube.com/",  # Missing video id
    "https://www.youtube.com/watch",  # Missing v parameter
    "https://www.youtube.com/watch?v=short",  # Invalid video id length
    "https://www.youtube.com/watch?v=toolongvideoid12345",
    "https://www.youtube.com/watch?v=../../etc/pw",  # Path traversal attempt in video id
])
def test_ssrf_and_invalid_urls_are_blocked(malicious_url):
    is_valid, canonical, err = validate_youtube_url(malicious_url)
    assert not is_valid
    assert canonical is None
    assert err is not None
    assert err.code == "invalid-url"

def test_valid_youtube_urls_strictly_canonicalized():
    valid_urls = [
        ("https://www.youtube.com/watch?v=dQw4w9WgXcQ", "https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
        ("https://youtu.be/dQw4w9WgXcQ", "https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
        ("https://m.youtube.com/watch?v=dQw4w9WgXcQ", "https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
        ("https://music.youtube.com/watch?v=dQw4w9WgXcQ", "https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
        ("https://www.youtube.com/shorts/dQw4w9WgXcQ", "https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
    ]
    for url, expected_canonical in valid_urls:
        is_valid, canonical, err = validate_youtube_url(url)
        assert is_valid
        assert canonical == expected_canonical
        assert err is None


# -------------------------------------------------------------
# 2. Path Traversal & Filename Sanitization Attack Tests
# -------------------------------------------------------------
@pytest.mark.parametrize("dangerous_name,expected_safe_part", [
    ("../../../etc/passwd", "etc passwd"),
    ("..\\..\\Windows\\System32\\cmd.exe", "Windows System32 cmd.exe"),
    ("my_song\x00malicious.exe", "my song malicious.exe"),
    ("song\r\nSet-Cookie: evil=1.mp4", "song Set-Cookie evil=1.mp4"),
    ("CON.mp4", "clipglass_CON.mp4"),
    ("PRN", "clipglass_PRN"),
    ("AUX", "clipglass_AUX"),
    ("NUL", "clipglass_NUL"),
    ("COM1", "clipglass_COM1"),
    ("", "clipglass_media"),
    ("   ...   ", "clipglass_media"),
])
def test_sanitize_filename_blocks_path_traversal_and_reserved_names(dangerous_name, expected_safe_part):
    clean = sanitize_filename(dangerous_name)
    assert "/" not in clean
    assert "\\" not in clean
    assert "\x00" not in clean
    assert "\r" not in clean
    assert "\n" not in clean
    assert not clean.startswith(".")
    assert len(clean) <= 100
    assert clean == expected_safe_part or expected_safe_part in clean


# -------------------------------------------------------------
# 3. Path Traversal in API Endpoints via Malicious Job ID
# -------------------------------------------------------------
def test_job_id_path_traversal_blocked_in_file_download():
    # Attempt directory traversal via job_id
    res = client.get("/api/v1/jobs/../../etc/passwd/file")
    assert res.status_code in (400, 404)

    # Attempt invalid hex length
    res = client.get("/api/v1/jobs/not-a-valid-hex-uuid/file")
    assert res.status_code == 400
    assert "Invalid job ID format" in res.json()["detail"]


# -------------------------------------------------------------
# 4. Command & Argument Injection Attack Surface Tests
# -------------------------------------------------------------
@pytest.mark.parametrize("malicious_timestamp", [
    "00:00:00 -filter_complex evil",
    "00:01:00; rm -rf /",
    "`whoami`",
    "$(reboot)",
    "00:00:00 | cat /etc/passwd",
    "-f null /dev/null",
    "99999999999999999999",  # Absurdly large
    "not_a_time",
])
def test_trimmer_rejects_injected_arguments(malicious_timestamp):
    with pytest.raises(Exception):
        TrimConfig(enabled=True, startTime=malicious_timestamp)

def test_trimmer_accepts_valid_timestamps():
    valid = ["00:01:30", "12:45", "75", "120.5", "01:10:20.500"]
    for ts in valid:
        cfg = TrimConfig(enabled=True, startTime=ts, endTime=ts)
        assert cfg.startTime is not None


def test_audio_metadata_strips_control_characters_and_quotes():
    injected_artist = "Artist Name\r\n-metadata album=Hacked\x00; evil"
    cfg = AudioMasteringConfig(artist=injected_artist)
    assert "\r" not in cfg.artist
    assert "\n" not in cfg.artist
    assert "\x00" not in cfg.artist
    assert ";" not in cfg.artist
    assert '"' not in cfg.artist
    assert "\\" not in cfg.artist
    assert cfg.artist == "Artist Name-metadata album=Hacked evil"


# -------------------------------------------------------------
# 5. Security Headers & CORS Enforcement Tests
# -------------------------------------------------------------
def test_security_headers_present_on_api_responses():
    res = client.get("/healthz")
    assert res.status_code == 200
    assert res.headers.get("x-content-type-options") == "nosniff"
    assert res.headers.get("x-frame-options") == "DENY"
    assert "strict-origin-when-cross-origin" in res.headers.get("referrer-policy", "")
    assert "camera=()" in res.headers.get("permissions-policy", "")
    assert res.headers.get("x-xss-protection") == "1; mode=block"


# -------------------------------------------------------------
# 6. Consent & Validation Enforcement
# -------------------------------------------------------------
def test_job_creation_requires_consent():
    res = client.post("/api/v1/jobs", json={
        "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "consent": False
    })
    assert res.status_code == 400
    assert res.json()["detail"]["code"] == "consent-required"
