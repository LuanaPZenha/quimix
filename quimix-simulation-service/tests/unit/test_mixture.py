import pytest

from app.domain.mixture import InvalidMixtureError, calculate_mixture
from app.domain.models import MixtureComponent, Reagent


def _reagent(rid: str, name: str, formula: str, conc: float) -> Reagent:
    return Reagent(id=rid, name=name, formula=formula, concentration_mol_l=conc)


def test_dilution_halves_concentration():
    hcl = _reagent("hcl", "HCl", "HCl", 1.0)
    water = _reagent("water", "Água", "H2O", 0.0)

    result = calculate_mixture(
        [
            MixtureComponent(reagent=hcl, volume_ml=50),
            MixtureComponent(reagent=water, volume_ml=50),
        ]
    )

    assert result.total_volume_ml == 100
    solutes = {s.reagent_id: s for s in result.solutes}
    assert solutes["hcl"].resulting_concentration_mol_l == pytest.approx(0.5)
    assert solutes["water"].resulting_concentration_mol_l == 0.0
    assert len(result.logs) >= 3


def test_same_solute_volumes_combine():
    hcl = _reagent("hcl", "HCl", "HCl", 1.0)
    result = calculate_mixture(
        [
            MixtureComponent(reagent=hcl, volume_ml=30),
            MixtureComponent(reagent=hcl, volume_ml=70),
        ]
    )
    assert result.total_volume_ml == 100
    assert len(result.solutes) == 1
    assert result.solutes[0].resulting_concentration_mol_l == pytest.approx(1.0)


def test_rejects_empty_mixture():
    with pytest.raises(InvalidMixtureError):
        calculate_mixture([])


def test_rejects_non_positive_volume():
    hcl = _reagent("hcl", "HCl", "HCl", 1.0)
    with pytest.raises(InvalidMixtureError):
        calculate_mixture([MixtureComponent(reagent=hcl, volume_ml=0)])
