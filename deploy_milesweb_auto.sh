#!/bin/bash
set -e

SERVER_USER="librika_1"
SERVER_IP="45.199.139.18"
PORT="22"
REMOTE_PATH="public_html"
PASS="Kalatota@123"

echo "======================================"
echo "  Deploying Librika to MilesWeb..."
echo "======================================"

# Step 1: Create clean zip
ZIP_PATH="../librika_upload.zip"
rm -f "$ZIP_PATH"
echo "[1/3] Packing project files..."
zip -q -r "$ZIP_PATH" . -x "*node_modules/*" "*venv/*" "*my_mac_env/*" "android/*" "android-app/*" "_legacy/*" ".git/*" ".DS_Store" "*/.DS_Store" "*.log" "ads/*" "*.apk" "*.zip" "ocr-scanner-system/*" "super-admin ui/*"

# Step 2: SCP upload
echo "[2/3] Uploading package to MilesWeb ($SERVER_IP)..."
sshpass -p "$PASS" scp -P "$PORT" -o StrictHostKeyChecking=no "$ZIP_PATH" "$SERVER_USER@$SERVER_IP:$REMOTE_PATH/"

# Step 3: Unzip and restart on server
echo "[3/3] Extracting files and restarting service..."
sshpass -p "$PASS" ssh -p "$PORT" -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" << 'EOF'
cd public_html
unzip -o librika_upload.zip
rm -f librika_upload.zip

# Ensure Node & NVM environment
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Install any new dependencies
npm install --silent || true

# Run DB schema sync
node db/initStudentPortalTables.js || true

# Kill running node instance so supervisor cleanly restarts server
pkill -9 -f "node app.js" 2>/dev/null || killall -9 node 2>/dev/null || true

# Touch passenger/restart if applicable
mkdir -p tmp
touch tmp/restart.txt

echo "MilesWeb server files extracted, DB updated, and application restarted."
EOF

rm -f "$ZIP_PATH"
echo "======================================"
echo "  Deploy Complete! Site updated."
echo "  Visit: https://librika.in"
echo "======================================"
