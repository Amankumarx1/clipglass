#!/usr/bin/env python3
"""
ClipGlass Unified Launcher
Pure Python + HTML + CSS + Tailwind Media Processing Workspace.
Runs the complete ClipGlass application on http://127.0.0.1:8000.
"""

import os
import sys
import time
import subprocess
import webbrowser
import shutil
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
API_DIR = ROOT_DIR / "apps" / "api"

# Add local Python and FFmpeg directories to PATH if present
extra_paths = [
    Path(os.environ.get("LOCALAPPDATA", "")) / "Programs" / "Python" / "Python312",
    Path(os.environ.get("LOCALAPPDATA", "")) / "Programs" / "Python" / "Python312" / "Scripts",
]

# Search for Gyan FFmpeg if present
ffmpeg_packages = Path(os.environ.get("LOCALAPPDATA", "")) / "Microsoft" / "WinGet" / "Packages"
if ffmpeg_packages.exists():
    for ffp in ffmpeg_packages.glob("**/ffmpeg.exe"):
        extra_paths.append(ffp.parent)
        break

for p in extra_paths:
    if p.exists() and str(p) not in os.environ.get("PATH", ""):
        os.environ["PATH"] = f"{p}{os.pathsep}{os.environ.get('PATH', '')}"

# Detect Python executable in virtual environment
if sys.platform == "win32":
    VENV_PYTHON = API_DIR / "venv" / "Scripts" / "python.exe"
else:
    VENV_PYTHON = API_DIR / "venv" / "bin" / "python"

python_bin = str(VENV_PYTHON) if VENV_PYTHON.exists() else sys.executable

def print_banner():
    banner = r"""
  ╔═══════════════════════════════════════════════════════════════╗
  ║                     CLIPGLASS LAUNCHER                        ║
  ║       Pure Python · HTML · CSS · Tailwind Media Engine        ║
  ╚═══════════════════════════════════════════════════════════════╝
    """
    print(banner)
    print("  🚀 Starting ClipGlass on http://127.0.0.1:8000 ...\n")

def main():
    print_banner()

    # Prepare environment for API
    api_env = os.environ.copy()
    api_env["PYTHONPATH"] = str(API_DIR)

    api_cmd = [
        python_bin,
        "-m",
        "uvicorn",
        "app.main:app",
        "--host",
        "127.0.0.1",
        "--port",
        "8000",
        "--reload"
    ]

    try:
        api_proc = subprocess.Popen(
            api_cmd,
            cwd=str(API_DIR),
            env=api_env
        )
    except Exception as e:
        print(f"❌ Failed to start ClipGlass: {e}")
        sys.exit(1)

    time.sleep(1.5)
    app_url = "http://127.0.0.1:8000"
    print("\n  🎉 ClipGlass is running!")
    print(f"  👉 Workspace: {app_url}")
    print(f"  👉 API Docs:  {app_url}/docs")
    print("\n  Press CTRL+C at any time to stop.\n")

    if "--no-browser" not in sys.argv:
        try:
            webbrowser.open(app_url)
        except Exception:
            pass

    try:
        api_proc.wait()
    except KeyboardInterrupt:
        print("\n  🛑 Shutting down ClipGlass...")
        api_proc.terminate()
        try:
            api_proc.wait(timeout=3)
        except subprocess.TimeoutExpired:
            api_proc.kill()
        print("  ✓ Shutdown complete.")

if __name__ == "__main__":
    main()
