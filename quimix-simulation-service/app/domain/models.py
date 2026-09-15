from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class Reagent:
    id: str
    name: str
    formula: str
    concentration_mol_l: float
    unit_label: str = "mol/L"


@dataclass(frozen=True, slots=True)
class MixtureComponent:
    reagent: Reagent
    volume_ml: float


@dataclass(frozen=True, slots=True)
class SoluteResult:
    reagent_id: str
    name: str
    formula: str
    resulting_concentration_mol_l: float
    contributed_volume_ml: float


@dataclass(frozen=True, slots=True)
class MixtureResult:
    total_volume_ml: float
    solutes: tuple[SoluteResult, ...]
    logs: tuple[str, ...]
    warnings: tuple[str, ...]
