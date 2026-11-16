"""Análise comportamental anônima com gates de qualidade (menos falso positivo).

NÃO declara furto/crime — apenas sinais para revisão humana.
"""

from __future__ import annotations

import math
from dataclasses import dataclass

from app.config import (
    CONCEALMENT_KEYPOINT_CONF,
    CONCEALMENT_MIN_FRAMES,
    CONCEALMENT_MIN_SCORE,
    CONCEALMENT_WRIST_TO_HIP_RATIO,
    LOITERING_MAX_DISPLACEMENT_PX,
    LOITERING_RECENT_PATH_PX,
    LOITERING_SECONDS,
    MIN_TRACK_HITS,
)
from app.detection.centroid_tracker import Track
from app.detection.pose_detector import (
    L_ELBOW,
    L_HIP,
    L_SHOULDER,
    L_WRIST,
    R_ELBOW,
    R_HIP,
    R_SHOULDER,
    R_WRIST,
)


@dataclass
class BehaviorSignal:
    alert_type: str
    priority: str
    description: str
    confidence: float
    track: Track


def _dist(a: tuple[float, float], b: tuple[float, float]) -> float:
    return math.hypot(a[0] - b[0], a[1] - b[1])


def _angle(a: tuple[float, float], b: tuple[float, float], c: tuple[float, float]) -> float:
    ba = (a[0] - b[0], a[1] - b[1])
    bc = (c[0] - b[0], c[1] - b[1])
    denom = (math.hypot(*ba) * math.hypot(*bc)) or 1e-6
    cos = max(-1.0, min(1.0, (ba[0] * bc[0] + ba[1] * bc[1]) / denom))
    return math.degrees(math.acos(cos))


def _side_concealment(track: Track, shoulder_i: int, elbow_i: int, wrist_i: int, hip_i: int) -> float | None:
    """Score só se houver evidência multi-sinal (proximidade + flexão + trajetória)."""
    if len(track.keypoints) < 13:
        return None

    def kp(index: int) -> tuple[float, float] | None:
        if index >= len(track.keypoints):
            return None
        x, y, conf = track.keypoints[index]
        return (x, y) if conf >= CONCEALMENT_KEYPOINT_CONF else None

    shoulder = kp(shoulder_i)
    elbow = kp(elbow_i)
    wrist = kp(wrist_i)
    hip = kp(hip_i)
    if not all([shoulder, elbow, wrist, hip]):
        return None

    assert shoulder and elbow and wrist and hip
    torso = max(50.0, _dist(shoulder, hip))
    wrist_hip = _dist(wrist, hip) / torso
    if wrist_hip > CONCEALMENT_WRIST_TO_HIP_RATIO:
        return None

    bend = _angle(shoulder, elbow, wrist)
    # Cotovelo claramente flexionado (evita braço solto)
    if bend < 40 or bend > 145:
        return None

    # Mão abaixo da linha do ombro
    if wrist[1] < shoulder[1]:
        return None

    # Mão não pode estar muito abaixo do quadril (evita gestos aleatórios)
    if wrist[1] > hip[1] + torso * 0.35:
        return None

    # Trajetória: mão estava mais alta / mais longe do quadril (prateleira → corpo)
    rising_to_body = 0
    vertical_drop = 0
    history = list(track.pose_history)[-12:]
    for past in history:
        if wrist_i >= len(past) or hip_i >= len(past) or shoulder_i >= len(past):
            continue
        wx, wy, wc = past[wrist_i]
        hx, hy, hc = past[hip_i]
        sx, sy, sc = past[shoulder_i]
        if min(wc, hc, sc) < CONCEALMENT_KEYPOINT_CONF:
            continue
        past_ratio = _dist((wx, wy), (hx, hy)) / torso
        if past_ratio > wrist_hip + 0.18:
            rising_to_body += 1
        if wy + 18 < wrist[1]:
            vertical_drop += 1

    # Exige trajetória — sem isso é pose estática comum (braço no bolso sem movimento)
    if rising_to_body < 3 or vertical_drop < 2:
        return None

    score = 0.62
    score += min(0.18, rising_to_body * 0.04)
    score += min(0.10, vertical_drop * 0.03)
    if wrist_hip < CONCEALMENT_WRIST_TO_HIP_RATIO * 0.75:
        score += 0.08
    if 55 <= bend <= 120:
        score += 0.05
    return min(0.95, score)


