from datetime import UTC, datetime
from uuid import uuid4

from app.config import settings
from app.domain.models import Role, User
from app.infrastructure.database import SessionLocal, SqlAlchemyUserRepository
from app.infrastructure.security import hash_password


def seed_admin_user() -> None:
    """Cria conta admin de testes se ainda não existir (idempotente)."""
    if not settings.seed_admin_enabled:
        return

    session = SessionLocal()
    try:
        repo = SqlAlchemyUserRepository(session)
        email = settings.seed_admin_email.strip().lower()
        if repo.get_by_email(email):
            return

        repo.create(
            User(
                id=str(uuid4()),
                email=email,
                full_name=settings.seed_admin_name.strip(),
                role=Role.ADMIN,
                password_hash=hash_password(settings.seed_admin_password),
                created_at=datetime.now(UTC),
                is_active=True,
            )
        )
    finally:
        session.close()
