"""Stub de detecção YOLO/ByteTrack.

Para movimento anônimo no curto prazo, use:
- frontend: detecção por diferença de frames
- python: src/detection/webcam_motion_watch.py (OpenCV)
"""


class YoloDetectionService:
    def analyze_frame(self, frame_path: str) -> dict:
        raise NotImplementedError(
            "YOLO/ByteTrack ainda não está ativo. "
            "Use motion_detector/webcam_motion_watch para o protótipo de movimento, "
            "ou o simulador em ai/src/simulation/event_generator.py."
        )
