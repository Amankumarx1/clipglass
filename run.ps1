# ClipGlass One-Command PowerShell Launcher
Set-Location -Path $PSScriptRoot
$py = if (Test-Path "apps\api\venv\Scripts\python.exe") { "apps\api\venv\Scripts\python.exe" } else { "python" }
& $py start.py

