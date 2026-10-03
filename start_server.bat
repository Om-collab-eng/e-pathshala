@echo off
REM ============================================
REM  Start Librika Server (Windows Production)
REM  Uses Waitress WSGI server (Windows-compatible)
REM ============================================

echo.
echo ========================================
echo   LIBRIKA SERVER - STARTING...
echo ========================================
echo.

REM Load production environment
if exist ".env.production" (
    echo Loading .env.production...
    for /f "usebackq tokens=1,* delims==" %%a in (".env.production") do (
        REM Skip comments and empty lines
        echo %%a | findstr /r "^#" >nul 2>&1
        if errorlevel 1 (
            if not "%%a"=="" (
                set "%%a=%%b"
            )
        )
    )
)

REM Override: do NOT use SQLite in production
set USE_SQLITE=

REM Get port (default 8080)
if "%PORT%"=="" set PORT=8080

echo.
echo Server will start on: http://localhost:%PORT%
echo Press Ctrl+C to stop the server
echo.

REM Start with Waitress (production WSGI server for Windows)
python -c "from waitress import serve; from app import app; print('Librika is LIVE on http://0.0.0.0:%PORT%'); serve(app, host='0.0.0.0', port=%PORT%, threads=8, channel_timeout=120)"
