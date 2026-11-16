"""SmartGuard Vision Service — Fase A (RTSP test/start/stop)."""

from __future__ import annotations

import logging

from fastapi import Depends, FastAPI
from pydantic import BaseModel, Field

from app.rtsp.stream_manager import stream_manager
from app.security import require_service_token

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")

app = FastAPI(
    title="SmartGuard Vision Service",
    version="0.1.0",
    description="Serviço de RTSP/visão. Fase A: teste e manutenção de stream Intelbras.",
)


class StreamRequest(BaseModel):
    cameraId: int = Field(..., ge=1)
    rtspUrl: str | None = None


class StopRequest(BaseModel):
    cameraId: int = Field(..., ge=1)


@app.get("/health")
def health() -> dict:
    return {"status": "UP", "service": "smartguard-vision", "phase": "A-rtsp"}


@app.post("/streams/test", dependencies=[Depends(require_service_token)])
def test_stream(payload: StreamRequest) -> dict:
    if not payload.rtspUrl:
        return {"success": False, "message": "rtspUrl é obrigatório"}
    return stream_manager.test(payload.cameraId, payload.rtspUrl)


@app.post("/streams/start", dependencies=[Depends(require_service_token)])
def start_stream(payload: StreamRequest) -> dict:
    if not payload.rtspUrl:
        return {"success": False, "message": "rtspUrl é obrigatório"}
    return stream_manager.start(payload.cameraId, payload.rtspUrl)


@app.post("/streams/stop", dependencies=[Depends(require_service_token)])
def stop_stream(payload: StopRequest) -> dict:
    return stream_manager.stop(payload.cameraId)
