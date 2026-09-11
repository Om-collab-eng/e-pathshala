#!/bin/bash
set -e

SERVER_USER="librika_1"
SERVER_IP="45.199.139.18"
PORT="22"
PASS="Kalatota@123"

echo "=================================================="
echo "  ⬇️  Pulling latest project from MilesWeb..."
echo "=================================================="

if command -v sshpass >/dev/null 2>&1; then
  R_SSH="sshpass -p $PASS ssh -p $PORT -o StrictHostKeyChecking=no"
else
  echo "(If prompted for password, enter: $PASS)"
  R_SSH="ssh -p $PORT -o StrictHostKeyChecking=no"
fi

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
  "$SERVER_USER@$SERVER_IP:public_html/" ./

echo "=================================================="
echo "  ✅ Pull Complete! All files, secrets, and overview"
echo "     are up to date from MilesWeb."
echo "=================================================="