class BehaviorAnalyzer:
    def analyze(self, tracks: list[Track]) -> list[BehaviorSignal]:
        signals: list[BehaviorSignal] = []
        for track in tracks:
            if track.hits < MIN_TRACK_HITS or track.confidence < 0.50:
                continue
            signals.extend(self._loitering(track))
            signals.extend(self._concealment(track))
        # Um sinal por track: prioriza ocultação > loitering
        by_track: dict[int, BehaviorSignal] = {}
        priority_rank = {"POSSIBLE_CONCEALMENT": 2, "UNUSUAL_DWELL": 1}
        for signal in signals:
            current = by_track.get(signal.track.track_id)
            if current is None or priority_rank.get(signal.alert_type, 0) > priority_rank.get(
                current.alert_type, 0
            ):
                by_track[signal.track.track_id] = signal
        return list(by_track.values())

    def _loitering(self, track: Track) -> list[BehaviorSignal]:
        if track.loitering_alerted:
            return []
        if track.age_seconds < LOITERING_SECONDS:
            return []
        # Precisa estar estável no espaço E pouco movimento recente
        if track.max_displacement_px > LOITERING_MAX_DISPLACEMENT_PX:
            return []
        if track.recent_path_px > LOITERING_RECENT_PATH_PX:
            return []
        if len(track.recent_centroids) < 10:
            return []

        confidence = min(
            0.92,
            0.55
            + (track.age_seconds / 150.0)
            + max(0.0, (LOITERING_MAX_DISPLACEMENT_PX - track.max_displacement_px) / 200.0),
        )
        if confidence < 0.60:
            return []

        track.loitering_alerted = True
        return [
            BehaviorSignal(
                alert_type="UNUSUAL_DWELL",
                priority="MEDIUM",
                description=(
                    f"Loitering anônimo (track #{track.track_id}): "
                    f"{track.age_seconds:.0f}s parado, deslocamento {track.max_displacement_px:.0f}px, "
                    f"path recente {track.recent_path_px:.0f}px. "
                    "Sem identificação. Revisar filmagem."
                ),
                confidence=confidence,
                track=track,
            )
        ]

    def _concealment(self, track: Track) -> list[BehaviorSignal]:
        if track.concealment_alerted:
            return []
        if len(track.keypoints) < 13 or len(track.pose_history) < 6:
            return []

        left = _side_concealment(track, L_SHOULDER, L_ELBOW, L_WRIST, L_HIP)
        right = _side_concealment(track, R_SHOULDER, R_ELBOW, R_WRIST, R_HIP)
        candidates = [s for s in (left, right) if s is not None]
        if not candidates:
            track.concealment_streak = max(0, track.concealment_streak - 1)
            return []

        track.concealment_streak += 1
        if track.concealment_streak < CONCEALMENT_MIN_FRAMES:
            return []

        score = max(candidates)
        if score < CONCEALMENT_MIN_SCORE:
            return []

        track.concealment_alerted = True
        return [
            BehaviorSignal(
                alert_type="POSSIBLE_CONCEALMENT",
                priority="HIGH",
                description=(
                    f"Suspeita de ocultação (track #{track.track_id}, score={score:.2f}): "
                    "mão→tronco com trajetória descendente e cotovelo flexionado. "
                    "NÃO confirma furto — revisão humana obrigatória."
                ),
                confidence=score,
                track=track,
            )
        ]
