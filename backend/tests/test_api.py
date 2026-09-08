import os

os.environ["DATABASE_URL"] = "sqlite:///./test.db"

from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_create_project_and_list():
    create_response = client.post(
        "/api/projects",
        json={"name": "Demo Project", "description": "benchmark target"},
    )
    assert create_response.status_code == 200
    project_id = create_response.json()["id"]

    list_response = client.get("/api/projects")
    assert list_response.status_code == 200
    assert any(project["id"] == project_id for project in list_response.json())
