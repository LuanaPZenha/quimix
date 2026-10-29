"""API e frontend do Quimix na Vercel.

Sobe o auth e a simulação no mesmo processo e serve o build do React.
No Docker local os três serviços continuam separados.
"""

from __future__ import annotations

import importlib
import sys
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

import jwt
from fastapi import Depends, FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

ROOT = Path(__file__).resolve().parent
DIST = ROOT / "quimix-web" / "dist"
SERVICE_DIRS = ("quimix-auth-service", "quimix-simulation-service")


def _purge_app_modules() -> None:
    for name in list(sys.modules):
        if name == "app" or name.startswith("app."):
            del sys.modules[name]


def _load_service(folder: str):
    _purge_app_modules()
    service_paths = {str(ROOT / name) for name in SERVICE_DIRS}
    sys.path[:] = [entry for entry in sys.path if entry not in service_paths]
    sys.path.insert(0, str(ROOT / folder))
    return importlib.import_module("app.api.routes")


auth_routes = _load_service("quimix-auth-service")
auth_config = importlib.import_module("app.config")
auth_db = importlib.import_module("app.infrastructure.database")
auth_seed = importlib.import_module("app.infrastructure.seed")
auth_router = auth_routes.router
JWT_SECRET = auth_config.settings.jwt_secret
JWT_ALGORITHM = auth_config.settings.jwt_algorithm

sim_routes = _load_service("quimix-simulation-service")
sim_router = sim_routes.router

_database_ready = False


def prepare_database() -> None:
    global _database_ready
    if _database_ready:
        return
    auth_db.init_db()
    auth_seed.seed_admin_user()
    _database_ready = True


@asynccontextmanager
async def lifespan(_app: FastAPI):
    prepare_database()
    yield


app = FastAPI(title="Quimix", version="0.1.0", docs_url="/docs", redoc_url=None, lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://quimix.vercel.app"],
    allow_origin_regex=r"https://quimix[a-z0-9-]*\.vercel\.app",
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)


@app.middleware("http")
async def ensure_database(request: Request, call_next):
    if request.url.path.startswith("/api"):
        prepare_database()
    return await call_next(request)


def require_access_token(request: Request) -> dict[str, Any]:
    authorization = request.headers.get("Authorization")
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Login obrigatório para executar experimentos.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = authorization.split(" ", 1)[1].strip()
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM], leeway=60)
    except jwt.PyJWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sessão inválida ou expirada. Faça login novamente.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
    if payload.get("type") != "access" or not payload.get("sub"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de acesso inválido.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "quimix"}


app.include_router(auth_router)
app.include_router(sim_router, dependencies=[Depends(require_access_token)])


def _static_file(full_path: str) -> Path | None:
    if not full_path or ".." in full_path.split("/"):
        return None
    root = DIST.resolve()
    candidate = (DIST / full_path).resolve()
    try:
        candidate.relative_to(root)
    except ValueError:
        return None
    if candidate.is_file():
        return candidate
    return None


@app.get("/{full_path:path}", include_in_schema=False)
def frontend(full_path: str) -> FileResponse:
    if full_path == "api" or full_path.startswith("api/"):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rota não encontrada.")
    asset = _static_file(full_path)
    if asset is not None:
        return FileResponse(asset)
    index = DIST / "index.html"
    if index.is_file():
        return FileResponse(index)
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Frontend ainda não foi compilado.")
