@echo off
title Stop Vajra Terminal Engine
cls
echo =====================================================================
echo   VAJRA TERMINAL - Stopping Background Workstation Engine
echo =====================================================================
echo.

cd /d "%~dp0"

echo [*] Terminating background processes on port 8080...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8080" ^| findstr "LISTENING"') do (
    taskkill /f /pid %%a >nul 2>&1
)

echo [OK] Workstation engine stopped. You can safely unplug your pendrive.
echo.
timeout /t 3
exit
