"""SmartGuard Vision Service — Fase A/B/C (RTSP + pose + comportamento)."""

from __future__ import annotations

import logging
from pathlib import Path

from fastapi import Depends, FastAPI
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from app.config import DETECTION_ENABLED, EVIDENCE_DIR, LOITERING_SECONDS
from app.rtsp.stream_manager import stream_manager
from app.security import require_service_token

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")

app = FastAPI(
    title="SmartGuard Vision Service",
    version="0.3.0",
    description=(
        "RTSP + YOLO-Pose: loitering e possível ocultação anônimos. "
        "Sem reconhecimento facial. Não declara furto automaticamente."
    ),
)

Path(EVIDENCE_DIR).mkdir(parents=True, exist_ok=True)
app.mount("/evidence", StaticFiles(directory=EVIDENCE_DIR), name="evidence")


class StreamRequest(BaseModel):
    cameraId: int = Field(..., ge=1)
    cameraIdentifier: str | None = None
    rtspUrl: str | None = None


class StopRequest(BaseModel):
    cameraId: int = Field(..., ge=1)


@app.get("/health")
def health() -> dict:
    return {
        "status": "UP",
        "service": "smartguard-vision",
        "phase": "C-behavior",
        "detectionEnabled": DETECTION_ENABLED,
        "loiteringSeconds": LOITERING_SECONDS,
        "behaviors": ["UNUSUAL_DWELL", "POSSIBLE_CONCEALMENT", "SUSPICIOUS_MOVEMENT"],
        "facialRecognition": False,
        "declaresCrime": False,
    }


@app.post("/streams/test", dependencies=[Depends(require_service_token)])
def test_stream(payload: StreamRequest) -> dict:
    if not payload.rtspUrl:
        return {"success": False, "message": "rtspUrl é obrigatório"}
    return stream_manager.test(
        payload.cameraId,
        payload.rtspUrl,
        payload.cameraIdentifier or "",
    )


@app.post("/streams/start", dependencies=[Depends(require_service_token)])
def start_stream(payload: StreamRequest) -> dict:
    if not payload.rtspUrl:
        return {"success": False, "message": "rtspUrl é obrigatório"}
    if not payload.cameraIdentifier:
        return {"success": False, "message": "cameraIdentifier é obrigatório"}
    return stream_manager.start(payload.cameraId, payload.rtspUrl, payload.cameraIdentifier)


@app.post("/streams/stop", dependencies=[Depends(require_service_token)])
def stop_stream(payload: StopRequest) -> dict:
    return stream_manager.stop(payload.cameraId)
