from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.models.server import ServerEnvironment, ServerLocation, ServerStatus


class ServerBase(BaseModel):
    name: str
    host_ip: str
    os: str
    environment: ServerEnvironment = ServerEnvironment.PRODUCTION
    location: ServerLocation = ServerLocation.DATA_CENTER
    description: Optional[str] = None
    status: ServerStatus = ServerStatus.ACTIVE


class ServerCreate(ServerBase):
    pass


class ServerUpdate(BaseModel):
    name: Optional[str] = None
    host_ip: Optional[str] = None
    os: Optional[str] = None
    environment: Optional[ServerEnvironment] = None
    location: Optional[ServerLocation] = None
    description: Optional[str] = None
    status: Optional[ServerStatus] = None


class ServerOut(ServerBase):
    id: int
    last_successful_backup: Optional[datetime] = None
    next_expected_backup: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
