@echo off
setlocal
:menu
cls
echo ====================================
echo    School Library Manager System
echo ====================================
echo 1. Start Library Server
echo 2. Stop Library Server
echo 3. Restart Library Server
echo 4. Check Server Status
echo 5. View Server Logs
echo 6. START GLOBAL HOSTING (Worldwide Access)
echo 7. Get Local WiFi Address
echo 8. Database Maintenance
echo 9. Set/Update Ngrok Token
echo 10. START EVERYTHING (Server + Global Hosting)
echo.
echo ====================================
set /p opt="Select an option: "

if "%opt%"=="1" pm2 start ecosystem.config.js
if "%opt%"=="2" pm2 stop library-system
if "%opt%"=="3" pm2 restart library-system
if "%opt%"=="4" pm2 status
if "%opt%"=="5" pm2 logs library-system
if "%opt%"=="6" (
    echo.
    echo ====================================
    echo    STARTING WORLDWIDE HOSTING...
    echo ====================================
    echo WARNING: Make sure Option 1 is RUNNING first!
    echo.
    npx ngrok http 127.0.0.1:5000
)
if "%opt%"=="7" (
    echo Your Local WiFi URL is:
    for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr "IPv4 Address"') do (
        echo http:%%a:5000
    )
    echo (Note: Only works for devices on your SAME WiFi)
)
if "%opt%"=="8" echo Database maintenance not implemented yet.
if "%opt%"=="9" set /p token="Enter Ngrok Auth Token: " && npx ngrok authtoken %token%
if "%opt%"=="10" (
    echo.
    echo ====================================
    echo    STARTING SERVER + WORLDWIDE...
    echo ====================================
    echo.
    pm2 stop library-system >nul 2>&1
    pm2 start ecosystem.config.js
    echo Waiting for server to stabilize...
    timeout /t 8 /nobreak
    npx ngrok http localhost:5000
)

if "%opt%"=="123" exit
goto menu
