"""Regras do laboratório: previsão, caderno, desafios, mitos e trilha.

A identidade química continua no frontend. Aqui só entra o que dá para
conferir com fórmula, efeito, volume e concentração já calculados.
"""

from __future__ import annotations

KINDS = {
    "water": "Água",
    "acid": "Ácido",
    "base": "Base",
    "salt": "Sal",
    "gas": "Gás",
    "oxide": "Óxido",
    "alloy": "Liga",
    "organic": "Orgânico",
    "mineral": "Mineral",
    "powder": "Pó",
    "ice": "Gelo",
    "blend": "Mistura",
}

EFFECTS = {
    "none": "Nenhum",
    "explode": "Explosão",
    "melt": "Derrete",
    "freeze": "Congela",
    "ignite": "Pega fogo",
}

TRAIL_STAGES: list[dict] = [
    {
        "id": "sais",
        "title": "Sais e água",
        "detail": "H, O, Na, Cl, C e N. Água, sal e os primeiros mitos cabem aqui.",
        "requires": "Aberta desde o primeiro acesso.",
        "symbols": ["H", "O", "Na", "Cl", "C", "N"],
    },
    {
        "id": "metais",
        "title": "Metais do dia a dia",
        "detail": "K, Ca, Mg, S, Fe, Cu, Zn, Al e Li.",
        "requires": "2 fichas no caderno.",
        "symbols": ["K", "Ca", "Mg", "S", "Fe", "Cu", "Zn", "Al", "Li"],
    },
    {
        "id": "halogenios",
        "title": "Halogênios e metais nobres",
        "detail": "F, Br, I, P, Ag, Au, Si, B e Be.",
        "requires": "5 fichas no caderno.",
        "symbols": ["F", "Br", "I", "P", "Ag", "Au", "Si", "B", "Be"],
    },
    {
        "id": "tabela",
        "title": "Tabela inteira",
        "detail": "O restante da tabela, inclusive gases nobres e os elementos de cuidado.",
        "requires": "8 fichas, ou 5 fichas e 2 mitos resolvidos.",
        "symbols": [],
    },
]

CHALLENGES: list[dict] = [
    {
        "id": "agua",
        "title": "Água no béquer",
        "brief": "Obtenha água (H2O).",
        "formula": "H2O",
    },
    {
        "id": "sal",
        "title": "Sal de cozinha",
        "brief": "Obtenha cloreto de sódio (NaCl).",
        "formula": "NaCl",
    },
    {
        "id": "ferrugem",
        "title": "Ferrugem",
        "brief": "Obtenha óxido de ferro (Fe2O3).",
        "formula": "Fe2O3",
    },
    {
        "id": "sal-meio",
        "title": "Sal a 0,5 mol/L",
        "brief": "Obtenha NaCl com volume entre 90 e 110 mL e sódio e cloro perto de 0,50 mol/L. Com as soluções a 1 mol/L, 50 mL de cada chega lá.",
        "formula": "NaCl",
        "volume_min": 90,
        "volume_max": 110,
        "solutes": {"Na": (0.45, 0.55), "Cl": (0.45, 0.55)},
    },
]

MYTHS: list[dict] = [
    {
        "id": "soda",
        "claim": "Soda cáustica pronta explode no béquer.",
        "prompt": "Adicione a fórmula NaOH, o produto já pronto, sem sódio metálico solto.",
        "formulas": ["NaOH"],
        "effect": "none",
        "lesson": "Soda cáustica pronta é hidróxido de sódio. O espetáculo aparece quando o metal cai na água, não quando o hidróxido já está feito.",
    },
    {
        "id": "polvora",
        "claim": "Pólvora negra explode só de ser misturada.",
        "prompt": "Monte pólvora negra com salitre, carvão e enxofre (K, N, O, C e S, ou as fórmulas KNO3, C e S).",
        "formulas": ["KNO3CS"],
        "effect": "none",
        "lesson": "No béquer a pólvora é um pó. Sem ignição ela não explode.",
    },
    {
        "id": "sodio",
        "claim": "Sódio metálico na água só vira um hidróxido tranquilo.",
        "prompt": "Junte sódio com água pelos elementos (Na, H e O), não pela fórmula NaOH pronta.",
        "formulas": ["NaOH"],
        "effect": "explode",
        "lesson": "O produto é hidróxido, e o perigo está no contato do metal com a água: sai hidrogênio e calor.",
    },
    {
        "id": "tnt",
        "claim": "TNT detona assim que a fórmula entra no béquer.",
        "prompt": "Adicione a fórmula C7H5N3O6.",
        "formulas": ["C7H5N3O6"],
        "effect": "none",
        "lesson": "TNT é um sólido relativamente estável. Sem detonador, o béquer mostra o composto.",
    },
]


