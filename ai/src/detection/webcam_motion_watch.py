"""Monitora a webcam local com OpenCV e envia alertas SIMULADOS ao backend.

Uso (a partir da pasta ai/):
  pip install opencv-python numpy requests python-dotenv
  python src/detection/webcam_motion_watch.py
  python src/detection/webcam_motion_watch.py --show

Regras:
- Não reconhece rostos
- Não identifica pessoas
- Apenas movimento anônimo (protótipo)
"""

from __future__ import annotations

import argparse
import os
import sys
import time
from pathlib import Path

import cv2
import requests
from dotenv import load_dotenv

DETECTION_DIR = Path(__file__).resolve().parent
SRC_DIR = DETECTION_DIR.parent
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

from detection.motion_detector import MotionDetector  # noqa: E402


def login(base_url: str, email: str, password: str) -> str:
    response = requests.post(
        f"{base_url.rstrip('/')}/auth/login",
        json={"email": email, "password": password},
        timeout=15,
    )
    response.raise_for_status()
    return response.json()["accessToken"]


def ingest(base_url: str, token: str, camera_identifier: str, score: float) -> dict:
    payload = {
        "cameraIdentifier": camera_identifier,
        "alertType": "SUSPICIOUS_MOVEMENT",
        "priority": "MEDIUM",
        "description": (
            "Protótipo OpenCV: movimento anônimo detectado na webcam local "
            f"(score={score:.2%}). Sem reconhecimento facial e sem identificação de pessoa."
        ),
        "confidence": round(min(0.95, max(0.5, score * 4)), 2),
        "simulated": True,
        "evidenceUrl": None,
    }
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
    parser = argparse.ArgumentParser(description="Watchdog de movimento (OpenCV)")
    parser.add_argument("--camera-index", type=int, default=0)
    parser.add_argument("--camera-id", default="CAM-ENT-01", help="identifier da câmera no SmartGuard")
    parser.add_argument("--cooldown", type=int, default=20, help="segundos entre alertas")
    parser.add_argument("--show", action="store_true", help="exibe janela de preview")
    args = parser.parse_args()

    base_url = os.getenv("SMARTGUARD_API_URL", "http://localhost:8080/api")
    email = os.getenv("SMARTGUARD_EMAIL", "operador@smartguard.local")
    password = os.getenv("SMARTGUARD_PASSWORD", "admin123")

    print("Protótipo OpenCV — detecção de movimento anônimo (sem faces).")
    token = login(base_url, email, password)
    detector = MotionDetector()
    cap = cv2.VideoCapture(args.camera_index)
    if not cap.isOpened():
        raise RuntimeError("Não foi possível abrir a webcam.")

    last_alert = 0.0
    try:
        while True:
            ok, frame = cap.read()
            if not ok:
                break

            result = detector.analyze(frame)
            now = time.time()

            if result.suspicious and now - last_alert >= args.cooldown:
                created = ingest(base_url, token, args.camera_id, result.score)
                last_alert = now
                print(f"Alerta {created.get('publicId')} score={result.score:.2%}")

            if args.show:
                label = f"motion={result.score:.1%} {'ALERT' if result.suspicious else 'ok'}"
                cv2.putText(frame, label, (12, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 220, 0), 2)
                cv2.imshow("SmartGuard motion prototype", frame)
                if cv2.waitKey(1) & 0xFF == ord("q"):
                    break
            else:
                time.sleep(0.03)
    finally:
        cap.release()
        cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
