@echo off
title ClipGlass Launcher
cd /d "%~dp0"
echo Starting ClipGlass...
python start.py
if errorlevel 1 pause

