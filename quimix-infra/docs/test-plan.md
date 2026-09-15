# Plano de testes Quimix

## Por repositório

Cada serviço roda sua suíte isolada.

| Repo | Ferramenta | Escopo |
|------|------------|--------|
| quimix-simulation-service | pytest | unit (domínio) + integration (API) |
| quimix-api-gateway | pytest | proxy, headers, rate limit |
| quimix-web | Vitest | helpers / componentes |
| quimix-auth-service | pytest | unit (JWT/senha) + integration (register/login/me) |
| auth/catalog/experiment/periodic (restante Fase 2) | pytest | unit + integration |

## Como rodar

```bash
cd ../quimix-auth-service && python -m pytest -q
cd ../quimix-simulation-service && python -m pytest -q
cd ../quimix-api-gateway && python -m pytest -q
cd ../quimix-web && npm test
```

## Critério de aceite auth

- Registro com papéis `aluno` / `professor`
- Login retorna access + refresh JWT
- `GET /api/v1/auth/me` exige Bearer válido
- Rotas de auth acessíveis via gateway