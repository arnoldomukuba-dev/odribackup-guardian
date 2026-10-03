from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.db import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.server import Server
from app.models.backup_job import BackupJob, JobStatus
from app.models.backup_run import BackupRun, RunStatus
from app.models.verification import BackupVerification, VerificationStatus
from app.schemas.report import ReportSummary, ComplianceReport, VerificationReport

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/summary", response_model=ReportSummary)
def get_report_summary(
    period: str = Query("Daily", regex="^(Daily|Weekly|Monthly)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    total_servers = db.query(Server).count()
    backed_up_servers = db.query(Server).filter(Server.last_successful_backup != None).count()
    compliance_rate = round((backed_up_servers / total_servers * 100), 1) if total_servers > 0 else 100.0

    total_jobs = db.query(BackupJob).count()
    active_jobs = db.query(BackupJob).filter(BackupJob.status == JobStatus.ACTIVE).count()
    disabled_jobs = total_jobs - active_jobs

    total_runs = db.query(BackupRun).count()
    successful_runs = db.query(BackupRun).filter(BackupRun.status == RunStatus.SUCCESS).count()
    failed_runs = total_runs - successful_runs

    total_verifications = db.query(BackupVerification).count()
    verified_count = db.query(BackupVerification).filter(BackupVerification.verification_status == VerificationStatus.VERIFIED).count()
    failed_verifications = db.query(BackupVerification).filter(BackupVerification.verification_status == VerificationStatus.FAILED).count()
    pending_verifications = total_verifications - verified_count - failed_verifications

    integrity_rate = round((verified_count / total_verifications * 100), 1) if total_verifications > 0 else 100.0

    # Server compliance ranking
    servers = db.query(Server).all()
    rankings = []
    for s in servers:
        s_runs = db.query(BackupRun).filter(BackupRun.server_id == s.id).count()
        s_success = db.query(BackupRun).filter(BackupRun.server_id == s.id, BackupRun.status == RunStatus.SUCCESS).count()
        s_rate = round((s_success / s_runs * 100), 1) if s_runs > 0 else 100.0
        rankings.append({
            "server_id": s.id,
            "server_name": s.name,
            "environment": s.environment.value,
            "total_runs": s_runs,
            "successful_runs": s_success,
            "compliance_rate": s_rate,
            "last_backup": s.last_successful_backup.isoformat() if s.last_successful_backup else None
        })

    rankings.sort(key=lambda x: x["compliance_rate"], reverse=True)

    return {
        "period": period,
        "generated_at": datetime.utcnow().isoformat(),
        "compliance": ComplianceReport(
            total_servers=total_servers,
            backed_up_servers=backed_up_servers,
            compliance_rate=compliance_rate,
            total_jobs=total_jobs,
            active_jobs=active_jobs,
            disabled_jobs=disabled_jobs,
            sla_met_count=successful_runs,
            sla_missed_count=failed_runs,
        ),
        "verification": VerificationReport(
            total_verifications=total_verifications,
            verified_count=verified_count,
            failed_count=failed_verifications,
            pending_count=pending_verifications,
            integrity_pass_rate=integrity_rate,
        ),
        "server_rankings": rankings
    }
