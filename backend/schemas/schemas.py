from datetime import datetime, timezone

from pydantic import BaseModel, Field
from typing import Any, Literal


class LogEvent(BaseModel):
    """Network log event — all fields are optional and default to safe values."""

    id: str | None = Field(
        default=None, description="Unique identifier for the log event", alias="_id"
    )
    src_ip: str = Field(default="0.0.0.0", description="Source IP address")
    dst_ip: str = Field(default="0.0.0.0", description="Destination IP address")
    src_port: int = Field(default=0, ge=0, le=65535)
    dst_port: int = Field(default=0, ge=0, le=65535)
    proto: str = Field(default="tcp", description="Protocol: tcp | udp | icmp")
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
    http_trans_depth: Any = Field(default=0)
    http_request_body_len: int = Field(default=0, ge=0)
    http_response_body_len: int = Field(default=0, ge=0)
    http_status_code: int = Field(default=0, ge=0)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    # Raw log string forwarded to the LLM when anomaly is detected
    raw_log: str | None = Field(
        default=None, description="Optional raw log text for LLM analysis"
    )


class AnalysisResult(BaseModel):
    timestamp: datetime
    # ML layer
    ml_label: str  # "normal" | <attack_type>
    ml_confidence: float
    ml_model: str
    is_anomaly: bool
    attack_type: str | None  # e.g. "ddos", "injection", None when normal
    risk_signals: list[dict[str, Any]]
    top_features: list[dict[str, Any]]
    # LLM layer
    classification: str  # "Normal" | "Suspicious" | "Malicious"
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
    severity: str  # "low" | "medium" | "high"
    src_ip: str
    dst_ip: str
    src_port: int
    dst_port: int
    protocol: str
    service: str


AnalysisJobState = Literal["waiting", "processing", "completed", "failed", "cancelled"]


class AnalysisJobCreateResponse(BaseModel):
    id: str
    status: AnalysisJobState
    queue_position: int | None = None
    progress: int = Field(default=0, ge=0, le=100)
    submitted_at: datetime


class AnalysisJobStatus(BaseModel):
    id: str
    status: AnalysisJobState
    progress: int = Field(default=0, ge=0, le=100)
    queue_position: int | None = None
    submitted_at: datetime
    started_at: datetime | None = None
    completed_at: datetime | None = None
    updated_at: datetime
    timeout_seconds: int | None = None
    error: str | None = None
    event: LogEvent
    result: AnalysisResult | None = None


class AlertStatusUpdate(BaseModel):
    status: str = Field(pattern="^(open|reviewing|resolved|false_positive)$")


class User(BaseModel):
    id: str | None = Field(default=None, alias="_id")
    username: str
    email: str
    is_active: bool = True
    password_hash: str


class UserCreate(BaseModel):
    username: str
    email: str
    password: str


class UserLogin(BaseModel):
    email: str
    password: str


class UserRead(BaseModel):
    id: str | None = Field(default=None, alias="_id")
    username: str
    email: str
    is_active: bool = True


class Token(BaseModel):
    access_token: str
    token_type: str
