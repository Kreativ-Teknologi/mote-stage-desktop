@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0build_install_run.ps1"
if errorlevel 1 (
  echo.
  echo Build or install failed. See the message above.
  pause
  exit /b 1
)
