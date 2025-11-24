from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_chat_valid_request_returns_answer():
    payload = {
        "message": "¿Cómo se hace un ciclo for en C++?",
        "thread_id": "thread_01"
    }

    resp = client.post("/chat", json=payload)

    assert resp.status_code == 200
    data = resp.json()
    assert "reply" in data
    assert isinstance(data["reply"], str)


def test_chat_missing_required_field_returns_422():
    payload = {}

    resp = client.post("/chat", json=payload)

    assert resp.status_code == 422
