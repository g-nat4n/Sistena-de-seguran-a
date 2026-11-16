import time

from app.detection.behavior_analyzer import BehaviorAnalyzer
from app.detection.centroid_tracker import Track


def main() -> None:
    t = Track(track_id=1, centroid=(100, 100), bbox=(80, 40, 140, 220), confidence=0.8)
    t.first_seen = time.time() - 40
    t.origin_centroid = (100, 100)
    t.max_displacement_px = 20
    t.hits = 12
    for i in range(12):
        t.recent_centroids.append((100 + i * 0.2, 100))
    signals = BehaviorAnalyzer().analyze([t])
    print("loitering", [(s.alert_type, round(s.confidence, 2)) for s in signals])

    kps = [(0.0, 0.0, 0.0)] * 17
    # Ombro → cotovelo bem flexionado → pulso perto do quadril
    kps[5] = (100.0, 80.0, 0.9)
    kps[7] = (130.0, 110.0, 0.9)
    kps[9] = (108.0, 155.0, 0.9)
    kps[11] = (100.0, 160.0, 0.9)
    t2 = Track(
        track_id=2,
        centroid=(100, 120),
        bbox=(70, 40, 140, 220),
        confidence=0.85,
        keypoints=kps,
    )
    t2.hits = 12
    for i in range(8):
        past = list(kps)
        # mão mais alta no passado (trajetória descendente)
        past[9] = (105.0, 60.0 - i, 0.9)
        t2.pose_history.append(past)
    t2.concealment_streak = 5
    signals2 = BehaviorAnalyzer().analyze([t2])
    print("concealment", [(s.alert_type, round(s.confidence, 2)) for s in signals2])


if __name__ == "__main__":
    main()
