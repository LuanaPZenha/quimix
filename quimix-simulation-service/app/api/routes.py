from fastapi import APIRouter, Depends, HTTPException, status

from app.api.schemas import (
    MixtureRequest,
    MixtureResponse,
    ReagentResponse,
    SoluteResponse,
)
from app.application.simulate_mixture import SimulateMixtureUseCase
from app.domain.mixture import InvalidMixtureError

router = APIRouter(prefix="/api/v1")


def get_use_case() -> SimulateMixtureUseCase:
    return SimulateMixtureUseCase()


@router.get("/reagents", response_model=list[ReagentResponse])
def list_reagents(use_case: SimulateMixtureUseCase = Depends(get_use_case)) -> list[ReagentResponse]:
    reagents = use_case.list_reagents()
    return [
        ReagentResponse(
            id=r.id,
            name=r.name,
            formula=r.formula,
            concentration_mol_l=r.concentration_mol_l,
            unit_label=r.unit_label,
        )
        for r in reagents
    ]


@router.post(
    "/simulations/mixtures",
    response_model=MixtureResponse,
    status_code=status.HTTP_200_OK,
)
def simulate_mixture(
    payload: MixtureRequest,
    use_case: SimulateMixtureUseCase = Depends(get_use_case),
) -> MixtureResponse:
    try:
        result = use_case.execute(
            [(c.reagent_id, c.volume_ml) for c in payload.components]
        )
    except InvalidMixtureError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    return MixtureResponse(
        total_volume_ml=result.total_volume_ml,
        solutes=[
            SoluteResponse(
                reagent_id=s.reagent_id,
                name=s.name,
                formula=s.formula,
                resulting_concentration_mol_l=s.resulting_concentration_mol_l,
                contributed_volume_ml=s.contributed_volume_ml,
            )
            for s in result.solutes
        ],
        logs=list(result.logs),
        warnings=list(result.warnings),
    )
