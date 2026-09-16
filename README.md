# Quimix

Laboratório virtual de química. O Quimix permite misturar elementos e compostos, ver o produto no béquer e acompanhar volumes, concentrações e logs — sem gastar reagente real.

O projeto é um TCC: uma plataforma didática em microserviços, com frontend React e APIs FastAPI atrás de um gateway. A Fase 1 cobre autenticação JWT, simulação de misturas (volumes e concentração) e a bancada visual no navegador.

## Sumário

1. [O que o Quimix ensina](#o-que-o-quimix-ensina)
2. [Arquitetura](#arquitetura)
3. [Estrutura do repositório](#estrutura-do-repositório)
4. [Stack](#stack)
5. [Pré-requisitos](#pré-requisitos)
6. [Subir o ambiente com Docker](#subir-o-ambiente-com-docker)
7. [Rodar cada serviço localmente](#rodar-cada-serviço-localmente)
8. [Variáveis de ambiente](#variáveis-de-ambiente)
9. [Contas e papéis](#contas-e-papéis)
10. [Frontend (`quimix-web`)](#frontend-quimix-web)
11. [Motor de identificação de misturas](#motor-de-identificação-de-misturas)
12. [Parser de fórmulas e unidades](#parser-de-fórmulas-e-unidades)
13. [Auth Service](#auth-service)
14. [Simulation Service](#simulation-service)
15. [API Gateway](#api-gateway)
16. [Contratos HTTP](#contratos-http)
17. [Banco de dados](#banco-de-dados)
18. [Segurança](#segurança)
19. [Testes](#testes)
20. [Fluxo de uma simulação](#fluxo-de-uma-simulação)
21. [Próximas fases](#próximas-fases)
22. [Autores](#autores)

---

## O que o Quimix ensina

A bancada não é um “efeito especial”. O produto químico e o espetáculo visual são coisas diferentes.

| Conceito | O que significa na tela |
|----------|-------------------------|
| **Produto** (`kind`) | O que a mistura *é*: água, ácido, base, sal, gás, óxido, liga, orgânico, mineral, pó, gelo ou mistura genérica. |
| **Efeito** (`effect`) | O que acontece *só quando a química exige*: nada, explosão, derretimento do vidro, congelamento ou ignição. |

Regras didáticas:

- Pólvora, TNT, RDX, PETN, ANFO, termite e napalm aparecem como substância (pó ou gel). Misturar não é o mesmo que detonar ou atear fogo.
- Explosão, chama, derretimento e geada só ligam quando a reação realmente é violenta no contato (metal alcalino na água, HF atacando o vidro, compostos instáveis como nitroglicerina ou XeO₃, gases pirofóricos, reação fortemente endotérmica).
- Se a mistura é perigosa, o béquer mostra o efeito **e** uma caixa `why` com a explicação.
- Colocar o produto pronto (por exemplo NaOH, pólvora já como fórmula) não dispara o efeito da *formação*. Soda cáustica pronta não explode; sódio metálico na água explode e vira hidróxido.
- Ácidos comuns (HCl, H₂SO₄) não derretem o béquer. Só o HF ataca a sílica do vidro.

O backend de simulação **não** modela reação química: ele soma volumes e recalcula concentração (mol/L). O nome do composto, a equação, a cor, o tema e o efeito vêm do identificador no frontend.

---

## Arquitetura

Cada pasta de serviço é independente. `quimix-infra` só orquestra Docker, variáveis e documentação. Comunicação entre peças: HTTP/JSON. OpenAPI em `/docs` em cada API.

```
Navegador (quimix-web :5173)
        │
        │  JWT no header Authorization
        ▼
API Gateway (:8000)
  CORS · rate limit · headers OWASP
  valida access token nas rotas de simulação
        │
        ├── Auth Service (:8002)  → Postgres `quimix_auth`
        └── Simulation Service (:8001)  → Postgres `quimix_simulation`
              (catálogo seed em memória na Fase 1)
```

Padrão interno de cada microserviço Python: **Clean Architecture**

```
domain        → modelos e regras puras
application   → casos de uso
infrastructure→ banco, catálogo, JWT, seed
api           → rotas FastAPI e schemas Pydantic
```

O navegador nunca fala direto com auth ou simulation em produção local via Compose: tudo passa pelo gateway em `http://localhost:8000`.

---

## Estrutura do repositório

```
Quimix/
├── README.md                          ← este guia
├── quimix-infra/                      orquestração local (sem regra de negócio)
│   ├── docker-compose.yml
│   ├── .env.example
│   ├── docker/postgres/init.sql       cria os bancos por serviço
│   └── docs/
│       ├── architecture.md
│       ├── security.md
│       └── test-plan.md
├── quimix-api-gateway/                borda HTTP (CORS, JWT, proxy, rate limit)
├── quimix-auth-service/               cadastro, login, refresh, /me
├── quimix-simulation-service/         catálogo de reagentes e cálculo de mistura
└── quimix-web/                        SPA React (bancada, tabela, béquer)
```

Serviços previstos para fases seguintes (bancos já criados no Postgres, código ainda não existe):

- `quimix-catalog-service`
- `quimix-experiment-service`
- `quimix-periodic-table-service`

---

## Stack

| Camada | Tecnologia |
|--------|------------|
| Frontend | React 19, React Router 7, TypeScript, Vite 6, Vitest |
| APIs | Python 3.11+, FastAPI, Pydantic v2, Uvicorn |
| Auth | JWT (HS256), bcrypt, SQLAlchemy 2 + Postgres (ou SQLite em dev isolado) |
| Gateway | FastAPI + httpx, CORS, rate limit em memória, headers OWASP |
| Simulação | domínio puro (sem IoT); catálogo seed de elementos e compostos |
| Infra | Docker Compose, Postgres 16 Alpine |
| Testes | pytest (serviços), Vitest (web) |

---

## Pré-requisitos

Para o ambiente completo:

- Docker e Docker Compose
- (opcional) Node.js 20+ e Python 3.11+, se for rodar os serviços fora do Compose

---

## Subir o ambiente com Docker

Na pasta de infra:

```bash
cd quimix-infra
cp .env.example .env
docker compose up --build
```

URLs:

| Serviço | URL |
|---------|-----|
| Web | http://localhost:5173 |
| Gateway (OpenAPI) | http://localhost:8000/docs |
| Simulation (OpenAPI) | http://localhost:8001/docs |
| Auth (OpenAPI) | http://localhost:8002/docs |
| Gateway health | http://localhost:8000/health |
| Gateway info | http://localhost:8000/api/v1/gateway/info |

O Postgres **não** publica a porta 5432 no host, para não brigar com um Postgres local. Ele só existe na rede interna do Compose.

A imagem da web recebe `VITE_API_BASE_URL=http://localhost:8000` no build: o navegador chama o gateway no host, não o hostname interno do Compose.

Parar:

```bash
docker compose down
```

Os dados do Postgres ficam no volume `quimix_pg_data`.

---

## Rodar cada serviço localmente

Útil para desenvolvimento sem rebuild de imagem. O gateway precisa apontar para `localhost` (não para os hostnames do Compose).

### Auth (porta 8002)

```bash
cd quimix-auth-service
python -m venv .venv
# Windows: .venv\Scripts\activate
pip install -e ".[dev]"
cp .env.example .env
uvicorn app.main:app --reload --port 8002
```

Sem `DATABASE_URL` de Postgres, o padrão é SQLite em `./quimix_auth.db`.

### Simulation (porta 8001)

```bash
cd quimix-simulation-service
python -m venv .venv
pip install -e ".[dev]"
uvicorn app.main:app --reload --port 8001
```

Não depende de banco na Fase 1: o catálogo é seed em memória.

### Gateway (porta 8000)

```bash
cd quimix-api-gateway
python -m venv .venv
pip install -e ".[dev]"
uvicorn app.main:app --reload --port 8000
```

Padrões: simulation em `http://localhost:8001`, auth em `http://localhost:8002`.

### Web (porta 5173)

```bash
cd quimix-web
npm install
npm run dev
```

`VITE_API_BASE_URL` (padrão `http://localhost:8000`) precisa coincidir com o gateway.

Scripts:

| Comando | Função |
|---------|--------|
| `npm run dev` | Vite com hot reload |
| `npm run build` | `tsc -b` + build de produção |
| `npm run preview` | serve o build |
| `npm test` | Vitest (uma passada) |

---

## Variáveis de ambiente

Arquivo canônico do Compose: `quimix-infra/.env.example` (copiar para `.env`; **nunca** versionar o `.env`).

| Variável | Padrão | Uso |
|----------|--------|-----|
| `POSTGRES_USER` | `quimix` | Usuário do cluster |
| `POSTGRES_PASSWORD` | `quimix_dev_change_me` | Senha de desenvolvimento |
| `POSTGRES_DB` | `quimix` | Banco inicial do container |
| `GATEWAY_PORT` | `8000` | Porta publicada do gateway |
| `SIMULATION_PORT` | `8001` | Porta do simulation |
| `AUTH_PORT` | `8002` | Porta do auth |
| `WEB_PORT` | `5173` | Porta da web (nginx na imagem) |
| `CORS_ORIGINS` | `http://localhost:5173` | Origens permitidas (lista separada por vírgula) |
| `RATE_LIMIT_PER_MINUTE` | `120` | Teto por IP no gateway |
| `JWT_SECRET` | valor de dev | **Mesmo segredo** no auth e no gateway |
| `SEED_ADMIN_ENABLED` | `true` | Cria admin na subida do auth |
| `SEED_ADMIN_EMAIL` | `admin@example.com` | E-mail do admin de testes |
| `SEED_ADMIN_PASSWORD` | `Admin@12345` | Senha do admin de testes |
| `SEED_ADMIN_NAME` | `Admin Quimix` | Nome exibido |
| `SIMULATION_SERVICE_URL` | `http://simulation-service:8001` | Upstream interno (Compose) |
| `AUTH_SERVICE_URL` | `http://auth-service:8002` | Upstream interno (Compose) |

Auth, além disso (`quimix-auth-service/.env.example`):

| Variável | Padrão | Uso |
|----------|--------|-----|
| `DATABASE_URL` | `sqlite:///./quimix_auth.db` | SQLAlchemy. No Compose: `postgresql+psycopg://…/quimix_auth` |
| `JWT_ALGORITHM` | `HS256` | Algoritmo do token |
| `ACCESS_TOKEN_MINUTES` | `30` | Vida do access token |
| `REFRESH_TOKEN_DAYS` | `7` | Vida do refresh token |

Simulation no Compose usa `DATABASE_URL` com `postgresql+asyncpg://…/quimix_simulation` (preparado para a fase seguinte; o cálculo atual não persiste misturas).

Em produção: trocar senhas, `JWT_SECRET` (mínimo 32 caracteres) e desligar o seed de admin.

---

## Contas e papéis

Papéis (`Role`): `aluno`, `professor`, `admin`.

- Cadastro público (`POST /api/v1/auth/register`) aceita só `aluno` ou `professor`. Papel `admin` é recusado.
- Senha: mínimo 8 caracteres.
- E-mail único (normalizado em minúsculas).
- Conta inativa não autentica.

**Admin de testes** (criado na subida do auth se ainda não existir):

| Campo | Valor |
|-------|--------|
| E-mail | `admin@example.com` |
| Senha | `Admin@12345` |
| Papel | `admin` |

Tokens:

- **Access**: `type=access`, claims `sub`, `email`, `role`, `iat`, `exp` (~30 min).
- **Refresh**: `type=refresh`, claim `sub`, `exp` (~7 dias). Um refresh bem-sucedido devolve um *novo* par access + refresh.

O frontend guarda `quimix_access_token`, `quimix_refresh_token` e `quimix_user` no `localStorage`. Em `401`, tenta refresh uma vez; se falhar, limpa a sessão e pede login de novo.

---

## Frontend (`quimix-web`)

SPA. Entrada: `src/main.tsx` (React StrictMode + BrowserRouter + `styles.css`). Rotas em `src/App.tsx`, envolvidas por `AuthProvider`.

### Rotas

| Caminho | Página | Auth |
|---------|--------|------|
| `/` | `HomePage` — hero, marca, atalho para simular ou criar conta | pública |
| `/login` | `LoginPage` — e-mail e senha | pública |
| `/register` | `RegisterPage` — nome, e-mail, senha, perfil aluno/professor | pública |
| `/simulate` | `SimulatePage` — bancada | `RequireAuth` (sem usuário → `/login` com `state.from`) |
| `*` | redireciona para `/` | — |

### Páginas

**Home** — atmosfera de laboratório (`LabAtmosphere`), logo animado (`QuimixMark`: béquer rachado com flash e estilhaços), três destaques (misturas visuais, tabela periódica, raciocínio registrado).

**Login / cadastro** — mesmos painéis; após sucesso vão para `/simulate` (login respeita a rota de origem).

**Bancada (`SimulatePage`)** — duas colunas: formulário à esquerda, resultado à direita.

Modos da bancada (`MixMode`):

- **Elementos**: clique na tabela periódica; cada célula vira um chip com quantidade.
- **Fórmula**: campo de texto (Enter ou botão Adicionar) + presets (`H2O`, `NaCl`, `HCl`, `NaOH`, `H2SO4`, `HNO3`, `CO2`, `CH4`, `NH3`, `H2O2`, `CaCO3`, `Fe2O3`, `C2H5OH`, `C6H12O6`, `KOH`). Nomes comuns (`água`, `pólvora`, `napalm`) também resolvem. A tabela fica só leitura neste modo.

Unidades (`AmountUnit`):

| Unidade | Significado na UI | Conversão enviada ao backend |
|---------|-------------------|------------------------------|
| `mL` | volume | valor direto |
| `partes` | proporção | × 50 mL |
| `mol` | quantidade de matéria | × 1000 mL (catálogo a 1 mol/L) |

Padrão de quantidade: 50 mL por elemento, 100 mL por fórmula; 1 nas outras unidades.

Ao simular, a bancada achata a composição em símbolos (`el-Na`, `el-Cl`, …), chama `POST /api/v1/simulations/mixtures` com JWT e, em paralelo, identifica o produto no cliente (`identifyMixture`). O painel de resultado mostra:

1. Béquer animado (`MixtureBeaker`)
2. Volume equivalente e, no modo fórmula, os compostos usados
3. Lista de solutos com concentração mol/L
4. Avisos do backend (o aviso genérico “não há modelagem de reação” some quando o identificador já nomeou um composto)
5. Logs passo a passo do cálculo

### Componentes

| Arquivo | Função |
|---------|--------|
| `QuimixMark.tsx` | Logo: um béquer que explode (flash, anéis, faíscas, gotas) |
| `LabAtmosphere.tsx` | Fundo da home/auth |
| `PeriodicTable.tsx` | Grade clássica (períodos 1–7, grupos 1–18, lantanídeos/actinídeos abaixo). Célula: número Z, símbolo e nome. Cores por categoria. |
| `MixtureBeaker.tsx` | Cena do béquer: fases `idle` → `pour` → `mix` → `reveal`. Classes `theme-{kind}` e `effect-{effect}`. Grãos no pó, geada no gelo, cogumelo na explosão, rachaduras só no derretimento. Caixa didática `why` abaixo do frasco. |

### Dados e API no cliente

| Arquivo | Função |
|---------|--------|
| `src/data/periodicTable.ts` | 118 elementos, categorias, `ELEMENT_BY_SYMBOL`, `elementReagentId("Na")` → `el-Na` |
| `src/data/formula.ts` | Parser de fórmulas, hidratos, unidades |
| `src/data/mixtureOutcomes.ts` | Receitas, `identifyMixture`, `lookupCompound` |
| `src/api/client.ts` | Cliente HTTP, sessão, refresh, `simulateMixture` |
| `src/auth/AuthContext.tsx` | Estado do usuário, login/register/logout, revalidação com `/me` |
| `src/auth/RequireAuth.tsx` | Guarda de rota |

### Estilo

`src/styles.css` concentra o visual da bancada: temas por `kind`, animações só no `effect` correspondente, tabela compacta, chips, painéis. Derretimento do vidro é escopado ao béquer em mistura/revelação (não pinta a página inteira).

---

## Motor de identificação de misturas

Arquivo: `quimix-web/src/data/mixtureOutcomes.ts`.

`identifyMixture(inputs, { sourceFormulas })` recebe os elementos da bancada (símbolo + quantidade) e, no modo fórmula, as fórmulas de origem.

1. Monta a chave ordenada dos símbolos (`Na+Cl`, `H+O`, `C+K+N+O+S`, …).
2. Busca receitas com exatamente esses elementos.
3. Se houver várias (H₂O vs H₂O₂, CO vs CO₂), escolhe a de menor distância de proporção em relação à estequiometria.
4. Resolve o **efeito** com `sourceFormulas`:
   - produto digitado pronto + efeito `ignite` → vira `none` (MgO já formado não pega fogo de novo);
   - hidróxido alcalino com metal livre na origem → `explode` + explicação do H₂ + calor;
   - senão usa o efeito cadastrado na receita.
5. Sem receita: `kind: blend`, sem efeito.

`lookupCompound` resolve fórmula (`H2O`, `H₂O`) ou nome normalizado sem acento (`agua`, `polvora`, `gunpowder`).

### Tipos de produto (`MixtureKind`)

`water` · `acid` · `base` · `salt` · `gas` · `oxide` · `alloy` · `organic` · `mineral` · `powder` · `ice` · `blend`

### Efeitos (`MixtureEffect`)

| Efeito | Quando |
|--------|--------|
| `none` | Produto estável no béquer |
| `explode` | Formação instável ou metal alcalino + água |
| `melt` | HF (ataque à sílica do vidro) |
| `freeze` | Reação fortemente endotérmica (ex.: Ba(OH)₂ + NH₄Cl) |
| `ignite` | Formação pirofórica (PH₃, B₂H₆, SiH₄, combustão de Mg ou P) |

### Como as receitas nascem

- Para cada metal da tabela (exceto não-cátions como H, C, N, O, halogênios, gases nobres), gera sais/óxidos/hidróxidos/carbonatos/sulfatos/nitratos etc. a partir da carga típica do grupo, com variantes (Fe²⁺, Cu⁺, Sn²⁺, …).
- Receitas explícitas por cima: água, ácidos, gases, orgânicos, minerais, ligas, compostos de gases nobres, pólvora, TNT, napalm, termite, nitroglicerina, mistura endotérmica, etc.
- `SPECIAL` ajusta nomes didáticos (soda cáustica, ferrugem, leite de magnésia) e efeitos de formação (MgO / P₄O₁₀ inflamam *ao se formar*).

Exemplos de produto **sem** explosão ao misturar: pólvora (`KNO3CS` / alias `pólvora`), TNT, RDX, PETN, ANFO, termite, napalm, metano, etanol, H₂SO₄.

Exemplos **com** efeito: Na + H₂O (explode), HF (derrete vidro), nitroglicerina / XeO₃ / XeO₄ / Cl₂O₇ (explodem), PH₃ / silano / diborano (ignição), Ba(OH)₂ + NH₄Cl (congela).

---

## Parser de fórmulas e unidades

Arquivo: `quimix-web/src/data/formula.ts`.

Aceita:

- Símbolos da tabela (`H2O`, `NaCl`, `Fe2O3`)
- Parênteses (`Ca(OH)2`, `Al(C16H31O2)`)
- Hidratos com ponto / `·` / `*` (`CuSO4.5H2O`)
- Subscritos Unicode (`H₂O` → `H2O`)

Rejeita parêntese desbalanceado e trecho que não é elemento.

`expandFormula` espalha a quantidade pelos átomos: em mL, reparte o volume pela soma estequiométrica; em partes/mol, multiplica cada índice pela quantidade.

---

## Auth Service

Pasta: `quimix-auth-service`. FastAPI, SQLAlchemy, bcrypt, PyJWT.

Na subida: `init_db()` cria a tabela `users` e `seed_admin_user()` insere o admin se o seed estiver ligado.

### Modelo `User`

`id` (UUID string), `email`, `full_name`, `role`, `password_hash`, `created_at`, `is_active`.

### Rotas

Prefixo `/api/v1/auth`.

| Método | Caminho | Auth | Resposta |
|--------|---------|------|----------|
| POST | `/register` | não | `201` + tokens + user |
| POST | `/login` | não | tokens + user |
| POST | `/refresh` | body com `refresh_token` | novo par de tokens + user |
| GET | `/me` | Bearer access | user |
| GET | `/health` | não | `{ status, service }` |

Erros típicos: e-mail já cadastrado (`409`), senha curta / admin público (`400`), credenciais inválidas / token ruim (`401`).

---

## Simulation Service

Pasta: `quimix-simulation-service`. **Não inclui IoT.** Motor de volumes e concentração.

Fórmula do domínio (`app/domain/mixture.py`):

1. Cada componente precisa de volume > 0 e concentração ≥ 0.
2. Moles = concentração (mol/L) × volume (L).
3. Volumes iguais ao mesmo `reagent_id` somam.
4. Volume total é aditivo.
5. Concentração resultante = moles / volume total (L), arredondada a 6 casas.
6. Logs descrevem cada adição e cada concentração.
7. Se há mais de um soluto, um aviso deixa claro que **não há modelagem de reação** nesta versão.

Catálogo (`reagent_catalog.py`):

- Compostos seed: `hcl-1m`, `naoh-1m`, `water` (água a 0 mol/L).
- Elementos `el-{símbolo}` com concentração típica 1.0 mol/L (nobres e alguns metais pesados em 0.5). Símbolo desconhecido ainda simula com 1.0 mol/L, desde que o id seja `el-` + símbolo curto.

A bancada envia só ids `el-H`, `el-O`, etc. Os compostos seed existem para demos/API direta.

### Rotas

Prefixo `/api/v1`.

| Método | Caminho | Corpo | Resposta |
|--------|---------|-------|----------|
| GET | `/reagents` | — | lista do catálogo |
| POST | `/simulations/mixtures` | `{ "components": [{ "reagent_id", "volume_ml" }] }` | volume total, solutos, logs, warnings |
| GET | `/health` | — | `{ status, service }` |

Validação: 1–50 componentes, `volume_ml` > 0 e ≤ 100 000. Reagente inexistente → `400`.

---

## API Gateway

Pasta: `quimix-api-gateway`. Única porta que o frontend precisa conhecer.

O gateway **não** inventa regra de mistura. Ele:

1. Aplica CORS (origens da env; métodos GET/POST/PUT/PATCH/DELETE/OPTIONS; headers `Content-Type`, `Accept`, `Authorization`; sem cookies).
2. Aplica rate limit por IP (padrão 120/min). `/health`, `/docs`, `/openapi.json` e `/redoc` ficam de fora.
3. Injeta headers OWASP em toda resposta.
4. Só faz proxy para hosts internos conhecidos e para **listas fechadas de caminhos** (anti-SSRF).
5. Exige Bearer **access** (`type=access`) em reagentes e simulações. Login/register/refresh passam sem JWT. `/me` encaminha o header `Authorization` ao auth.

Forward: só `content-type`, `accept` e, quando preciso, `authorization`. Timeout httpx: 30 s. Upstream fora → `502`.

| Rota no gateway | Upstream | JWT no gateway |
|-----------------|----------|----------------|
| `GET /health` | local | não |
| `GET /api/v1/gateway/info` | local (mostra URLs internas) | não |
| `POST /api/v1/auth/register` | auth | não |
| `POST /api/v1/auth/login` | auth | não |
| `POST /api/v1/auth/refresh` | auth | não |
| `GET /api/v1/auth/me` | auth | encaminha Bearer |
| `GET /api/v1/reagents` | simulation | valida access |
| `POST /api/v1/simulations/mixtures` | simulation | valida access |

`JWT_SECRET` e `JWT_ALGORITHM` **têm de ser iguais** aos do auth, senão a bancada autentica no auth e o gateway recusa a simulação.

---

## Contratos HTTP

Exemplos contra o gateway (`http://localhost:8000`).

### Cadastro

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "aluno@escola.edu",
  "password": "senha1234",
  "full_name": "Ana Aluna",
  "role": "aluno"
}
```

Resposta `201`:

```json
{
  "access_token": "<jwt>",
  "refresh_token": "<jwt>",
  "token_type": "bearer",
  "user": {
    "id": "<uuid>",
    "email": "aluno@escola.edu",
    "full_name": "Ana Aluna",
    "role": "aluno"
  }
}
```

### Login

```http
POST /api/v1/auth/login
Content-Type: application/json

{ "email": "admin@example.com", "password": "Admin@12345" }
```

### Mistura (access token)

```http
POST /api/v1/simulations/mixtures
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "components": [
    { "reagent_id": "el-H", "volume_ml": 100 },
    { "reagent_id": "el-O", "volume_ml": 50 }
  ]
}
```

Resposta `200`: `total_volume_ml`, `solutes[]` (`reagent_id`, `name`, `formula`, `resulting_concentration_mol_l`, `contributed_volume_ml`), `logs[]`, `warnings[]`.

Sem token: `401` com `Login obrigatório para executar experimentos.`

---

## Banco de dados

Um cluster Postgres 16; **um database por serviço** (`quimix-infra/docker/postgres/init.sql`):

| Database | Uso atual |
|----------|-----------|
| `quimix_auth` | Tabela `users` (SQLAlchemy) |
| `quimix_simulation` | Reservado (simulação ainda é stateless) |
| `quimix_catalog` | Fase 2 |
| `quimix_experiment` | Fase 2 |
| `quimix_periodic` | Fase 2 |

Healthcheck: `pg_isready`. Volume nomeado `quimix_pg_data`.

---

## Segurança

Detalhes também em `quimix-infra/docs/security.md`. Baseline OWASP da Fase 1:

| Risco | Mitigação no Quimix |
|-------|---------------------|
| Broken Access Control | JWT no gateway nas rotas de experimento; papéis no token; cadastro admin bloqueado |
| Cryptographic Failures | bcrypt nas senhas; secrets em `.env`; JWT com expiração curta + refresh |
| Injection | Pydantic na borda; SQLAlchemy parametrizado |
| Insecure Design | Serviços separados; validação no gateway e no domínio |
| Security Misconfiguration | Headers no gateway; docs só no ambiente de dev |
| Identification / Auth Failures | Access 30 min + refresh 7 dias; refresh rotaciona o par |
| SSRF | Proxy só para URLs internas e paths allowlist |
| Logging | Sem senha nem token nos logs de aplicação |

Headers do gateway:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: no-referrer`
- `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'`
- `Permissions-Policy: geolocation=(), microphone=(), camera=()`

Leeway de 60 s na validação JWT (auth e gateway) para relógio entre containers.

---

## Testes

Plano resumido em `quimix-infra/docs/test-plan.md`. Cada pasta roda a suíte isolada.

```bash
cd quimix-auth-service && python -m pytest -q
cd quimix-simulation-service && python -m pytest -q
cd quimix-api-gateway && python -m pytest -q
cd quimix-web && npm test
```

| Pasta | Ferramenta | O que cobre |
|-------|------------|-------------|
| `quimix-auth-service/tests/unit` | pytest | hash/verify de senha, JWT access vs refresh |
| `quimix-auth-service/tests/integration` | pytest + httpx | register, login, me, bloqueio de admin público |
| `quimix-simulation-service/tests/unit` | pytest | volumes aditivos, moles, erros de volume |
| `quimix-simulation-service/tests/integration` | pytest | `/reagents`, `/simulations/mixtures` |
| `quimix-api-gateway/tests` | pytest | proxy, 401 sem token, headers, rate limit |
| `quimix-web/src/data/formula.test.ts` | Vitest | parser, hidratos, unidades |
| `quimix-web/src/data/mixtureOutcomes.test.ts` | Vitest | água, pólvora como pó, HF derrete, H₂SO₄ não, Na+água explode, NaOH fonte não explode, napalm orgânico |
| `quimix-web/src/api/client.test.ts` | Vitest | formatação de concentração / cliente |

Critério de aceite da auth: registro aluno/professor, login devolve access + refresh, `/me` exige Bearer, rotas de auth acessíveis pelo gateway.

---

## Fluxo de uma simulação

Exemplo: aluno monta **H₂O** no modo fórmula, 100 mL.

1. `lookupCompound("H2O")` (ou `parseFormula`) → composição H:2, O:1.
2. A bancada expande para equivalentes de H e O e mostra a tabela só como referência.
3. `identifyMixture` com `sourceFormulas: ["H2O"]` → água, efeito `none`, cor azul.
4. Submit chama o gateway com `el-H` e `el-O` e o Bearer.
5. Gateway valida o access JWT e encaminha ao simulation.
6. Simulation devolve volume 150 mL equivalentes (proporção 2:1 em 100 mL de fórmula) e as concentrações.
7. O béquer anima vazão → mistura → revelação da água. Sem explosão. Equação `2 H + O → H₂O` e caption didática.

Exemplo perigoso: modo elementos, **Na** + **O** + **H** na proporção de NaOH, com o metal na bancada → produto hidróxido, efeito `explode`, texto explicando o H₂ e o calor. Se a origem for a fórmula `NaOH`, o mesmo produto aparece **sem** explosão.

---

## Próximas fases

Já desenhadas na infra, ainda sem código de serviço:

- Catálogo persistente de reagentes (hoje o seed vive no simulation)
- Histórico de experimentos por usuário
- Serviço dedicado da tabela periódica
- HTTPS e secrets reais em produção
- Autorização mais fina por papel (turma, correção de relatório)

Documentação complementar:

- `quimix-infra/docs/architecture.md`
- `quimix-infra/docs/security.md`
- `quimix-infra/docs/test-plan.md`
- README de cada pasta de serviço

---

## Autores

- **Luana Zenha**
- **Bruno Barral**
