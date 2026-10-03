@echo off
REM ============================================
REM  Auto-Start Librika + Cloudflare on Boot
REM  Place shortcut to this in:
REM  C:\Users\YOUR_USERNAME\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup
REM ============================================

REM Navigate to Librika directory
cd /d "%~dp0"

REM Start Librika server in background
start "Librika Server" /min cmd /c start_server.bat

REM Wait 5 seconds for server to boot
timeout /t 5 /nobreak >nul

REM Start Cloudflare Tunnel in background
start "Cloudflare Tunnel" /min cmd /c cloudflared tunnel run librika

echo Librika is starting up...
echo Server: http://localhost:8080
echo Public: https://librika.in
