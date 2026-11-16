"""Cliente HTTP para o backend Spring Boot (worker / scripts)."""

from __future__ import annotations

from typing import Any

import requests


class BackendClient:
    def __init__(self, base_url: str, service_token: str | None = None) -> None:
        self.base_url = base_url.rstrip("/")
        self.service_token = service_token

    def _headers(self) -> dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self.service_token:
            headers["X-Service-Token"] = self.service_token
        return headers

    def post_detection_event(self, payload: dict[str, Any], bearer_token: str | None = None) -> dict[str, Any]:
        headers = self._headers()
        if bearer_token:
            headers["Authorization"] = f"Bearer {bearer_token}"
        response = requests.post(
            f"{self.base_url}/simulation/ingest",
            json=payload,
            headers=headers,
            timeout=15,
        )
        response.raise_for_status()
        return response.json()

    def heartbeat(self, camera_id: int, stream_state: str, last_error: str | None = None) -> None:
        response = requests.post(
            f"{self.base_url}/internal/cameras/{camera_id}/heartbeat",
            json={"streamState": stream_state, "lastError": last_error},
            headers=self._headers(),
            timeout=5,
        )
        response.raise_for_status()
