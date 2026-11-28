"""Persistência local de snapshots e clips de evidência (compatível com o app)."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from pathlib import Path

import cv2
import numpy as np

from app.config import EVIDENCE_DIR, PUBLIC_BASE_URL

logger = logging.getLogger("smartguard.evidence")


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

        # Normaliza frames (BGR -> RGB) e tamanho
        rgb_frames: list[np.ndarray] = []
        for frame in frames:
            if frame is None or frame.size == 0:
                continue
            if frame.shape[0] != height or frame.shape[1] != width:
                frame = cv2.resize(frame, (width, height))
            rgb_frames.append(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))

        if len(rgb_frames) < 3:
            return None

        # H.264 via ffmpeg (abre no Electron/Chrome). Fallback OpenCV mp4v.
        if self._write_h264(path, rgb_frames, fps):
            return f"{PUBLIC_BASE_URL.rstrip('/')}/evidence/{filename}"

        if self._write_opencv_mp4v(path, frames, width, height, fps):
            return f"{PUBLIC_BASE_URL.rstrip('/')}/evidence/{filename}"

        logger.warning("Não foi possível gravar clip de evidência camera_id=%s", camera_id)
        return None

    def _write_h264(self, path: Path, rgb_frames: list[np.ndarray], fps: float) -> bool:
        try:
            import imageio.v2 as imageio

            writer = imageio.get_writer(
                str(path),
                fps=max(1.0, fps),
                codec="libx264",
                quality=7,
                pixelformat="yuv420p",
                macro_block_size=1,
            )
            try:
                for frame in rgb_frames:
                    writer.append_data(frame)
            finally:
                writer.close()

            if path.exists() and path.stat().st_size >= 1024:
                return True
            path.unlink(missing_ok=True)
            return False
        except Exception as exc:  # noqa: BLE001
            logger.warning("Falha ao gravar H.264 (%s). Tentando fallback.", exc)
            try:
                path.unlink(missing_ok=True)
            except OSError:
                pass
            return False

    def _write_opencv_mp4v(
        self,
        path: Path,
        frames: list[np.ndarray],
        width: int,
        height: int,
        fps: float,
    ) -> bool:
        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        writer = cv2.VideoWriter(str(path), fourcc, max(1.0, fps), (width, height))
        if not writer.isOpened():
            return False
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
            return False
        return True
