FROM node:20-slim

WORKDIR /app

# Install system dependencies for sharp, canvas, and native modules
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    python3 \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --only=production

COPY . .

# Railway/Render inject PORT as env var
EXPOSE ${PORT:-5001}

CMD ["node", "app.js"]
