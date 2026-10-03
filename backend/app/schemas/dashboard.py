from typing import List, Optional
from pydantic import BaseModel
from app.schemas.backup_run import BackupRunOut
from app.schemas.alert import AlertOut


class DashboardStats(BaseModel):
    total_servers: int
    active_servers: int
    total_jobs: int
    active_jobs: int
    successful_backups: int
    failed_backups: int
    missed_backups: int
    overdue_backups: int
    running_backups: int
    success_rate: float  # Percentage e.g. 95.4
    overall_health: str  # "Healthy", "Warning", "Critical"
    recent_activity: List[BackupRunOut]
    recent_alerts: List[AlertOut]
