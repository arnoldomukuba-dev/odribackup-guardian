def test_list_servers(client, viewer_token):
    headers = {"Authorization": f"Bearer {viewer_token}"}
    response = client.get("/api/v1/servers", headers=headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_create_server_as_operator(client, operator_token):
    headers = {"Authorization": f"Bearer {operator_token}"}
    payload = {
        "name": "test-backup-node-99",
        "host_ip": "10.0.99.1",
        "os": "Ubuntu 22.04",
        "environment": "Production",
        "location": "AWS",
        "description": "Test node for unit test",
        "status": "Active"
    }
    response = client.post("/api/v1/servers", json=payload, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "test-backup-node-99"


def test_create_server_as_viewer_forbidden(client, viewer_token):
    headers = {"Authorization": f"Bearer {viewer_token}"}
    payload = {
        "name": "forbidden-node",
        "host_ip": "10.0.99.2",
        "os": "Debian",
        "environment": "Development",
        "location": "AWS",
        "status": "Active"
    }
    response = client.post("/api/v1/servers", json=payload, headers=headers)
    assert response.status_code == 403
