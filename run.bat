@echo off
title ClipGlass Launcher
cd /d "%~dp0"
echo Starting ClipGlass...
if exist "apps\api\venv\Scripts\python.exe" (
    "apps\api\venv\Scripts\python.exe" start.py
) else (
    python start.py
)
if errorlevel 1 pause

