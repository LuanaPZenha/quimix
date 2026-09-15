from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.api.schemas import (
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)
from app.application.auth_service import AuthService
from app.domain.models import User
from app.infrastructure.database import SqlAlchemyUserRepository, get_session
from app.infrastructure.security import AuthError

router = APIRouter(prefix="/api/v1/auth")


def get_auth_service(session: Session = Depends(get_session)) -> AuthService:
    return AuthService(SqlAlchemyUserRepository(session))


def _to_user_response(user: User) -> UserResponse:
    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
    )


def _to_token_response(user: User, access: str, refresh: str) -> TokenResponse:
    return TokenResponse(
        access_token=access,
        refresh_token=refresh,
        user=_to_user_response(user),
    )


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, service: AuthService = Depends(get_auth_service)) -> TokenResponse:
    try:
        user, access, refresh = service.register(
            email=str(payload.email),
            password=payload.password,
            full_name=payload.full_name,
            role=payload.role,
        )
    except AuthError as exc:
        detail = str(exc)
        code = status.HTTP_409_CONFLICT if "cadastrado" in detail.lower() else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=code, detail=detail) from exc
    return _to_token_response(user, access, refresh)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, service: AuthService = Depends(get_auth_service)) -> TokenResponse:
    try:
        user, access, refresh = service.login(email=str(payload.email), password=payload.password)
    except AuthError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc
    return _to_token_response(user, access, refresh)


@router.post("/refresh", response_model=TokenResponse)
def refresh_tokens(payload: RefreshRequest, service: AuthService = Depends(get_auth_service)) -> TokenResponse:
    try:
        user, access, refresh = service.refresh(payload.refresh_token)
    except AuthError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc
    return _to_token_response(user, access, refresh)


@router.get("/me", response_model=UserResponse)
def me(
    authorization: str | None = Header(default=None),
    service: AuthService = Depends(get_auth_service),
) -> UserResponse:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Bearer token obrigatório.")
    token = authorization.split(" ", 1)[1].strip()
    try:
        user = service.me(token)
    except AuthError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc
    return _to_user_response(user)
