import pytest
import tempfile
import os
import sqlite3
from fastapi.testclient import TestClient

from app.main import app
from app.core.config import settings
from app.core.database import get_db, init_db

@pytest.fixture(scope="session", autouse=True)
def test_db_setup():
    """Ensure database tables exist for tests."""
    init_db()

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c

def test_health_check(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "Recallix" in data["service"]
    assert data["database"] == "connected"
    assert "uptime_seconds" in data
    assert data["version"] == settings.VERSION

def test_list_lectures(client):
    response = client.get("/api/v1/lectures")
    assert response.status_code == 200
    lectures = response.json()
    assert isinstance(lectures, list)
    assert len(lectures) >= 1

def test_create_and_get_lecture(client):
    payload = {
        "title": "Quantum Computing & Superposition",
        "subject": "Quantum Physics",
        "raw_notes": "Qubits exist in superposition states alpha|0> + beta|1>. Hadamard gates create equal superposition. Entanglement produces EPR pairs."
    }
    create_res = client.post("/api/v1/lectures", json=payload)
    assert create_res.status_code == 201
    created_data = create_res.json()
    assert created_data["title"] == payload["title"]
    assert created_data["subject"] == payload["subject"]
    assert "id" in created_data
    assert len(created_data["key_concepts"]) > 0
    assert len(created_data["action_items"]) > 0

    lecture_id = created_data["id"]

    # Retrieve by ID
    get_res = client.get(f"/api/v1/lectures/{lecture_id}")
    assert get_res.status_code == 200
    retrieved = get_res.json()
    assert retrieved["id"] == lecture_id
    assert retrieved["title"] == payload["title"]

def test_create_lecture_validation_error(client):
    # Invalid: missing title and raw_notes too short
    payload = {
        "title": "",
        "subject": "Math",
        "raw_notes": "123"
    }
    response = client.post("/api/v1/lectures", json=payload)
    assert response.status_code == 422

def test_get_lecture_not_found(client):
    response = client.get("/api/v1/lectures/non-existent-id-999")
    assert response.status_code == 404

def test_toggle_task_completion(client):
    # Create lecture first
    payload = {
        "title": "Operating Systems & Synchronization",
        "subject": "Computer Science",
        "raw_notes": "Semaphores, mutexes, condition variables, and dining philosophers synchronization problem."
    }
    create_res = client.post("/api/v1/lectures", json=payload)
    assert create_res.status_code == 201
    lec = create_res.json()
    task_id = lec["action_items"][0]["id"]
    lec_id = lec["id"]

    # Toggle task to completed: true
    patch_res = client.patch(
        f"/api/v1/lectures/{lec_id}/tasks/{task_id}",
        json={"completed": True}
    )
    assert patch_res.status_code == 200
    updated_lec = patch_res.json()
    updated_task = next(t for t in updated_lec["action_items"] if t["id"] == task_id)
    assert updated_task["completed"] is True

def test_toggle_task_not_found(client):
    response = client.patch(
        "/api/v1/lectures/non-existent-lec/tasks/task-999",
        json={"completed": True}
    )
    assert response.status_code == 404
