"""Gerador de eventos comportamentais SIMULADOS para o SmartGuard AI.

Não usa câmeras reais, YOLO ou OpenCV nesta etapa.
Os eventos alimentam a central de alertas via API do backend.
"""

from __future__ import annotations

import argparse
import os
import random
from typing import Any

import requests
from dotenv import load_dotenv

ALERT_TYPES = [
    "POSSIBLE_CONCEALMENT",
    "SUSPICIOUS_MOVEMENT",
    "RESTRICTED_AREA_ENTRY",
    "UNUSUAL_DWELL",
    "AFTER_HOURS_MOVEMENT",
]

PRIORITY_BY_TYPE = {
    "POSSIBLE_CONCEALMENT": "HIGH",
    "SUSPICIOUS_MOVEMENT": "MEDIUM",
    "RESTRICTED_AREA_ENTRY": "CRITICAL",
    "UNUSUAL_DWELL": "MEDIUM",
    "AFTER_HOURS_MOVEMENT": "HIGH",
}


def login(base_url: str, email: str, password: str) -> str:
    response = requests.post(
        f"{base_url.rstrip('/')}/auth/login",
        json={"email": email, "password": password},
        timeout=15,
    )
    response.raise_for_status()
    return response.json()["accessToken"]


def build_payload(camera_identifier: str, alert_type: str | None = None) -> dict[str, Any]:
    selected = alert_type or random.choice(ALERT_TYPES)
    return {
        "cameraIdentifier": camera_identifier,
        "alertType": selected,
        "priority": PRIORITY_BY_TYPE[selected],
        "description": (
            f"Evento SIMULADO ({selected}) gerado pelo módulo Python. "
            "Não representa detecção real nem identificação de pessoas."
        ),
        "confidence": round(random.uniform(0.55, 0.92), 2),
        "simulated": True,
        "evidenceUrl": None,
    }


def send_event(base_url: str, token: str, payload: dict[str, Any]) -> dict[str, Any]:
    response = requests.post(
        f"{base_url.rstrip('/')}/simulation/ingest",
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
        timeout=15,
    )
    response.raise_for_status()
    return response.json()


def main() -> None:
    load_dotenv()
    parser = argparse.ArgumentParser(description="Simulador SmartGuard AI (eventos fictícios)")
    parser.add_argument("--count", type=int, default=1, help="Quantidade de eventos")
    parser.add_argument("--camera", default="CAM-ENT-01", help="Identificador da câmera")
    parser.add_argument("--type", choices=ALERT_TYPES, default=None, help="Tipo específico")
    args = parser.parse_args()

    base_url = os.getenv("SMARTGUARD_API_URL", "http://localhost:8080/api")
    email = os.getenv("SMARTGUARD_EMAIL", "operador@smartguard.local")
    password = os.getenv("SMARTGUARD_PASSWORD", "admin123")

    print("Modo: SIMULAÇÃO — sem visão computacional real.")
    token = login(base_url, email, password)

    for index in range(args.count):
        payload = build_payload(args.camera, args.type)
        created = send_event(base_url, token, payload)
        print(f"[{index + 1}] {created.get('publicId')} -> {created.get('type')} ({created.get('status')})")


if __name__ == "__main__":
    main()
