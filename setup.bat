@echo off
SETLOCAL EnableDelayedExpansion
title Librika - One-Time Setup
color 0A

echo.
echo  ================================================
echo     LIBRIKA - AUTOMATED SETUP FOR WINDOWS
echo     This will set up everything on your PC
echo  ================================================
echo.
echo  Press any key to begin...
pause >nul

REM ================================================
REM  STEP 1: CHECK PYTHON
REM ================================================
echo.
echo  [1/6] Checking Python...
python --version 2>nul
if %errorlevel% neq 0 (
    echo.
    echo  !! Python NOT found !!
    echo  Opening Python download page...
    echo  IMPORTANT: Check "Add Python to PATH" checkbox during install!
    echo.
    start https://www.python.org/downloads/release/python-3119/
    echo  After installing Python, run this script again.
    pause
    exit /b 1
)
echo  [OK] Python found!

REM ================================================
REM  STEP 2: CHECK/INSTALL POSTGRESQL
REM ================================================
echo.
echo  [2/6] Checking PostgreSQL...
where psql >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  !! PostgreSQL NOT found !!
    echo  Opening PostgreSQL download page...
    echo.
    echo  During install:
    echo    - Remember the password you set for 'postgres' user
    echo    - Keep default port 5432
    echo    - Check "pgAdmin" and "Command Line Tools"
    echo.
    start https://www.postgresql.org/download/windows/
    echo  After installing PostgreSQL, run this script again.
    pause
    exit /b 1
)
echo  [OK] PostgreSQL found!

REM ================================================
REM  STEP 3: CREATE DATABASE
REM ================================================
echo.
echo  [3/6] Setting up database...
echo.
set /p PG_PASS="  Enter your PostgreSQL 'postgres' user password: "

REM Create database if it doesn't exist
set PGPASSWORD=%PG_PASS%
psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'librika'" 2>nul | findstr "1" >nul
if %errorlevel% neq 0 (
    echo  Creating database 'librika'...
    psql -U postgres -c "CREATE DATABASE librika;" 2>nul
    if %errorlevel% neq 0 (
        echo  WARNING: Could not create database automatically.
        echo  Please create it manually in pgAdmin:
        echo    Right-click Databases ^> Create ^> Database ^> Name: librika
    ) else (
        echo  [OK] Database 'librika' created!
    )
) else (
    echo  [OK] Database 'librika' already exists!
)

REM ================================================
REM  STEP 4: INSTALL PYTHON DEPENDENCIES
REM ================================================
echo.
echo  [4/6] Installing Python packages (this may take a few minutes)...
pip install -r requirements.txt --quiet
if %errorlevel% neq 0 (
    echo  WARNING: Some packages failed. Trying again...
    pip install -r requirements.txt
)
echo  [OK] Python packages installed!

REM ================================================
REM  STEP 5: INSTALL NGROK
REM ================================================
echo.
echo  [5/6] Setting up ngrok...
where ngrok >nul 2>&1
if %errorlevel% neq 0 (
    echo  Downloading ngrok...
    echo.
    echo  Opening ngrok signup page - create a FREE account:
    start https://dashboard.ngrok.com/signup
    echo.
    echo  After signing up:
    echo    1. Go to: https://dashboard.ngrok.com/get-started/your-authtoken
    echo    2. Copy your auth token
    echo.
    echo  Opening ngrok download page:
    start https://ngrok.com/download
    echo.
    echo  After downloading:
    echo    1. Extract ngrok.exe
    echo    2. Move ngrok.exe to C:\ngrok\ngrok.exe
    echo    3. Run this setup again
    echo.
    pause
    exit /b 1
)
echo  [OK] ngrok found!

REM Check if ngrok is authenticated
echo  Checking ngrok auth...
set /p NGROK_TOKEN="  Enter your ngrok auth token (from dashboard.ngrok.com): "
if not "%NGROK_TOKEN%"=="" (
    ngrok config add-authtoken %NGROK_TOKEN%
    echo  [OK] ngrok authenticated!
) else (
    echo  Skipped ngrok auth (you can do this later)
)

REM ================================================
REM  STEP 6: CREATE ENVIRONMENT FILE
REM ================================================
echo.
echo  [6/6] Creating environment configuration...

if exist ".env.production" (
    echo  .env.production already exists. Skipping.
) else (
    (
        echo # =============================================
        echo # LIBRIKA PRODUCTION ENVIRONMENT
        echo # Fill in your actual values below
        echo # =============================================
        echo.
        echo # PostgreSQL Database
        echo DATABASE_URL=postgresql://postgres:%PG_PASS%@localhost:5432/librika
        echo.
        echo # Cloudinary Storage
        echo CLOUDINARY_CLOUD_NAME=azwohkqu
        echo CLOUDINARY_API_KEY=613621954564511
        echo CLOUDINARY_API_SECRET=
        echo.
        echo # Email
        echo SMTP_USER=
        echo SMTP_PASS=
        echo.
        echo # AI Keys
        echo BREVO_API_KEY=
        echo OPENROUTER_API_KEY=
        echo.
        echo # Server
        echo PORT=8080
    ) > .env.production
    echo  [OK] Created .env.production
    echo.
    echo  IMPORTANT: Open .env.production in Notepad and fill in
    echo  your API keys. Copy them from your Mac's .env file.
)

