from app.domain.models import Reagent

# Compound seeds kept for backward compatibility / demos
COMPOUND_REAGENTS: tuple[Reagent, ...] = (
    Reagent(
        id="hcl-1m",
        name="Ácido clorídrico",
        formula="HCl",
        concentration_mol_l=1.0,
    ),
    Reagent(
        id="naoh-1m",
        name="Hidróxido de sódio",
        formula="NaOH",
        concentration_mol_l=1.0,
    ),
    Reagent(
        id="water",
        name="Água destilada",
        formula="H2O",
        concentration_mol_l=0.0,
    ),
)

# Symbol -> (name, default concentration mol/L for mixture simulation)
ELEMENT_CATALOG: dict[str, tuple[str, float]] = {
    "H": ("Hidrogênio", 1.0),
    "He": ("Hélio", 0.5),
    "Li": ("Lítio", 1.0),
    "Be": ("Berílio", 1.0),
    "B": ("Boro", 1.0),
    "C": ("Carbono", 1.0),
    "N": ("Nitrogênio", 1.0),
    "O": ("Oxigênio", 1.0),
    "F": ("Flúor", 1.0),
    "Ne": ("Neônio", 0.5),
    "Na": ("Sódio", 1.0),
    "Mg": ("Magnésio", 1.0),
    "Al": ("Alumínio", 1.0),
    "Si": ("Silício", 1.0),
    "P": ("Fósforo", 1.0),
    "S": ("Enxofre", 1.0),
    "Cl": ("Cloro", 1.0),
    "Ar": ("Argônio", 0.5),
    "K": ("Potássio", 1.0),
    "Ca": ("Cálcio", 1.0),
    "Fe": ("Ferro", 1.0),
    "Cu": ("Cobre", 1.0),
    "Zn": ("Zinco", 1.0),
    "Br": ("Bromo", 1.0),
    "Ag": ("Prata", 1.0),
    "I": ("Iodo", 1.0),
    "Au": ("Ouro", 0.5),
    "Hg": ("Mercúrio", 1.0),
    "Pb": ("Chumbo", 1.0),
    "U": ("Urânio", 0.5),
}


def _element_reagent(symbol: str) -> Reagent | None:
    meta = ELEMENT_CATALOG.get(symbol)
    if meta is None:
        # Unknown element still simulable with default concentration
        if not symbol or len(symbol) > 3:
            return None
        return Reagent(
            id=f"el-{symbol}",
            name=f"Elemento {symbol}",
            formula=symbol,
            concentration_mol_l=1.0,
        )
    name, conc = meta
    return Reagent(
        id=f"el-{symbol}",
        name=name,
        formula=symbol,
        concentration_mol_l=conc,
    )


def get_seed_reagents() -> list[Reagent]:
    elements = [_element_reagent(sym) for sym in ELEMENT_CATALOG]
    return list(COMPOUND_REAGENTS) + [e for e in elements if e is not None]


def find_reagent(reagent_id: str) -> Reagent | None:
    for reagent in COMPOUND_REAGENTS:
        if reagent.id == reagent_id:
            return reagent
    if reagent_id.startswith("el-"):
        symbol = reagent_id[3:]
        return _element_reagent(symbol)
    return None
