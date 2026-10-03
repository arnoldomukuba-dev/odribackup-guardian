from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.db import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    user_email = Column(String(255), nullable=False)
    action = Column(String(100), nullable=False, index=True)  # e.g., LOGIN, CREATE_SERVER, ACK_ALERT
    entity_type = Column(String(100), nullable=True)         # e.g., Server, BackupJob, Alert, User
    entity_id = Column(String(100), nullable=True)
    details = Column(Text, nullable=True)                     # JSON string or text summary
    ip_address = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationships
    user = relationship("User", back_populates="audit_logs")
