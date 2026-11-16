"""Detecção de pessoa + pose (esqueleto) para análise comportamental.

Usa YOLOv8-Pose quando disponível. Fallback: detector de pessoa sem keypoints.
Nunca faz reconhecimento facial.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field

import cv2
import numpy as np

from app.detection.person_detector import PersonDetection, PersonDetector

logger = logging.getLogger("smartguard.pose")

# COCO-17
NOSE, L_SHOULDER, R_SHOULDER = 0, 5, 6
L_ELBOW, R_ELBOW, L_WRIST, R_WRIST = 7, 8, 9, 10
L_HIP, R_HIP = 11, 12


@dataclass
class PoseDetection(PersonDetection):
    """Pessoa com keypoints opcionais (x, y, conf)."""

    keypoints: list[tuple[float, float, float]] = field(default_factory=list)

    def keypoint(self, index: int, min_conf: float = 0.35) -> tuple[float, float] | None:
        if index < 0 or index >= len(self.keypoints):
            return None
        x, y, conf = self.keypoints[index]
        if conf < min_conf:
            return None
        return x, y


class PosePersonDetector:
    def __init__(
        self,
        confidence: float = 0.45,
        pose_model: str = "yolov8n-pose.pt",
        box_model: str = "yolov8n.pt",
    ) -> None:
        self.confidence = confidence
        self.backend = "none"
        self._pose = None
        self._fallback = PersonDetector(confidence=confidence, model_name=box_model)

        try:
            from ultralytics import YOLO  # type: ignore

            self._pose = YOLO(pose_model)
            self.backend = "yolo-pose"
            logger.info("Detector comportamental: YOLO-Pose (%s)", pose_model)
        except Exception as exc:  # noqa: BLE001
            logger.warning(
                "YOLO-Pose indisponível (%s). Usando detector de pessoa sem pose.",
                exc,
            )
            self.backend = self._fallback.backend

    def detect(self, frame: np.ndarray) -> list[PoseDetection]:
        if self.backend == "yolo-pose" and self._pose is not None:
            return self._detect_pose(frame)

        # Fallback sem keypoints
        people = self._fallback.detect(frame)
        return [
            PoseDetection(
                x1=p.x1,
                y1=p.y1,
                x2=p.x2,
                y2=p.y2,
                confidence=p.confidence,
                keypoints=[],
            )
            for p in people
        ]

    def _detect_pose(self, frame: np.ndarray) -> list[PoseDetection]:
        assert self._pose is not None
        results = self._pose.predict(frame, conf=self.confidence, verbose=False)
        detections: list[PoseDetection] = []
        if not results:
            return detections

        result = results[0]
        boxes = result.boxes
        keypoints = result.keypoints
        if boxes is None:
            return detections

        for idx, box in enumerate(boxes):
            xyxy = box.xyxy[0].tolist()
            conf = float(box.conf[0].item()) if box.conf is not None else 0.0
            kps: list[tuple[float, float, float]] = []
            if keypoints is not None and idx < len(keypoints):
                # xy: (17, 2), conf: (17,) ou embutido
                person_kps = keypoints[idx]
                xy = person_kps.xy[0].tolist() if person_kps.xy is not None else []
                confs = []
                if person_kps.conf is not None:
                    confs = person_kps.conf[0].tolist()
                for i, point in enumerate(xy):
                    c = float(confs[i]) if i < len(confs) else 0.5
                    kps.append((float(point[0]), float(point[1]), c))

            detections.append(
                PoseDetection(
                    x1=int(xyxy[0]),
                    y1=int(xyxy[1]),
                    x2=int(xyxy[2]),
                    y2=int(xyxy[3]),
                    confidence=conf,
                    keypoints=kps,
                )
            )
        return detections


def draw_pose(frame: np.ndarray, detection: PoseDetection, color=(0, 180, 255)) -> None:
    """Desenha bbox + esqueleto anônimo (sem face destacada)."""
    cv2.rectangle(frame, (detection.x1, detection.y1), (detection.x2, detection.y2), color, 2)
    if len(detection.keypoints) < 13:
        return

    skeleton = [
        (L_SHOULDER, R_SHOULDER),
        (L_SHOULDER, L_ELBOW),
        (L_ELBOW, L_WRIST),
        (R_SHOULDER, R_ELBOW),
        (R_ELBOW, R_WRIST),
        (L_SHOULDER, L_HIP),
        (R_SHOULDER, R_HIP),
        (L_HIP, R_HIP),
    ]
    for a, b in skeleton:
        pa = detection.keypoint(a, min_conf=0.3)
        pb = detection.keypoint(b, min_conf=0.3)
        if pa and pb:
            cv2.line(frame, (int(pa[0]), int(pa[1])), (int(pb[0]), int(pb[1])), color, 2)

    for i in (L_WRIST, R_WRIST, L_HIP, R_HIP, L_SHOULDER, R_SHOULDER):
        point = detection.keypoint(i, min_conf=0.3)
        if point:
            cv2.circle(frame, (int(point[0]), int(point[1])), 3, (40, 220, 120), -1)
