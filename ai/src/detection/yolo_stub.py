"""Compatibilidade: a detecção YOLO ativa está em ai/app/detection/person_detector.py."""


class YoloDetectionService:
    def analyze_frame(self, frame_path: str) -> dict:
        raise NotImplementedError(
            "Use o Vision Service (ai/app) com stream RTSP iniciado. "
            "Detector ativo: app.detection.person_detector.PersonDetector."
        )
