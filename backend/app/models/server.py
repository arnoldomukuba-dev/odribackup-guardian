import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Enum
from sqlalchemy.orm import relationship
from app.core.db import Base


class ServerEnvironment(str, enum.Enum):
    PRODUCTION = "Production"
    STAGING = "Staging"
    DEVELOPMENT = "Development"
    DR = "DR"


class ServerLocation(str, enum.Enum):
    DATA_CENTER = "Data Center"
    AWS = "AWS"
    AZURE = "Azure"
    GCP = "GCP"
    ON_PREMISE = "On-Premise"


class ServerStatus(str, enum.Enum):
    ACTIVE = "Active"
    INACTIVE = "Inactive"
    MAINTENANCE = "Maintenance"


class Server(Base):
    __tablename__ = "servers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), index=True, nullable=False)
    host_ip = Column(String(100), nullable=False)
    os = Column(String(100), nullable=False)
    environment = Column(Enum(ServerEnvironment), default=ServerEnvironment.PRODUCTION, nullable=False)
    location = Column(Enum(ServerLocation), default=ServerLocation.DATA_CENTER, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(Enum(ServerStatus), default=ServerStatus.ACTIVE, nullable=False)
    last_successful_backup = Column(DateTime, nullable=True)
    next_expected_backup = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    backup_jobs = relationship("BackupJob", back_populates="server", cascade="all, delete-orphan")
    backup_runs = relationship("BackupRun", back_populates="server", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="server", cascade="all, delete-orphan")
