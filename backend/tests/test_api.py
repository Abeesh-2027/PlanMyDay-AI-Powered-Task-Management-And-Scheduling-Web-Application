import pytest
from fastapi.testclient import TestClient
from mongomock_motor import AsyncMongoMockClient

import main
from database import get_tasks_collection
from services import openrouter

H = {"X-Username": "alice"}
TASK = {
    "title": "Write report", "description": "Q3", "date": "2026-10-30", "time": "10:00",
    "duration": 60, "priority": "High", "status": "Todo",
}


@pytest.fixture()
def client():
    collection = AsyncMongoMockClient()["planmyday"]["tasks"]
    main.app.dependency_overrides[get_tasks_collection] = lambda: collection
    with TestClient(main.app) as c:
        yield c
    main.app.dependency_overrides.clear()


def create(client, **over):
    r = client.post("/tasks", json={**TASK, **over}, headers=H)
    assert r.status_code == 201, r.text
    return r.json()


def test_requires_user_header(client):
    assert client.get("/tasks").status_code == 401


def test_crud_flow(client):
    t = create(client)
    assert t["title"] == "Write report" and t["created_at"]

    assert client.get(f"/tasks/{t['id']}", headers=H).json()["id"] == t["id"]

    updated = client.put(f"/tasks/{t['id']}", json={**TASK, "title": "Edited", "duration": 90}, headers=H)
    assert updated.status_code == 200 and updated.json()["title"] == "Edited"

    patched = client.patch(f"/tasks/{t['id']}/status", json={"status": "Done"}, headers=H)
    assert patched.json()["status"] == "Done"

    assert client.delete(f"/tasks/{t['id']}", headers=H).status_code == 204
    assert client.get(f"/tasks/{t['id']}", headers=H).status_code == 404


def test_validation_and_errors(client):
    assert client.post("/tasks", json={**TASK, "title": ""}, headers=H).status_code == 422
    assert client.post("/tasks", json={**TASK, "date": "2026-02-31"}, headers=H).status_code == 422
    assert client.post("/tasks", json={**TASK, "priority": "Urgent"}, headers=H).status_code == 422
    assert client.post("/tasks", json={**TASK, "duration": 0}, headers=H).status_code == 422
    assert client.get("/tasks/not-an-id", headers=H).status_code == 400
    assert client.get("/tasks/64b7f0f0f0f0f0f0f0f0f0f0", headers=H).status_code == 404


def test_tasks_are_private_per_user(client):
    t = create(client)
    other = {"X-Username": "bob"}
    assert client.get("/tasks", headers=other).json() == []
    assert client.get(f"/tasks/{t['id']}", headers=other).status_code == 404
    assert client.delete(f"/tasks/{t['id']}", headers=other).status_code == 404


def test_filter_and_sort(client):
    create(client, title="Low later", priority="Low", date="2026-11-02")
    create(client, title="High soon", priority="High", date="2026-10-31", status="In Progress")
    create(client, title="Medium today", priority="Medium", date="2026-10-30")

    by_deadline = [t["title"] for t in client.get("/tasks?sort_by=deadline", headers=H).json()]
    assert by_deadline == ["Medium today", "High soon", "Low later"]
    by_priority = [t["title"] for t in client.get("/tasks?sort_by=priority", headers=H).json()]
    assert by_priority == ["High soon", "Medium today", "Low later"]

    assert len(client.get("/tasks?priority=High", headers=H).json()) == 1
    assert len(client.get("/tasks?status=In Progress", headers=H).json()) == 1
    assert len(client.get("/tasks?date=2026-10-30", headers=H).json()) == 1
    assert len(client.get("/tasks?q=later", headers=H).json()) == 1


def test_progress_endpoint_updates_with_status(client):
    a, b = create(client), create(client, title="Second")
    p = client.get("/progress?date=2026-10-30", headers=H).json()
    assert (p["total"], p["pending"], p["done"], p["completion_percentage"]) == (2, 2, 0, 0)

    client.patch(f"/tasks/{a['id']}/status", json={"status": "Done"}, headers=H)
    client.patch(f"/tasks/{b['id']}/status", json={"status": "In Progress"}, headers=H)
    p = client.get("/progress?date=2026-10-30", headers=H).json()
    assert (p["pending"], p["in_progress"], p["done"], p["completion_percentage"]) == (0, 1, 1, 50)


def test_planner_without_ai_uses_fallback(client):
    create(client, title="Big thing", priority="High", duration=60)
    create(client, title="Small thing", priority="Low", duration=30)
    r = client.post("/ai/generate-schedule", json={"date": "2026-10-30", "start_time": "09:00", "end_time": "12:00"}, headers=H)
    body = r.json()
    assert r.status_code == 200 and body["source"] == "fallback"
    assert body["warning"]
    assert [i["title"] for i in body["schedule"] if i["type"] == "task"] == ["Big thing", "Small thing"]


def test_planner_rejects_bad_window(client):
    r = client.post("/ai/generate-schedule", json={"start_time": "12:00", "end_time": "12:10"}, headers=H)
    assert r.status_code == 422


def test_planner_with_no_tasks(client):
    r = client.post("/ai/generate-schedule", json={"date": "2026-10-30"}, headers=H)
    assert r.status_code == 200 and r.json()["schedule"] == []


def test_planner_uses_ai_when_reply_is_valid(client, monkeypatch):
    t = create(client, title="Focus block", priority="High", duration=60)

    async def fake(payload, regenerate=False):
        return {
            "summary": "AI plan",
            "schedule": [{"type": "task", "task_id": t["id"], "start_time": "09:00", "end_time": "10:00", "reason": "Most important"}],
            "unscheduled": [],
        }, "test/model"

    monkeypatch.setattr(openrouter, "is_configured", lambda: True)
    monkeypatch.setattr(openrouter, "generate_schedule_json", fake)
    body = client.post("/ai/generate-schedule", json={"date": "2026-10-30"}, headers=H).json()
    assert body["source"] == "ai" and body["ai_model"] == "test/model" and body["warning"] is None


def test_planner_falls_back_when_ai_fails_or_is_invalid(client, monkeypatch):
    t = create(client, title="Focus block", priority="High", duration=60)
    monkeypatch.setattr(openrouter, "is_configured", lambda: True)

    async def boom(payload, regenerate=False):
        raise openrouter.OpenRouterError("down")

    monkeypatch.setattr(openrouter, "generate_schedule_json", boom)
    body = client.post("/ai/generate-schedule", json={"date": "2026-10-30"}, headers=H).json()
    assert body["source"] == "fallback" and "unavailable" in body["warning"]

    async def overlapping(payload, regenerate=False):
        return {"schedule": [
            {"type": "task", "task_id": t["id"], "start_time": "09:00", "end_time": "10:00"},
            {"type": "task", "task_id": t["id"], "start_time": "09:30", "end_time": "10:30"},
        ]}, "test/model"

    monkeypatch.setattr(openrouter, "generate_schedule_json", overlapping)
    body = client.post("/ai/generate-schedule", json={"date": "2026-10-30"}, headers=H).json()
    assert body["source"] == "fallback" and "could not be verified" in body["warning"]
