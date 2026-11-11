"""Stub de detecção YOLO/OpenCV/ByteTrack.

Preparação arquitetural apenas. Não processa vídeo nesta etapa.
"""


class YoloDetectionService:
    def analyze_frame(self, frame_path: str) -> dict:
        raise NotImplementedError(
            "Processamento real com YOLO/OpenCV/ByteTrack será implementado em etapa futura. "
            "Use o simulador em ai/src/simulation/event_generator.py."
        )