def norm_formula(value: str) -> str:
    return "".join(ch for ch in value.upper() if ch.isalnum())


def grade_prediction(
    prediction_kind: str | None,
    prediction_effect: str | None,
    kind: str,
    effect: str,
) -> str:
    if not prediction_kind and not prediction_effect:
        return "skip"
    kind_ok = prediction_kind == kind
    effect_ok = prediction_effect == effect
    if kind_ok and effect_ok:
        return "hit"
    if kind_ok or effect_ok:
        return "partial"
    return "miss"


def open_stage_count(card_count: int, solved_myths: int) -> int:
    if card_count >= 8 or (card_count >= 5 and solved_myths >= 2):
        return 4
    if card_count >= 5:
        return 3
    if card_count >= 2:
        return 2
    return 1


def unlocked_symbols(card_count: int, solved_myths: int, *, trail_free: bool) -> list[str] | None:
    if trail_free or open_stage_count(card_count, solved_myths) >= 4:
        return None
    opened = open_stage_count(card_count, solved_myths)
    symbols: list[str] = []
    for stage in TRAIL_STAGES[:opened]:
        symbols.extend(stage["symbols"])
    return symbols


def next_hint(card_count: int, solved_myths: int, *, trail_free: bool) -> str:
    if trail_free:
        return "Sua bancada fica livre. A trilha abaixo é a dos alunos."
    opened = open_stage_count(card_count, solved_myths)
    if opened >= 4:
        return "A tabela inteira está aberta."
    if opened == 1:
        missing = max(0, 2 - card_count)
        noun = "ficha" if missing == 1 else "fichas"
        return f"Falta {missing} {noun} para abrir {TRAIL_STAGES[1]['title']}." if missing == 1 else f"Faltam {missing} {noun} para abrir {TRAIL_STAGES[1]['title']}."
    if opened == 2:
        missing = max(0, 5 - card_count)
        noun = "ficha" if missing == 1 else "fichas"
        verb = "Falta" if missing == 1 else "Faltam"
        return f"{verb} {missing} {noun} para abrir {TRAIL_STAGES[2]['title']}."
    if solved_myths >= 1:
        return "Mais um mito, ou fichas até 8, abre a tabela inteira."
    missing = max(0, 8 - card_count)
    return f"Faltam {missing} fichas, ou 2 mitos, para abrir a tabela inteira."


def _formula_in(formula: str, expected: str | list[str]) -> bool:
    got = norm_formula(formula)
    values = expected if isinstance(expected, list) else [expected]
    return got in {norm_formula(item) for item in values}


def _solute_map(solutes: list[dict] | None) -> dict[str, float]:
    found: dict[str, float] = {}
    for solute in solutes or []:
        formula = norm_formula(str(solute.get("formula", "")))
        if not formula:
            continue
        try:
            found[formula] = float(solute["resulting_concentration_mol_l"])
        except (KeyError, TypeError, ValueError):
            continue
    return found


def matching_challenge_ids(snapshot: dict) -> list[str]:
    found: list[str] = []
    formula = str(snapshot.get("formula", ""))
    volume = snapshot.get("volume_ml")
    solutes = _solute_map(snapshot.get("solutes"))
    for challenge in CHALLENGES:
        if not _formula_in(formula, challenge["formula"]):
            continue
        if "volume_min" in challenge:
            if not isinstance(volume, (int, float)):
                continue
            if not challenge["volume_min"] <= float(volume) <= challenge["volume_max"]:
                continue
        windows: dict[str, tuple[float, float]] | None = challenge.get("solutes")
        if windows:
            ok = True
            for symbol, (low, high) in windows.items():
                conc = solutes.get(norm_formula(symbol))
                if conc is None or not low <= conc <= high:
                    ok = False
                    break
            if not ok:
                continue
        found.append(challenge["id"])
    return found


