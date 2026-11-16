"""Gerenciador de streams RTSP (1+ câmeras) com reconexão e heartbeat."""

from __future__ import annotations

import logging
import threading
import time
from dataclasses import dataclass, field
from typing import Dict

import cv2
import requests

from app.config import (
    BACKEND_BASE_URL,
    HEARTBEAT_SECONDS,
    OPEN_TIMEOUT_SECONDS,
    RECONNECT_DELAY_SECONDS,
    SERVICE_TOKEN,
)
from app.rtsp.connection import mask_rtsp_url, probe_rtsp

logger = logging.getLogger("smartguard.rtsp")


@dataclass
class StreamHandle:
    camera_id: int
    rtsp_url: str
    stop_event: threading.Event = field(default_factory=threading.Event)
    thread: threading.Thread | None = None


class StreamManager:
    def __init__(self) -> None:
        self._streams: Dict[int, StreamHandle] = {}
        self._lock = threading.Lock()

    def test(self, camera_id: int, rtsp_url: str) -> dict:
        logger.info("Testando RTSP camera_id=%s url=%s", camera_id, mask_rtsp_url(rtsp_url))
        result = probe_rtsp(rtsp_url, OPEN_TIMEOUT_SECONDS)
        return {"success": result.success, "message": result.message}

    def start(self, camera_id: int, rtsp_url: str) -> dict:
        with self._lock:
            existing = self._streams.get(camera_id)
            if existing and existing.thread and existing.thread.is_alive():
                return {"success": True, "message": "Stream já estava em execução"}

            handle = StreamHandle(camera_id=camera_id, rtsp_url=rtsp_url)
            thread = threading.Thread(
                target=self._run_loop,
                args=(handle,),
                name=f"rtsp-camera-{camera_id}",
                daemon=True,
            )
            handle.thread = thread
            self._streams[camera_id] = handle
            thread.start()

        logger.info("Stream iniciado camera_id=%s url=%s", camera_id, mask_rtsp_url(rtsp_url))
        return {"success": True, "message": "Stream iniciado"}

    def stop(self, camera_id: int) -> dict:
        with self._lock:
            handle = self._streams.pop(camera_id, None)

        if not handle:
            self._heartbeat(camera_id, "STOPPED", None)
            return {"success": True, "message": "Nenhum stream ativo"}

        handle.stop_event.set()
        if handle.thread:
            handle.thread.join(timeout=5)
        self._heartbeat(camera_id, "STOPPED", None)
        logger.info("Stream parado camera_id=%s", camera_id)
        return {"success": True, "message": "Stream interrompido"}

    def _run_loop(self, handle: StreamHandle) -> None:
        camera_id = handle.camera_id
        consecutive_failures = 0

        while not handle.stop_event.is_set():
            capture = None
            try:
                self._heartbeat(camera_id, "CONNECTING", None)
                capture = cv2.VideoCapture(handle.rtsp_url, cv2.CAP_FFMPEG)
                if not capture.isOpened():
                    raise RuntimeError("Falha ao abrir RTSP")

                capture.set(cv2.CAP_PROP_BUFFERSIZE, 1)
                self._heartbeat(camera_id, "CONNECTED", None)
                consecutive_failures = 0
                last_heartbeat = 0.0

                while not handle.stop_event.is_set():
                    ok, frame = capture.read()
                    now = time.time()
                    if not ok or frame is None:
                        raise RuntimeError("Perda de frames no RTSP")

                    if now - last_heartbeat >= HEARTBEAT_SECONDS:
                        self._heartbeat(camera_id, "CONNECTED", None)
                        last_heartbeat = now

                    # Fase A: apenas mantém a conexão viva.
                    time.sleep(0.01)

            except Exception as exc:  # noqa: BLE001
                consecutive_failures += 1
                message = str(exc)
                logger.warning(
                    "Stream camera_id=%s falhou (%s). Tentativa=%s",
                    camera_id,
                    message,
                    consecutive_failures,
                )
                self._heartbeat(
                    camera_id,
                    "RECONNECTING" if consecutive_failures < 5 else "ERROR",
                    message,
                )
                if handle.stop_event.wait(RECONNECT_DELAY_SECONDS):
                    break
            finally:
                if capture is not None:
                    capture.release()

        self._heartbeat(camera_id, "STOPPED", None)

    def _heartbeat(self, camera_id: int, stream_state: str, last_error: str | None) -> None:
        try:
            requests.post(
                f"{BACKEND_BASE_URL.rstrip('/')}/internal/cameras/{camera_id}/heartbeat",
                json={"streamState": stream_state, "lastError": last_error},
                headers={"X-Service-Token": SERVICE_TOKEN},
                timeout=5,
            )
        except requests.RequestException as exc:
            logger.warning("Falha ao enviar heartbeat camera_id=%s: %s", camera_id, exc)


stream_manager = StreamManager()
