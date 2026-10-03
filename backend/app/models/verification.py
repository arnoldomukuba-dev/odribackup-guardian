import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.core.db import Base


class VerificationStatus(str, enum.Enum):
    VERIFIED = "Verified"
    FAILED = "Failed"
    PENDING = "Pending"


class BackupVerification(Base):
    __tablename__ = "backup_verifications"

    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(Integer, ForeignKey("backup_runs.id", ondelete="CASCADE"), nullable=False, index=True, unique=True)
    job_id = Column(Integer, ForeignKey("backup_jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    
    existence_checked = Column(Boolean, default=True, nullable=False)
    checksum_hash = Column(String(128), nullable=True)  # e.g., SHA256
    verification_status = Column(Enum(VerificationStatus), default=VerificationStatus.PENDING, nullable=False, index=True)
    notes = Column(Text, nullable=True)
    verified_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    run = relationship("BackupRun", back_populates="verification")
    job = relationship("BackupJob", back_populates="verifications")
