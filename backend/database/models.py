import logging
from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field


class Alert(BaseModel):
    """Alerte IDS — anomalie détectée par le pipeline ML+LLM."""

    id: Optional[str] = Field(None, alias="_id")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: str = "open"  # open | reviewing | resolved | false_positive

    # Réseau
    src_ip: str
    dst_ip: str
    src_port: int = 0
    dst_port: int = 0
    proto: str
    service: str = "-"

    # ML
    ml_label: str
    ml_confidence: float
    ml_model: str
    is_anomaly: bool = True
    attack_type: Optional[str] = None
    risk_signals: list[dict] = Field(default_factory=list)
    top_features: list[dict] = Field(default_factory=list)

    # LLM
    classification: str
    llm_attack_type: Optional[str] = None
    llm_severity: Optional[str] = None
    llm_confidence: float
    final_confidence: float
    severity: str
    explanation: str
    recommended_action: str
    evidence: list[str] = Field(default_factory=list)
    knowledge_matches: list[str] = Field(default_factory=list)
    needs_manual_review: bool = True


class NetworkTraffic(BaseModel):

    id: Optional[str] = Field(None, alias="_id")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    src_ip: str
    dst_ip: str
    src_port: int = 0
    dst_port: int = 0
    proto: str
    service: str = "-"
    conn_state: str = "OTH"
    duration: float = 0.0
    src_bytes: int = 0
    dst_bytes: int = 0

    ml_label: str
    is_anomaly: bool
    ml_confidence: float
    severity: str
    attack_type: Optional[str] = None


class User(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    username: str
    email: str
    full_name: Optional[str] = None
    is_active: bool = True
    is_admin: bool = False
    password_hash: str
