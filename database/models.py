from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timezone


class AlertModel(BaseModel):
    """Represents an intrusion detection alert stored in the database."""

    id: Optional[str] = Field(default=None, alias="_id")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    type: str = Field(..., description="Category of the alert (e.g. Port Scan, DDoS)")
    message: str = Field(..., description="Human-readable description of the alert")
    source_ip: Optional[str] = Field(default=None, description="Source IP address")
    severity: str = Field(default="medium", description="Alert severity: low, medium, high, critical")

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "type": "Port Scan",
                "message": "Suspicious port scan from 192.168.1.100",
                "source_ip": "192.168.1.100",
                "severity": "high",
            }
        }


class NetworkTrafficModel(BaseModel):
    """Represents a network traffic record used for ML inference."""

    id: Optional[str] = Field(default=None, alias="_id")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    source_ip: str
    destination_ip: str
    protocol: str = Field(..., description="Network protocol (TCP, UDP, ICMP, etc.)")
    packet_size: int = Field(..., description="Packet size in bytes")
    duration: float = Field(..., description="Connection duration in seconds")
    label: Optional[str] = Field(default=None, description="ML label: normal or attack type")

    class Config:
        populate_by_name = True
