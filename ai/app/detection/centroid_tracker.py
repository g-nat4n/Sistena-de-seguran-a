"""Tracker por centróide com histórico para loitering/pose."""

from __future__ import annotations

from collections import deque
from dataclasses import dataclass, field
import math
import time

from app.detection.pose_detector import PoseDetection


@dataclass
class Track:
    track_id: int
    centroid: tuple[float, float]
    bbox: tuple[int, int, int, int]
    confidence: float
    keypoints: list[tuple[float, float, float]] = field(default_factory=list)
    hits: int = 1
    misses: int = 0
    first_seen: float = field(default_factory=time.time)
    last_seen: float = field(default_factory=time.time)
    origin_centroid: tuple[float, float] = field(default=(0.0, 0.0))
    max_displacement_px: float = 0.0
    recent_centroids: deque = field(default_factory=lambda: deque(maxlen=24))
    pose_history: deque = field(default_factory=lambda: deque(maxlen=20))
    dwell_alerted: bool = False
    loitering_alerted: bool = False
    concealment_alerted: bool = False
    concealment_streak: int = 0
    movement_alerted: bool = False

    @property
    def age_seconds(self) -> float:
        return time.time() - self.first_seen

    @property
    def recent_path_px(self) -> float:
        """Deslocamento acumulado recente (quanto a pessoa 'anditou' nos últimos pontos)."""
        points = list(self.recent_centroids)
        if len(points) < 2:
            return 0.0
        total = 0.0
        for i in range(1, len(points)):
            total += math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1])
        return total

    @property
    def avg_confidence(self) -> float:
        return self.confidence


class CentroidTracker:
    def __init__(self, max_distance: float = 100.0, max_misses: int = 15) -> None:
        self.max_distance = max_distance
        self.max_misses = max_misses
        self._next_id = 1
        self.tracks: dict[int, Track] = {}

    def update(self, detections: list[PoseDetection]) -> list[Track]:
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
                distance = math.hypot(tx - dx, ty - dy)
                pairs.append((distance, track_id, idx))

        pairs.sort(key=lambda item: item[0])
        for distance, track_id, det_idx in pairs:
            if distance > self.max_distance:
                break
            if track_id not in unused_tracks or det_idx not in unused_detections:
                continue
            detection = detections[det_idx]
            track = self.tracks[track_id]
            self._apply_detection(track, detection, now)
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

    def _apply_detection(self, track: Track, detection: PoseDetection, now: float) -> None:
        track.centroid = detection.centroid
        track.bbox = (detection.x1, detection.y1, detection.x2, detection.y2)
        track.confidence = detection.confidence
        track.keypoints = list(detection.keypoints)
        track.hits += 1
        track.misses = 0
        track.last_seen = now
        track.recent_centroids.append(detection.centroid)
        displacement = math.hypot(
            detection.centroid[0] - track.origin_centroid[0],
            detection.centroid[1] - track.origin_centroid[1],
        )
        track.max_displacement_px = max(track.max_displacement_px, displacement)
        if detection.keypoints:
            track.pose_history.append(list(detection.keypoints))

    def _register(self, detection: PoseDetection, now: float) -> None:
        track_id = self._next_id
        self._next_id += 1
        track = Track(
            track_id=track_id,
            centroid=detection.centroid,
            bbox=(detection.x1, detection.y1, detection.x2, detection.y2),
            confidence=detection.confidence,
            keypoints=list(detection.keypoints),
            first_seen=now,
            last_seen=now,
            origin_centroid=detection.centroid,
        )
        track.recent_centroids.append(detection.centroid)
        if detection.keypoints:
            track.pose_history.append(list(detection.keypoints))
        self.tracks[track_id] = track
