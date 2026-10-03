FROM python:3.12-slim

WORKDIR /app

# Prevent Python from writing pyc files to disc
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY . .

# Expose FastAPI port
EXPOSE 8000

# Start script running alembic migrations and uvicorn
CMD ["sh", "-c", "alembic upgrade head && python -c 'from app.core.db import SessionLocal; from app.services.seed_service import seed_database; db = SessionLocal(); seed_database(db); db.close()' && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
