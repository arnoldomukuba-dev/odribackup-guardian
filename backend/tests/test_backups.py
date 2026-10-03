def test_list_backup_jobs(client, viewer_token):
    headers = {"Authorization": f"Bearer {viewer_token}"}
    response = client.get("/api/v1/backups", headers=headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_trigger_backup_run(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    # List jobs to get valid ID
    jobs_res = client.get("/api/v1/backups", headers=headers)
    jobs = jobs_res.json()
    assert len(jobs) > 0
    job_id = jobs[0]["id"]

    run_res = client.post(f"/api/v1/backups/{job_id}/run", headers=headers)
    assert run_res.status_code == 200
    data = run_res.json()
    assert data["job_id"] == job_id
    assert data["status"] == "Success"
