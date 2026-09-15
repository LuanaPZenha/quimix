from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_list_reagents():
    response = client.get("/api/v1/reagents")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 4
    assert {"id", "name", "formula", "concentration_mol_l"} <= set(data[0].keys())


def test_simulate_mixture_success():
    response = client.post(
        "/api/v1/simulations/mixtures",
        json={
            "components": [
                {"reagent_id": "hcl-1m", "volume_ml": 50},
                {"reagent_id": "water", "volume_ml": 50},
            ]
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["total_volume_ml"] == 100
    assert any(s["reagent_id"] == "hcl-1m" for s in body["solutes"])
    assert body["logs"]


def test_simulate_mixture_unknown_reagent():
    response = client.post(
        "/api/v1/simulations/mixtures",
        json={"components": [{"reagent_id": "unknown", "volume_ml": 10}]},
    )
    assert response.status_code == 400


def test_simulate_element_mixture():
    response = client.post(
        "/api/v1/simulations/mixtures",
        json={
            "components": [
                {"reagent_id": "el-H", "volume_ml": 50},
                {"reagent_id": "el-O", "volume_ml": 50},
            ]
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["total_volume_ml"] == 100
    assert {s["formula"] for s in body["solutes"]} >= {"H", "O"}
