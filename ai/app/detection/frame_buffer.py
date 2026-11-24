"""Ring buffer de frames para clip de evidência (~últimos N segundos)."""

from __future__ import annotations

from collections import deque

import numpy as np


class FrameRingBuffer:
    def __init__(self, max_frames: int = 40) -> None:
        self._frames: deque[np.ndarray] = deque(maxlen=max(2, max_frames))

    def push(self, frame: np.ndarray) -> None:
        # Cópia rasa suficiente: OpenCV devolve array novo a cada read, mas
        # garantimos independência do buffer do capture.
        self._frames.append(frame.copy())

    def snapshot(self) -> list[np.ndarray]:
        return list(self._frames)

    def clear(self) -> None:
        self._frames.clear()

    def __len__(self) -> int:
        return len(self._frames)
