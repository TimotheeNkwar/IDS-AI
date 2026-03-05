from sqlalchemy import Column, Integer, String, Float, DateTime, func
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime, timezone
from pydantic import BaseModel, Field
from typing import Optional

Base = declarative_base()


class Alert(Base):
    """SQLAlchemy model for intrusion detection alerts."""

    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    type = Column(String(100), nullable=False, index=True)
    message = Column(String(500), nullable=False)
    source_ip = Column(String(45), nullable=True, index=True)  # IPv4 or IPv6
    severity = Column(String(20), default="medium", nullable=False)  # low, medium, high, critical


class NetworkTraffic(Base):
    """SQLAlchemy model for network traffic records used for ML inference."""

    __tablename__ = "network_traffic"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    source_ip = Column(String(45), nullable=False, index=True)
    destination_ip = Column(String(45), nullable=False, index=True)
    protocol = Column(String(20), nullable=False)  # TCP, UDP, ICMP, etc.
    packet_size = Column(Integer, nullable=False)
    duration = Column(Float, nullable=False)
    label = Column(String(50), nullable=True)  # normal or attack type


# Pydantic schemas for API responses
class AlertSchema(BaseModel):
    """Pydantic schema for Alert responses."""

    id: Optional[int] = None
    timestamp: datetime
    type: str
    message: str
    source_ip: Optional[str] = None
    severity: str = "medium"

    class Config:
        from_attributes = True


class NetworkTrafficSchema(BaseModel):
    """Pydantic schema for NetworkTraffic responses."""

    id: Optional[int] = None
    timestamp: datetime
    source_ip: str
    destination_ip: str
    protocol: str
    packet_size: int
    duration: float
    label: Optional[str] = None

    class Config:
        from_attributes = True
