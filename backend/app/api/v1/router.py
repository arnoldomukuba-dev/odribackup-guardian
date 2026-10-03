from fastapi import APIRouter
from app.api.v1 import (
    health,
    auth,
    users,
    servers,
    backups,
    backup_runs,
    verifications,
    alerts,
    dashboard,
    reports,
    audit_logs,
)

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(servers.router)
api_router.include_router(backups.router)
api_router.include_router(backup_runs.router)
api_router.include_router(verifications.router)
api_router.include_router(alerts.router)
api_router.include_router(dashboard.router)
api_router.include_router(reports.router)
api_router.include_router(audit_logs.router)
