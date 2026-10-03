#!/bin/bash
# ============================================================
# Librika - 1-Click Automated Deployment Script for MilesWeb
# Usage: bash deploy_to_milesweb.sh
# ============================================================

set -e

SERVER_USER="librika_1"
SERVER_IP="45.199.139.18"
PORT="22"
REMOTE_PATH="public_html"

echo "======================================"
echo "  Deploying Librika to MilesWeb..."
echo "======================================"

# Step 1: Create a clean zip excluding node_modules and heavy non-web assets (ads, APKs, PDFs, Zips, local uploads)
echo "[1/3] Packing project files..."
ZIP_PATH="../librika_upload.zip"
zip -q -r "$ZIP_PATH" . -x "*node_modules/*" "*venv/*" "*my_mac_env/*" "android/*" "android-app/*" "_legacy/*" ".git/*" ".DS_Store" "*/.DS_Store" "*.log" "ads/*" "*.apk" "*.zip" "*.pdf" "ocr-scanner-system/*" "super-admin ui/*" "static/uploads/*" "static/digital_content/*"

# Step 2: Upload to MilesWeb server
echo "[2/3] Uploading package to MilesWeb ($SERVER_IP)..."
scp -P "$PORT" "$ZIP_PATH" "$SERVER_USER@$SERVER_IP:$REMOTE_PATH/"

# Step 3: Extract and restart app on MilesWeb server
echo "[3/3] Extracting files on server..."
ssh -p "$PORT" "$SERVER_USER@$SERVER_IP" "cd $REMOTE_PATH && unzip -o librika_upload.zip && rm librika_upload.zip"

echo "======================================"
echo "  Deploy Complete! Site updated."
echo "  Visit: https://librika.in"
echo "======================================"
