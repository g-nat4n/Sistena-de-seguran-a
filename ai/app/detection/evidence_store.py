"""Persistência local de snapshots de evidência."""

from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path

import cv2
import numpy as np

from app.config import EVIDENCE_DIR, PUBLIC_BASE_URL


class EvidenceStore:
    def __init__(self) -> None:
        self.root = Path(EVIDENCE_DIR)
        self.root.mkdir(parents=True, exist_ok=True)

    def save_frame(self, camera_id: int, frame: np.ndarray, suffix: str = "det") -> str:
        stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%f")
        filename = f"cam{camera_id}_{suffix}_{stamp}.jpg"
        path = self.root / filename
        cv2.imwrite(str(path), frame, [int(cv2.IMWRITE_JPEG_QUALITY), 85])
        return f"{PUBLIC_BASE_URL.rstrip('/')}/evidence/{filename}"
