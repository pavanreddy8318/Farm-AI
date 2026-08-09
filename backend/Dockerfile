# ---------------------------------------------------------------------------
# FarmAI Python Backend (FastAPI + YOLOv8/FGCN inference)
# NOTE: torch + torch-geometric + ultralytics produce a LARGE image (~5-8 GB).
# Mount your trained model as ./backend/models/best.pt
# ---------------------------------------------------------------------------

FROM python:3.12-slim

WORKDIR /app

# System deps for OpenCV/Pillow/ultralytics
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 libglib2.0-0 libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p models

EXPOSE 8000

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
  CMD python -c "import urllib.request;urllib.request.urlopen('http://127.0.0.1:8000/')" || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
