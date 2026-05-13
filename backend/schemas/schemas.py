from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


# ── Network ────────────────────────────────────────────────────────────────────


class LogEvent(BaseModel):
    """Network log event — all fields are optional and default to safe values."""

    id: str | None = Field(default=None, alias="_id")
    src_ip: str = Field(default="0.0.0.0")
    dst_ip: str = Field(default="0.0.0.0")
    src_port: int = Field(default=0, ge=0, le=65535)
    dst_port: int = Field(default=0, ge=0, le=65535)
    protocol: str = Field(default="tcp")
    service: str = Field(default="-")
    conn_state: str = Field(default="OTH")
    duration: float = Field(default=0.0, ge=0)
    src_bytes: int = Field(default=0, ge=0)
    dst_bytes: int = Field(default=0, ge=0)
    missed_bytes: int = Field(default=0, ge=0)
    src_pkts: int = Field(default=0, ge=0)
    src_ip_bytes: int = Field(default=0, ge=0)
    dst_pkts: int = Field(default=0, ge=0)
    dst_ip_bytes: int = Field(default=0, ge=0)
    dns_qclass: int = Field(default=0, ge=0)
    dns_qtype: int = Field(default=0, ge=0)
    dns_rcode: int = Field(default=0, ge=0)
    http_trans_depth: int = Field(default=0, ge=0)
    http_request_body_len: int = Field(default=0, ge=0)
    http_response_body_len: int = Field(default=0, ge=0)
    http_status_code: int = Field(default=0, ge=0)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    raw_log: str | None = Field(default=None)


class AnalysisResult(BaseModel):
    timestamp: datetime
    # ML layer
    ml_label: str
    ml_confidence: float
    ml_model: str
    is_anomaly: bool
    attack_type: str | None
    risk_signals: list[dict[str, Any]]
    top_features: list[dict[str, Any]]
    # LLM layer
    classification: str
    llm_attack_type: str | None = None
    llm_severity: str | None = None
    llm_confidence: float
    evidence: list[str] = Field(default_factory=list)
    knowledge_matches: list[str] = Field(default_factory=list)
    explanation: str
    recommended_action: str
    needs_manual_review: bool
    llm_available: bool
    # Summary
    final_confidence: float
    severity: str
    src_ip: str
    dst_ip: str
    protocol: str
    service: str


class AlertStatusUpdate(BaseModel):
    status: str = Field(pattern="^(open|reviewing|resolved|false_positive)$")


# ── Users ──────────────────────────────────────────────────────────────────────


class _UserBase(BaseModel):
    """Champs communs — jamais utilisé directement."""

    username: str
    email: str


class UserCreate(_UserBase):
    """Payload d'inscription."""

    password: str


class UserLogin(BaseModel):
    """Payload de connexion."""

    email: str
    password: str


class UserInDB(_UserBase):
    """Modèle interne DB uniquement — ne jamais retourner en réponse API."""

    model_config = ConfigDict(populate_by_name=True)
    id: str | None = Field(default=None, alias="_id")
    is_active: bool = True
    password_hash: str  # ✅ isolé ici, jamais exposé


class UserRead(_UserBase):
    """Réponse API — sans password_hash."""

    model_config = ConfigDict(populate_by_name=True)
    id: str | None = Field(default=None, alias="_id")
    is_active: bool = True


class Token(BaseModel):
    access_token: str
    token_type: str


class User(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    id: str | None = Field(default=None, alias="_id")
    username: str
    email: str
    is_active: bool
    password_hash: str
