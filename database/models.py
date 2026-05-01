# type: ignore
"""Pydantic schemas for MongoDB documents."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from pydantic import BaseModel, Field

try:
    from bson import ObjectId
except ImportError:
    ObjectId = str


class Alert(BaseModel):
    """MongoDB model for intrusion detection alerts."""

    id: Optional[str] = Field(None, alias="_id")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    type: str
    message: str
    source_ip: Optional[str] = None
    destination_ip: Optional[str] = None
    severity: str = "medium"
    status: str = "open"
    classification: Optional[str] = None
    llm_attack_type: Optional[str] = None
    llm_severity: Optional[str] = None
    ml_label: Optional[str] = None
    ml_confidence: Optional[float] = None
    llm_confidence: Optional[float] = None
    final_confidence: Optional[float] = None
    risk_signals: list[dict] = Field(default_factory=list)
    top_features: list[dict] = Field(default_factory=list)
    evidence: list[str] = Field(default_factory=list)
    knowledge_matches: list[str] = Field(default_factory=list)
    recommended_action: Optional[str] = None
    needs_manual_review: bool = True

    class Config:
        populate_by_name = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda v: v.isoformat(),
        }


class NetworkTraffic(BaseModel):
    """MongoDB model for network traffic records used for ML inference."""

    id: Optional[str] = Field(None, alias="_id")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    source_ip: str
    destination_ip: str
    protocol: str
    packet_size: int = 0
    duration: float = 0.0
    label: Optional[str] = None
    is_anomaly: bool = False
    ml_confidence: Optional[float] = None
    severity: str = "low"
    risk_signals: list[dict] = Field(default_factory=list)
    top_features: list[dict] = Field(default_factory=list)
    knowledge_matches: list[str] = Field(default_factory=list)
    raw_event: Optional[dict] = None

    class Config:
        populate_by_name = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda v: v.isoformat(),
        }


AlertSchema = Alert
NetworkTrafficSchema = NetworkTraffic
