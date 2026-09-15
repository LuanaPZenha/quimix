from app.domain.models import MixtureComponent, MixtureResult, SoluteResult


class InvalidMixtureError(ValueError):
    """Raised when mixture input violates domain rules."""


def calculate_mixture(components: list[MixtureComponent]) -> MixtureResult:
    if not components:
        raise InvalidMixtureError("A mistura precisa de pelo menos um componente.")

    logs: list[str] = []
    warnings: list[str] = []
    total_volume = 0.0
    moles_by_id: dict[str, float] = {}
    meta_by_id: dict[str, MixtureComponent] = {}

    for item in components:
        if item.volume_ml <= 0:
            raise InvalidMixtureError(
                f"Volume inválido para {item.reagent.name}: deve ser > 0 mL."
            )
        if item.reagent.concentration_mol_l < 0:
            raise InvalidMixtureError(
                f"Concentração inválida para {item.reagent.name}."
            )

        volume_l = item.volume_ml / 1000.0
        moles = item.reagent.concentration_mol_l * volume_l
        total_volume += item.volume_ml

        key = item.reagent.id
        moles_by_id[key] = moles_by_id.get(key, 0.0) + moles
        if key in meta_by_id:
            prev = meta_by_id[key]
            meta_by_id[key] = MixtureComponent(
                reagent=prev.reagent,
                volume_ml=prev.volume_ml + item.volume_ml,
            )
        else:
            meta_by_id[key] = item

        logs.append(
            f"Adicionado {item.volume_ml:.2f} mL de {item.reagent.name} "
            f"({item.reagent.formula}) a {item.reagent.concentration_mol_l:.4f} mol/L "
            f"→ {moles:.6f} mol"
        )

    if total_volume <= 0:
        raise InvalidMixtureError("Volume total da mistura deve ser > 0.")

    total_volume_l = total_volume / 1000.0
    logs.append(f"Volume total (aditivo): {total_volume:.2f} mL")

    solutes: list[SoluteResult] = []
    for reagent_id, moles in moles_by_id.items():
        component = meta_by_id[reagent_id]
        resulting = moles / total_volume_l
        solutes.append(
            SoluteResult(
                reagent_id=reagent_id,
                name=component.reagent.name,
                formula=component.reagent.formula,
                resulting_concentration_mol_l=round(resulting, 6),
                contributed_volume_ml=component.volume_ml,
            )
        )
        logs.append(
            f"Concentração resultante de {component.reagent.name}: "
            f"{resulting:.6f} mol/L (= {moles:.6f} mol / {total_volume_l:.6f} L)"
        )

    if len(solutes) > 1:
        warnings.append(
            "Mistura com múltiplos solutos: volumes tratados como aditivos; "
            "não há modelagem de reação química nesta versão."
        )

    return MixtureResult(
        total_volume_ml=round(total_volume, 4),
        solutes=tuple(solutes),
        logs=tuple(logs),
        warnings=tuple(warnings),
    )
