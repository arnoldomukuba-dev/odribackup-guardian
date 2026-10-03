# ODRI Backup Guardian Platform

[![Build Status](https://img.shields.io/badge/Status-Production%20Ready-emerald.svg)]()
[![Backend](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Python%203.12-blue.svg)]()
[![Frontend](https://img.shields.io/badge/Frontend-React%2018%20%7C%20Vite%20%7C%20TailwindCSS-sky.svg)]()
[![Database](https://img.shields.io/badge/Database-PostgreSQL%2016-indigo.svg)]()

**ODRI Backup Guardian** is a complete, enterprise-grade infrastructure backup monitoring and compliance platform designed to ensure organization-wide data protection, detect backup failures, monitor overdue jobs, calculate SLA compliance, and execute automated integrity checksum verifications.

---

## 🌟 Key Features

* **Real-time Backup Monitoring**: Automated detection of `Success`, `Failed`, `Missed`, `Overdue`, and `Running` backups.
* **Server Management & Multi-environment Tagging**: Register physical and cloud servers across `Production`, `Staging`, `Development`, and `Disaster Recovery`.
* **Backup Job Execution Engine**: Configure cron backup schedules, target S3/cloud locations, retention policies, and trigger manual "Run Now" execution simulations.
* **Automated Backup Verification**: SHA256 checksum integrity verification, archive existence checking, and corrupt backup detection.
* **Alerts & Notification Dispatch**: Alert center with severity categorization (`Critical`, `High`, `Medium`, `Low`), acknowledgment workflow with remediation notes.
* **Role-Based Access Control (RBAC)**: Secure access tiering with JWT authentication (`ADMINISTRATOR`, `OPERATOR`, `VIEWER`).
* **SLA & Compliance Reporting**: Daily, Weekly, and Monthly backup compliance reports with CSV/JSON export and server rankings.
* **Immutable Audit Trail**: Full event audit logging for login history, server modifications, job updates, and administrative actions.
* **Containerized Architecture**: Production-ready Docker Compose setup with Nginx reverse proxy and PostgreSQL 16.

---

## 🚀 Quick Start (Local Development)

### Prerequisites
* Python 3.12+
* Node.js 20+
* Docker & Docker Compose

### 1. Database & Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Start PostgreSQL database (via Docker)
docker run -d --name odri_pg_dev -e POSTGRES_DB=odribackup -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgrespassword -p 5434:5432 postgres:16-alpine

# Run Alembic migrations & seed initial database records
alembic upgrade head
python -c "from app.core.db import SessionLocal; from app.services.seed_service import seed_database; db = SessionLocal(); seed_database(db); db.close()"

# Run FastAPI backend server
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Navigate to `http://localhost:5173`.

---

## 🔐 Default Demo Accounts

| Role | Username | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `AdminPass123!` | Full system control, User Management, Delete rights |
| **Operator** | `operator` | `OperatorPass123!` | Server & Job CRUD, Run backups, Acknowledge alerts |
| **Viewer** | `viewer` | `ViewerPass123!` | Read-only access to Dashboard, Reports & Logs |

---

## 🐳 Production Deployment with Docker Compose

Run the entire containerized stack (Nginx + React Frontend + FastAPI Backend + PostgreSQL) with a single command:

```bash
docker-compose up -d --build
```
Access the application at: `http://localhost:8080` (or host IP).

---

## 🧪 Running Automated Tests

```bash
cd backend
PYTHONPATH=. ./venv/bin/pytest
```
