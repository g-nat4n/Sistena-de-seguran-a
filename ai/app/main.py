"""SmartGuard Vision Service — Fase A/B/C (RTSP + pose + comportamento)."""

from __future__ import annotations

import logging
from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from app.config import DETECTION_ENABLED, EVIDENCE_DIR, LOITERING_SECONDS
from app.rtsp.stream_manager import stream_manager
from app.security import require_service_token

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")

app = FastAPI(
    title="SmartGuard Vision Service",
    version="0.4.0",
    description=(
        "RTSP + YOLO-Pose: loitering e possível ocultação anônimos. "
        "Sem reconhecimento facial. Não declara furto automaticamente."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

Path(EVIDENCE_DIR).mkdir(parents=True, exist_ok=True)
app.mount("/evidence", StaticFiles(directory=EVIDENCE_DIR), name="evidence")


class StreamRequest(BaseModel):
    cameraId: int = Field(..., ge=1)
    cameraIdentifier: str | None = None
    rtspUrl: str | None = None


class StopRequest(BaseModel):
    cameraId: int = Field(..., ge=1)


def _assert_local_client(request: Request) -> None:
    host = request.client.host if request.client else ""
    if host not in {"127.0.0.1", "::1", "localhost"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Preview só disponível em localhost",
        )


@app.get("/health")
def health() -> dict:
    return {
        "status": "UP",
        "service": "smartguard-vision",
        "phase": "C-behavior+preview",
        "detectionEnabled": DETECTION_ENABLED,
        "loiteringSeconds": LOITERING_SECONDS,
        "behaviors": ["UNUSUAL_DWELL", "POSSIBLE_CONCEALMENT", "SUSPICIOUS_MOVEMENT"],
        "facialRecognition": False,
        "declaresCrime": False,
        "livePreview": True,
    }


@app.get("/streams/{camera_id}/snapshot")
def stream_snapshot(camera_id: int, request: Request) -> Response:
    """JPEG do último frame do stream ativo (apenas localhost / Electron)."""
    _assert_local_client(request)
    jpeg = stream_manager.get_snapshot_jpeg(camera_id)
    if not jpeg:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sem frame ainda. Inicie o stream da câmera.",
        )
    return Response(
        content=jpeg,
        media_type="image/jpeg",
        headers={"Cache-Control": "no-store, no-cache, must-revalidate"},
    )


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
