from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from app.core.db import Base


class NotificationSetting(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    channel_name = Column(String(100), nullable=False)  # Email, Slack, Webhook, PagerDuty
    destination = Column(String(255), nullable=False)   # Email address, webhook URL, channel
    is_enabled = Column(Boolean, default=True, nullable=False)
    notify_on_failure = Column(Boolean, default=True, nullable=False)
    notify_on_missed = Column(Boolean, default=True, nullable=False)
    notify_on_overdue = Column(Boolean, default=True, nullable=False)
    notify_on_verification_failure = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
