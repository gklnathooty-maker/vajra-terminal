@echo off
title VAJRA TERMINAL - Institutional Quantitative Workstation (Python 3.15)
cls
echo ==============================================================================
echo   VAJRA TERMINAL - Institutional Quantitative Workstation (Python)
echo   Equities: NSE + BSE India  ^|  Camarilla H1-H5  ^|  Algo Trading  ^|  Power BI
echo ==============================================================================
echo.

cd /d "%~dp0"

echo [1/2] Verifying Python 3.15 Environment...
python --version
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in system PATH.
    pause
    exit /b 1
)

echo.
echo [2/2] Launching VAJRA TERMINAL Standalone Desktop Workstation GUI...
python vajra_terminal_app.py
exit
