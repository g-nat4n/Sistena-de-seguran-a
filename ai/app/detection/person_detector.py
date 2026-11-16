"""Detecção anônima de pessoas.

Prioridade: YOLO (ultralytics). Fallback: HOG do OpenCV.
Nunca faz reconhecimento facial nem identifica identidade.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass

import cv2
import numpy as np

logger = logging.getLogger("smartguard.detection")


@dataclass
class PersonDetection:
    x1: int
    y1: int
    x2: int
    y2: int
    confidence: float

    @property
    def centroid(self) -> tuple[float, float]:
        return ((self.x1 + self.x2) / 2.0, (self.y1 + self.y2) / 2.0)

    @property
    def area(self) -> int:
        return max(0, self.x2 - self.x1) * max(0, self.y2 - self.y1)


class PersonDetector:
    def __init__(self, confidence: float = 0.45, model_name: str = "yolov8n.pt") -> None:
        self.confidence = confidence
        self.backend = "none"
        self._yolo = None
        self._hog = None

        try:
            from ultralytics import YOLO  # type: ignore

            self._yolo = YOLO(model_name)
            self.backend = "yolo"
            logger.info("Detector de pessoas: YOLO (%s)", model_name)
        except Exception as exc:  # noqa: BLE001
            logger.warning("YOLO indisponível (%s). Usando fallback HOG OpenCV.", exc)
            self._hog = cv2.HOGDescriptor()
            self._hog.setSVMDetector(cv2.HOGDescriptor_getDefaultPeopleDetector())
            self.backend = "hog"

    def detect(self, frame: np.ndarray) -> list[PersonDetection]:
        if self.backend == "yolo" and self._yolo is not None:
            return self._detect_yolo(frame)
        if self.backend == "hog" and self._hog is not None:
            return self._detect_hog(frame)
        return []

    def _detect_yolo(self, frame: np.ndarray) -> list[PersonDetection]:
        assert self._yolo is not None
        results = self._yolo.predict(frame, conf=self.confidence, verbose=False, classes=[0])
        detections: list[PersonDetection] = []
        if not results:
            return detections

        boxes = results[0].boxes
        if boxes is None:
            return detections

        for box in boxes:
            xyxy = box.xyxy[0].tolist()
            conf = float(box.conf[0].item()) if box.conf is not None else 0.0
            detections.append(
                PersonDetection(
                    x1=int(xyxy[0]),
                    y1=int(xyxy[1]),
                    x2=int(xyxy[2]),
                    y2=int(xyxy[3]),
                    confidence=conf,
                )
            )
        return detections

    def _detect_hog(self, frame: np.ndarray) -> list[PersonDetection]:
        assert self._hog is not None
        resized = frame
        scale = 1.0
        if frame.shape[1] > 960:
            scale = 960 / frame.shape[1]
            resized = cv2.resize(frame, (0, 0), fx=scale, fy=scale)

        rects, weights = self._hog.detectMultiScale(
            resized,
            winStride=(8, 8),
            padding=(8, 8),
            scale=1.05,
        )
        detections: list[PersonDetection] = []
        for (x, y, w, h), weight in zip(rects, weights):
            conf = float(min(0.99, max(0.35, weight / 2.0)))
            if conf < self.confidence:
                continue
            detections.append(
                PersonDetection(
                    x1=int(x / scale),
                    y1=int(y / scale),
                    x2=int((x + w) / scale),
                    y2=int((y + h) / scale),
                    confidence=conf,
                )
            )
        return detections
