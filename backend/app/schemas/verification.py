from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.models.verification import VerificationStatus
from app.schemas.backup_run import BackupRunOut


class VerificationOut(BaseModel):
    id: int
    run_id: int
    job_id: int
    existence_checked: bool
    checksum_hash: Optional[str] = None
    verification_status: VerificationStatus
    notes: Optional[str] = None
    verified_at: datetime
    created_at: datetime
    run: Optional[BackupRunOut] = None

    class Config:
        from_attributes = True
