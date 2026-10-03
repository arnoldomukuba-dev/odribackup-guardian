from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.models.alert import AlertType, AlertSeverity
from app.schemas.server import ServerOut


class AlertAcknowledge(BaseModel):
    resolution_note: Optional[str] = None


class AlertOut(BaseModel):
    id: int
    type: AlertType
    severity: AlertSeverity
    title: str
    message: str
    server_id: Optional[int] = None
    job_id: Optional[int] = None
    is_acknowledged: bool
    acknowledged_by: Optional[int] = None
    acknowledged_at: Optional[datetime] = None
    resolution_note: Optional[str] = None
    created_at: datetime
    server: Optional[ServerOut] = None

    class Config:
        from_attributes = True
