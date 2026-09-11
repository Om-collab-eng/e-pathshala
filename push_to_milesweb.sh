#!/bin/bash
set -e

SERVER_USER="librika_1"
SERVER_IP="45.199.139.18"
PORT="22"
PASS="Kalatota@123"

echo "=================================================="
echo "  ⬆️  Pushing changes to MilesWeb server..."
echo "=================================================="

if command -v sshpass >/dev/null 2>&1; then
  R_SSH="sshpass -p $PASS ssh -p $PORT -o StrictHostKeyChecking=no"
else
  echo "(If prompted for password, enter: $PASS)"
  R_SSH="ssh -p $PORT -o StrictHostKeyChecking=no"
fi

echo "[1/2] Syncing changed files to MilesWeb via rsync..."
rsync -avz --progress \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='*.apk' \
  --exclude='*.log' \
  --exclude='*.zip' \
  --exclude='__pycache__' \
  --exclude='.DS_Store' \
  --exclude='tmp/*' \
  --exclude='*.db-shm' \
  --exclude='*.db-wal' \
  --exclude='ocr-scanner-system/library_ocr.db' \
  -e "$R_SSH" \
  ./ "$SERVER_USER@$SERVER_IP:public_html/"

echo "[2/2] Restarting service & running DB migrations on MilesWeb..."
if command -v sshpass >/dev/null 2>&1; then
  sshpass -p "$PASS" ssh -p "$PORT" -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" << 'REMOTE_SCRIPT'
cd public_html
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
node db/initStudentPortalTables.js || true
node db/initAdsMigration.js || true
node db/initMeetingTables.js || true

pkill -9 -f "node app.js" 2>/dev/null || killall -9 node 2>/dev/null || true
mkdir -p tmp
touch tmp/restart.txt
echo "MilesWeb server updated & restarted."
REMOTE_SCRIPT
else
  ssh -p "$PORT" -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" << 'REMOTE_SCRIPT'
cd public_html
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
node db/initStudentPortalTables.js || true
node db/initAdsMigration.js || true
node db/initMeetingTables.js || true

pkill -9 -f "node app.js" 2>/dev/null || killall -9 node 2>/dev/null || true
mkdir -p tmp
touch tmp/restart.txt
echo "MilesWeb server updated & restarted."
REMOTE_SCRIPT
fi

echo "=================================================="
echo "  ✅ Push Complete! MilesWeb is live & updated."
echo "     Site: https://librika.in"
echo "=================================================="
