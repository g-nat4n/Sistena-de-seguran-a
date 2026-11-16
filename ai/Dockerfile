# Vision Service (cloud): OpenCV headless + FastAPI.
# YOLO é opcional (imagem menor / cabe melhor em free tiers). Ative INSTALL_YOLO=true no build.
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    ffmpeg \
  && rm -rf /var/lib/apt/lists/*

COPY requirements.cloud.txt .
RUN pip install --no-cache-dir -r requirements.cloud.txt

ARG INSTALL_YOLO=false
RUN if [ "$INSTALL_YOLO" = "true" ]; then \
      pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu && \
      pip install --no-cache-dir ultralytics; \
    fi

COPY app ./app
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN sed -i 's/\r$//' ./docker-entrypoint.sh && chmod +x ./docker-entrypoint.sh \
  && mkdir -p /app/data/evidence

ENV PYTHONUNBUFFERED=1
ENV EVIDENCE_DIR=/app/data/evidence
ENV DETECTION_ENABLED=true
ENV PERSON_ALERT_ENABLED=false

EXPOSE 8090
ENTRYPOINT ["./docker-entrypoint.sh"]
