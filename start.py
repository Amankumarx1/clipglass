#!/usr/bin/env python3
"""
ClipGlass Unified Launcher
Pure Python · HTML · CSS · Tailwind Media Processing Engine.
Supports both local development and production-grade hosting.
"""

import os
import sys
import time
import argparse
import subprocess
import webbrowser
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

def print_banner(mode: str, host: str, port: int):
    banner = f"""
  ╔═══════════════════════════════════════════════════════════════╗
  ║                     CLIPGLASS LAUNCHER                        ║
  ║       Pure Python · HTML · CSS · Tailwind Media Engine        ║
  ╚═══════════════════════════════════════════════════════════════╝
  🚀 Mode: {mode.upper()}
  🌐 Listening on http://{host}:{port}
    """
    print(banner)

def main():
    parser = argparse.ArgumentParser(description="ClipGlass Production & Development Launcher")
    parser.add_argument("--prod", action="store_true", help="Launch in production mode (multi-worker, no-reload, proxy headers)")
    parser.add_argument("--host", default=None, help="Host interface (default: 0.0.0.0 for prod, 127.0.0.1 for dev)")
    parser.add_argument("--port", type=int, default=8000, help="Port to listen on (default: 8000)")
    parser.add_argument("--workers", type=int, default=2, help="Worker processes for production (default: 2)")
    parser.add_argument("--no-browser", action="store_true", help="Do not automatically launch web browser")
    args = parser.parse_args()

    mode = "production" if args.prod or os.environ.get("ENVIRONMENT") == "production" else "development"
    host = args.host or ("0.0.0.0" if mode == "production" else "127.0.0.1")
    port = args.port

    print_banner(mode, host, port)

    # Prepare environment for API
    api_env = os.environ.copy()
    api_env["PYTHONPATH"] = str(API_DIR)
    if mode == "production":
        api_env["ENVIRONMENT"] = "production"

    api_cmd = [
        python_bin,
        "-m",
        "uvicorn",
        "app.main:app",
        "--host",
        host,
        "--port",
        str(port),
    ]

    if mode == "production":
        api_cmd.extend([
            "--workers", str(args.workers),
            "--proxy-headers",
            "--forwarded-allow-ips", "*"
        ])
    else:
        api_cmd.append("--reload")

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
    app_url = f"http://{'127.0.0.1' if host == '0.0.0.0' else host}:{port}"
    print(f"\n  👉 ClipGlass Workspace: {app_url}")
    print(f"  👉 OpenAPI Swagger:     {app_url}/docs")
    print(f"  👉 Health Check:        {app_url}/healthz")
    print("\n  Press CTRL+C at any time to stop.\n")

    if not args.no_browser and mode != "production":
        try:
            webbrowser.open(app_url)
        except Exception:
            pass

    try:
        api_proc.wait()
    except KeyboardInterrupt:
        print("\n  🛑 Shutting down ClipGlass gracefully...")
        api_proc.terminate()
        try:
            api_proc.wait(timeout=3)
        except subprocess.TimeoutExpired:
            api_proc.kill()
        print("  ✓ Shutdown complete.")

if __name__ == "__main__":
    main()
