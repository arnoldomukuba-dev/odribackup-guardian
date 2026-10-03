from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.core.db import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.backup_run import BackupRun, RunStatus
from app.schemas.backup_run import BackupRunOut

router = APIRouter(prefix="/backup-runs", tags=["Backup Runs"])


@router.get("", response_model=List[BackupRunOut])
def list_backup_runs(
    job_id: Optional[int] = None,
    server_id: Optional[int] = None,
    status: Optional[RunStatus] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(BackupRun).options(joinedload(BackupRun.server), joinedload(BackupRun.job))
    if job_id:
        query = query.filter(BackupRun.job_id == job_id)
    if server_id:
        query = query.filter(BackupRun.server_id == server_id)
    if status:
        query = query.filter(BackupRun.status == status)

    runs = query.order_by(BackupRun.id.desc()).limit(limit).all()
    
    # Populate job_name helper field
    res = []
    for r in runs:
        out = BackupRunOut.from_orm(r)
        if r.job:
            out.job_name = r.job.name
        res.append(out)

    return res


@router.get("/{run_id}", response_model=BackupRunOut)
def get_backup_run(
    run_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    run = db.query(BackupRun).options(joinedload(BackupRun.server), joinedload(BackupRun.job)).filter(BackupRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Backup run record not found")
    out = BackupRunOut.from_orm(run)
    if run.job:
        out.job_name = run.job.name
    return out
