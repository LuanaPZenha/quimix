from datetime import UTC, datetime, timedelta

import jwt
from fastapi.testclient import TestClient

from app.config import settings
from app.main import app

client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_security_headers_present():
    response = client.get("/health")
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["X-Frame-Options"] == "DENY"
    assert "Content-Security-Policy" in response.headers


def test_gateway_info():
    response = client.get("/api/v1/gateway/info")
    assert response.status_code == 200
    upstream = response.json()["upstream"]
    assert "simulation" in upstream
    assert "auth" in upstream


def test_unknown_route_returns_404():
    response = client.get("/api/v1/does-not-exist")
    assert response.status_code == 404


def test_simulation_requires_login():
    response = client.get("/api/v1/reagents")
    assert response.status_code == 401
    assert "Login obrigatório" in response.json()["detail"]


def test_mixture_requires_login():
    response = client.post(
        "/api/v1/simulations/mixtures",
        json={"components": [{"reagent_id": "hcl-1m", "volume_ml": 10}]},
    )
    assert response.status_code == 401


def test_simulation_rejects_invalid_token():
    response = client.get(
        "/api/v1/reagents",
        headers={"Authorization": "Bearer not-a-real-token"},
    )
    assert response.status_code == 401


def _make_access_token() -> str:
    now = datetime.now(UTC)
    payload = {
        "sub": "user-1",
        "email": "aluno@example.com",
        "role": "aluno",
        "type": "access",
        "iat": now,
        "exp": now + timedelta(minutes=30),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def test_simulation_accepts_valid_token_shape():
    # Sem upstream real no teste unitário: token válido passa da auth e pode dar 502
    token = _make_access_token()
    response = client.get(
        "/api/v1/reagents",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code != 401
