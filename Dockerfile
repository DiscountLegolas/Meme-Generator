# syntax=docker/dockerfile:1

# Multi-stage build for smaller final image
FROM python:3.10-slim as builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Install system dependencies for building
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libjpeg62-turbo-dev \
    zlib1g-dev \
    libpng-dev \
    && rm -rf /var/lib/apt/lists/*

# Install core dependencies first (faster builds)
COPY requirements-core.txt ./
RUN pip install --upgrade pip && pip install -r requirements-core.txt

# Install AI dependencies (heavy, cached separately)
COPY requirements-ai.txt ./
RUN pip install -r requirements-ai.txt

# Production stage
FROM python:3.10-slim as production

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    FLASK_ENV=production

WORKDIR /app

# Copy only runtime dependencies from builder
COPY --from=builder /usr/local/lib/python3.10/site-packages /usr/local/lib/python3.10/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Install minimal runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libjpeg62-turbo \
    zlib1g \
    libpng16-16 \
    && rm -rf /var/lib/apt/lists/*

# Copy app source
COPY . .

# Create required folders
RUN mkdir -p GeneratedMemes Memes frontend/build

# Expose Flask port
EXPOSE 5000

# Use gunicorn in container for robustness
CMD ["gunicorn", "-w", "2", "-b", "0.0.0.0:5000", "app:app"]


