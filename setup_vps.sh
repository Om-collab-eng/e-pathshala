#!/bin/bash
# ============================================================
# Librika - Hostinger VPS Setup Script
# Run this script on a fresh Ubuntu 22.04 VPS as root
# Usage: bash setup.sh
# ============================================================

set -e

echo "======================================"
echo "  Librika VPS Setup - Starting..."
echo "======================================"

# ---------- 1. System Update ----------
echo "[1/8] Updating system packages..."
apt update && apt upgrade -y
apt install -y python3.11 python3.11-venv python3-pip python3.11-dev \
    nginx git curl unzip build-essential libpq-dev \
    libssl-dev libffi-dev nodejs npm

# ---------- 2. Create app user ----------
echo "[2/8] Creating 'librika' app user..."
id -u librika &>/dev/null || useradd -m -s /bin/bash librika

# ---------- 3. Clone / copy project ----------
echo "[3/8] Setting up project directory..."
mkdir -p /var/www/librika
chown -R librika:librika /var/www/librika

# If you have a GitHub repo, replace this URL:
# git clone https://github.com/YOUR_USERNAME/librika.git /var/www/librika
# Otherwise we assume you've already uploaded your files via scp/sftp

# ---------- 4. Python virtual environment ----------
echo "[4/8] Setting up Python virtual environment..."
cd /var/www/librika
python3.11 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# ---------- 5. Environment variables ----------
echo "[5/8] Writing .env file..."
cat > /var/www/librika/.env << 'ENVEOF'
DATABASE_URL=postgresql://librika_user:VuqnILXFEbllUS8TwDnm5QeFMcWMssZm@dpg-d97murd7vvec73chvd2g-a.oregon-postgres.render.com/librika
CLOUDINARY_CLOUD_NAME=dwnlpxe2v
CLOUDINARY_API_KEY=943486337222384
CLOUDINARY_API_SECRET=wwvKpb1qQs_fEbalCsCYa4bU-EY
FLASK_DEBUG=false
PORT=8000
ENVEOF

chmod 600 /var/www/librika/.env
chown librika:librika /var/www/librika/.env

# ---------- 6. Run database migration ----------
echo "[6/8] Running database migration (init_db)..."
cd /var/www/librika
source venv/bin/activate
INIT_DB=true DATABASE_URL="postgresql://librika_user:VuqnILXFEbllUS8TwDnm5QeFMcWMssZm@dpg-d97murd7vvec73chvd2g-a.oregon-postgres.render.com/librika" python3 -c "from app import init_db; init_db()"
echo "Database migration done!"

# ---------- 7. Gunicorn systemd service ----------
echo "[7/8] Creating Gunicorn systemd service..."
cat > /etc/systemd/system/librika.service << 'SERVICEEOF'
[Unit]
Description=Librika Flask App
After=network.target

[Service]
User=librika
Group=librika
WorkingDirectory=/var/www/librika
EnvironmentFile=/var/www/librika/.env
ExecStart=/var/www/librika/venv/bin/gunicorn \
    --workers 2 \
    --bind 127.0.0.1:8000 \
    --timeout 120 \
    --access-logfile /var/log/librika/access.log \
    --error-logfile /var/log/librika/error.log \
    app:app
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
SERVICEEOF

mkdir -p /var/log/librika
chown -R librika:librika /var/log/librika

systemctl daemon-reload
systemctl enable librika
systemctl start librika

# ---------- 8. Nginx reverse proxy ----------
echo "[8/8] Configuring Nginx reverse proxy..."
cat > /etc/nginx/sites-available/librika << 'NGINXEOF'
server {
    listen 80;
    server_name _;

    client_max_body_size 50M;

    location /static/ {
        alias /var/www/librika/static/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120;
        proxy_connect_timeout 120;
    }
}
NGINXEOF

ln -sf /etc/nginx/sites-available/librika /etc/nginx/sites-enabled/librika
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo ""
echo "======================================"
echo "  Setup Complete!"
echo "======================================"
echo "  Your app is now running at:"
echo "  http://$(curl -s ifconfig.me)"
echo ""
echo "  Useful commands:"
echo "  sudo systemctl status librika    # Check app status"
echo "  sudo systemctl restart librika   # Restart app"
echo "  sudo journalctl -u librika -f    # View live logs"
echo "  sudo tail -f /var/log/librika/error.log"
echo "======================================"
