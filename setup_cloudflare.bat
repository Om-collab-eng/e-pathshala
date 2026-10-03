@echo off
REM ============================================
REM  Cloudflare Tunnel Setup for Librika
REM  This makes librika.in point to your PC
REM  NO static IP or port forwarding needed!
REM ============================================

echo.
echo ========================================
echo   CLOUDFLARE TUNNEL SETUP
echo ========================================
echo.

REM Check if cloudflared is installed
cloudflared --version 2>nul
if %errorlevel% neq 0 (
    echo Cloudflared not found. Downloading...
    echo.
    echo Please download from:
    echo https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
    echo.
    echo Or run this in PowerShell as Admin:
    echo   winget install Cloudflare.cloudflared
    echo.
    pause
    exit /b 1
)

echo Cloudflared found!
echo.

REM Step 1: Login to Cloudflare
echo [Step 1] Logging in to Cloudflare...
echo This will open your browser. Log in and select librika.in domain.
cloudflared tunnel login
echo.

REM Step 2: Create tunnel
echo [Step 2] Creating tunnel named 'librika'...
cloudflared tunnel create librika
echo.

REM Step 3: Route DNS
echo [Step 3] Routing librika.in to this tunnel...
cloudflared tunnel route dns librika librika.in
echo.

REM Step 4: Create config
echo [Step 4] Creating tunnel config...
(
    echo url: http://localhost:8080
    echo tunnel: librika
    echo credentials-file: %USERPROFILE%\.cloudflared\*.json
) > %USERPROFILE%\.cloudflared\config.yml
echo Config saved to %USERPROFILE%\.cloudflared\config.yml
echo.

echo ========================================
echo   SETUP COMPLETE!
echo ========================================
echo.
echo To start the tunnel, run:
echo   cloudflared tunnel run librika
echo.
echo To make it start automatically on boot:
echo   cloudflared service install
echo.
echo Once running, librika.in will point to this PC!
echo.
pause
