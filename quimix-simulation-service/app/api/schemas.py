from pydantic import BaseModel, Field, field_validator


class ReagentResponse(BaseModel):
    id: str
    name: str
    formula: str
    concentration_mol_l: float
    unit_label: str


class MixtureComponentRequest(BaseModel):
    reagent_id: str = Field(min_length=1, max_length=64)
    volume_ml: float = Field(gt=0, le=100_000)

    @field_validator("reagent_id")
    @classmethod
    def strip_id(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("reagent_id não pode ser vazio")
        return cleaned


class MixtureRequest(BaseModel):
    components: list[MixtureComponentRequest] = Field(min_length=1, max_length=50)


class SoluteResponse(BaseModel):
    reagent_id: str
    name: str
    formula: str
    resulting_concentration_mol_l: float
    contributed_volume_ml: float


class MixtureResponse(BaseModel):
    total_volume_ml: float
    solutes: list[SoluteResponse]
    logs: list[str]
    warnings: list[str]
