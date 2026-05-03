@echo off
title Life Log
cd /d "%~dp0"

REM First-time setup: install dependencies if node_modules doesn't exist
if not exist "node_modules\" (
    echo.
    echo ===============================================
    echo  First-time setup - installing dependencies
    echo  This takes about 30 seconds. One-time only.
    echo ===============================================
    echo.
    call npm install
    if errorlevel 1 (
        echo.
        echo --------------------------------------------------
        echo  npm install failed.
        echo  Make sure Node.js is installed: https://nodejs.org
        echo --------------------------------------------------
        pause
        exit /b 1
    )
    echo.
    echo Dependencies installed.
    echo.
)

echo.
echo ===============================================
echo  Starting Life Log at http://localhost:5173
echo  Press Ctrl+C in this window to stop.
echo ===============================================
echo.
call npm run dev

REM If the dev server exits (Ctrl+C or error), keep window open so you can read messages
pause
