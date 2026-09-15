from typing import Any

import httpx
from fastapi import APIRouter, HTTPException, Request, Response, status

from app.auth import require_access_token
from app.config import settings

router = APIRouter()

ALLOWED_SIMULATION_PATHS = {
    "/api/v1/reagents": {"GET"},
    "/api/v1/simulations/mixtures": {"POST"},
}

ALLOWED_AUTH_PATHS = {
    "/api/v1/auth/register": {"POST"},
    "/api/v1/auth/login": {"POST"},
    "/api/v1/auth/refresh": {"POST"},
    "/api/v1/auth/me": {"GET"},
}


def _forward_headers(request: Request, *, include_auth: bool) -> dict[str, str]:
    allowed = {"content-type", "accept"}
    if include_auth:
        allowed.add("authorization")
    return {
        key: value
        for key, value in request.headers.items()
        if key.lower() in allowed
    }


async def _proxy(
    request: Request,
    *,
    base_url: str,
    path: str,
    allowed_methods: set[str],
    include_auth: bool = False,
) -> Response:
    method = request.method.upper()
    if method not in allowed_methods:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rota não encontrada")

    url = f"{base_url.rstrip('/')}{path}"
    body = await request.body()
    headers = _forward_headers(request, include_auth=include_auth)

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            upstream = await client.request(method, url, content=body, headers=headers)
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Falha ao contatar upstream: {exc}",
        ) from exc

    return Response(
        content=upstream.content,
        status_code=upstream.status_code,
        media_type=upstream.headers.get("content-type"),
    )


@router.api_route("/api/v1/reagents", methods=["GET"])
async def reagents(request: Request) -> Response:
    require_access_token(request)
    return await _proxy(
        request,
        base_url=settings.simulation_service_url,
        path="/api/v1/reagents",
        allowed_methods=ALLOWED_SIMULATION_PATHS["/api/v1/reagents"],
    )


@router.api_route("/api/v1/simulations/mixtures", methods=["POST"])
async def mixtures(request: Request) -> Response:
    require_access_token(request)
    return await _proxy(
        request,
        base_url=settings.simulation_service_url,
        path="/api/v1/simulations/mixtures",
        allowed_methods=ALLOWED_SIMULATION_PATHS["/api/v1/simulations/mixtures"],
    )


@router.api_route("/api/v1/auth/register", methods=["POST"])
async def auth_register(request: Request) -> Response:
    return await _proxy(
        request,
        base_url=settings.auth_service_url,
        path="/api/v1/auth/register",
        allowed_methods=ALLOWED_AUTH_PATHS["/api/v1/auth/register"],
    )


@router.api_route("/api/v1/auth/login", methods=["POST"])
async def auth_login(request: Request) -> Response:
    return await _proxy(
        request,
        base_url=settings.auth_service_url,
        path="/api/v1/auth/login",
        allowed_methods=ALLOWED_AUTH_PATHS["/api/v1/auth/login"],
    )


@router.api_route("/api/v1/auth/refresh", methods=["POST"])
async def auth_refresh(request: Request) -> Response:
    return await _proxy(
        request,
        base_url=settings.auth_service_url,
        path="/api/v1/auth/refresh",
        allowed_methods=ALLOWED_AUTH_PATHS["/api/v1/auth/refresh"],
    )


@router.api_route("/api/v1/auth/me", methods=["GET"])
async def auth_me(request: Request) -> Response:
    return await _proxy(
        request,
        base_url=settings.auth_service_url,
        path="/api/v1/auth/me",
        allowed_methods=ALLOWED_AUTH_PATHS["/api/v1/auth/me"],
        include_auth=True,
    )


@router.get("/api/v1/gateway/info")
async def gateway_info() -> dict[str, Any]:
    return {
        "service": settings.app_name,
        "version": settings.app_version,
        "upstream": {
            "simulation": settings.simulation_service_url,
            "auth": settings.auth_service_url,
        },
    }
