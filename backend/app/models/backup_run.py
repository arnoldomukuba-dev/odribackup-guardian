import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, ForeignKey, BigInteger
from sqlalchemy.orm import relationship
from app.core.db import Base


class RunStatus(str, enum.Enum):
    SUCCESS = "Success"
    FAILED = "Failed"
    RUNNING = "Running"
    MISSED = "Missed"
    OVERDUE = "Overdue"


class BackupRun(Base):
    __tablename__ = "backup_runs"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("backup_jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    server_id = Column(Integer, ForeignKey("servers.id", ondelete="CASCADE"), nullable=False, index=True)
    
    start_time = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    end_time = Column(DateTime, nullable=True)
    duration_seconds = Column(Integer, default=0, nullable=False)
    status = Column(Enum(RunStatus), default=RunStatus.RUNNING, nullable=False, index=True)
    size_bytes = Column(BigInteger, default=0, nullable=False)
    error_message = Column(Text, nullable=True)
    backup_location = Column(String(255), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    job = relationship("BackupJob", back_populates="runs")
    server = relationship("Server", back_populates="backup_runs")
    verification = relationship("BackupVerification", back_populates="run", uselist=False, cascade="all, delete-orphan")