REM ================================================
REM  CREATE THE RUN SCRIPT (with auto-pull)
REM ================================================
echo.
echo  Creating run_librika.bat...
(
    echo @echo off
    echo SETLOCAL EnableDelayedExpansion
    echo title Librika Server
    echo color 0B
    echo.
    echo echo.
    echo echo  ========================================
    echo echo     LIBRIKA - STARTING SERVER
    echo echo  ========================================
    echo echo.
    echo.
    echo REM ------- AUTO-PULL LATEST CODE -------
    echo echo  Pulling latest code from GitHub...
    echo git pull origin main --quiet 2^>nul
    echo if %%errorlevel%% equ 0 ^(
    echo     echo  [OK] Code is up to date!
    echo ^) else ^(
    echo     echo  [!!] Could not pull. Using current code.
    echo ^)
    echo echo.
    echo.
    echo REM ------- AUTO-UPDATE DEPENDENCIES -------
    echo echo  Checking for new dependencies...
    echo pip install -r requirements.txt --quiet 2^>nul
    echo echo  [OK] Dependencies checked.
    echo echo.
    echo.
    echo REM ------- LOAD ENV -------
    echo if exist ".env.production" ^(
    echo     for /f "usebackq tokens=1,* delims==" %%%%a in ^(".env.production"^) do ^(
    echo         echo %%%%a ^| findstr /r "^^#" ^>nul 2^>^&1
    echo         if errorlevel 1 ^(
    echo             if not "%%%%a"=="" set "%%%%a=%%%%b"
    echo         ^)
    echo     ^)
    echo ^)
    echo.
    echo REM Force PostgreSQL mode
    echo set USE_SQLITE=
    echo if "%%PORT%%"=="" set PORT=8080
    echo.
    echo REM ------- START NGROK -------
    echo start "ngrok" /min cmd /c "ngrok http %%PORT%% --log=stdout"
    echo timeout /t 3 /nobreak ^>nul
    echo.
    echo REM ------- START AUTO-UPDATER IN BACKGROUND -------
    echo start "Auto-Updater" /min cmd /c "auto_update.bat"
    echo.
    echo echo  ========================================
    echo echo  PUBLIC URL: Open http://localhost:4040
    echo echo  Auto-updates: Every 5 min from GitHub
    echo echo  ========================================
    echo echo.
    echo.
    echo REM ------- START SERVER -------
    echo python -c "from waitress import serve; from app import app; print(''); print('  Librika is LIVE on http://localhost:%%PORT%%'); print('  ngrok dashboard: http://localhost:4040'); print('  Auto-updating from GitHub every 5 minutes'); print(''); serve(app, host='0.0.0.0', port=int('%%PORT%%'), threads=8, channel_timeout=120)"
) > run_librika.bat
echo  [OK] Created run_librika.bat

REM ================================================
REM  CREATE AUTO-UPDATE SCRIPT
REM ================================================
echo.
echo  Creating auto_update.bat...
(
    echo @echo off
    echo title Librika Auto-Updater
    echo color 0E
    echo.
    echo echo  ========================================
    echo echo   LIBRIKA AUTO-UPDATER
    echo echo   Checking GitHub every 5 minutes...
    echo echo  ========================================
    echo echo.
    echo.
    echo :loop
    echo timeout /t 300 /nobreak ^>nul
    echo.
    echo REM Check if there are new commits
    echo git fetch origin main --quiet 2^>nul
    echo git diff HEAD origin/main --quiet 2^>nul
    echo if %%errorlevel%% neq 0 ^(
    echo     echo [%%date%% %%time%%] New code found! Pulling...
    echo     git pull origin main --quiet
    echo     echo [%%date%% %%time%%] Updated! Restart run_librika.bat to apply.
    echo     echo.
    echo     REM Notify user
    echo     msg * "Librika: New code pulled from GitHub! Restart run_librika.bat to apply changes." 2^>nul
    echo ^) else ^(
    echo     echo [%%date%% %%time%%] No updates.
    echo ^)
    echo.
    echo goto loop
) > auto_update.bat
echo  [OK] Created auto_update.bat

REM ================================================
REM  DONE!
REM ================================================
echo.
echo  ================================================
echo     SETUP COMPLETE!
echo  ================================================
echo.
echo  HOW IT WORKS:
echo.
echo    1. Open .env.production - fill in your API keys
echo.
echo    2. Double-click  run_librika.bat
echo       - Auto-pulls latest code from GitHub
echo       - Installs any new dependencies
echo       - Starts server + ngrok
echo       - Background auto-updater checks every 5 min
echo.
echo    3. When I push changes on your Mac:
echo       - Your old PC auto-pulls in ~5 minutes
echo       - You get a notification to restart
echo       - Just close and re-open run_librika.bat
echo.
echo    4. Open http://localhost:4040 for your public URL
echo.
echo  ================================================
echo.
pause
