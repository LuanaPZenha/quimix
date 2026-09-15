# Quimix Auth Service

Microserviço de autenticação e autorização (JWT + papéis `aluno` / `professor` / `admin`).

Serviço de autenticação do Quimix.

## Conta admin de testes (seed)

Criada automaticamente na subida do serviço (se ainda não existir):

| Campo | Valor padrão |
|-------|----------------|
| E-mail | `admin@example.com` |
| Senha | `Admin@12345` |
| Papel | `admin` |

Cadastro público com papel `admin` é bloqueado.

## API

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `GET /api/v1/auth/me`
- `GET /health`

OpenAPI: `http://localhost:8002/docs`

## Desenvolvimento

```bash
python -m venv .venv
pip install -e ".[dev]"
uvicorn app.main:app --reload --port 8002
pytest -q
```

Variáveis: ver `.env.example`.
