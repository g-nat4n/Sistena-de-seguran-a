import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

SERVICE_TOKEN = os.getenv("VISION_SERVICE_TOKEN", "smartguard-vision-dev-token")
BACKEND_BASE_URL = os.getenv("SMARTGUARD_API_URL", "http://localhost:8080/api")
PUBLIC_BASE_URL = os.getenv("VISION_PUBLIC_BASE_URL", "http://127.0.0.1:8090")

OPEN_TIMEOUT_SECONDS = float(os.getenv("RTSP_OPEN_TIMEOUT_SECONDS", "10"))
READ_TIMEOUT_SECONDS = float(os.getenv("RTSP_READ_TIMEOUT_SECONDS", "6"))
HEARTBEAT_SECONDS = float(os.getenv("RTSP_HEARTBEAT_SECONDS", "5"))
RECONNECT_DELAY_SECONDS = float(os.getenv("RTSP_RECONNECT_DELAY_SECONDS", "3"))

DETECTION_EVERY_N_FRAMES = int(os.getenv("DETECTION_EVERY_N_FRAMES", "4"))
YOLO_MODEL = os.getenv("YOLO_MODEL", "yolov8n.pt")
YOLO_POSE_MODEL = os.getenv("YOLO_POSE_MODEL", "yolov8n-pose.pt")
# Confiança mais alta = menos falso positivo
YOLO_CONFIDENCE = float(os.getenv("YOLO_CONFIDENCE", "0.55"))
DWELL_SECONDS = float(os.getenv("DWELL_SECONDS", "18"))
ALERT_COOLDOWN_SECONDS = float(os.getenv("ALERT_COOLDOWN_SECONDS", "25"))

# Fase C — comportamento (defaults mais sensíveis para loja/teste)
LOITERING_SECONDS = float(os.getenv("LOITERING_SECONDS", "18"))
LOITERING_MAX_DISPLACEMENT_PX = float(os.getenv("LOITERING_MAX_DISPLACEMENT_PX", "70"))
LOITERING_RECENT_PATH_PX = float(os.getenv("LOITERING_RECENT_PATH_PX", "90"))
MIN_TRACK_HITS = int(os.getenv("MIN_TRACK_HITS", "6"))
CONCEALMENT_MIN_FRAMES = int(os.getenv("CONCEALMENT_MIN_FRAMES", "4"))
CONCEALMENT_WRIST_TO_HIP_RATIO = float(os.getenv("CONCEALMENT_WRIST_TO_HIP_RATIO", "0.38"))
CONCEALMENT_MIN_SCORE = float(os.getenv("CONCEALMENT_MIN_SCORE", "0.65"))
CONCEALMENT_KEYPOINT_CONF = float(os.getenv("CONCEALMENT_KEYPOINT_CONF", "0.40"))
# Presença estável ajuda a validar a detecção em campo
PERSON_ALERT_ENABLED = os.getenv("PERSON_ALERT_ENABLED", "true").lower() in {"1", "true", "yes"}
MIN_ALERT_CONFIDENCE = float(os.getenv("MIN_ALERT_CONFIDENCE", "0.50"))

EVIDENCE_DIR = os.getenv(
    "EVIDENCE_DIR",
    str(Path(__file__).resolve().parents[1] / "data" / "evidence"),
)
DETECTION_ENABLED = os.getenv("DETECTION_ENABLED", "true").lower() in {"1", "true", "yes"}

# Clip de evidência (~últimos N segundos antes do alerta)
EVIDENCE_CLIP_SECONDS = float(os.getenv("EVIDENCE_CLIP_SECONDS", "8"))
EVIDENCE_CLIP_FPS = float(os.getenv("EVIDENCE_CLIP_FPS", "6"))
