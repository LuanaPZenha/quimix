import os
from pathlib import Path

os.environ["DATABASE_URL"] = "sqlite:///./test_auth.db"
os.environ["JWT_SECRET"] = "test-secret-key-for-unit-tests-only"

db_path = Path("test_auth.db")
if db_path.exists():
    db_path.unlink()

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["service"] == "quimix-auth-service"


def test_register_login_me_flow():
    register = client.post(
        "/api/v1/auth/register",
        json={
            "email": "aluno@example.com",
            "password": "senha12345",
            "full_name": "Aluno Teste",
            "role": "aluno",
        },
    )
    assert register.status_code == 201, register.text
    body = register.json()
    assert body["token_type"] == "bearer"
    assert body["user"]["role"] == "aluno"
    access = body["access_token"]

    me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {access}"})
    assert me.status_code == 200
    assert me.json()["email"] == "aluno@example.com"

    login = client.post(
        "/api/v1/auth/login",
        json={"email": "aluno@example.com", "password": "senha12345"},
    )
    assert login.status_code == 200
    assert login.json()["user"]["full_name"] == "Aluno Teste"


def test_register_professor():
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "prof@example.com",
            "password": "senha12345",
            "full_name": "Prof Teste",
            "role": "professor",
        },
    )
    assert response.status_code == 201, response.text
    assert response.json()["user"]["role"] == "professor"


def test_duplicate_email_conflict():
    payload = {
        "email": "dup@example.com",
        "password": "senha12345",
        "full_name": "Dup",
        "role": "aluno",
    }
    assert client.post("/api/v1/auth/register", json=payload).status_code == 201
    assert client.post("/api/v1/auth/register", json=payload).status_code == 409


def test_login_invalid_credentials():
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "missing@example.com", "password": "senha12345"},
    )
    assert response.status_code == 401


def test_refresh_token():
    register = client.post(
        "/api/v1/auth/register",
        json={
            "email": "refresh@example.com",
            "password": "senha12345",
            "full_name": "Refresh",
            "role": "aluno",
        },
    )
    assert register.status_code == 201, register.text
    refresh = register.json()["refresh_token"]
    response = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh})
    assert response.status_code == 200
    assert response.json()["access_token"]


def test_seed_admin_can_login():
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@example.com", "password": "Admin@12345"},
    )
    assert response.status_code == 200, response.text
    assert response.json()["user"]["role"] == "admin"
    assert response.json()["user"]["email"] == "admin@example.com"


def test_public_register_as_admin_is_blocked():
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "hacker@example.com",
            "password": "senha12345",
            "full_name": "Hacker",
            "role": "admin",
        },
    )
    assert response.status_code == 400
    assert "admin" in response.json()["detail"].lower()
