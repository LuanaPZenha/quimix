# Quimix API Gateway

Gateway HTTP do ecossistema Quimix. Responsável por:

- Roteamento para microserviços internos
- CORS
- Rate limiting
- Headers de segurança (OWASP)

Gateway HTTP do Quimix.

## Desenvolvimento

```bash
python -m venv .venv
pip install -e ".[dev]"
uvicorn app.main:app --reload --port 8000
pytest -q
```

## Rotas Fase 1

- `GET /health`
- `GET /api/v1/reagents` → simulation-service
- `POST /api/v1/simulations/mixtures` → simulation-service
