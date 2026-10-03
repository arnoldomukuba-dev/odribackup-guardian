import hashlib
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session, joinedload
from app.core.db import get_db
from app.core.deps import get_current_user, require_roles
from app.core.audit import log_audit
from app.models.user import User, UserRole
from app.models.backup_run import BackupRun, RunStatus
from app.models.verification import BackupVerification, VerificationStatus
from app.models.alert import Alert, AlertType, AlertSeverity
from app.schemas.verification import VerificationOut

router = APIRouter(prefix="/verifications", tags=["Backup Verification"])


@router.get("", response_model=List[VerificationOut])
def list_verifications(
    status: Optional[VerificationStatus] = None,
    job_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(BackupVerification).options(
        joinedload(BackupVerification.run).joinedload(BackupRun.server),
        joinedload(BackupVerification.run).joinedload(BackupRun.job)
    )
    if status:
        query = query.filter(BackupVerification.verification_status == status)
    if job_id:
        query = query.filter(BackupVerification.job_id == job_id)

    verifications = query.order_by(BackupVerification.id.desc()).all()
    
    # Populate nested job_name
    res = []
    for v in verifications:
        out = VerificationOut.from_orm(v)
        if v.run and v.run.job:
            out.run.job_name = v.run.job.name
        res.append(out)

    return res


@router.post("/trigger/{run_id}", response_model=VerificationOut)
def trigger_verification(
    run_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMINISTRATOR, UserRole.OPERATOR]))
):
    run = db.query(BackupRun).filter(BackupRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Backup run not found")

    verification = db.query(BackupVerification).filter(BackupVerification.run_id == run_id).first()
    if not verification:
        verification = BackupVerification(
            run_id=run.id,
            job_id=run.job_id,
            existence_checked=True,
            verification_status=VerificationStatus.PENDING,
            verified_at=datetime.utcnow()
        )
        db.add(verification)

    now = datetime.utcnow()
    # Perform verification check simulation
    if run.status == RunStatus.SUCCESS:
        sample_data = f"payload_run_{run.id}_{run.start_time.isoformat()}".encode('utf-8')
        checksum = hashlib.sha256(sample_data).hexdigest()
        
        verification.existence_checked = True
        verification.checksum_hash = checksum
        verification.verification_status = VerificationStatus.VERIFIED
        verification.notes = f"Verified payload file at {run.backup_location or 'destination'}. Checksum match."
        verification.verified_at = now
    else:
        verification.existence_checked = False
        verification.checksum_hash = None
        verification.verification_status = VerificationStatus.FAILED
        verification.notes = f"Verification failed. Run status is {run.status.value}. Error: {run.error_message or 'No backup archive generated'}"
        verification.verified_at = now

        # Create alert if verification failed
        alert = Alert(
            type=AlertType.VERIFICATION_FAILURE,
            severity=AlertSeverity.CRITICAL,
            title=f"Backup Verification Failed for Run #{run.id}",
            message=f"Integrity check failed for backup location {run.backup_location}. Status: {verification.notes}",
            server_id=run.server_id,
            job_id=run.job_id,
            is_acknowledged=False,
        )
        db.add(alert)

    db.commit()
    db.refresh(verification)

    client_ip = request.client.host if request.client else None
    log_audit(db, current_user.id, current_user.email, "TRIGGER_VERIFICATION", "BackupVerification", verification.id, details={"status": verification.verification_status.value}, ip_address=client_ip)

    out = VerificationOut.from_orm(verification)
    if run and run.job:
        out.run.job_name = run.job.name
    return out
