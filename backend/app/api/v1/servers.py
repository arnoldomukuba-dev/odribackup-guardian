from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.core.db import get_db
from app.core.deps import get_current_user, require_roles
from app.core.audit import log_audit
from app.models.user import User, UserRole
from app.models.server import Server, ServerEnvironment, ServerLocation, ServerStatus
from app.schemas.server import ServerOut, ServerCreate, ServerUpdate

router = APIRouter(prefix="/servers", tags=["Servers"])


@router.get("", response_model=List[ServerOut])
def list_servers(
    search: Optional[str] = None,
    environment: Optional[ServerEnvironment] = None,
    location: Optional[ServerLocation] = None,
    status: Optional[ServerStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Server)
    if search:
        query = query.filter(
            (Server.name.ilike(f"%{search}%")) |
            (Server.host_ip.ilike(f"%{search}%")) |
            (Server.os.ilike(f"%{search}%"))
        )
    if environment:
        query = query.filter(Server.environment == environment)
    if location:
        query = query.filter(Server.location == location)
    if status:
        query = query.filter(Server.status == status)

    return query.order_by(Server.id.desc()).all()


@router.get("/{server_id}", response_model=ServerOut)
def get_server(
    server_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    server = db.query(Server).filter(Server.id == server_id).first()
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")
    return server


@router.post("", response_model=ServerOut, status_code=status.HTTP_201_CREATED)
def create_server(
    server_in: ServerCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMINISTRATOR, UserRole.OPERATOR]))
):
    server = Server(
        name=server_in.name,
        host_ip=server_in.host_ip,
        os=server_in.os,
        environment=server_in.environment,
        location=server_in.location,
        description=server_in.description,
        status=server_in.status,
    )
    db.add(server)
    db.commit()
    db.refresh(server)

    client_ip = request.client.host if request.client else None
    log_audit(db, current_user.id, current_user.email, "CREATE_SERVER", "Server", server.id, details={"name": server.name, "host_ip": server.host_ip}, ip_address=client_ip)

    return server


@router.put("/{server_id}", response_model=ServerOut)
def update_server(
    server_id: int,
    server_in: ServerUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMINISTRATOR, UserRole.OPERATOR]))
):
    server = db.query(Server).filter(Server.id == server_id).first()
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")

    update_data = server_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(server, field, value)

    db.commit()
    db.refresh(server)

    client_ip = request.client.host if request.client else None
    log_audit(db, current_user.id, current_user.email, "UPDATE_SERVER", "Server", server.id, details=update_data, ip_address=client_ip)

    return server


@router.post("/{server_id}/deactivate", response_model=ServerOut)
def deactivate_server(
    server_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMINISTRATOR, UserRole.OPERATOR]))
):
    server = db.query(Server).filter(Server.id == server_id).first()
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")

    server.status = ServerStatus.INACTIVE
    db.commit()
    db.refresh(server)

    client_ip = request.client.host if request.client else None
    log_audit(db, current_user.id, current_user.email, "DEACTIVATE_SERVER", "Server", server.id, details={"name": server.name}, ip_address=client_ip)

    return server


@router.delete("/{server_id}")
def delete_server(
    server_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMINISTRATOR]))
):
    server = db.query(Server).filter(Server.id == server_id).first()
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")

    db.delete(server)
    db.commit()

    client_ip = request.client.host if request.client else None
    log_audit(db, current_user.id, current_user.email, "DELETE_SERVER", "Server", server_id, details={"name": server.name}, ip_address=client_ip)

    return {"message": "Server deleted successfully"}
