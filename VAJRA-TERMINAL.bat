@echo off
title VAJRA TERMINAL - Institutional Quantitative Workstation
cls
echo =====================================================================
echo   VAJRA TERMINAL - Institutional Quantitative Workstation (NSE + BSE)
echo   Mode: Standalone Native Desktop Workstation (Online + Offline)
echo =====================================================================
echo.

cd /d "%~dp0"

echo [1/3] Checking workstation engine status...
curl.exe -s -o NUL -f --max-time 1 http://127.0.0.1:8080/
if %errorlevel% equ 0 (
    echo [OK] Engine is already running.
    goto launch_ui
)

echo [2/3] Starting background workstation engine (TypeScript / TanStack / Canvas)...
start /b "" npm.cmd run dev > NUL 2>&1

echo [*] Waiting for engine to initialize...
for /l %%i in (1,1,35) do (
    curl.exe -s -o NUL -f --max-time 1 http://127.0.0.1:8080/
    if !errorlevel! equ 0 goto ready
    timeout /t 1 /nobreak > NUL
)

:ready
echo [OK] Engine is ready at http://localhost:8080/
echo.

:launch_ui
echo [3/3] Launching VAJRA TERMINAL desktop workstation window...

set "EDGE1=C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
set "EDGE2=C:\Program Files\Microsoft\Edge\Application\msedge.exe"
set "CHROME1=C:\Program Files\Google\Chrome\Application\chrome.exe"
set "CHROME2=C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
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

start "" "%APP_URL%"
exit
