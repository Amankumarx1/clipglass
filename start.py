#!/usr/bin/env python3
"""
ClipGlass Single-Command Launcher
Runs both the FastAPI Backend (port 8000) and Next.js Frontend (port 3000)
with a single command, opens the browser, and handles clean shutdown on Ctrl+C.
"""

import os
import sys
import time
import subprocess
import webbrowser
import signal
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
API_DIR = ROOT_DIR / "apps" / "api"
WEB_DIR = ROOT_DIR / "apps" / "web"

# Detect Python executable in virtual environment
if sys.platform == "win32":
    VENV_PYTHON = API_DIR / "venv" / "Scripts" / "python.exe"
    NPM_CMD = "npm.cmd"
else:
    VENV_PYTHON = API_DIR / "venv" / "bin" / "python"
    NPM_CMD = "npm"

python_bin = str(VENV_PYTHON) if VENV_PYTHON.exists() else sys.executable

def print_banner():
    banner = r"""
  ╔═══════════════════════════════════════════════════════════════╗
  ║                     CLIPGLASS LAUNCHER                        ║
  ║         Liquid Glass Media Extraction & Processing            ║
  ╚═══════════════════════════════════════════════════════════════╝
    """
    print(banner)
    print("  🚀 Starting FastAPI backend on http://127.0.0.1:8000 ...")
    print("  ✨ Starting Next.js frontend on http://localhost:3000 ...\n")

def main():
    print_banner()

    processes = []

    # Prepare environment for API
    api_env = os.environ.copy()
    api_env["PYTHONPATH"] = str(API_DIR)

    # 1. Start FastAPI Backend
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
        processes.append(api_proc)
    except Exception as e:
        print(f"❌ Failed to start backend: {e}")
        sys.exit(1)

    # 2. Start Next.js Frontend
    web_cmd = [NPM_CMD, "run", "dev"]

    try:
        web_proc = subprocess.Popen(
            web_cmd,
            cwd=str(WEB_DIR)
        )
        processes.append(web_proc)
    except Exception as e:
        print(f"❌ Failed to start frontend: {e}")
        for p in processes:
            p.terminate()
        sys.exit(1)

    # Wait 2 seconds and open browser
    time.sleep(2)
    print("\n  🎉 ClipGlass is running!")
    print("  👉 Web App:         http://localhost:3000")
    print("  👉 Design Showcase: http://localhost:3000/design")
    print("  👉 API Docs:        http://127.0.0.1:8000/docs")
    print("\n  Press CTRL+C at any time to cleanly stop all services.\n")

    try:
        webbrowser.open("http://localhost:3000")
    except Exception:
        pass

    # Monitor and handle graceful shutdown
    def handle_signal(sig, frame):
        print("\n\n  🛑 Shutting down ClipGlass services...")
        for p in processes:
            try:
                p.terminate()
                p.wait(timeout=3)
            except Exception:
                try:
                    p.kill()
                except Exception:
                    pass
        print("  ✅ All services stopped safely. Bye!\n")
        sys.exit(0)

    signal.signal(signal.SIGINT, handle_signal)
    signal.signal(signal.SIGTERM, handle_signal)

    # Wait for processes
    try:
        while True:
            for p in processes:
                if p.poll() is not None:
                    print(f"⚠️ Process {p.args} exited unexpectedly.")
                    handle_signal(None, None)
            time.sleep(1)
    except KeyboardInterrupt:
        handle_signal(None, None)

if __name__ == "__main__":
    main()

