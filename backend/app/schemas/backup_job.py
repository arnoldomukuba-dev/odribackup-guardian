from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.models.backup_job import BackupType, JobStatus
from app.schemas.server import ServerOut


class BackupJobBase(BaseModel):
    name: str
    server_id: int
    backup_type: BackupType = BackupType.FULL
    schedule_cron: str
    schedule_human: Optional[str] = None
    destination: str
    retention_days: int = 30
    status: JobStatus = JobStatus.ACTIVE


class BackupJobCreate(BackupJobBase):
    pass


class BackupJobUpdate(BaseModel):
    name: Optional[str] = None
    server_id: Optional[int] = None
    backup_type: Optional[BackupType] = None
    schedule_cron: Optional[str] = None
    schedule_human: Optional[str] = None
    destination: Optional[str] = None
    retention_days: Optional[int] = None
    status: Optional[JobStatus] = None


class BackupJobOut(BackupJobBase):
    id: int
    last_run_at: Optional[datetime] = None
    next_run_at: Optional[datetime] = None
    last_backup_size: int = 0
    last_duration_seconds: int = 0
    last_error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    server: Optional[ServerOut] = None

    class Config:
        from_attributes = True
