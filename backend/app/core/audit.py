import json
from typing import Any, Optional
from sqlalchemy.orm import Session
from app.models.audit import AuditLog


def log_audit(
    db: Session,
    user_id: Optional[int],
    user_email: str,
    action: str,
    entity_type: Optional[str] = None,
    entity_id: Optional[Any] = None,
    details: Optional[Any] = None,
    ip_address: Optional[str] = None,
):
    try:
        details_str = None
        if isinstance(details, (dict, list)):
            details_str = json.dumps(details, default=str)
        elif details is not None:
            details_str = str(details)

        audit_entry = AuditLog(
            user_id=user_id,
            user_email=user_email,
            action=action,
            entity_type=entity_type,
            entity_id=str(entity_id) if entity_id is not None else None,
            details=details_str,
            ip_address=ip_address,
        )
        db.add(audit_entry)
        db.commit()
    except Exception as e:
        db.rollback()
        # Non-blocking log failure
        print(f"Failed to record audit log: {e}")
