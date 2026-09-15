# Quimix

Plataforma de laboratório virtual de química (TCC). Este repositório reúne a infraestrutura local e os serviços da Fase 1.

## Estrutura

| Pasta | Função |
|-------|--------|
| `quimix-infra` | Docker Compose e documentação |
| `quimix-auth-service` | Autenticação JWT (aluno/professor) |
| `quimix-simulation-service` | Motor de misturas |
| `quimix-api-gateway` | Gateway / OWASP |
| `quimix-web` | Frontend React |

## Subir o ambiente

```bash
cd quimix-infra
cp .env.example .env
docker compose up --build
```

- Web: http://localhost:5173
- Gateway: http://localhost:8000/docs
- Auth: http://localhost:8002/docs
- Simulation: http://localhost:8001/docs

## Testes

```bash
cd quimix-auth-service && python -m pytest -q
cd quimix-simulation-service && python -m pytest -q
cd quimix-api-gateway && python -m pytest -q
cd quimix-web && npm test
```
