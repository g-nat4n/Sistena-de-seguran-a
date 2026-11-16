"""Regras comportamentais anônimas com filtro de qualidade.

Não classifica criminosos. Gera alertas para revisão humana.
"""

from __future__ import annotations

import logging
import time
from dataclasses import dataclass

import cv2
import numpy as np
import requests

from app.config import (
    ALERT_COOLDOWN_SECONDS,
    BACKEND_BASE_URL,
    MIN_ALERT_CONFIDENCE,
    PERSON_ALERT_ENABLED,
    SERVICE_TOKEN,
)
from app.detection.behavior_analyzer import BehaviorAnalyzer
from app.detection.centroid_tracker import Track
from app.detection.evidence_store import EvidenceStore
from app.detection.pose_detector import PoseDetection, draw_pose

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
        self.behavior = BehaviorAnalyzer()
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

        # Prioriza comportamentos (loitering/ocultação). Presença simples é opcional.
        signals = [
            signal
            for signal in self.behavior.analyze(tracks)
            if signal.confidence >= MIN_ALERT_CONFIDENCE
        ]
        signals.sort(key=lambda item: item.confidence, reverse=True)

        for signal in signals:
            if not self._can_emit(camera_id, signal.alert_type):
                continue
            event = DetectionEvent(
                alert_type=signal.alert_type,
                priority=signal.priority,
                description=signal.description[:500],
                confidence=signal.confidence,
            )
            public_id = self._ingest(camera_id, camera_identifier, frame, event, signal.track)
            if public_id:
                created.append(public_id)
                self._mark(camera_id, signal.alert_type)

        if PERSON_ALERT_ENABLED and self._can_emit(camera_id, "SUSPICIOUS_MOVEMENT"):
            stable = [t for t in tracks if t.hits >= 12 and t.confidence >= 0.65]
            if stable:
                best = max(stable, key=lambda item: item.confidence)
                if not best.movement_alerted and best.confidence >= MIN_ALERT_CONFIDENCE:
                    event = DetectionEvent(
                        alert_type="SUSPICIOUS_MOVEMENT",
                        priority="LOW",
                        description=(
                            f"Presença estável anônima (track #{best.track_id}, "
                            f"conf={best.confidence:.2f}, hits={best.hits}). "
                            "Alerta auxiliar — revisar se necessário."
                        ),
                        confidence=best.confidence,
                    )
                    public_id = self._ingest(camera_id, camera_identifier, frame, event, best)
                    if public_id:
                        best.movement_alerted = True
                        created.append(public_id)
                        self._mark(camera_id, "SUSPICIOUS_MOVEMENT")

        return created

    def _can_emit(self, camera_id: int, alert_type: str) -> bool:
        key = (camera_id, alert_type)
        last = self._last_alert_at.get(key, 0.0)
        cooldown = ALERT_COOLDOWN_SECONDS
        if alert_type == "SUSPICIOUS_MOVEMENT":
            cooldown = max(cooldown, 180.0)
        if alert_type == "POSSIBLE_CONCEALMENT":
            cooldown = max(cooldown, 90.0)
        return time.time() - last >= cooldown

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
        pose = PoseDetection(
            x1=track.bbox[0],
            y1=track.bbox[1],
            x2=track.bbox[2],
            y2=track.bbox[3],
            confidence=track.confidence,
            keypoints=list(track.keypoints),
        )
        color = (0, 90, 255) if event.alert_type == "POSSIBLE_CONCEALMENT" else (0, 180, 255)
        draw_pose(annotated, pose, color=color)
        cv2.putText(
            annotated,
            f"anon #{track.track_id} {event.alert_type} {event.confidence:.2f}",
            (track.bbox[0], max(20, track.bbox[1] - 8)),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.5,
            color,
            2,
        )
        evidence_url = self.evidence.save_frame(camera_id, annotated, event.alert_type.lower())

        payload = {
            "cameraIdentifier": camera_identifier,
            "alertType": event.alert_type,
            "priority": event.priority,
            "description": event.description[:500],
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
            logger.info(
                "Alerta ingerido camera_id=%s publicId=%s type=%s conf=%.2f",
                camera_id,
                public_id,
                event.alert_type,
                event.confidence,
            )
            return public_id
        except requests.RequestException as exc:
            logger.warning("Falha ao ingerir detecção camera_id=%s: %s", camera_id, exc)
            return None
