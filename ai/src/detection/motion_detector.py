"""Protótipo de detecção de movimento com OpenCV.

Não faz reconhecimento facial nem identifica pessoas.
Usa subtração de fundo / diferença de frames para sinalizar movimento anônimo.
"""

from __future__ import annotations

from dataclasses import dataclass

import cv2
import numpy as np


@dataclass
class MotionResult:
    score: float
    suspicious: bool
    frame_shape: tuple[int, int]


class MotionDetector:
    def __init__(self, history: int = 30, var_threshold: int = 25, suspicious_ratio: float = 0.03):
        self.suspicious_ratio = suspicious_ratio
        self.subtractor = cv2.createBackgroundSubtractorMOG2(
            history=history,
            varThreshold=var_threshold,
            detectShadows=False,
        )

    def analyze(self, frame: np.ndarray) -> MotionResult:
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        gray = cv2.GaussianBlur(gray, (5, 5), 0)
        mask = self.subtractor.apply(gray)
        _, mask = cv2.threshold(mask, 200, 255, cv2.THRESH_BINARY)
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))

        changed = cv2.countNonZero(mask)
        total = mask.shape[0] * mask.shape[1]
        score = 0.0 if total == 0 else changed / float(total)

        return MotionResult(
            score=score,
            suspicious=score >= self.suspicious_ratio,
            frame_shape=(mask.shape[0], mask.shape[1]),
        )
