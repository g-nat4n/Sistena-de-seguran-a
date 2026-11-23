"""Utilitários de conexão RTSP sem registrar credenciais em logs."""

from __future__ import annotations

import os
import re
from dataclasses import dataclass

import cv2


CREDENTIALS_PATTERN = re.compile(r"rtsp://([^/@]+)@")


def mask_rtsp_url(rtsp_url: str) -> str:
    return CREDENTIALS_PATTERN.sub("rtsp://***@", rtsp_url)


@dataclass
class RtspProbeResult:
    success: bool
    message: str


def probe_rtsp(rtsp_url: str, open_timeout: float = 8.0, read_timeout: float = 5.0) -> RtspProbeResult:
    """Tenta abrir o RTSP e ler 1 frame. Não imprime a URL com senha."""
    os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = (
        f"rtsp_transport;tcp|stimeout;{int(open_timeout * 1_000_000)}"
    )

    capture = cv2.VideoCapture(rtsp_url, cv2.CAP_FFMPEG)
    if not capture.isOpened():
        capture.release()
        return RtspProbeResult(
            False,
            "Não foi possível abrir o RTSP. Confira IP, porta, path, usuário e senha "
            "e se a câmera está na mesma rede.",
        )

    capture.set(cv2.CAP_PROP_BUFFERSIZE, 1)
    ok, frame = capture.read()
    capture.release()

    if not ok or frame is None:
        return RtspProbeResult(
            False,
            "Conectou no equipamento, mas não leu imagem. Confira o path/canal "
            "(channel/subtype) e se o RTSP está liberado na câmera.",
        )

    height, width = frame.shape[:2]
    return RtspProbeResult(True, f"Conexão OK — frame {width}x{height}")
