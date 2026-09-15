from datetime import UTC, datetime
from uuid import uuid4

from app.domain.models import Role, User
from app.domain.repositories import UserRepository
from app.infrastructure.security import (
    AuthError,
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)


class AuthService:
    def __init__(self, users: UserRepository) -> None:
        self._users = users

    def register(
        self,
        *,
        email: str,
        password: str,
        full_name: str,
        role: Role,
    ) -> tuple[User, str, str]:
        if role == Role.ADMIN:
            raise AuthError("Cadastro público como admin não é permitido.")
        if self._users.get_by_email(email):
            raise AuthError("E-mail já cadastrado.")
        if len(password) < 8:
            raise AuthError("Senha deve ter pelo menos 8 caracteres.")

        user = User(
            id=str(uuid4()),
            email=email.strip().lower(),
            full_name=full_name.strip(),
            role=role,
            password_hash=hash_password(password),
            created_at=datetime.now(UTC),
            is_active=True,
        )
        created = self._users.create(user)
        access = create_access_token(user_id=created.id, email=created.email, role=created.role)
        refresh = create_refresh_token(user_id=created.id)
        return created, access, refresh

    def login(self, *, email: str, password: str) -> tuple[User, str, str]:
        user = self._users.get_by_email(email)
        if user is None or not verify_password(password, user.password_hash):
            raise AuthError("Credenciais inválidas.")
        if not user.is_active:
            raise AuthError("Usuário inativo.")
        access = create_access_token(user_id=user.id, email=user.email, role=user.role)
        refresh = create_refresh_token(user_id=user.id)
        return user, access, refresh

    def refresh(self, refresh_token: str) -> tuple[User, str, str]:
        payload = decode_token(refresh_token, expected_type="refresh")
        user = self._users.get_by_id(str(payload["sub"]))
        if user is None or not user.is_active:
            raise AuthError("Usuário não encontrado.")
        access = create_access_token(user_id=user.id, email=user.email, role=user.role)
        new_refresh = create_refresh_token(user_id=user.id)
        return user, access, new_refresh

    def me(self, access_token: str) -> User:
        payload = decode_token(access_token, expected_type="access")
        user = self._users.get_by_id(str(payload["sub"]))
        if user is None or not user.is_active:
            raise AuthError("Usuário não encontrado.")
        return user
