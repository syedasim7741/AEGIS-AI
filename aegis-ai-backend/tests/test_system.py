from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_root_endpoint() -> None:
    response = client.get("/")

    assert response.status_code == 200

    payload = response.json()

    assert payload["status"] == "running"
    assert payload["application"] == "AEGIS AI API"
    assert payload["documentation"] == "/docs"


def test_health_endpoint() -> None:
    response = client.get("/health")

    assert response.status_code == 200

    payload = response.json()

    assert payload["status"] == "healthy"
    assert payload["application"] == "AEGIS AI API"
    assert "version" in payload


def test_health_endpoint_hidden_from_openapi() -> None:
    response = client.get("/openapi.json")

    assert response.status_code == 200

    paths = response.json()["paths"]

    assert "/" in paths
    assert "/health" not in paths
