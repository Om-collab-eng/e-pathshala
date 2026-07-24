FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for psycopg2 and PyMuPDF
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Railway injects PORT as env var
EXPOSE ${PORT:-8080}

CMD ["gunicorn", "app:app", "--bind", "0.0.0.0:8080", "--workers", "2", "--threads", "4", "--timeout", "120"]
