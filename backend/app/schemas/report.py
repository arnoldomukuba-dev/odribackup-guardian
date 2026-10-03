from typing import List, Dict, Any, Optional
from pydantic import BaseModel


class ComplianceReport(BaseModel):
    total_servers: int
    backed_up_servers: int
    compliance_rate: float
    total_jobs: int
    active_jobs: int
    disabled_jobs: int
    sla_met_count: int
    sla_missed_count: int


class VerificationReport(BaseModel):
    total_verifications: int
    verified_count: int
    failed_count: int
    pending_count: int
    integrity_pass_rate: float


class ReportSummary(BaseModel):
    period: str  # Daily, Weekly, Monthly
    generated_at: str
    compliance: ComplianceReport
    verification: VerificationReport
    server_rankings: List[Dict[str, Any]]
