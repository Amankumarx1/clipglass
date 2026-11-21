import pytest
import sys
from pathlib import Path

# Ensure api directory is in sys.path
api_dir = Path(__file__).resolve().parent.parent
if str(api_dir) not in sys.path:
    sys.path.insert(0, str(api_dir))

from services.ytdlp_service import validate_youtube_url, sanitize_filename

def test_valid_youtube_urls():
    valid_urls = [
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "https://youtube.com/watch?v=dQw4w9WgXcQ",
        "https://m.youtube.com/watch?v=dQw4w9WgXcQ",
        "https://music.youtube.com/watch?v=dQw4w9WgXcQ",
        "https://youtu.be/dQw4w9WgXcQ",
        "http://youtu.be/dQw4w9WgXcQ",
        "https://www.youtube.com/shorts/dQw4w9WgXcQ",
        "https://www.youtube.com/live/dQw4w9WgXcQ",
        "https://www.youtube.com/embed/dQw4w9WgXcQ"
    ]
    for url in valid_urls:
        is_valid, canonical, err = validate_youtube_url(url)
        assert is_valid is True, f"Failed for {url}"
        assert canonical is not None
        assert err is None
        assert "dQw4w9WgXcQ" in canonical

def test_invalid_and_blocked_urls():
    invalid_urls = [
        "https://google.com",
        "https://vimeo.com/123456",
        "https://attacker.com/malicious",
        "http://localhost:8080",
        "http://169.254.169.254/latest/meta-data/",
        "ftp://youtube.com/watch?v=123",
        "",
        "not_a_url"
    ]
    for url in invalid_urls:
        is_valid, canonical, err = validate_youtube_url(url)
        assert is_valid is False, f"Should have failed for {url}"
        assert err is not None
        assert err.code == "invalid-url"

def test_sanitize_filename():
    assert sanitize_filename("My Video: Ep. 1 / *Special*?") == "My Video Ep. 1 Special"
    assert sanitize_filename("") == "clipglass_media"
    assert sanitize_filename("A" * 200) == "A" * 120
