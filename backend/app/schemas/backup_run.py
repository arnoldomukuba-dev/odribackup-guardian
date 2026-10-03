from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.models.backup_run import RunStatus
from app.schemas.server import ServerOut


class BackupRunOut(BaseModel):
    id: int
    job_id: int
    server_id: int
    start_time: datetime
    end_time: Optional[datetime] = None
    duration_seconds: int
    status: RunStatus
    size_bytes: int
    error_message: Optional[str] = None
    backup_location: Optional[str] = None
    created_at: datetime
    server: Optional[ServerOut] = None
    job_name: Optional[str] = None

    class Config:
        from_attributes = True
