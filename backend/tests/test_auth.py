def test_login_success(client):
    response = client.post("/api/v1/auth/login", json={"username": "admin", "password": "AdminPass123!"})
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["username"] == "admin"
    assert data["user"]["role"] == "ADMINISTRATOR"


def test_login_invalid_password(client):
    response = client.post("/api/v1/auth/login", json={"username": "admin", "password": "WrongPassword"})
    assert response.status_code == 401


def test_get_me(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "admin"
