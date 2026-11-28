"""Gerenciador de streams RTSP com reconexão, heartbeat e detecção (Fase B/C)."""

from __future__ import annotations

import logging
import threading
import time
from dataclasses import dataclass, field
from typing import Dict

import cv2
import numpy as np
import requests

from app.config import (
    BACKEND_BASE_URL,
    DETECTION_ENABLED,
    DETECTION_EVERY_N_FRAMES,
    EVIDENCE_CLIP_FPS,
    EVIDENCE_CLIP_SECONDS,
    HEARTBEAT_SECONDS,
    OPEN_TIMEOUT_SECONDS,
    RECONNECT_DELAY_SECONDS,
    SERVICE_TOKEN,
    YOLO_CONFIDENCE,
    YOLO_MODEL,
    YOLO_POSE_MODEL,
)
from app.detection.frame_buffer import FrameRingBuffer
from app.rtsp.connection import mask_rtsp_url, open_rtsp_capture, probe_rtsp

logger = logging.getLogger("smartguard.rtsp")


@dataclass
class StreamHandle:
    camera_id: int
    camera_identifier: str
    rtsp_url: str
    preferred_transport: str | None = None
    stop_event: threading.Event = field(default_factory=threading.Event)
    thread: threading.Thread | None = None


class StreamManager:
    def __init__(self) -> None:
        self._streams: Dict[int, StreamHandle] = {}
        self._lock = threading.Lock()
        self._latest_jpeg: Dict[int, bytes] = {}
        self._jpeg_lock = threading.Lock()
        self._detector = None
        self._detector_cls = None
        self._event_engine = None
        self._tracker_cls = None

    def get_snapshot_jpeg(self, camera_id: int) -> bytes | None:
        with self._jpeg_lock:
            data = self._latest_jpeg.get(camera_id)
            return data if data else None

    def _store_preview_frame(self, camera_id: int, frame: np.ndarray) -> None:
        try:
            # Preview leve (~2–5 FPS efetivo no UI): JPEG baixo
            h, w = frame.shape[:2]
            max_w = 960
            if w > max_w:
                scale = max_w / float(w)
                frame = cv2.resize(frame, (int(w * scale), int(h * scale)))
            ok, encoded = cv2.imencode(".jpg", frame, [int(cv2.IMWRITE_JPEG_QUALITY), 55])
            if not ok:
                return
            with self._jpeg_lock:
                self._latest_jpeg[camera_id] = encoded.tobytes()
        except Exception as exc:  # noqa: BLE001
            logger.debug("Falha ao gerar preview camera_id=%s: %s", camera_id, exc)

    def _ensure_detection(self) -> None:
        if self._event_engine is not None:
            return
        from app.detection.centroid_tracker import CentroidTracker
        from app.detection.event_engine import EventEngine
        from app.detection.pose_detector import PosePersonDetector

        self._tracker_cls = CentroidTracker
        self._event_engine = EventEngine()
        self._detector_cls = PosePersonDetector

    def _get_detector(self):
        self._ensure_detection()
        if self._detector is None:
            self._detector = self._detector_cls(
                confidence=YOLO_CONFIDENCE,
                pose_model=YOLO_POSE_MODEL,
                box_model=YOLO_MODEL,
            )
        return self._detector

    def test(self, camera_id: int, rtsp_url: str, camera_identifier: str = "") -> dict:
        logger.info(
            "Testando RTSP camera_id=%s identifier=%s url=%s",
            camera_id,
            camera_identifier or "-",
            mask_rtsp_url(rtsp_url),
        )
        result = probe_rtsp(rtsp_url, OPEN_TIMEOUT_SECONDS)
        return {"success": result.success, "message": result.message}

    def start(self, camera_id: int, rtsp_url: str, camera_identifier: str) -> dict:
        # Valida conexão antes de marcar stream como iniciado (evita "sucesso fantasma")
        probe = probe_rtsp(rtsp_url, OPEN_TIMEOUT_SECONDS)
        if not probe.success:
            logger.warning(
                "Start recusado camera_id=%s url=%s motivo=%s",
                camera_id,
                mask_rtsp_url(rtsp_url),
                probe.message,
            )
            return {"success": False, "message": probe.message}

        with self._lock:
            existing = self._streams.get(camera_id)
            if existing and existing.thread and existing.thread.is_alive():
                existing.rtsp_url = rtsp_url
                existing.preferred_transport = probe.transport
                return {
                    "success": True,
                    "message": "Stream já estava em execução (URL atualizada se necessário)",
                }

            handle = StreamHandle(
                camera_id=camera_id,
                camera_identifier=camera_identifier,
                rtsp_url=rtsp_url,
                preferred_transport=probe.transport,
            )
            thread = threading.Thread(
                target=self._run_loop,
                args=(handle,),
                name=f"rtsp-camera-{camera_id}",
                daemon=True,
            )
            handle.thread = thread
            self._streams[camera_id] = handle
            thread.start()

        logger.info(
            "Stream iniciado camera_id=%s identifier=%s url=%s transport=%s detection=%s",
            camera_id,
            camera_identifier,
            mask_rtsp_url(rtsp_url),
            probe.transport or "?",
            DETECTION_ENABLED,
        )
        suffix = f" via {probe.transport.upper()}" if probe.transport else ""
        base = "Stream iniciado com detecção" if DETECTION_ENABLED else "Stream iniciado"
        return {"success": True, "message": f"{base}{suffix}"}

    def stop(self, camera_id: int) -> dict:
        with self._lock:
            handle = self._streams.pop(camera_id, None)

        if not handle:
            self._heartbeat(camera_id, "STOPPED", None)
            return {"success": True, "message": "Nenhum stream ativo"}

        handle.stop_event.set()
        if handle.thread:
            handle.thread.join(timeout=5)
        with self._jpeg_lock:
            self._latest_jpeg.pop(camera_id, None)
        self._heartbeat(camera_id, "STOPPED", None)
        logger.info("Stream parado camera_id=%s", camera_id)
        return {"success": True, "message": "Stream interrompido"}

    def _run_loop(self, handle: StreamHandle) -> None:
        camera_id = handle.camera_id
        consecutive_failures = 0
        tracker = None
        clip_buffer = FrameRingBuffer(
            max_frames=max(8, int(EVIDENCE_CLIP_SECONDS * EVIDENCE_CLIP_FPS))
        )
        if DETECTION_ENABLED:
            self._ensure_detection()
            tracker = self._tracker_cls()
        frame_index = 0
        last_buffer_push = 0.0
        buffer_interval = 1.0 / max(1.0, EVIDENCE_CLIP_FPS)

        while not handle.stop_event.is_set():
            capture = None
            try:
                self._heartbeat(camera_id, "CONNECTING", None)
                capture, transport, open_error = open_rtsp_capture(
                    handle.rtsp_url,
                    OPEN_TIMEOUT_SECONDS,
                    preferred_transport=handle.preferred_transport,
                )
                if capture is None:
                    raise RuntimeError(open_error or "Falha ao abrir RTSP")

                if transport:
                    handle.preferred_transport = transport
                self._heartbeat(camera_id, "CONNECTED", None)
                consecutive_failures = 0
                last_heartbeat = 0.0
                blank_reads = 0

                while not handle.stop_event.is_set():
                    ok, frame = capture.read()
                    now = time.time()
                    if not ok or frame is None:
                        blank_reads += 1
                        if blank_reads >= 8:
                            raise RuntimeError("Perda de frames no RTSP")
                        time.sleep(0.05)
                        continue
                    blank_reads = 0

                    if now - last_heartbeat >= HEARTBEAT_SECONDS:
                        self._heartbeat(camera_id, "CONNECTED", None)
                        last_heartbeat = now

                    if DETECTION_ENABLED and now - last_buffer_push >= buffer_interval:
                        clip_buffer.push(frame)
                        last_buffer_push = now

                    frame_index += 1
                    # Preview a cada ~3 frames
                    if frame_index % 3 == 0:
                        self._store_preview_frame(camera_id, frame)

                    if DETECTION_ENABLED and tracker is not None and frame_index % DETECTION_EVERY_N_FRAMES == 0:
                        try:
                            detections = self._get_detector().detect(frame)
                            tracks = tracker.update(detections)
                            if tracks:
                                self._event_engine.evaluate(
                                    camera_id=handle.camera_id,
                                    camera_identifier=handle.camera_identifier,
                                    frame=frame,
                                    tracks=tracks,
                                    recent_frames=clip_buffer.snapshot(),
                                )
                        except Exception as det_exc:  # noqa: BLE001
                            # Não derruba o RTSP se a detecção falhar (YOLO/HOG ausente)
                            logger.warning(
                                "Detecção falhou camera_id=%s: %s",
                                camera_id,
                                det_exc,
                            )

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
                    "RECONNECTING" if consecutive_failures < 8 else "ERROR",
                    message,
                )
                # Backoff: 3s, 4.5s, 6.7s… até 20s — continua tentando indefinidamente
                delay = min(20.0, RECONNECT_DELAY_SECONDS * (1.5 ** min(consecutive_failures - 1, 6)))
                if handle.stop_event.wait(delay):
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
