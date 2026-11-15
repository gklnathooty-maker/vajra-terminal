@echo off
REM Vajra Terminal launcher: private virtual environment + bounded dependencies.
REM Reinstalls only when requirements.txt changes. Extra arguments are passed on,
REM e.g.  RUN-VAJRA-PYTHON.bat --server
setlocal
cd /d "%~dp0"

if not exist ".venv\Scripts\python.exe" (
    echo Creating private Python environment...
    py -3 -m venv .venv || goto :fail
)

fc /b requirements.txt .venv\requirements.stamp >nul 2>&1
if errorlevel 1 (
    echo Installing dependencies from requirements.txt...
    ".venv\Scripts\python.exe" -m pip install --disable-pip-version-check -r requirements.txt || goto :fail
    copy /y requirements.txt .venv\requirements.stamp >nul
)

".venv\Scripts\python.exe" vajra_terminal_app.py %*
goto :eof

:fail
echo.
echo Setup failed. Check that Python 3 is installed (py -3 --version) and that you are online.
pause
exit /b 1
