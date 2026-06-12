# Playwright's official Python image ships Chromium + all system libs.
# Pinned to v1.48.0 to match requirements.txt.
FROM mcr.microsoft.com/playwright/python:v1.48.0-jammy

WORKDIR /app

# Python deps first so this layer caches across code edits.
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Application code (designs/ is excluded via .dockerignore — that lives on the volume).
COPY src ./src
COPY shared ./shared

# Persistent volume mounted here by Fly. Subdirs created lazily by the app.
ENV STUDIO_HOST=0.0.0.0 \
    STUDIO_PORT=8080 \
    ITIHA_DESIGNS_ROOT=/data/designs \
    ITIHA_OUTPUT_ROOT=/data/renders

EXPOSE 8080
CMD ["python", "-u", "src/studio.py"]
