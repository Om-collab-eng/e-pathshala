#!/bin/bash
# ============================================================
# Librika - Deploy / Update Script
# Run this on the VPS to push new code changes
# Usage: bash deploy.sh
# ============================================================

set -e

echo "======================================"
echo "  Librika - Deploying Update..."
echo "======================================"

cd /var/www/librika

# Pull latest code (if using git)
# git pull origin main

# Install any new packages
source venv/bin/activate
pip install -r requirements.txt --quiet

# Run migrations if needed
INIT_DB=true python3 -c "from app import init_db; init_db()" 2>/dev/null || true

# Restart the app
systemctl restart librika

echo "Deploy complete! App restarted."
systemctl status librika --no-pager
