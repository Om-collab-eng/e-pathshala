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
REM  CREATE THE RUN SCRIPT
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
    echo REM Load production env
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
    echo echo  Starting Librika on port %%PORT%%...
    echo echo.
    echo.
    echo REM Start ngrok in background
    echo start "ngrok" /min cmd /c "ngrok http %%PORT%% --log=stdout"
    echo.
    echo REM Wait for ngrok to start
    echo timeout /t 3 /nobreak ^>nul
    echo.
    echo REM Show ngrok URL
    echo echo  ========================================
    echo echo  Your PUBLIC URL:
    echo echo  Open http://localhost:4040 in browser
    echo echo  to see your ngrok public URL
    echo echo  ========================================
    echo echo.
    echo.
    echo REM Start Flask server with Waitress
    echo python -c "from waitress import serve; from app import app; print(''); print('  Librika is LIVE on http://localhost:%%PORT%%'); print('  ngrok dashboard: http://localhost:4040'); print(''); serve(app, host='0.0.0.0', port=int('%%PORT%%'), threads=8, channel_timeout=120)"
) > run_librika.bat
echo  [OK] Created run_librika.bat

REM ================================================
REM  DONE!
REM ================================================
echo.
echo  ================================================
echo     SETUP COMPLETE!
echo  ================================================
echo.
echo  WHAT TO DO NOW:
echo.
echo    1. Open .env.production in Notepad
echo       Fill in your API keys from your Mac's .env
echo.
echo    2. Double-click  run_librika.bat
echo       This starts your server + ngrok together
echo.
echo    3. Open http://localhost:4040 in browser
echo       Copy the ngrok public URL (e.g. https://abc123.ngrok-free.app)
echo       Share this URL - anyone can access your site!
echo.
echo    4. To use librika.in domain with ngrok:
echo       Get ngrok Pro ($8/mo) and run:
echo       ngrok http 8080 --domain=librika.in
echo.
echo  ================================================
echo.
pause
