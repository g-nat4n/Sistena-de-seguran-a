"""Persistência local de snapshots e clips de evidência."""

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

    def save_clip(
        self,
        camera_id: int,
        frames: list[np.ndarray],
        suffix: str = "clip",
        fps: float = 5.0,
    ) -> str | None:
        if len(frames) < 3:
            return None

        stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%f")
        filename = f"cam{camera_id}_{suffix}_{stamp}.mp4"
        path = self.root / filename
        height, width = frames[0].shape[:2]
        if height < 2 or width < 2:
            return None

        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        writer = cv2.VideoWriter(str(path), fourcc, max(1.0, fps), (width, height))
        if not writer.isOpened():
            return None

        try:
            for frame in frames:
                if frame is None or frame.size == 0:
                    continue
                if frame.shape[0] != height or frame.shape[1] != width:
                    frame = cv2.resize(frame, (width, height))
                writer.write(frame)
        finally:
            writer.release()

        if not path.exists() or path.stat().st_size < 512:
            try:
                path.unlink(missing_ok=True)
            except OSError:
                pass
            return None

        return f"{PUBLIC_BASE_URL.rstrip('/')}/evidence/{filename}"
