"""Tracker simples por centróide (base para ByteTrack futuro)."""

from __future__ import annotations

from dataclasses import dataclass, field
import time

from app.detection.person_detector import PersonDetection


@dataclass
class Track:
    track_id: int
    centroid: tuple[float, float]
    bbox: tuple[int, int, int, int]
    confidence: float
    hits: int = 1
    misses: int = 0
    first_seen: float = field(default_factory=time.time)
    last_seen: float = field(default_factory=time.time)
    dwell_alerted: bool = False

    @property
    def age_seconds(self) -> float:
        return time.time() - self.first_seen


class CentroidTracker:
    def __init__(self, max_distance: float = 120.0, max_misses: int = 20) -> None:
        self.max_distance = max_distance
        self.max_misses = max_misses
        self._next_id = 1
        self.tracks: dict[int, Track] = {}

    def update(self, detections: list[PersonDetection]) -> list[Track]:
        now = time.time()
        if not self.tracks:
            for detection in detections:
                self._register(detection, now)
            return list(self.tracks.values())

        track_ids = list(self.tracks.keys())
        unused_tracks = set(track_ids)
        unused_detections = set(range(len(detections)))

        pairs: list[tuple[float, int, int]] = []
        for track_id in track_ids:
            tx, ty = self.tracks[track_id].centroid
            for idx, detection in enumerate(detections):
                dx, dy = detection.centroid
                distance = ((tx - dx) ** 2 + (ty - dy) ** 2) ** 0.5
                pairs.append((distance, track_id, idx))

        pairs.sort(key=lambda item: item[0])
        for distance, track_id, det_idx in pairs:
            if distance > self.max_distance:
                break
            if track_id not in unused_tracks or det_idx not in unused_detections:
                continue
            detection = detections[det_idx]
            track = self.tracks[track_id]
            track.centroid = detection.centroid
            track.bbox = (detection.x1, detection.y1, detection.x2, detection.y2)
            track.confidence = detection.confidence
            track.hits += 1
            track.misses = 0
            track.last_seen = now
            unused_tracks.discard(track_id)
            unused_detections.discard(det_idx)

        for det_idx in unused_detections:
            self._register(detections[det_idx], now)

        for track_id in list(unused_tracks):
            track = self.tracks[track_id]
            track.misses += 1
            if track.misses > self.max_misses:
                del self.tracks[track_id]

        return list(self.tracks.values())

    def _register(self, detection: PersonDetection, now: float) -> None:
        track_id = self._next_id
        self._next_id += 1
        self.tracks[track_id] = Track(
            track_id=track_id,
            centroid=detection.centroid,
            bbox=(detection.x1, detection.y1, detection.x2, detection.y2),
            confidence=detection.confidence,
            first_seen=now,
            last_seen=now,
        )
