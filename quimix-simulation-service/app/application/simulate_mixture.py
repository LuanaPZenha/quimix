from app.domain.mixture import InvalidMixtureError, calculate_mixture
from app.domain.models import MixtureComponent, MixtureResult, Reagent
from app.infrastructure.reagent_catalog import find_reagent, get_seed_reagents


class SimulateMixtureUseCase:
    def list_reagents(self) -> list[Reagent]:
        return get_seed_reagents()

    def execute(self, items: list[tuple[str, float]]) -> MixtureResult:
        components: list[MixtureComponent] = []
        for reagent_id, volume_ml in items:
            reagent = find_reagent(reagent_id)
            if reagent is None:
                raise InvalidMixtureError(f"Reagente não encontrado: {reagent_id}")
            components.append(MixtureComponent(reagent=reagent, volume_ml=volume_ml))
        return calculate_mixture(components)
