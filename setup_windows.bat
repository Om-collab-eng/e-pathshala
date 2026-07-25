@echo off
REM ============================================
REM  Librika Self-Hosting Setup Script (Windows)
REM  Run this as Administrator
REM ============================================

echo.
echo ========================================
echo   LIBRIKA SELF-HOSTING SETUP
echo   Your Old PC = Your Server
echo ========================================
echo.

REM Step 1: Check Python
echo [1/5] Checking Python installation...
python --version 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Python not found!
    echo Please download Python 3.11 from: https://www.python.org/downloads/
    echo IMPORTANT: Check "Add Python to PATH" during installation!
    pause
    exit /b 1
)
echo Python found!
echo.

REM Step 2: Check PostgreSQL
echo [2/5] Checking PostgreSQL...
pg_isready 2>nul
if %errorlevel% neq 0 (
    echo WARNING: PostgreSQL not detected.
    echo Please download from: https://www.postgresql.org/download/windows/
    echo During install, remember the password you set for 'postgres' user.
    echo.
    echo After installing PostgreSQL, create the database:
    echo   1. Open pgAdmin or psql
    echo   2. Run: CREATE DATABASE librika;
    echo.
    pause
)
echo.

REM Step 3: Install Python dependencies
echo [3/5] Installing Python dependencies...
pip install -r requirements.txt
echo.

REM Step 4: Create .env for production
echo [4/5] Setting up environment...
if not exist ".env.production" (
    echo Creating .env.production template...
    (
        echo # Librika Production Environment
        echo # UPDATE ALL VALUES BELOW WITH YOUR ACTUAL KEYS
        echo.
        echo # Database - set your PostgreSQL password
        echo DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/librika
        echo.
        echo # Cloudinary Storage
        echo CLOUDINARY_CLOUD_NAME=YOUR_CLOUD_NAME
        echo CLOUDINARY_API_KEY=YOUR_API_KEY
        echo CLOUDINARY_API_SECRET=YOUR_API_SECRET
        echo.
        echo # Email SMTP
        echo SMTP_USER=YOUR_EMAIL
        echo SMTP_PASS=YOUR_APP_PASSWORD
        echo.
        echo # AI Keys
        echo BREVO_API_KEY=YOUR_BREVO_KEY
        echo OPENROUTER_API_KEY=YOUR_OPENROUTER_KEY
        echo.
        echo # Server Port
        echo PORT=8080
    ) > .env.production
    echo.
    echo Created .env.production
    echo IMPORTANT: Open .env.production and fill in your actual API keys!
    echo Copy them from your .env file on your Mac.
) else (
    echo .env.production already exists.
)
echo.

REM Step 5: Test run
echo [5/5] Setup complete!
echo.
echo ========================================
echo   NEXT STEPS:
echo ========================================
echo.
echo 1. Edit .env.production and set your actual keys
echo    (copy them from the .env file on your Mac)
echo 2. Run the server:    start_server.bat
echo 3. Open browser:      http://localhost:8080
echo 4. Set up Cloudflare:  setup_cloudflare.bat
echo.
pause
