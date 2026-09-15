# Quimix Simulation Service

Microserviço responsável pelo **motor de simulação de misturas químicas** (volumes e concentração resultante).

Motor de simulação de misturas químicas. Não inclui IoT.

## API

- `GET /health`
- `GET /api/v1/reagents` — catálogo seed local (Fase 1)
- `POST /api/v1/simulations/mixtures` — calcula mistura

OpenAPI: `http://localhost:8001/docs`

## Desenvolvimento

```bash
python -m venv .venv
# Windows: .venv\Scripts\activate
pip install -e ".[dev]"
uvicorn app.main:app --reload --port 8001
pytest -q
```

## Docker

```bash
docker build -t quimix-simulation-service .
docker run -p 8001:8001 quimix-simulation-service
```
