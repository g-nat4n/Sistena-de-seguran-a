import os

from dotenv import load_dotenv

load_dotenv()

SERVICE_TOKEN = os.getenv("VISION_SERVICE_TOKEN", "smartguard-vision-dev-token")
BACKEND_BASE_URL = os.getenv("SMARTGUARD_API_URL", "http://localhost:8080/api")
OPEN_TIMEOUT_SECONDS = float(os.getenv("RTSP_OPEN_TIMEOUT_SECONDS", "8"))
READ_TIMEOUT_SECONDS = float(os.getenv("RTSP_READ_TIMEOUT_SECONDS", "5"))
HEARTBEAT_SECONDS = float(os.getenv("RTSP_HEARTBEAT_SECONDS", "5"))
RECONNECT_DELAY_SECONDS = float(os.getenv("RTSP_RECONNECT_DELAY_SECONDS", "3"))
