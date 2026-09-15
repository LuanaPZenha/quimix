from enum import StrEnum

from dataclasses import dataclass
from datetime import datetime


class Role(StrEnum):
    ALUNO = "aluno"
    PROFESSOR = "professor"
    ADMIN = "admin"


@dataclass(slots=True)
class User:
    id: str
    email: str
    full_name: str
    role: Role
    password_hash: str
    created_at: datetime
    is_active: bool = True
