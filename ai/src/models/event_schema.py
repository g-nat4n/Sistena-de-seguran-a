"""Contrato de evento comportamental para integração futura com o backend."""

from dataclasses import dataclass
from typing import Literal


AlertType = Literal[
    "POSSIBLE_CONCEALMENT",
    "SUSPICIOUS_MOVEMENT",
    "RESTRICTED_AREA_ENTRY",
    "UNUSUAL_DWELL",
    "AFTER_HOURS_MOVEMENT",
]


@dataclass
class DetectionEvent:
    camera_identifier: str
    alert_type: AlertType
    priority: str
    description: str
    confidence: float
    simulated: bool = True
    evidence_url: str | None = None
