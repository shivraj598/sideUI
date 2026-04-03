@echo off
REM SideUI Chrome Extension - Installation Script for Windows
REM This script sets up the extension and provides next steps

echo.
echo SideUI - Chrome Extension Setup
echo ================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo X Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i

echo + Node.js found: %NODE_VERSION%
echo + npm found: %NPM_VERSION%
echo.

REM Install dependencies
echo Installing dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 goto error
echo.

REM Build the extension
echo Building extension...
call npm run build
if %ERRORLEVEL% NEQ 0 goto error
echo.

echo + Setup complete!
echo.
echo Next Steps:
echo ===========
echo.
echo 1. Open Chrome and go to: chrome://extensions/
echo.
echo 2. Enable 'Developer mode' (toggle in top right)
echo.
echo 3. Click 'Load unpacked' button
echo.
echo 4. Select the 'dist' folder in this project
echo.
echo 5. The SideUI icon should now appear in your Chrome toolbar!
echo.
echo Usage Tips:
echo ===========
echo + Click the SideUI icon to open the popup
echo + Press Ctrl+Shift+U to toggle sidebar
echo + Use quick add bar to paste URLs
echo + Search to filter your favorites
echo.
echo Development:
echo ============
echo Run 'npm run dev' to watch for changes and auto-rebuild
echo.
echo Documentation:
echo ===============
echo + Read QUICKSTART.md for a quick guide
echo + Read DEVELOPMENT.md for architecture details
echo + Read README.md for complete documentation
echo.
echo Happy browsing!
echo.
pause
exit /b 0

:error
echo.
echo X An error occurred during setup. Please check the output above.
pause
exit /b 1
