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


def _register(email: str, role: str, name: str) -> dict:
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": "senha12345",
            "full_name": name,
            "role": role,
        },
    )
    assert response.status_code == 201, response.text
    return response.json()


def test_learn_progress_discovery_and_mission():
    aluno = _register("aluno-learn@example.com", "aluno", "Ana Aprende")
    headers = {"Authorization": f"Bearer {aluno['access_token']}"}

    progress = client.get("/api/v1/learn/progress", headers=headers)
    assert progress.status_code == 200, progress.text
    assert progress.json()["unlocked_symbols"] == ["H", "O", "Na", "Cl", "C", "N"]
    assert progress.json()["trail_free"] is False

    water = client.post(
        "/api/v1/learn/discoveries",
        headers=headers,
        json={
            "formula": "H2O",
            "name": "Água",
            "equation": "2 H + O -> H2O",
            "kind": "water",
            "effect": "none",
            "caption": "água",
            "prediction_kind": "water",
            "prediction_effect": "none",
            "volume_ml": 100,
            "solutes": [],
        },
    )
    assert water.status_code == 200, water.text
    assert water.json()["grade"] == "hit"
    assert water.json()["new_card"] is True
    assert water.json()["progress"]["streak"] == 1
    assert "agua" in water.json()["cleared_challenge_ids"]
    assert "K" not in water.json()["progress"]["unlocked_symbols"]

    partial = client.post(
        "/api/v1/learn/discoveries",
        headers=headers,
        json={
            "formula": "H2O",
            "name": "Água",
            "equation": "2 H + O -> H2O",
            "kind": "water",
            "effect": "none",
            "prediction_kind": "water",
            "prediction_effect": "explode",
            "volume_ml": 100,
            "solutes": [],
        },
    )
    assert partial.json()["grade"] == "partial"
    assert partial.json()["new_card"] is False
    assert partial.json()["progress"]["streak"] == 1

    salt = client.post(
        "/api/v1/learn/discoveries",
        headers=headers,
        json={
            "formula": "NaCl",
            "name": "Cloreto de sódio",
            "equation": "Na + Cl -> NaCl",
            "kind": "salt",
            "effect": "none",
            "prediction_kind": "gas",
            "prediction_effect": "explode",
            "volume_ml": 100,
            "solutes": [
                {"formula": "Na", "resulting_concentration_mol_l": 0.5},
                {"formula": "Cl", "resulting_concentration_mol_l": 0.5},
            ],
        },
    )
    assert salt.json()["grade"] == "miss"
    assert salt.json()["progress"]["streak"] == 0
    assert "K" in salt.json()["progress"]["unlocked_symbols"]
    assert "sal" in salt.json()["cleared_challenge_ids"]
    assert "sal-meio" in salt.json()["cleared_challenge_ids"]

    denied = client.post(
        "/api/v1/learn/missions",
        headers=headers,
        json={"title": "Faça sal", "brief": "Obtenha NaCl na bancada.", "kind": "product", "target_formula": "NaCl"},
    )
    assert denied.status_code == 403

    professor = _register("prof-learn@example.com", "professor", "Prof Química")
    prof_headers = {"Authorization": f"Bearer {professor['access_token']}"}
    mission = client.post(
        "/api/v1/learn/missions",
        headers=prof_headers,
        json={
            "title": "Faça sal",
            "brief": "Obtenha cloreto de sódio.",
            "kind": "product",
            "target_formula": "NaCl",
        },
    )
    assert mission.status_code == 201, mission.text
    mission_id = mission.json()["id"]

    attempt = client.post(
        f"/api/v1/learn/missions/{mission_id}/attempts",
        headers=headers,
        json={
            "formula": "NaCl",
            "name": "Cloreto de sódio",
            "kind": "salt",
            "effect": "none",
            "note": "Juntei sódio e cloro.",
            "volume_ml": 100,
            "solutes": [],
        },
    )
    assert attempt.status_code == 200, attempt.text
    assert attempt.json()["correct"] is True

    listed = client.get("/api/v1/learn/missions", headers=prof_headers)
    found = next(item for item in listed.json() if item["id"] == mission_id)
    assert found["attempts"][0]["student_name"] == "Ana Aprende"
    assert found["attempts"][0]["correct"] is True

    aluno_list = client.get("/api/v1/learn/missions", headers=headers)
    own = next(item for item in aluno_list.json() if item["id"] == mission_id)
    assert own["attempts"] == []
    assert own["my_attempt"]["correct"] is True


def test_starter_missions_are_ready_to_play():
    aluno = _register("aluno-missoes@example.com", "aluno", "Bia Missao")
    headers = {"Authorization": f"Bearer {aluno['access_token']}"}
    listed = client.get("/api/v1/learn/missions", headers=headers)
    assert listed.status_code == 200, listed.text
    ids = [item["id"] for item in listed.json()]
    assert ids[0] == "lab-agua"
    assert "lab-sal-meio" in ids
    assert "lab-tnt" in ids
    assert ids.index("lab-agua") < ids.index("lab-tnt")

    water = client.post(
        "/api/v1/learn/missions/lab-agua/attempts",
        headers=headers,
        json={
            "formula": "H2O",
            "name": "Água",
            "kind": "water",
            "effect": "none",
            "note": "Hidrogênio e oxigênio.",
            "volume_ml": 100,
            "solutes": [],
        },
    )
    assert water.status_code == 200, water.text
    assert water.json()["correct"] is True

    ch4 = next(item for item in listed.json() if item["id"] == "lab-ch4")
    assert "CH4" not in ch4["brief"]
    assert "metano" not in ch4["brief"].lower()
    assert ch4["target_formula"] is None

    fogao = client.post(
        "/api/v1/learn/missions/lab-ch4/attempts",
        headers=headers,
        json={
            "formula": "CH4",
            "name": "Metano",
            "kind": "gas",
            "effect": "none",
            "volume_ml": 80,
            "solutes": [],
        },
    )
    assert fogao.status_code == 200, fogao.text
    assert fogao.json()["correct"] is True

    wrong = client.post(
        "/api/v1/learn/missions/lab-agua/attempts",
        headers=headers,
        json={
            "formula": "NaCl",
            "name": "Cloreto de sódio",
            "kind": "salt",
            "effect": "none",
            "volume_ml": 100,
            "solutes": [],
        },
    )
    assert wrong.json()["correct"] is False
