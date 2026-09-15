# Quimix Infra

Orquestração local do ecossistema Quimix. Esta pasta **não** contém regra de negócio — apenas Compose, variáveis de ambiente e documentação.

## Pastas do projeto

```
Quimix/
  quimix-infra/
  quimix-api-gateway/
  quimix-auth-service/
  quimix-simulation-service/
  quimix-web/
  # próximos:
  # quimix-catalog-service/
  # quimix-experiment-service/
  # quimix-periodic-table-service/
```

## Subir o ambiente

```bash
cp .env.example .env
docker compose up --build
```

- Web: http://localhost:5173
- Gateway: http://localhost:8000/docs
- Auth: http://localhost:8002/docs
- Simulation: http://localhost:8001/docs

## Testes

```bash
cd ../quimix-auth-service && python -m pytest -q
cd ../quimix-simulation-service && python -m pytest -q
cd ../quimix-api-gateway && python -m pytest -q
cd ../quimix-web && npm test
```
