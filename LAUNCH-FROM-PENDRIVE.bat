@echo off
title VAJRA TERMINAL - Portable Pendrive Edition
cls
echo =====================================================================
echo   VAJRA TERMINAL - PORTABLE PENDRIVE EDITION (PLUG ^& PLAY)
echo   Indian Equity Analysis Workstation (NSE + BSE)
echo =====================================================================
echo.

cd /d "%~dp0"

echo [*] Detected directory: %CD%

REM 1. Verify portable node runtime or system node
if exist "%~dp0runtime\node.exe" (
    echo [OK] Portable Node.js runtime detected inside pendrive.
    set "NODE_BIN=%~dp0runtime\node.exe"
) else (
    where node >nul 2>&1
    if %errorlevel% equ 0 (
        echo [OK] System Node.js detected on host machine.
        set "NODE_BIN=node"
    ) else (
        echo [ERROR] No Node runtime found in runtime\node.exe or system PATH.
        echo Please ensure runtime\node.exe is present in this folder.
        pause
        exit /b 1
    )
)

REM 2. Check if engine is already running
curl.exe -s -o NUL -f --max-time 1 http://127.0.0.1:8080/
if %errorlevel% equ 0 (
    echo [OK] Workstation engine is already active.
    goto launch_ui
)

REM 3. Start portable background engine
echo [*] Launching workstation engine...
start /b "" "%NODE_BIN%" "%~dp0scripts\with-app-env.mjs" vite dev --host 0.0.0.0 --port 8080 > NUL 2>&1

echo [*] Initializing workstation modules (waiting for port 8080)...
for /l %%i in (1,1,35) do (
    curl.exe -s -o NUL -f --max-time 1 http://127.0.0.1:8080/
    if !errorlevel! equ 0 goto ready
    timeout /t 1 /nobreak > NUL
)

:ready
echo [OK] Engine online at http://localhost:8080/

:launch_ui
echo [*] Opening native workstation display window...

set "EDGE1=C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
set "EDGE2=C:\Program Files\Microsoft\Edge\Application\msedge.exe"
set "CHROME1=C:\Program Files\Google\Chrome\Application\chrome.exe"
set "CHROME2=C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
set "EDGE3=%LOCALAPPDATA%\Microsoft\Edge\Application\msedge.exe"
set "CHROME3=%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"
set "APP_URL=http://localhost:8080/?key=VAJRA2026"

if exist "%EDGE1%" (
    start "" "%EDGE1%" --app="%APP_URL%" --window-size=1440,920 --disable-features=TranslateUI --disable-extensions --app-auto-launched
    exit
)
if exist "%EDGE2%" (
    start "" "%EDGE2%" --app="%APP_URL%" --window-size=1440,920 --disable-features=TranslateUI --disable-extensions --app-auto-launched
    exit
)
if exist "%CHROME1%" (
    start "" "%CHROME1%" --app="%APP_URL%" --window-size=1440,920 --disable-features=TranslateUI --disable-extensions --app-auto-launched
    exit
)
if exist "%CHROME2%" (
    start "" "%CHROME2%" --app="%APP_URL%" --window-size=1440,920 --disable-features=TranslateUI --disable-extensions --app-auto-launched
    exit
)
if exist "%EDGE3%" (
    start "" "%EDGE3%" --app="%APP_URL%" --window-size=1440,920 --disable-features=TranslateUI --disable-extensions --app-auto-launched
    exit
)
if exist "%CHROME3%" (
    start "" "%CHROME3%" --app="%APP_URL%" --window-size=1440,920 --disable-features=TranslateUI --disable-extensions --app-auto-launched
    exit
)

REM Fallback to default system browser
start "" "%APP_URL%"
exit