def matching_myth_ids(snapshot: dict) -> list[str]:
    found: list[str] = []
    for myth in MYTHS:
        if snapshot.get("effect") != myth["effect"]:
            continue
        if _formula_in(str(snapshot.get("formula", "")), myth["formulas"]):
            found.append(myth["id"])
    return found


def myth_by_id(myth_id: str | None) -> dict | None:
    if not myth_id:
        return None
    return next((item for item in MYTHS if item["id"] == myth_id), None)


def grade_mission(mission: dict, snapshot: dict) -> bool:
    kind = mission.get("kind")
    if kind == "product":
        target = mission.get("target_formula") or ""
        return bool(target) and _formula_in(str(snapshot.get("formula", "")), target)
    if kind == "myth":
        myth = myth_by_id(mission.get("myth_id"))
        if myth is None:
            return False
        return snapshot.get("effect") == myth["effect"] and _formula_in(
            str(snapshot.get("formula", "")),
            myth["formulas"],
        )
    if kind == "concentration":
        target = mission.get("target_formula") or ""
        if not target or not _formula_in(str(snapshot.get("formula", "")), target):
            return False
        target_volume = mission.get("target_volume_ml")
        volume = snapshot.get("volume_ml")
        if target_volume:
            if not isinstance(volume, (int, float)):
                return False
            tolerance = max(8.0, float(target_volume) * 0.1)
            if abs(float(volume) - float(target_volume)) > tolerance:
                return False
        symbol = mission.get("solute_symbol") or ""
        target_mol = mission.get("target_mol_l")
        if target_mol is None or not symbol:
            return False
        conc = _solute_map(snapshot.get("solutes")).get(norm_formula(symbol))
        if conc is None:
            return False
        return abs(conc - float(target_mol)) <= 0.05
    return False


def seals_for(cards: list[dict], solved_myths: list[str]) -> list[dict]:
    kinds = {card.get("kind") for card in cards}
    effects = {card.get("effect") for card in cards}
    return [
        {"id": "sal", "title": "Primeiro sal", "earned": "salt" in kinds},
        {"id": "agua", "title": "Água", "earned": "water" in kinds},
        {"id": "acido-base", "title": "Ácido e base", "earned": "acid" in kinds and "base" in kinds},
        {"id": "oxido", "title": "Óxido", "earned": "oxide" in kinds},
        {
            "id": "perigo",
            "title": "Leu o perigo",
            "earned": any(effect not in {None, "none"} for effect in effects) or len(solved_myths) > 0,
        },
        {"id": "mitos", "title": "Mitos de laboratório", "earned": len(solved_myths) >= 2},
    ]


def public_challenges(cleared: list[str]) -> list[dict]:
    done = set(cleared)
    return [
        {
            "id": item["id"],
            "title": item["title"],
            "brief": item["brief"],
            "cleared": item["id"] in done,
        }
        for item in CHALLENGES
    ]


def public_myths(solved: list[str]) -> list[dict]:
    done = set(solved)
    rows: list[dict] = []
    for item in MYTHS:
        is_solved = item["id"] in done
        rows.append(
            {
                "id": item["id"],
                "claim": item["claim"],
                "prompt": item["prompt"],
                "solved": is_solved,
                "lesson": item["lesson"] if is_solved else None,
            }
        )
    return rows


def public_stages(card_count: int, solved_myths: int) -> list[dict]:
    opened = open_stage_count(card_count, solved_myths)
    rows: list[dict] = []
    for index, stage in enumerate(TRAIL_STAGES):
        rows.append(
            {
                "id": stage["id"],
                "title": stage["title"],
                "detail": stage["detail"],
                "requires": stage["requires"],
                "symbols": list(stage["symbols"]),
                "open": index < opened,
            }
        )
    return rows
