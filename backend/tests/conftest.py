import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.core.db import Base, get_db
from app.core.config import settings
from app.core.security import get_password_hash, create_access_token
from app.models.user import User, UserRole

# Use Postgres test DB or SQLite for fast unit tests
TEST_DATABASE_URL = settings.DATABASE_URL

engine = create_engine(TEST_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    yield
    # Cleanup after test suite if needed


@pytest.fixture
def db_session():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db_session):
    def _get_test_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = _get_test_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def admin_token(db_session):
    user = db_session.query(User).filter(User.username == "admin").first()
    if not user:
        user = User(
            username="admin",
            email="admin@test.com",
            password_hash=get_password_hash("AdminPass123!"),
            full_name="Admin User",
            role=UserRole.ADMINISTRATOR,
            is_active=True,
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
    return create_access_token(subject=user.id, role=user.role.value)


@pytest.fixture
def operator_token(db_session):
    user = db_session.query(User).filter(User.username == "operator").first()
    if not user:
        user = User(
            username="operator",
            email="operator@test.com",
            password_hash=get_password_hash("OperatorPass123!"),
            full_name="Operator User",
            role=UserRole.OPERATOR,
            is_active=True,
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
    return create_access_token(subject=user.id, role=user.role.value)


@pytest.fixture
def viewer_token(db_session):
    user = db_session.query(User).filter(User.username == "viewer").first()
    if not user:
        user = User(
            username="viewer",
            email="viewer@test.com",
            password_hash=get_password_hash("ViewerPass123!"),
            full_name="Viewer User",
            role=UserRole.VIEWER,
            is_active=True,
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
    return create_access_token(subject=user.id, role=user.role.value)
