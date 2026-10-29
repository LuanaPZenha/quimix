from datetime import UTC, datetime
from uuid import uuid4

from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.application.auth_service import AuthService
from app.domain.learn_catalog import EFFECTS, KINDS, myth_by_id
from app.domain.models import Role, User
from app.infrastructure.database import SqlAlchemyUserRepository, get_session
from app.infrastructure.learn_db import (
    ClassMissionRow,
    add_mission,
    count_teacher_missions,
    get_or_create_progress,
    list_missions,
    progress_payload,
    record_discovery,
    submit_attempt,
)
from app.infrastructure.security import AuthError

router = APIRouter(prefix="/api/v1/learn")


class SoluteIn(BaseModel):
    formula: str = Field(min_length=1, max_length=40)
    resulting_concentration_mol_l: float = Field(ge=0, le=1000)


class DiscoveryIn(BaseModel):
    formula: str = Field(min_length=1, max_length=80)
    name: str = Field(min_length=1, max_length=120)
    equation: str = Field(min_length=1, max_length=240)
    kind: str = Field(min_length=1, max_length=32)
    effect: str = Field(min_length=1, max_length=32)
    caption: str = Field(default="", max_length=400)
    prediction_kind: str | None = Field(default=None, max_length=32)
    prediction_effect: str | None = Field(default=None, max_length=32)
    volume_ml: float | None = Field(default=None, ge=0, le=100000)
    solutes: list[SoluteIn] = Field(default_factory=list, max_length=30)


class MissionIn(BaseModel):
    title: str = Field(min_length=3, max_length=80)
    brief: str = Field(min_length=3, max_length=280)
    kind: str = Field(min_length=1, max_length=32)
    target_formula: str | None = Field(default=None, max_length=80)
    target_mol_l: float | None = Field(default=None, ge=0, le=20)
    target_volume_ml: float | None = Field(default=None, gt=0, le=5000)
    solute_symbol: str | None = Field(default=None, max_length=8)
    myth_id: str | None = Field(default=None, max_length=40)


class AttemptIn(BaseModel):
    formula: str = Field(min_length=1, max_length=80)
    name: str = Field(min_length=1, max_length=120)
    kind: str = Field(min_length=1, max_length=32)
    effect: str = Field(min_length=1, max_length=32)
    volume_ml: float | None = Field(default=None, ge=0, le=100000)
    solutes: list[SoluteIn] = Field(default_factory=list, max_length=30)
    note: str = Field(default="", max_length=240)


def current_user(
    authorization: str | None = Header(default=None),
    session: Session = Depends(get_session),
) -> User:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Bearer token obrigatório.")
    token = authorization.split(" ", 1)[1].strip()
    service = AuthService(SqlAlchemyUserRepository(session))
    try:
        return service.me(token)
    except AuthError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc


def _check_outcome(kind: str, effect: str) -> None:
    if kind not in KINDS or effect not in EFFECTS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tipo ou efeito desconhecido.")


@router.get("/progress")
def read_progress(
    user: User = Depends(current_user),
    session: Session = Depends(get_session),
) -> dict:
    row = get_or_create_progress(session, user.id)
    session.commit()
    return progress_payload(row, user.role)


@router.post("/discoveries")
def discover(
    payload: DiscoveryIn,
    user: User = Depends(current_user),
    session: Session = Depends(get_session),
) -> dict:
    _check_outcome(payload.kind, payload.effect)
    if (payload.prediction_kind is None) != (payload.prediction_effect is None):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A previsão precisa de tipo e efeito.",
        )
    if payload.prediction_kind is not None and (
        payload.prediction_kind not in KINDS or payload.prediction_effect not in EFFECTS
    ):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Previsão desconhecida.")
    return record_discovery(session, user, payload.model_dump())


@router.get("/missions")
def read_missions(
    user: User = Depends(current_user),
    session: Session = Depends(get_session),
) -> list[dict]:
    return list_missions(session, user)


@router.post("/missions", status_code=status.HTTP_201_CREATED)
def create_mission(
    payload: MissionIn,
    user: User = Depends(current_user),
    session: Session = Depends(get_session),
) -> dict:
    if user.role not in {Role.PROFESSOR, Role.ADMIN}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Só professor ou admin publica missão.",
        )
    if payload.kind not in {"product", "concentration", "myth"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tipo de missão desconhecido.")
    if payload.kind == "product" and not (payload.target_formula or "").strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A missão de produto precisa da fórmula.")
    if payload.kind == "myth" and myth_by_id(payload.myth_id) is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Mito desconhecido.")
    if payload.kind == "concentration":
        if not (payload.target_formula or "").strip() or not (payload.solute_symbol or "").strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A missão de concentração precisa da fórmula e do símbolo medido.",
            )
        if payload.target_mol_l is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A missão de concentração precisa do alvo em mol/L.",
            )
    if count_teacher_missions(session, user.id) >= 40:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Limite de 40 missões por professor.")

    row = ClassMissionRow(
        id=str(uuid4()),
        teacher_id=user.id,
        teacher_name=user.full_name,
        title=payload.title.strip(),
        brief=payload.brief.strip(),
        kind=payload.kind,
        target_formula=(payload.target_formula or "").strip() or None,
        target_mol_l=payload.target_mol_l,
        target_volume_ml=payload.target_volume_ml,
        solute_symbol=(payload.solute_symbol or "").strip() or None,
        myth_id=payload.myth_id,
        created_at=datetime.now(UTC),
    )
    saved = add_mission(session, row)
    listed = list_missions(session, user)
    found = next(item for item in listed if item["id"] == saved.id)
    return found


@router.post("/missions/{mission_id}/attempts")
def attempt_mission(
    mission_id: str,
    payload: AttemptIn,
    user: User = Depends(current_user),
    session: Session = Depends(get_session),
) -> dict:
    _check_outcome(payload.kind, payload.effect)
    body = payload.model_dump()
    body["attempt_id"] = str(uuid4())
    result = submit_attempt(session, user, mission_id, body)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Missão não encontrada.")
    return result
