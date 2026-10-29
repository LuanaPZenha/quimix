from app.domain.learn_catalog import (
    grade_mission,
    grade_prediction,
    matching_challenge_ids,
    matching_myth_ids,
    open_stage_count,
    unlocked_symbols,
)


def test_prediction_grades():
    assert grade_prediction(None, None, "salt", "none") == "skip"
    assert grade_prediction("salt", "none", "salt", "none") == "hit"
    assert grade_prediction("salt", "explode", "salt", "none") == "partial"
    assert grade_prediction("gas", "explode", "salt", "none") == "miss"


def test_challenges_match_salt_and_dilution():
    salt = matching_challenge_ids(
        {
            "formula": "NaCl",
            "effect": "none",
            "volume_ml": 100,
            "solutes": [
                {"formula": "Na", "resulting_concentration_mol_l": 0.5},
                {"formula": "Cl", "resulting_concentration_mol_l": 0.5},
            ],
        }
    )
    assert salt == ["sal", "sal-meio"]
    assert matching_challenge_ids({"formula": "H2O", "effect": "none", "volume_ml": 50, "solutes": []}) == [
        "agua"
    ]


def test_myths_distinguish_ready_soda_from_sodium_metal():
    ready = matching_myth_ids({"formula": "NaOH", "effect": "none"})
    metal = matching_myth_ids({"formula": "NaOH", "effect": "explode"})
    powder = matching_myth_ids({"formula": "KNO3·C·S", "effect": "none"})
    assert ready == ["soda"]
    assert metal == ["sodio"]
    assert powder == ["polvora"]


def test_trail_opens_with_cards_and_keeps_early_gates():
    assert open_stage_count(0, 2) == 1
    assert open_stage_count(2, 0) == 2
    assert open_stage_count(5, 0) == 3
    assert open_stage_count(5, 2) == 4
    assert unlocked_symbols(0, 0, trail_free=False) == ["H", "O", "Na", "Cl", "C", "N"]
    assert unlocked_symbols(8, 0, trail_free=False) is None
    assert unlocked_symbols(0, 0, trail_free=True) is None


def test_teacher_mission_grades_product_and_concentration():
    product = {"kind": "product", "target_formula": "NaCl"}
    assert grade_mission(product, {"formula": "NaCl"}) is True
    assert grade_mission(product, {"formula": "H2O"}) is False
    concentration = {
        "kind": "concentration",
        "target_formula": "NaCl",
        "target_mol_l": 0.5,
        "target_volume_ml": 100,
        "solute_symbol": "Na",
    }
    snapshot = {
        "formula": "NaCl",
        "volume_ml": 100,
        "solutes": [{"formula": "Na", "resulting_concentration_mol_l": 0.5}],
    }
    assert grade_mission(concentration, snapshot) is True
    snapshot["solutes"] = [{"formula": "Na", "resulting_concentration_mol_l": 0.2}]
    assert grade_mission(concentration, snapshot) is False
