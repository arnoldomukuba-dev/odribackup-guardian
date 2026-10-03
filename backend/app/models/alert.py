import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.core.db import Base


class AlertType(str, enum.Enum):
    BACKUP_FAILURE = "Backup Failure"
    MISSED_BACKUP = "Missed Backup"
    OVERDUE_BACKUP = "Overdue Backup"
    VERIFICATION_FAILURE = "Verification Failure"
    SERVER_UNAVAILABLE = "Server Unavailable"
    STORAGE_WARNING = "Storage Warning"
    REPEATED_FAILURES = "Repeated Failures"


class AlertSeverity(str, enum.Enum):
    CRITICAL = "Critical"
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(Enum(AlertType), nullable=False, index=True)
    severity = Column(Enum(AlertSeverity), default=AlertSeverity.HIGH, nullable=False, index=True)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    
    server_id = Column(Integer, ForeignKey("servers.id", ondelete="CASCADE"), nullable=True, index=True)
    job_id = Column(Integer, ForeignKey("backup_jobs.id", ondelete="CASCADE"), nullable=True, index=True)
    
    is_acknowledged = Column(Boolean, default=False, nullable=False, index=True)
    acknowledged_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)
    resolution_note = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationships
    server = relationship("Server", back_populates="alerts")
    job = relationship("BackupJob", back_populates="alerts")
    acknowledged_by_user = relationship("User", back_populates="acknowledged_alerts")
