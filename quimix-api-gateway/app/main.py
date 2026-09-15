from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.middleware import RateLimitMiddleware, SecurityHeadersMiddleware
from app.proxy import router


def create_app() -> FastAPI:
    application = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        docs_url="/docs",
        redoc_url="/redoc",
    )

    application.add_middleware(SecurityHeadersMiddleware)
    application.add_middleware(RateLimitMiddleware, limit_per_minute=settings.rate_limit_per_minute)
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=False,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Accept", "Authorization"],
    )

    @application.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok", "service": settings.app_name}

    application.include_router(router)
    return application


app = create_app()
