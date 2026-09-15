from fastapi import FastAPI

from app.api.routes import router
from app.config import settings
from app.infrastructure.database import init_db
from app.infrastructure.seed import seed_admin_user


def create_app() -> FastAPI:
    init_db()
    seed_admin_user()
    application = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        docs_url="/docs",
        redoc_url="/redoc",
    )

    @application.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok", "service": settings.app_name}

    application.include_router(router)
    return application


app = create_app()
