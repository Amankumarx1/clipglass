import os
import pytest
from unittest.mock import patch, MagicMock
from engine.slicer.dash_slicer import slice_with_ytdlp_sections
from engine.slicer.range_seeker import slice_with_ffmpeg_range_seek
from engine.slicer.url_refresher import refresh_dash_stream_urls
from engine.slicer.unified_slicer import slice_winning_moment

def test_dash_slicer_command_construction(tmp_path):
    out_file = str(tmp_path / "slice.mp4")

    with patch("subprocess.run") as mock_run, patch("os.path.exists", return_value=True), patch("os.path.getsize", return_value=50000):
        mock_proc = MagicMock()
        mock_proc.returncode = 0
        mock_run.return_value = mock_proc

        ok, path, err = slice_with_ytdlp_sections(
            url="https://youtube.com/watch?v=dQw4w9WgXcQ",
            start_sec=10.0,
            end_sec=30.0,
            output_path=out_file,
            pad_pre=2.0,
            pad_post=1.0
        )

        assert ok is True
        assert path == out_file
        # Check that --download-sections arg was properly passed with 2s pre-roll and 1s post-roll (8.00 to 31.00)
        call_args = mock_run.call_args[0][0]
        assert "--download-sections" in call_args
        sec_idx = call_args.index("--download-sections")
        assert call_args[sec_idx + 1] == "*8.00-31.00"

def test_ffmpeg_range_seek_command(tmp_path):
    out_file = str(tmp_path / "range_slice.mp4")

    with patch("subprocess.run") as mock_run, patch("os.path.exists", return_value=True), patch("os.path.getsize", return_value=50000):
        mock_proc = MagicMock()
        mock_proc.returncode = 0
        mock_run.return_value = mock_proc

        ok, path, err = slice_with_ffmpeg_range_seek(
            video_url="https://googlevideo.com/videoplayback?v=1",
            audio_url="https://googlevideo.com/videoplayback?a=1",
            start_sec=15.0,
            end_sec=40.0,
            output_path=out_file,
            headers={"User-Agent": "TestAgent"},
            pad_pre=2.0,
            pad_post=1.0
        )

        assert ok is True
        assert path == out_file
        call_args = mock_run.call_args[0][0]
        # Should seek pad_start (13.00s) before inputs
        assert "-ss" in call_args
        ss_idx = call_args.index("-ss")
        assert call_args[ss_idx + 1] == "13.00"

def test_unified_slicer_fallback_on_403(tmp_path):
    out_file = str(tmp_path / "fallback.mp4")

    # Primary returns 403 Forbidden
    with patch("engine.slicer.unified_slicer.slice_with_ytdlp_sections", return_value=(False, None, "HTTP Error 403: Forbidden")):
        # Refresher yields fresh URLs
        with patch("engine.slicer.unified_slicer.refresh_dash_stream_urls", return_value=("https://video.new", "https://audio.new", {"X": "1"})):
            # Fallback FFmpeg seek succeeds
            with patch("engine.slicer.unified_slicer.slice_with_ffmpeg_range_seek", return_value=(True, out_file, None)):
                ok, path, err = slice_winning_moment(
                    url="https://youtube.com/watch?v=dQw4w9WgXcQ",
                    start_sec=20.0,
                    end_sec=45.0,
                    output_path=out_file
                )
                assert ok is True
                assert path == out_file
                assert err is None
