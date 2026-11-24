"""Utilitários de conexão RTSP sem registrar credenciais em logs."""

from __future__ import annotations

import os
import re
import socket
import time
from dataclasses import dataclass
from urllib.parse import urlparse

import cv2


CREDENTIALS_PATTERN = re.compile(r"rtsp://([^/@]+)@")


def mask_rtsp_url(rtsp_url: str) -> str:
    return CREDENTIALS_PATTERN.sub("rtsp://***@", rtsp_url)


@dataclass
class RtspProbeResult:
    success: bool
    message: str
    transport: str | None = None


def _parse_host_port(rtsp_url: str) -> tuple[str | None, int]:
    try:
        parsed = urlparse(rtsp_url)
        host = parsed.hostname
        port = parsed.port or 554
        return host, port
    except Exception:  # noqa: BLE001
        return None, 554


def check_tcp_reachable(host: str, port: int, timeout: float = 3.0) -> tuple[bool, str]:
    """Pré-checagem de rede: IP/porta RTSP acessíveis no PC."""
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True, f"Porta {port} aberta em {host}"
    except socket.timeout:
        return False, (
            f"Timeout ao conectar em {host}:{port}. "
            "Confira se o PC está na mesma rede e se o IP está correto."
        )
    except OSError as exc:
        return False, (
            f"Não alcançou {host}:{port} ({exc}). "
            "Confira IP, cabo/Wi-Fi e se o RTSP está liberado no equipamento."
        )


def _set_ffmpeg_options(transport: str, open_timeout: float) -> None:
    # stimeout em microssegundos (FFmpeg)
    os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = (
        f"rtsp_transport;{transport}|stimeout;{int(open_timeout * 1_000_000)}"
        f"|max_delay;500000|rw_timeout;{int(open_timeout * 1_000_000)}"
    )


def open_rtsp_capture(
    rtsp_url: str,
    open_timeout: float = 8.0,
    preferred_transport: str | None = None,
) -> tuple[cv2.VideoCapture | None, str | None, str]:
    """Abre VideoCapture tentando TCP e, se falhar, UDP.

    Retorna (capture|None, transport_usado|None, mensagem_erro).
    """
    transports: list[str] = []
    if preferred_transport in {"tcp", "udp"}:
        transports.append(preferred_transport)
    for candidate in ("tcp", "udp"):
        if candidate not in transports:
            transports.append(candidate)

    last_error = "Não foi possível abrir o RTSP."
    for transport in transports:
        _set_ffmpeg_options(transport, open_timeout)
        capture = cv2.VideoCapture(rtsp_url, cv2.CAP_FFMPEG)
        if capture is not None and capture.isOpened():
            capture.set(cv2.CAP_PROP_BUFFERSIZE, 1)
            return capture, transport, ""
        if capture is not None:
            capture.release()
        last_error = f"Falha ao abrir RTSP via {transport.upper()}."

    return None, None, last_error


def probe_rtsp(
    rtsp_url: str,
    open_timeout: float = 8.0,
    read_timeout: float = 5.0,
    retries: int = 2,
) -> RtspProbeResult:
    """Tenta abrir o RTSP e ler 1 frame. Não imprime a URL com senha."""
    host, port = _parse_host_port(rtsp_url)
    if host:
        ok_tcp, tcp_msg = check_tcp_reachable(host, port, min(3.0, open_timeout))
        if not ok_tcp:
            return RtspProbeResult(False, tcp_msg)

    last_message = "Não foi possível abrir o RTSP."
    for attempt in range(max(1, retries)):
        capture, transport, open_error = open_rtsp_capture(rtsp_url, open_timeout)
        if capture is None:
            last_message = (
                open_error
                + " Confira IP, porta, path, usuário e senha e se a câmera está na mesma rede."
            )
            time.sleep(0.6 * (attempt + 1))
            continue

        deadline = time.time() + max(1.0, read_timeout)
        ok = False
        frame = None
        while time.time() < deadline:
            ok, frame = capture.read()
            if ok and frame is not None:
                break
            time.sleep(0.15)

        capture.release()

        if not ok or frame is None:
            last_message = (
                "Conectou no equipamento, mas não leu imagem. Confira o path/canal "
                "(channel/subtype) e se o RTSP está liberado na câmera."
            )
            time.sleep(0.4 * (attempt + 1))
            continue

        height, width = frame.shape[:2]
        via = transport.upper() if transport else "?"
        return RtspProbeResult(
            True,
            f"Conexão OK — frame {width}x{height} via {via}",
            transport=transport,
        )

    return RtspProbeResult(False, last_message)
