import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, ForeignKey, BigInteger
from sqlalchemy.orm import relationship
from app.core.db import Base


class BackupType(str, enum.Enum):
    FULL = "Full"
    INCREMENTAL = "Incremental"
    DIFFERENTIAL = "Differential"
    SNAPSHOT = "Snapshot"


class JobStatus(str, enum.Enum):
    ACTIVE = "Active"
    DISABLED = "Disabled"


class BackupJob(Base):
    __tablename__ = "backup_jobs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), index=True, nullable=False)
    server_id = Column(Integer, ForeignKey("servers.id", ondelete="CASCADE"), nullable=False, index=True)
    backup_type = Column(Enum(BackupType), default=BackupType.FULL, nullable=False)
    schedule_cron = Column(String(100), nullable=False)  # e.g., "0 2 * * *" or "Daily at 02:00"
    schedule_human = Column(String(100), nullable=True)  # e.g., "Every day at 2:00 AM"
    destination = Column(String(255), nullable=False)    # e.g., "s3://backups/prod-db" or "/mnt/backup/srv1"
    retention_days = Column(Integer, default=30, nullable=False)
    status = Column(Enum(JobStatus), default=JobStatus.ACTIVE, nullable=False)
    
    last_run_at = Column(DateTime, nullable=True)
    next_run_at = Column(DateTime, nullable=True)
    last_backup_size = Column(BigInteger, default=0, nullable=False)  # in bytes
    last_duration_seconds = Column(Integer, default=0, nullable=False)
    last_error_message = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    server = relationship("Server", back_populates="backup_jobs")
    runs = relationship("BackupRun", back_populates="job", cascade="all, delete-orphan")
    verifications = relationship("BackupVerification", back_populates="job", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="job", cascade="all, delete-orphan")
