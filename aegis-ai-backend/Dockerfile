# syntax=docker/dockerfile:1

FROM python:3.13.14-alpine3.24 AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

RUN apk add --no-cache \
        build-base \
        cargo \
        linux-headers \
        libffi-dev \
        postgresql-dev \
        libjpeg-turbo-dev \
        zlib-dev

COPY requirements.txt .

RUN python -m venv /opt/venv \
    && /opt/venv/bin/python -m pip install \
        --upgrade \
        pip \
        setuptools==83.0.0 \
        wheel \
    && /opt/venv/bin/python -m pip install \
        --requirement requirements.txt \
    && /opt/venv/bin/python -m pip install \
        --upgrade \
        msgpack==1.2.1 \
        setuptools==83.0.0 \
    && /opt/venv/bin/python -m pip check


FROM python:3.13.14-alpine3.24 AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1 \
    PATH="/opt/venv/bin:$PATH"

WORKDIR /app

RUN apk add --no-cache \
        libpq \
        libstdc++ \
        libgomp \
        libjpeg-turbo \
        zlib \
    && python -m pip install \
        --upgrade \
        setuptools==83.0.0

COPY --from=builder /opt/venv /opt/venv

COPY . .

RUN mkdir -p \
        storage/vision_inspections \
        customization/reports \
    && addgroup -S app \
    && adduser -S -G app app \
    && chown -R app:app /app

USER app

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD ["python", "-c", "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=3).read()"]

CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
