from datetime import UTC, datetime

from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text, UniqueConstraint, select
from sqlalchemy.orm import Mapped, Session, mapped_column
from sqlalchemy.types import JSON

from app.domain.learn_catalog import (
    STARTER_MISSIONS,
    grade_mission,
    grade_prediction,
    matching_challenge_ids,
    matching_myth_ids,
    next_hint,
    norm_formula,
    open_stage_count,
    public_challenges,
    public_myths,
    public_stages,
    seals_for,
    unlocked_symbols,
)
from app.domain.models import Role, User
from app.infrastructure.database import Base


class LearnerProgressRow(Base):
    __tablename__ = "learner_progress"

    user_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    streak: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    best_streak: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    predictions: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    hits: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    partials: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    cards: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    cleared_challenge_ids: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    solved_myth_ids: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class ClassMissionRow(Base):
    __tablename__ = "class_missions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    teacher_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    teacher_name: Mapped[str] = mapped_column(String(120), nullable=False)
    title: Mapped[str] = mapped_column(String(80), nullable=False)
    brief: Mapped[str] = mapped_column(Text, nullable=False)
    kind: Mapped[str] = mapped_column(String(32), nullable=False)
    target_formula: Mapped[str | None] = mapped_column(String(80), nullable=True)
    target_mol_l: Mapped[float | None] = mapped_column(Float, nullable=True)
    target_volume_ml: Mapped[float | None] = mapped_column(Float, nullable=True)
    solute_symbol: Mapped[str | None] = mapped_column(String(8), nullable=True)
    myth_id: Mapped[str | None] = mapped_column(String(40), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class MissionAttemptRow(Base):
    __tablename__ = "mission_attempts"
    __table_args__ = (UniqueConstraint("mission_id", "student_id", name="uq_mission_student"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    mission_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    student_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    student_name: Mapped[str] = mapped_column(String(120), nullable=False)
    formula: Mapped[str] = mapped_column(String(80), nullable=False)
    compound_name: Mapped[str] = mapped_column(String(120), nullable=False)
    correct: Mapped[bool] = mapped_column(Boolean, nullable=False)
    note: Mapped[str] = mapped_column(String(240), nullable=False, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


def _now() -> datetime:
    return datetime.now(UTC)


def get_or_create_progress(session: Session, user_id: str) -> LearnerProgressRow:
    row = session.get(LearnerProgressRow, user_id)
    if row is not None:
        return row
    row = LearnerProgressRow(
        user_id=user_id,
        streak=0,
        best_streak=0,
        predictions=0,
        hits=0,
        partials=0,
        cards=[],
        cleared_challenge_ids=[],
        solved_myth_ids=[],
        updated_at=_now(),
    )
    session.add(row)
    session.flush()
    return row


def progress_payload(row: LearnerProgressRow, role: Role) -> dict:
    cards = list(row.cards or [])
    solved = list(row.solved_myth_ids or [])
    cleared = list(row.cleared_challenge_ids or [])
    trail_free = role in {Role.PROFESSOR, Role.ADMIN}
    opened = open_stage_count(len(cards), len(solved))
    return {
        "streak": row.streak,
        "best_streak": row.best_streak,
        "predictions": row.predictions,
        "hits": row.hits,
        "partials": row.partials,
        "cards": cards,
        "seals": seals_for(cards, solved),
        "challenges": public_challenges(cleared),
        "myths": public_myths(solved),
        "stages": public_stages(len(cards), len(solved)),
        "unlocked_symbols": unlocked_symbols(len(cards), len(solved), trail_free=trail_free),
        "trail_free": trail_free,
        "stage_title": public_stages(len(cards), len(solved))[opened - 1]["title"],
        "next_hint": next_hint(len(cards), len(solved), trail_free=trail_free),
    }


def _snapshot(payload: dict) -> dict:
    return {
        "formula": payload["formula"],
        "effect": payload["effect"],
        "volume_ml": payload.get("volume_ml"),
        "solutes": payload.get("solutes") or [],
    }


def record_discovery(session: Session, user: User, payload: dict) -> dict:
    row = get_or_create_progress(session, user.id)
    grade = grade_prediction(
        payload.get("prediction_kind"),
        payload.get("prediction_effect"),
        payload["kind"],
        payload["effect"],
    )
    if grade == "hit":
        row.predictions += 1
        row.hits += 1
        row.streak += 1
        row.best_streak = max(row.best_streak, row.streak)
    elif grade == "partial":
        row.predictions += 1
        row.partials += 1
    elif grade == "miss":
        row.predictions += 1
        row.streak = 0

    cards = list(row.cards or [])
    formula_key = norm_formula(payload["formula"])
    new_card = False
    if payload["kind"] != "blend" and formula_key and len(cards) < 80:
        already = any(norm_formula(card.get("formula", "")) == formula_key for card in cards)
        if not already:
            cards.append(
                {
                    "formula": payload["formula"].strip(),
                    "name": payload["name"].strip(),
                    "equation": payload["equation"].strip(),
                    "kind": payload["kind"],
                    "effect": payload["effect"],
                    "caption": (payload.get("caption") or "").strip(),
                }
            )
            new_card = True
            row.cards = cards

    snap = _snapshot(payload)
    cleared = list(row.cleared_challenge_ids or [])
    newly_challenges = [item for item in matching_challenge_ids(snap) if item not in cleared]
    if newly_challenges:
        row.cleared_challenge_ids = cleared + newly_challenges

    solved = list(row.solved_myth_ids or [])
    newly_myths = [item for item in matching_myth_ids(snap) if item not in solved]
    if newly_myths:
        row.solved_myth_ids = solved + newly_myths

    row.updated_at = _now()
    session.commit()
    session.refresh(row)
    return {
        "grade": grade,
        "new_card": new_card,
        "cleared_challenge_ids": newly_challenges,
        "solved_myth_ids": newly_myths,
        "progress": progress_payload(row, user.role),
    }


LAB_TEACHER_ID = "quimix"
LAB_TEACHER_NAME = "Quimix"


def ensure_starter_missions(session: Session) -> None:
    changed = False
    for spec in STARTER_MISSIONS:
        if session.get(ClassMissionRow, spec["id"]) is not None:
            continue
        session.add(
            ClassMissionRow(
                id=spec["id"],
                teacher_id=LAB_TEACHER_ID,
                teacher_name=LAB_TEACHER_NAME,
                title=spec["title"],
                brief=spec["brief"],
                kind=spec["kind"],
                target_formula=spec.get("target_formula"),
                target_mol_l=spec.get("target_mol_l"),
                target_volume_ml=spec.get("target_volume_ml"),
                solute_symbol=spec.get("solute_symbol"),
                myth_id=spec.get("myth_id"),
                created_at=datetime(2026, 1, 1, tzinfo=UTC),
            )
        )
        changed = True
    if changed:
        session.commit()


def list_missions(session: Session, user: User) -> list[dict]:
    ensure_starter_missions(session)
    starter_ids = [item["id"] for item in STARTER_MISSIONS]
    starter_set = set(starter_ids)
    stored = list(session.scalars(select(ClassMissionRow)))
    by_id = {row.id: row for row in stored}
    missions = [by_id[item_id] for item_id in starter_ids if item_id in by_id]
    extras = [row for row in stored if row.id not in starter_set]
    extras.sort(key=lambda row: row.created_at, reverse=True)
    missions.extend(extras)
    if not missions:
        return []
    mission_ids = [mission.id for mission in missions]
    attempts = list(
        session.scalars(select(MissionAttemptRow).where(MissionAttemptRow.mission_id.in_(mission_ids)))
    )
    by_mission: dict[str, list[MissionAttemptRow]] = {}
    for attempt in attempts:
        by_mission.setdefault(attempt.mission_id, []).append(attempt)

    rows: list[dict] = []
    for mission in missions:
        mine = next((item for item in by_mission.get(mission.id, []) if item.student_id == user.id), None)
        visible = user.role == Role.ADMIN or mission.teacher_id == user.id
        attempt_rows = by_mission.get(mission.id, []) if visible else []
        rows.append(_mission_payload(mission, mine, attempt_rows))
    return rows


def _attempt_payload(attempt: MissionAttemptRow) -> dict:
    return {
        "student_id": attempt.student_id,
        "student_name": attempt.student_name,
        "formula": attempt.formula,
        "compound_name": attempt.compound_name,
        "correct": attempt.correct,
        "note": attempt.note,
        "created_at": attempt.created_at.isoformat(),
    }


def _mission_payload(
    mission: ClassMissionRow,
    mine: MissionAttemptRow | None,
    attempts: list[MissionAttemptRow],
) -> dict:
    return {
        "id": mission.id,
        "teacher_id": mission.teacher_id,
        "teacher_name": mission.teacher_name,
        "title": mission.title,
        "brief": mission.brief,
        "kind": mission.kind,
        "target_formula": mission.target_formula,
        "target_mol_l": mission.target_mol_l,
        "target_volume_ml": mission.target_volume_ml,
        "solute_symbol": mission.solute_symbol,
        "myth_id": mission.myth_id,
        "created_at": mission.created_at.isoformat(),
        "my_attempt": _attempt_payload(mine) if mine else None,
        "attempts": [_attempt_payload(item) for item in attempts],
    }


def mission_rule(mission: ClassMissionRow) -> dict:
    return {
        "kind": mission.kind,
        "target_formula": mission.target_formula,
        "target_mol_l": mission.target_mol_l,
        "target_volume_ml": mission.target_volume_ml,
        "solute_symbol": mission.solute_symbol,
        "myth_id": mission.myth_id,
    }


def count_teacher_missions(session: Session, teacher_id: str) -> int:
    return len(list(session.scalars(select(ClassMissionRow.id).where(ClassMissionRow.teacher_id == teacher_id))))


def add_mission(session: Session, row: ClassMissionRow) -> ClassMissionRow:
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


def submit_attempt(session: Session, user: User, mission_id: str, payload: dict) -> dict | None:
    ensure_starter_missions(session)
    mission = session.get(ClassMissionRow, mission_id)
    if mission is None:
        return None
    correct = grade_mission(mission_rule(mission), _snapshot(payload))
    existing = session.scalar(
        select(MissionAttemptRow).where(
            MissionAttemptRow.mission_id == mission.id,
            MissionAttemptRow.student_id == user.id,
        )
    )
    now = _now()
    if existing is None:
        existing = MissionAttemptRow(
            id=payload["attempt_id"],
            mission_id=mission.id,
            student_id=user.id,
            student_name=user.full_name,
            formula=payload["formula"].strip(),
            compound_name=payload["name"].strip(),
            correct=correct,
            note=(payload.get("note") or "").strip(),
            created_at=now,
        )
        session.add(existing)
    else:
        existing.student_name = user.full_name
        existing.formula = payload["formula"].strip()
        existing.compound_name = payload["name"].strip()
        existing.correct = correct
        existing.note = (payload.get("note") or "").strip()
        existing.created_at = now
    session.commit()
    message = (
        "Entrega certa. A mistura cumpre o pedido."
        if correct
        else "A mistura ainda não cumpre o pedido. Ajuste a bancada e simule de novo."
    )
    return {"mission_id": mission.id, "correct": correct, "message": message}
