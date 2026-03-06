#type: ignore
from datetime import datetime, timezone
from pydantic import BaseModel, Field
from typing import Optional
from bson import ObjectId


class Alert(BaseModel):
    """MongoDB model for intrusion detection alerts."""

    id: Optional[str] = Field(None, alias="_id")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    type: str
    message: str
    source_ip: Optional[str] = None  # IPv4 or IPv6
    severity: str = "medium"  # low, medium, high, critical

    class Config:
        populate_by_name = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda v: v.isoformat()
        }


class NetworkTraffic(BaseModel):
    """MongoDB model for network traffic records used for ML inference."""

    id: Optional[str] = Field(None, alias="_id")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    source_ip: str
    destination_ip: str
    protocol: str  # TCP, UDP, ICMP, etc.
    packet_size: int
    duration: float
    label: Optional[str] = None  # normal or attack type

    class Config:
        populate_by_name = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda v: v.isoformat()
        }


# Aliases for API responses (same as models)
AlertSchema = Alert
NetworkTrafficSchema = NetworkTraffic
