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
    src_port: int = Field(default=0, ge=0, le=65535, description="Source port")
    dst_port: int = Field(default=0, ge=0, le=65535, description="Destination port")
    proto: str = Field(default="tcp", description="Protocol: tcp | udp | icmp")
    service: str = Field(default="-", description="Service type, e.g. http, dns, ssh")
    conn_state: str = Field(default="OTH",description="Connection state, e.g. S0, SF, OTH")
    duration: float = Field(default=0.0, ge=0, description="Connection duration in seconds")
    src_bytes: int = Field(default=0, ge=0,description="Bytes sent from source to destination" )
    dst_bytes: int = Field(default=0, ge=0, description="Bytes sent from destination to source")
    missed_bytes: int = Field(default=0, ge=0, description="Bytes missed in the connection")
    src_pkts: int = Field(default=0, ge=0, description="Packets sent from source to destination")
    src_ip_bytes: int = Field(default=0, ge=0, description="IP bytes sent from source to destination")
    dst_pkts: int = Field(default=0, ge=0, description="Packets sent from destination to source")
    dst_ip_bytes: int = Field(default=0, ge=0, description="IP bytes sent from destination to source")
    dns_qclass: int = Field(default=0, ge=0, description="DNS query class, e.g. 1 for IN")
    dns_qtype: int = Field(default=0, ge=0, description="DNS query type")
    dns_rcode: int = Field(default=0, ge=0, description="DNS response code")
    http_trans_depth: Any = Field(default=0, description="HTTP transaction depth, can be int or '-'")
    http_request_body_len: int = Field(default=0, ge=0, description="Length of HTTP request body")
    http_response_body_len: int = Field(default=0, ge=0, description="Length of HTTP response body")
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
    # LLM layer (only when anomaly)
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
    proto: str
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
