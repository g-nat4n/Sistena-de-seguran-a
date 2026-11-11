"""Cliente HTTP para enviar eventos ao backend Spring Boot.

Implementação completa na Fase 3. Mantido como contrato de integração.
"""

from __future__ import annotations

from typing import Any


class BackendClient:
    def __init__(self, base_url: str) -> None:
        self.base_url = base_url.rstrip("/")

    def post_detection_event(self, payload: dict[str, Any]) -> None:
        raise NotImplementedError(
            "Integração com /api/alerts/ingest será implementada na Fase 3."
        )
