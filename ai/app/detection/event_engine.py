"""Regras comportamentais anônimas a partir de tracks.

Não classifica criminosos. Gera alertas para revisão humana.
"""

from __future__ import annotations

import logging
import time
from dataclasses import dataclass

import numpy as np
import requests

from app.config import (
    ALERT_COOLDOWN_SECONDS,
    BACKEND_BASE_URL,
    DWELL_SECONDS,
    SERVICE_TOKEN,
)
from app.detection.centroid_tracker import Track
from app.detection.evidence_store import EvidenceStore

logger = logging.getLogger("smartguard.events")


@dataclass
class DetectionEvent:
    alert_type: str
    priority: str
    description: str
    confidence: float


class EventEngine:
    def __init__(self) -> None:
        self.evidence = EvidenceStore()
        self._last_alert_at: dict[tuple[int, str], float] = {}

    def evaluate(
        self,
        camera_id: int,
        camera_identifier: str,
        frame: np.ndarray,
        tracks: list[Track],
    ) -> list[str]:
        created: list[str] = []
        if not tracks:
            return created

        best = max(tracks, key=lambda item: item.confidence)
        if self._can_emit(camera_id, "SUSPICIOUS_MOVEMENT"):
            event = DetectionEvent(
                alert_type="SUSPICIOUS_MOVEMENT",
                priority="MEDIUM",
                description=(
                    f"Detecção anônima de pessoa no stream RTSP "
                    f"(tracks ativos={len(tracks)}, confiança={best.confidence:.2f}). "
                    "Sem reconhecimento facial. Requer revisão humana."
                ),
                confidence=best.confidence,
            )
            public_id = self._ingest(camera_id, camera_identifier, frame, event, best)
            if public_id:
                created.append(public_id)
                self._mark(camera_id, "SUSPICIOUS_MOVEMENT")

        for track in tracks:
            if track.age_seconds < DWELL_SECONDS or track.dwell_alerted:
                continue
            if not self._can_emit(camera_id, "UNUSUAL_DWELL"):
                break
            event = DetectionEvent(
                alert_type="UNUSUAL_DWELL",
                priority="MEDIUM",
                description=(
                    f"Permanência anônima incomum detectada (track #{track.track_id}, "
                    f"{track.age_seconds:.0f}s). Sem identificação de pessoa. Revisão humana necessária."
                ),
                confidence=track.confidence,
            )
            public_id = self._ingest(camera_id, camera_identifier, frame, event, track)
            if public_id:
                track.dwell_alerted = True
                created.append(public_id)
                self._mark(camera_id, "UNUSUAL_DWELL")

        return created

    def _can_emit(self, camera_id: int, alert_type: str) -> bool:
        key = (camera_id, alert_type)
        last = self._last_alert_at.get(key, 0.0)
        return time.time() - last >= ALERT_COOLDOWN_SECONDS

    def _mark(self, camera_id: int, alert_type: str) -> None:
        self._last_alert_at[(camera_id, alert_type)] = time.time()

    def _ingest(
        self,
        camera_id: int,
        camera_identifier: str,
        frame: np.ndarray,
        event: DetectionEvent,
        track: Track,
    ) -> str | None:
        annotated = frame.copy()
        x1, y1, x2, y2 = track.bbox
        import cv2

        cv2.rectangle(annotated, (x1, y1), (x2, y2), (0, 180, 255), 2)
        cv2.putText(
            annotated,
            f"anon #{track.track_id}",
            (x1, max(20, y1 - 8)),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (0, 180, 255),
            2,
        )
        evidence_url = self.evidence.save_frame(camera_id, annotated, event.alert_type.lower())

        payload = {
            "cameraIdentifier": camera_identifier,
            "alertType": event.alert_type,
            "priority": event.priority,
            "description": event.description,
            "confidence": round(event.confidence, 2),
            "simulated": False,
            "evidenceUrl": evidence_url,
        }
        try:
            response = requests.post(
                f"{BACKEND_BASE_URL.rstrip('/')}/internal/detections/ingest",
                json=payload,
                headers={"X-Service-Token": SERVICE_TOKEN},
                timeout=10,
            )
            response.raise_for_status()
            public_id = response.json().get("publicId")
            logger.info("Alerta ingerido camera_id=%s publicId=%s type=%s", camera_id, public_id, event.alert_type)
            return public_id
        except requests.RequestException as exc:
            logger.warning("Falha ao ingerir detecção camera_id=%s: %s", camera_id, exc)
            return None
