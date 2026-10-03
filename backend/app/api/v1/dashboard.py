from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from app.core.db import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.server import Server, ServerStatus
from app.models.backup_job import BackupJob, JobStatus
from app.models.backup_run import BackupRun, RunStatus
from app.models.alert import Alert, AlertSeverity
from app.schemas.dashboard import DashboardStats
from app.schemas.backup_run import BackupRunOut
from app.schemas.alert import AlertOut

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    total_servers = db.query(Server).count()
    active_servers = db.query(Server).filter(Server.status == ServerStatus.ACTIVE).count()

    total_jobs = db.query(BackupJob).count()
    active_jobs = db.query(BackupJob).filter(BackupJob.status == JobStatus.ACTIVE).count()

    # Run statistics
    total_runs = db.query(BackupRun).count()
    successful_backups = db.query(BackupRun).filter(BackupRun.status == RunStatus.SUCCESS).count()
    failed_backups = db.query(BackupRun).filter(BackupRun.status == RunStatus.FAILED).count()
    missed_backups = db.query(BackupRun).filter(BackupRun.status == RunStatus.MISSED).count()
    overdue_backups = db.query(BackupRun).filter(BackupRun.status == RunStatus.OVERDUE).count()
    running_backups = db.query(BackupRun).filter(BackupRun.status == RunStatus.RUNNING).count()

    # Success rate
    if total_runs > 0:
        success_rate = round((successful_backups / total_runs) * 100, 1)
    else:
        success_rate = 100.0

    # System Health logic
    unack_critical = db.query(Alert).filter(Alert.is_acknowledged == False, Alert.severity == AlertSeverity.CRITICAL).count()
    unack_high = db.query(Alert).filter(Alert.is_acknowledged == False, Alert.severity == AlertSeverity.HIGH).count()

    if unack_critical > 0 or failed_backups > 3:
        overall_health = "Critical"
    elif unack_high > 0 or overdue_backups > 0 or missed_backups > 0:
        overall_health = "Warning"
    else:
        overall_health = "Healthy"

    # Recent activity
    recent_runs_orm = db.query(BackupRun).options(
        joinedload(BackupRun.server), joinedload(BackupRun.job)
    ).order_by(BackupRun.id.desc()).limit(8).all()

    recent_runs = []
    for r in recent_runs_orm:
        out = BackupRunOut.from_orm(r)
        if r.job:
            out.job_name = r.job.name
        recent_runs.append(out)

    # Recent alerts
    recent_alerts_orm = db.query(Alert).options(
        joinedload(Alert.server)
    ).filter(Alert.is_acknowledged == False).order_by(Alert.id.desc()).limit(5).all()

    recent_alerts = [AlertOut.from_orm(a) for a in recent_alerts_orm]

    return {
        "total_servers": total_servers,
        "active_servers": active_servers,
        "total_jobs": total_jobs,
        "active_jobs": active_jobs,
        "successful_backups": successful_backups,
        "failed_backups": failed_backups,
        "missed_backups": missed_backups,
        "overdue_backups": overdue_backups,
        "running_backups": running_backups,
        "success_rate": success_rate,
        "overall_health": overall_health,
        "recent_activity": recent_runs,
        "recent_alerts": recent_alerts,
    }
