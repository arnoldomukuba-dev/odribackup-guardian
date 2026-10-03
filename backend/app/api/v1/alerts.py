from datetime import datetime
from typing import List, Optional, Dict
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session, joinedload
from app.core.db import get_db
from app.core.deps import get_current_user, require_roles
from app.core.audit import log_audit
from app.models.user import User, UserRole
from app.models.alert import Alert, AlertSeverity, AlertType
from app.schemas.alert import AlertOut, AlertAcknowledge

router = APIRouter(prefix="/alerts", tags=["Alerts"])


@router.get("", response_model=List[AlertOut])
def list_alerts(
    search: Optional[str] = None,
    severity: Optional[AlertSeverity] = None,
    is_acknowledged: Optional[bool] = None,
    server_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Alert).options(joinedload(Alert.server))
    if search:
        query = query.filter(
            (Alert.title.ilike(f"%{search}%")) |
            (Alert.message.ilike(f"%{search}%"))
        )
    if severity:
        query = query.filter(Alert.severity == severity)
    if is_acknowledged is not None:
        query = query.filter(Alert.is_acknowledged == is_acknowledged)
    if server_id:
        query = query.filter(Alert.server_id == server_id)

    return query.order_by(Alert.id.desc()).all()


@router.get("/summary", response_model=Dict[str, int])
def alert_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    total = db.query(Alert).count()
    unacknowledged = db.query(Alert).filter(Alert.is_acknowledged == False).count()
    critical = db.query(Alert).filter(Alert.severity == AlertSeverity.CRITICAL, Alert.is_acknowledged == False).count()
    high = db.query(Alert).filter(Alert.severity == AlertSeverity.HIGH, Alert.is_acknowledged == False).count()
    medium = db.query(Alert).filter(Alert.severity == AlertSeverity.MEDIUM, Alert.is_acknowledged == False).count()
    low = db.query(Alert).filter(Alert.severity == AlertSeverity.LOW, Alert.is_acknowledged == False).count()

    return {
        "total": total,
        "unacknowledged": unacknowledged,
        "critical": critical,
        "high": high,
        "medium": medium,
        "low": low
    }


@router.post("/{alert_id}/acknowledge", response_model=AlertOut)
def acknowledge_alert(
    alert_id: int,
    payload: AlertAcknowledge,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMINISTRATOR, UserRole.OPERATOR]))
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.is_acknowledged = True
    alert.acknowledged_by = current_user.id
    alert.acknowledged_at = datetime.utcnow()
    alert.resolution_note = payload.resolution_note or "Acknowledged by operator"

    db.commit()
    db.refresh(alert)

    client_ip = request.client.host if request.client else None
    log_audit(db, current_user.id, current_user.email, "ACKNOWLEDGE_ALERT", "Alert", alert.id, details={"resolution": alert.resolution_note}, ip_address=client_ip)

    return alert
