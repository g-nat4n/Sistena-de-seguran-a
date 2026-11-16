import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

SERVICE_TOKEN = os.getenv("VISION_SERVICE_TOKEN", "smartguard-vision-dev-token")
BACKEND_BASE_URL = os.getenv("SMARTGUARD_API_URL", "http://localhost:8080/api")
PUBLIC_BASE_URL = os.getenv("VISION_PUBLIC_BASE_URL", "http://127.0.0.1:8090")

OPEN_TIMEOUT_SECONDS = float(os.getenv("RTSP_OPEN_TIMEOUT_SECONDS", "8"))
READ_TIMEOUT_SECONDS = float(os.getenv("RTSP_READ_TIMEOUT_SECONDS", "5"))
HEARTBEAT_SECONDS = float(os.getenv("RTSP_HEARTBEAT_SECONDS", "5"))
RECONNECT_DELAY_SECONDS = float(os.getenv("RTSP_RECONNECT_DELAY_SECONDS", "3"))

DETECTION_EVERY_N_FRAMES = int(os.getenv("DETECTION_EVERY_N_FRAMES", "5"))
YOLO_MODEL = os.getenv("YOLO_MODEL", "yolov8n.pt")
YOLO_CONFIDENCE = float(os.getenv("YOLO_CONFIDENCE", "0.45"))
DWELL_SECONDS = float(os.getenv("DWELL_SECONDS", "20"))
ALERT_COOLDOWN_SECONDS = float(os.getenv("ALERT_COOLDOWN_SECONDS", "45"))

EVIDENCE_DIR = os.getenv(
    "EVIDENCE_DIR",
    str(Path(__file__).resolve().parents[1] / "data" / "evidence"),
)
DETECTION_ENABLED = os.getenv("DETECTION_ENABLED", "true").lower() in {"1", "true", "yes"}
