import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.server import Server, ServerEnvironment, ServerLocation, ServerStatus
from app.models.backup_job import BackupJob, BackupType, JobStatus
from app.models.backup_run import BackupRun, RunStatus
from app.models.verification import BackupVerification, VerificationStatus
from app.models.alert import Alert, AlertType, AlertSeverity
from app.models.audit import AuditLog
from app.models.notification import NotificationSetting


def seed_database(db: Session) -> None:
    # 1. Seed Users if none exist
    if db.query(User).count() == 0:
        admin_user = User(
            username="admin",
            email="admin@odribackup.com",
            password_hash=get_password_hash("AdminPass123!"),
            full_name="System Administrator",
            role=UserRole.ADMINISTRATOR,
            is_active=True,
        )
        operator_user = User(
            username="operator",
            email="operator@odribackup.com",
            password_hash=get_password_hash("OperatorPass123!"),
            full_name="Backup Operator",
            role=UserRole.OPERATOR,
            is_active=True,
        )
        viewer_user = User(
            username="viewer",
            email="viewer@odribackup.com",
            password_hash=get_password_hash("ViewerPass123!"),
            full_name="Audit Viewer",
            role=UserRole.VIEWER,
            is_active=True,
        )
        db.add_all([admin_user, operator_user, viewer_user])
        db.commit()
        print("✓ Users seeded successfully.")

    admin = db.query(User).filter(User.username == "admin").first()

    # 2. Seed Servers if none exist
    if db.query(Server).count() == 0:
        now = datetime.utcnow()
        servers = [
            Server(
                name="prod-db-cluster-01",
                host_ip="10.0.1.15",
                os="Ubuntu 22.04 LTS",
                environment=ServerEnvironment.PRODUCTION,
                location=ServerLocation.AWS,
                description="Primary Postgres database cluster host for main application",
                status=ServerStatus.ACTIVE,
                last_successful_backup=now - timedelta(hours=3),
                next_expected_backup=now + timedelta(hours=21),
            ),
            Server(
                name="prod-app-server-02",
                host_ip="10.0.1.20",
                os="Debian 12",
                environment=ServerEnvironment.PRODUCTION,
                location=ServerLocation.DATA_CENTER,
                description="Application backend server cluster",
                status=ServerStatus.ACTIVE,
                last_successful_backup=now - timedelta(hours=6),
                next_expected_backup=now + timedelta(hours=18),
            ),
            Server(
                name="staging-api-01",
                host_ip="10.0.2.10",
                os="Ubuntu 22.04 LTS",
                environment=ServerEnvironment.STAGING,
                location=ServerLocation.GCP,
                description="Staging API environment host",
                status=ServerStatus.ACTIVE,
                last_successful_backup=now - timedelta(days=1),
                next_expected_backup=now + timedelta(hours=12),
            ),
            Server(
                name="dr-replica-node-01",
                host_ip="192.168.10.50",
                os="Red Hat Enterprise Linux 9",
                environment=ServerEnvironment.DR,
                location=ServerLocation.AZURE,
                description="Disaster recovery standby node",
                status=ServerStatus.MAINTENANCE,
                last_successful_backup=now - timedelta(days=2),
                next_expected_backup=now + timedelta(days=1),
            ),
            Server(
                name="legacy-storage-vault",
                host_ip="172.16.5.12",
                os="CentOS 7",
                environment=ServerEnvironment.PRODUCTION,
                location=ServerLocation.ON_PREMISE,
                description="Legacy NFS archive file server",
                status=ServerStatus.INACTIVE,
                last_successful_backup=now - timedelta(days=5),
                next_expected_backup=now - timedelta(days=2), # Overdue
            ),
        ]
        db.add_all(servers)
        db.commit()
        print("✓ Servers seeded successfully.")

    # Fetch servers
    servers_list = db.query(Server).all()
    srv_db = servers_list[0]
    srv_app = servers_list[1]
    srv_stg = servers_list[2]
    srv_dr = servers_list[3]
    srv_leg = servers_list[4]

    # 3. Seed Backup Jobs if none exist
    if db.query(BackupJob).count() == 0:
        now = datetime.utcnow()
        jobs = [
            BackupJob(
                name="PostgreSQL Full Database Snapshot",
                server_id=srv_db.id,
                backup_type=BackupType.FULL,
                schedule_cron="0 2 * * *",
                schedule_human="Daily at 02:00 UTC",
                destination="s3://odri-backups-vault/prod-db/full/",
                retention_days=60,
                status=JobStatus.ACTIVE,
                last_run_at=now - timedelta(hours=3),
                next_run_at=now + timedelta(hours=21),
                last_backup_size=42949672960,  # ~40 GB
                last_duration_seconds=1420,
            ),
            BackupJob(
                name="PostgreSQL Hourly WAL Logs",
                server_id=srv_db.id,
                backup_type=BackupType.INCREMENTAL,
                schedule_cron="0 * * * *",
                schedule_human="Hourly",
                destination="s3://odri-backups-vault/prod-db/wal/",
                retention_days=14,
                status=JobStatus.ACTIVE,
                last_run_at=now - timedelta(minutes=45),
                next_run_at=now + timedelta(minutes=15),
                last_backup_size=1073741824,   # ~1 GB
                last_duration_seconds=95,
            ),
            BackupJob(
                name="App Data File System Backup",
                server_id=srv_app.id,
                backup_type=BackupType.DIFFERENTIAL,
                schedule_cron="0 3 * * *",
                schedule_human="Daily at 03:00 UTC",
                destination="s3://odri-backups-vault/prod-app/files/",
                retention_days=30,
                status=JobStatus.ACTIVE,
                last_run_at=now - timedelta(hours=6),
                next_run_at=now + timedelta(hours=18),
                last_backup_size=16106127360,  # ~15 GB
                last_duration_seconds=840,
            ),
            BackupJob(
                name="Staging Database Export",
                server_id=srv_stg.id,
                backup_type=BackupType.SNAPSHOT,
                schedule_cron="0 4 * * 0",
                schedule_human="Weekly on Sunday at 04:00 UTC",
                destination="gcp-bucket://stg-backups/snapshots/",
                retention_days=14,
                status=JobStatus.ACTIVE,
                last_run_at=now - timedelta(days=1),
                next_run_at=now + timedelta(days=6),
                last_backup_size=8589934592,   # ~8 GB
                last_duration_seconds=420,
            ),
            BackupJob(
                name="Legacy Storage Vault Monthly Archive",
                server_id=srv_leg.id,
                backup_type=BackupType.FULL,
                schedule_cron="0 0 1 * *",
                schedule_human="Monthly on 1st at 00:00 UTC",
                destination="/mnt/nas/archives/legacy/",
                retention_days=365,
                status=JobStatus.DISABLED,
                last_run_at=now - timedelta(days=5),
                next_run_at=now - timedelta(days=2),
                last_backup_size=107374182400, # ~100 GB
                last_duration_seconds=3600,
                last_error_message="Storage mount failed: No route to host 172.16.5.12",
            ),
        ]
        db.add_all(jobs)
        db.commit()
        print("✓ Backup Jobs seeded successfully.")

    jobs_list = db.query(BackupJob).all()

    # 4. Seed Backup Runs if none exist
    if db.query(BackupRun).count() == 0:
        now = datetime.utcnow()
        runs = []

        # Successful runs
        for j in jobs_list[:3]:
            for i in range(3):
                run_start = now - timedelta(hours=(i+1)*8)
                run_end = run_start + timedelta(seconds=random.randint(100, 1200))
                runs.append(BackupRun(
                    job_id=j.id,
                    server_id=j.server_id,
                    start_time=run_start,
                    end_time=run_end,
                    duration_seconds=int((run_end - run_start).total_seconds()),
                    status=RunStatus.SUCCESS,
                    size_bytes=j.last_backup_size + random.randint(-1000000, 1000000),
                    backup_location=f"{j.destination}run_{run_start.strftime('%Y%m%d_%H%M%S')}.tar.gz",
                ))

        # Failed run
        failed_start = now - timedelta(hours=5)
        runs.append(BackupRun(
            job_id=jobs_list[0].id,
            server_id=jobs_list[0].server_id,
            start_time=failed_start,
            end_time=failed_start + timedelta(seconds=120),
            duration_seconds=120,
            status=RunStatus.FAILED,
            size_bytes=0,
            error_message="Connection reset by peer during chunk transmission",
            backup_location=f"{jobs_list[0].destination}run_failed.tmp",
        ))

        # Missed/Overdue run
        overdue_start = now - timedelta(days=2)
        runs.append(BackupRun(
            job_id=jobs_list[4].id,
            server_id=jobs_list[4].server_id,
            start_time=overdue_start,
            end_time=None,
            duration_seconds=0,
            status=RunStatus.OVERDUE,
            size_bytes=0,
            error_message="Scheduled execution missed: Server un-reachable",
        ))

        db.add_all(runs)
        db.commit()
        print("✓ Backup Runs seeded successfully.")

    runs_list = db.query(BackupRun).all()

    # 5. Seed Verifications if none exist
    if db.query(BackupVerification).count() == 0:
        verifications = []
        for r in runs_list:
            if r.status == RunStatus.SUCCESS:
                verifications.append(BackupVerification(
                    run_id=r.id,
                    job_id=r.job_id,
                    existence_checked=True,
                    checksum_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                    verification_status=VerificationStatus.VERIFIED,
                    notes="Checksum verified and header signature validated successfully.",
                    verified_at=r.start_time + timedelta(minutes=15),
                ))
            elif r.status == RunStatus.FAILED:
                verifications.append(BackupVerification(
                    run_id=r.id,
                    job_id=r.job_id,
                    existence_checked=False,
                    checksum_hash=None,
                    verification_status=VerificationStatus.FAILED,
                    notes="Archive payload file does not exist on storage destination.",
                    verified_at=r.start_time + timedelta(minutes=5),
                ))
            elif r.status in [RunStatus.RUNNING, RunStatus.OVERDUE]:
                verifications.append(BackupVerification(
                    run_id=r.id,
                    job_id=r.job_id,
                    existence_checked=False,
                    checksum_hash=None,
                    verification_status=VerificationStatus.PENDING,
                    notes="Awaiting job completion for integrity verification.",
                    verified_at=r.start_time,
                ))

        db.add_all(verifications)
        db.commit()
        print("✓ Verifications seeded successfully.")

    # 6. Seed Alerts if none exist
    if db.query(Alert).count() == 0:
        now = datetime.utcnow()
        alerts = [
            Alert(
                type=AlertType.BACKUP_FAILURE,
                severity=AlertSeverity.CRITICAL,
                title="PostgreSQL Backup Chunk Transmission Failed",
                message="Backup execution for PostgreSQL Full Database Snapshot failed: Connection reset by peer during chunk transmission.",
                server_id=srv_db.id,
                job_id=jobs_list[0].id,
                is_acknowledged=False,
                created_at=now - timedelta(hours=5),
            ),
            Alert(
                type=AlertType.OVERDUE_BACKUP,
                severity=AlertSeverity.HIGH,
                title="Legacy Archive Job Execution Overdue",
                message="Job Legacy Storage Vault Monthly Archive has missed its scheduled execution window by 2 days.",
                server_id=srv_leg.id,
                job_id=jobs_list[4].id,
                is_acknowledged=True,
                acknowledged_by=admin.id if admin else None,
                acknowledged_at=now - timedelta(hours=12),
                resolution_note="Acknowledged. Server network card is scheduled for hardware replacement.",
                created_at=now - timedelta(days=2),
            ),
            Alert(
                type=AlertType.STORAGE_WARNING,
                severity=AlertSeverity.MEDIUM,
                title="Backup Vault Storage Reaching 85% Capacity",
                message="Destination s3://odri-backups-vault storage usage exceeded warning threshold (85.4% used).",
                server_id=srv_app.id,
                job_id=jobs_list[2].id,
                is_acknowledged=False,
                created_at=now - timedelta(hours=1),
            ),
        ]
        db.add_all(alerts)
        db.commit()
        print("✓ Alerts seeded successfully.")

    # 7. Seed Audit Logs if none exist
    if db.query(AuditLog).count() == 0:
        now = datetime.utcnow()
        logs = [
            AuditLog(
                user_id=admin.id if admin else None,
                user_email="admin@odribackup.com",
                action="INITIALIZE_SYSTEM",
                entity_type="System",
                entity_id="1",
                details='{"status": "System initialized successfully"}',
                ip_address="127.0.0.1",
                created_at=now - timedelta(days=3),
            ),
            AuditLog(
                user_id=admin.id if admin else None,
                user_email="admin@odribackup.com",
                action="CREATE_SERVER",
                entity_type="Server",
                entity_id=str(srv_db.id),
                details=f'{{"server_name": "{srv_db.name}", "ip": "{srv_db.host_ip}"}}',
                ip_address="127.0.0.1",
                created_at=now - timedelta(days=2),
            ),
            AuditLog(
                user_id=admin.id if admin else None,
                user_email="admin@odribackup.com",
                action="ACKNOWLEDGE_ALERT",
                entity_type="Alert",
                entity_id="2",
                details='{"resolution": "Server network card hardware replacement scheduled"}',
                ip_address="127.0.0.1",
                created_at=now - timedelta(hours=12),
            ),
        ]
        db.add_all(logs)
        db.commit()
        print("✓ Audit Logs seeded successfully.")
