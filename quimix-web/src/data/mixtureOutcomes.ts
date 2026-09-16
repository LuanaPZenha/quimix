import { PERIODIC_ELEMENTS, type PeriodicElement } from "./periodicTable";

export type MixtureKind =
  | "water"
  | "acid"
  | "base"
  | "salt"
  | "gas"
  | "oxide"
  | "alloy"
  | "organic"
  | "mineral"
  | "powder"
  | "ice"
  | "blend";

export type MixtureEffect = "none" | "explode" | "melt" | "freeze" | "ignite";

export type MixtureInput = {
  symbol: string;
  volumeMl: number;
};

export type MixtureOutcome = {
  key: string;
  formula: string;
  name: string;
  equation: string;
  kind: MixtureKind;
  effect: MixtureEffect;
  liquidColor: string;
  caption: string;
  ratioHint?: string;
  why?: string;
};

type Recipe = {
  key: string;
  stoich: Record<string, number>;
  formula: string;
  name: string;
  equation: string;
  kind: MixtureKind;
  effect: MixtureEffect;
  liquidColor: string;
  caption: string;
  why?: string;
};

const KIND_COLOR: Record<MixtureKind, string> = {
  water: "#3d9fd6",
  acid: "#c6d96a",
  base: "#dfeaf2",
  salt: "#eef6fb",
  gas: "#8aa4b8",
  oxide: "#c4a882",
  alloy: "#b7c2cc",
  organic: "#c4a070",
  mineral: "#d9cbb0",
  powder: "#2a2118",
  ice: "#c8e4f8",
  blend: "#7aa392",
};

const ALKALI_METALS = new Set(["Li", "Na", "K", "Rb", "Cs", "Fr"]);

const ELEMENT_COLORS: Record<string, string> = {
  H: "#f4fbff",
  He: "#c5b8e0",
  O: "#4ea8d8",
  N: "#7ea6e8",
  C: "#3a3a3a",
  S: "#e4d35a",
  Cl: "#9ccc4a",
  F: "#b7e07a",
  Br: "#b85a3a",
  I: "#6b3fa0",
  Na: "#f0a05a",
  K: "#e090c8",
  Li: "#f2b5a0",
  Ca: "#f5d29a",
  Mg: "#e8d090",
  Fe: "#b87333",
  Cu: "#c4713b",
  Zn: "#9aa7b0",
  Ag: "#cfd6dc",
  Au: "#d4b44a",
  Al: "#b8d4c8",
  Si: "#d4c9e8",
  P: "#e07050",
  Pb: "#6a7380",
  Hg: "#9aa3ad",
  Sn: "#c5d0d6",
};

const ELEMENT_NAME = Object.fromEntries(
  PERIODIC_ELEMENTS.map((el) => [el.symbol, el.name]),
) as Record<string, string>;

const NOT_CATION = new Set([
  "H",
  "He",
  "C",
  "N",
  "O",
  "F",
  "Ne",
  "P",
  "S",
  "Cl",
  "Ar",
  "Se",
  "Br",
  "Kr",
  "I",
  "Xe",
  "At",
  "Rn",
  "Ts",
  "Og",
]);

const HALOGENS = [
  { symbol: "F", anion: "fluoreto", acid: "ácido fluorídrico" },
  { symbol: "Cl", anion: "cloreto", acid: "ácido clorídrico" },
  { symbol: "Br", anion: "brometo", acid: "ácido bromídrico" },
  { symbol: "I", anion: "iodeto", acid: "ácido iodídrico" },
  { symbol: "At", anion: "astateto", acid: "ácido astatídrico" },
] as const;

const RECIPES: Recipe[] = [];
const BY_KEY = new Map<string, Recipe[]>();
const BY_FORMULA = new Map<string, Recipe>();
const BY_NAME = new Map<string, Recipe>();

export const FORMULA_PRESETS = [
  "H2O",
  "NaCl",
  "HCl",
  "NaOH",
  "H2SO4",
  "HNO3",
  "CO2",
  "CH4",
  "NH3",
  "H2O2",
  "CaCO3",
  "Fe2O3",
  "C2H5OH",
  "C6H12O6",
  "KOH",
] as const;

function formulaIndex(formula: string): string {
  return formula
    .replace(/[₀₁₂₃₄₅₆₇₈₉]/g, (digit) => "0123456789"["₀₁₂₃₄₅₆₇₈₉".indexOf(digit)] ?? digit)
    .replace(/[^A-Za-z0-9()]/g, "");
}

function nameIndex(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

export function mixtureKey(symbols: string[]): string {
  return [...new Set(symbols)].sort((a, b) => a.localeCompare(b)).join("+");
}

export function colorForSymbol(symbol: string, fallback = "#a8d5a2"): string {
  return ELEMENT_COLORS[symbol] ?? fallback;
}

export function prettyFormula(formula: string): string {
  const subs = "₀₁₂₃₄₅₆₇₈₉";
  return formula.replace(/\d/g, (digit) => subs[Number(digit)] ?? digit);
}

function ofName(symbol: string): string {
  return (ELEMENT_NAME[symbol] ?? symbol).toLowerCase();
}

function equationFrom(stoich: Record<string, number>, formula: string): string {
  const left = Object.entries(stoich)
    .map(([symbol, count]) => (count === 1 ? symbol : `${count} ${symbol}`))
    .join(" + ");
  return `${left} → ${prettyFormula(formula)}`;
}

function ionicCounts(cationCharge: number, anionCharge: number): { cations: number; anions: number } {
  let cations = Math.abs(anionCharge);
  let anions = Math.abs(cationCharge);
  const divisor = gcd(cations, anions);
  cations /= divisor;
  anions /= divisor;
  return { cations, anions };
}

function formulaOf(
  metal: string,
  metalCount: number,
  anion: string,
  anionCount: number,
  polyatomic: boolean,
): string {
  const metalPart = metalCount === 1 ? metal : `${metal}${metalCount}`;
  if (anionCount === 1) return metalPart + anion;
  if (polyatomic) return `${metalPart}(${anion})${anionCount}`;
  return `${metalPart}${anion}${anionCount}`;
}

function addRecipe(
  stoich: Record<string, number>,
  formula: string,
  name: string,
  kind: MixtureKind,
  options: {
    caption?: string;
    color?: string;
    effect?: MixtureEffect;
    why?: string;
  } = {},
): void {
  const clean: Record<string, number> = {};
  for (const [symbol, count] of Object.entries(stoich)) {
    if (count > 0) clean[symbol] = count;
  }
  const key = mixtureKey(Object.keys(clean));
  const recipe: Recipe = {
    key,
    stoich: clean,
    formula,
    name,
    equation: equationFrom(clean, formula),
    kind,
    effect: options.effect ?? "none",
    liquidColor: options.color ?? KIND_COLOR[kind],
    caption: options.caption ?? `A mistura vira ${name}.`,
    why: options.why,
  };
  RECIPES.push(recipe);
  const list = BY_KEY.get(key);
  if (list) list.push(recipe);
  else BY_KEY.set(key, [recipe]);
  const formulaKey = formulaIndex(formula);
  if (formulaKey) BY_FORMULA.set(formulaKey, recipe);
  const named = nameIndex(name);
  if (named && !BY_NAME.has(named)) BY_NAME.set(named, recipe);
}

function addIonic(
  metal: string,
  charge: number,
  anionSymbol: string,
  anionCharge: number,
  anionName: string,
  kind: MixtureKind,
  polyatomic = false,
  anionLabel = anionSymbol,
): void {
  const { cations, anions } = ionicCounts(charge, anionCharge);
  addRecipe(
    { [metal]: cations, [anionSymbol]: anions },
    formulaOf(metal, cations, anionLabel, anions, polyatomic),
    `${anionName} de ${ofName(metal)}`,
    kind,
  );
}

function addPolyatomic(
  metal: string,
  charge: number,
  parts: Record<string, number>,
  anionFormula: string,
  anionCharge: number,
  name: string,
  kind: MixtureKind,
): void {
  const { cations, anions } = ionicCounts(charge, anionCharge);
  const stoich: Record<string, number> = { [metal]: cations };
  for (const [symbol, count] of Object.entries(parts)) {
    stoich[symbol] = (stoich[symbol] ?? 0) + count * anions;
  }
  addRecipe(
    stoich,
    formulaOf(metal, cations, anionFormula, anions, true),
    `${name} de ${ofName(metal)}`,
    kind,
  );
}

function defaultCharge(el: PeriodicElement): number {
  if (el.category === "alkali") return 1;
  if (el.category === "alkaline-earth") return 2;
  if (el.category === "lanthanide") return 3;
  if (el.symbol === "U") return 6;
  if (el.symbol === "Th" || el.symbol === "Pa") return 4;
  if (el.category === "actinide") return 3;
  switch (el.group) {
    case 3:
      return 3;
    case 4:
      return 4;
    case 5:
      return 5;
    case 6:
      return el.symbol === "Cr" ? 3 : 6;
    case 7:
      return el.symbol === "Mn" ? 4 : 7;
    case 8:
    case 9:
    case 10:
      if (el.symbol === "Fe") return 3;
      if (el.symbol === "Os" || el.symbol === "Ru") return 4;
      if (el.symbol === "Pt") return 4;
      return 2;
    case 11:
      if (el.symbol === "Ag") return 1;
      if (el.symbol === "Au") return 3;
      return 2;
    case 12:
      return 2;
    case 13:
      return el.symbol === "Tl" ? 1 : 3;
    case 14:
      return el.symbol === "Pb" ? 2 : 4;
    case 15:
      return 3;
    case 16:
      return 2;
    default:
      return 2;
  }
}

function addMetalChemistry(el: PeriodicElement, charge: number): void {
  const metal = el.symbol;
  for (const halogen of HALOGENS) {
    addIonic(metal, charge, halogen.symbol, 1, halogen.anion, "salt");
  }
  addIonic(metal, charge, "O", 2, "óxido", "oxide");
  addIonic(metal, charge, "S", 2, "sulfeto", "oxide");
  addIonic(metal, charge, "Se", 2, "seleneto", "salt");
  addIonic(metal, charge, "N", 3, "nitreto", "oxide");
  addIonic(metal, charge, "P", 3, "fosfeto", "oxide");
  addIonic(metal, charge, "C", 4, "carboneto", "oxide");
  addIonic(metal, charge, "H", 1, "hidreto", "salt");
  addPolyatomic(metal, charge, { O: 1, H: 1 }, "OH", 1, "hidróxido", "base");
  addPolyatomic(metal, charge, { C: 1, O: 3 }, "CO3", 2, "carbonato", "salt");
  addPolyatomic(metal, charge, { H: 1, C: 1, O: 3 }, "HCO3", 1, "bicarbonato", "salt");
  addPolyatomic(metal, charge, { S: 1, O: 4 }, "SO4", 2, "sulfato", "salt");
  addPolyatomic(metal, charge, { S: 1, O: 3 }, "SO3", 2, "sulfito", "salt");
  addPolyatomic(metal, charge, { N: 1, O: 3 }, "NO3", 1, "nitrato", "salt");
  addPolyatomic(metal, charge, { N: 1, O: 2 }, "NO2", 1, "nitrito", "salt");
  addPolyatomic(metal, charge, { P: 1, O: 4 }, "PO4", 3, "fosfato", "salt");
  addPolyatomic(metal, charge, { Cl: 1, O: 3 }, "ClO3", 1, "clorato", "salt");
  addPolyatomic(metal, charge, { Cl: 1, O: 4 }, "ClO4", 1, "perclorato", "salt");
}

for (const el of PERIODIC_ELEMENTS) {
  if (NOT_CATION.has(el.symbol)) continue;
  addMetalChemistry(el, defaultCharge(el));
}

const CHARGE_VARIANTS: Record<string, number[]> = {
  Fe: [2],
  Cu: [1],
  Sn: [2],
  Pb: [4],
  Hg: [1],
  Tl: [3],
  Cr: [6, 2],
  Mn: [2, 7],
  Co: [3],
  Ni: [3],
  Au: [1],
  Pt: [2],
  V: [4, 3],
  Ti: [3],
  W: [4],
  Mo: [4],
  U: [4],
  Ce: [4],
  Sb: [5],
  As: [5],
  Bi: [5],
};

for (const [symbol, charges] of Object.entries(CHARGE_VARIANTS)) {
  const el = PERIODIC_ELEMENTS.find((item) => item.symbol === symbol);
  if (!el) continue;
  for (const charge of charges) addMetalChemistry(el, charge);
}

addRecipe({ H: 2, O: 1 }, "H2O", "Água", "water", {
  caption: "A mistura se condensa e vira água.",
  color: "#3d9fd6",
});
addRecipe({ H: 2, O: 2 }, "H2O2", "Água oxigenada", "acid", {
  caption: "A mistura vira peróxido de hidrogênio (água oxigenada).",
  color: "#9fd4e8",
});

addRecipe({ H: 1, F: 1 }, "HF", "ácido fluorídrico", "acid", {
  caption: "A mistura vira ácido fluorídrico, o único ácido comum que ataca o vidro.",
  effect: "melt",
  why: "O HF reage com a sílica do vidro (SiO₂ + 6 HF → H₂SiF₆ + 2 H₂O). Por isso o béquer de vidro é o recipiente errado: o ácido dissolve o próprio frasco. Ácidos como HCl ou H₂SO₄ não fazem isso.",
});
for (const halogen of HALOGENS) {
  if (halogen.symbol === "F") continue;
  addRecipe({ H: 1, [halogen.symbol]: 1 }, `H${halogen.symbol}`, halogen.acid, "acid");
}

addRecipe({ H: 2, S: 1 }, "H2S", "Gás sulfídrico", "gas", {
  caption: "O H₂S é um gás tóxico e inflamável. No béquer ele aparece como gás; só queima se houver ignição.",
});
addRecipe({ H: 2, Se: 1 }, "H2Se", "Seleneto de hidrogênio", "gas");
addRecipe({ H: 2, Te: 1 }, "H2Te", "Telureto de hidrogênio", "gas");
addRecipe({ N: 1, H: 3 }, "NH3", "Amônia", "gas", {
  caption: "A mistura vira amônia, um gás incolor e pungente.",
});
addRecipe({ P: 1, H: 3 }, "PH3", "Fosfina", "gas", {
  caption: "A fosfina é um gás que inflama sozinho no ar.",
  effect: "ignite",
  why: "A fosfina é pirofórica: ao se formar, reage com o oxigênio do ar e pega fogo. Não é uma queima “de palco” — é a instabilidade do PH₃ em contato com o ar.",
});
addRecipe({ As: 1, H: 3 }, "AsH3", "Arsina", "gas");
addRecipe({ Sb: 1, H: 3 }, "SbH3", "Estibina", "gas");
addRecipe({ B: 2, H: 6 }, "B2H6", "Diborano", "gas", {
  caption: "O diborano inflama espontaneamente no ar.",
  effect: "ignite",
  why: "O diborano é pirofórico. A ligação B–H reage com O₂ assim que o gás encontra o ar, então a mistura inflama sem fósforo nem faísca.",
});
addRecipe({ Si: 1, H: 4 }, "SiH4", "Silano", "gas", {
  caption: "O silano pega fogo ao contato com o ar.",
  effect: "ignite",
  why: "O silano é pirofórico: a mistura com o oxigênio do ar é espontânea e exotérmica o bastante para inflamar.",
});
addRecipe({ C: 1, H: 4 }, "CH4", "Metano", "gas", {
  caption: "A mistura vira metano, o principal componente do gás natural. É inflamável, mas no béquer permanece como gás até haver ignição.",
});
addRecipe({ C: 1, H: 1 }, "CH", "Radical metino", "gas");
addRecipe({ C: 2, H: 2 }, "C2H2", "Acetileno", "gas", {
  caption: "A mistura vira acetileno, usado em maçaricos. É um gás inflamável, não uma chama pronta.",
});
addRecipe({ C: 2, H: 4 }, "C2H4", "Etileno", "gas");
addRecipe({ C: 2, H: 6 }, "C2H6", "Etano", "gas");
addRecipe({ C: 3, H: 8 }, "C3H8", "Propano", "gas", {
  caption: "A mistura vira propano, o gás de botijão. Inflama só com uma fonte de calor.",
});
addRecipe({ C: 4, H: 10 }, "C4H10", "Butano", "gas");
addRecipe({ C: 6, H: 6 }, "C6H6", "Benzeno", "organic", {
  caption: "A mistura vira benzeno, um líquido inflamável.",
});
addRecipe({ C: 8, H: 18 }, "C8H18", "Octano", "organic", {
  caption: "A mistura se aproxima da gasolina: um líquido combustível, não uma chama.",
});

addRecipe({ C: 1, O: 1 }, "CO", "Monóxido de carbono", "gas", {
  caption: "A mistura vira monóxido de carbono, um gás tóxico.",
  color: "#6a7a88",
});
addRecipe({ C: 1, O: 2 }, "CO2", "Gás carbônico", "gas", {
  caption: "A mistura vira dióxido de carbono.",
});
addRecipe({ N: 2, O: 1 }, "N2O", "Óxido nitroso", "gas", {
  caption: "A mistura vira óxido nitroso (gás hilariante).",
});
addRecipe({ N: 1, O: 1 }, "NO", "Monóxido de nitrogênio", "gas");
addRecipe({ N: 1, O: 2 }, "NO2", "Dióxido de nitrogênio", "gas", {
  caption: "A mistura vira um gás acastanhado, o NO₂.",
  color: "#c45c26",
});
addRecipe({ N: 2, O: 4 }, "N2O4", "Tetróxido de dinitrogênio", "gas");
addRecipe({ N: 2, O: 5 }, "N2O5", "Pentóxido de dinitrogênio", "oxide");
addRecipe({ S: 1, O: 2 }, "SO2", "Dióxido de enxofre", "gas", {
  caption: "A mistura vira dióxido de enxofre.",
});
addRecipe({ S: 1, O: 3 }, "SO3", "Trióxido de enxofre", "gas");
addRecipe({ P: 4, O: 6 }, "P4O6", "Trióxido de fósforo", "oxide");
addRecipe({ P: 4, O: 10 }, "P4O10", "Pentóxido de fósforo", "oxide");
addRecipe({ P: 2, O: 5 }, "P2O5", "Pentóxido de fósforo", "oxide");
addRecipe({ P: 2, O: 3 }, "P2O3", "Trióxido de fósforo", "oxide");
addRecipe({ B: 2, O: 3 }, "B2O3", "Óxido de boro", "oxide");
addRecipe({ Si: 1, O: 2 }, "SiO2", "Sílica (areia)", "mineral", {
  caption: "A mistura vira sílica, o principal componente da areia.",
  color: "#e4d9b8",
});
addRecipe({ As: 2, O: 3 }, "As2O3", "Óxido de arsênio", "oxide");
addRecipe({ Sb: 2, O: 3 }, "Sb2O3", "Óxido de antimônio", "oxide");
addRecipe({ Se: 1, O: 2 }, "SeO2", "Dióxido de selênio", "oxide");
addRecipe({ Te: 1, O: 2 }, "TeO2", "Dióxido de telúrio", "oxide");
addRecipe({ Cl: 2, O: 1 }, "Cl2O", "Monóxido de dicloro", "gas");
addRecipe({ Cl: 2, O: 7 }, "Cl2O7", "Heptóxido de dicloro", "oxide", {
  caption: "O Cl₂O₇ é um oxidante extremamente instável.",
  effect: "explode",
  why: "O heptóxido de dicloro é tão oxidante e instável que detona ao se formar ou ao menor atrito. Aqui a explosão ensina o risco da mistura, não um “efeito especial”.",
});
addRecipe({ F: 2, O: 1 }, "OF2", "Difluoreto de oxigênio", "gas");

addRecipe({ C: 1, S: 2 }, "CS2", "Dissulfeto de carbono", "organic", {
  caption: "O CS₂ é um líquido muito inflamável. No béquer ele aparece como solvente, não como fogo.",
});
addRecipe({ C: 1, N: 1 }, "CN", "Cianeto", "organic");
addRecipe({ Si: 1, C: 1 }, "SiC", "Carboneto de silício", "mineral", {
  caption: "A mistura vira carborundum, um abrasivo duríssimo.",
});
addRecipe({ B: 1, N: 1 }, "BN", "Nitreto de boro", "mineral");
addRecipe({ B: 4, C: 1 }, "B4C", "Carboneto de boro", "mineral");
addRecipe({ Fe: 1, S: 2 }, "FeS2", "Pirita", "mineral", {
  caption: "A mistura vira pirita, o ouro dos tolos.",
  color: "#d4b44a",
});
addRecipe({ Fe: 3, C: 1 }, "Fe3C", "Cementita", "alloy");
addRecipe({ Ca: 1, C: 2 }, "CaC2", "Carboneto de cálcio", "oxide", {
  caption: "A mistura vira carbureto de cálcio, que gera acetileno com água.",
});

addRecipe({ H: 2, S: 1, O: 4 }, "H2SO4", "Ácido sulfúrico", "acid", {
  caption: "A mistura vira ácido sulfúrico, um ácido forte.",
});
addRecipe({ H: 2, S: 1, O: 3 }, "H2SO3", "Ácido sulfuroso", "acid");
addRecipe({ H: 1, N: 1, O: 3 }, "HNO3", "Ácido nítrico", "acid", {
  caption: "A mistura vira ácido nítrico.",
});
addRecipe({ H: 1, N: 1, O: 2 }, "HNO2", "Ácido nitroso", "acid");
addRecipe({ H: 3, P: 1, O: 4 }, "H3PO4", "Ácido fosfórico", "acid");
addRecipe({ H: 3, P: 1, O: 3 }, "H3PO3", "Ácido fosforoso", "acid");
addRecipe({ H: 3, B: 1, O: 3 }, "H3BO3", "Ácido bórico", "acid");
addRecipe({ H: 2, C: 1, O: 3 }, "H2CO3", "Ácido carbônico", "acid", {
  caption: "A mistura vira ácido carbônico, o ácido dos refrigerantes.",
});
addRecipe({ H: 1, C: 1, N: 1 }, "HCN", "Ácido cianídrico", "acid", {
  caption: "A mistura vira ácido cianídrico, extremamente tóxico.",
});
addRecipe({ H: 1, Cl: 1, O: 1 }, "HClO", "Ácido hipocloroso", "acid");
addRecipe({ H: 1, Cl: 1, O: 2 }, "HClO2", "Ácido cloroso", "acid");
addRecipe({ H: 1, Cl: 1, O: 3 }, "HClO3", "Ácido clórico", "acid");
addRecipe({ H: 1, Cl: 1, O: 4 }, "HClO4", "Ácido perclórico", "acid");
addRecipe({ H: 1, Br: 1, O: 3 }, "HBrO3", "Ácido brômico", "acid");
addRecipe({ H: 1, I: 1, O: 3 }, "HIO3", "Ácido iódico", "acid");
addRecipe({ H: 1, Mn: 1, O: 4 }, "HMnO4", "Ácido permangânico", "acid", {
  color: "#6b1a5c",
});
addRecipe({ H: 2, Cr: 1, O: 4 }, "H2CrO4", "Ácido crômico", "acid", {
  color: "#c45c26",
});
addRecipe({ H: 2, Cr: 2, O: 7 }, "H2Cr2O7", "Ácido dicrômico", "acid");
addRecipe({ N: 1, H: 5, O: 1 }, "NH4OH", "Hidróxido de amônio", "base", {
  caption: "A mistura vira amoníaco em solução (NH₄OH).",
});
addRecipe({ N: 1, H: 4, Cl: 1 }, "NH4Cl", "Cloreto de amônio", "salt");
addRecipe({ N: 2, H: 4, O: 3 }, "NH4NO3", "Nitrato de amônio", "salt", {
  caption: "A mistura vira nitrato de amônio, um sal usado em fertilizantes. Só detona com calor extremo ou iniciação, não ao ser formado.",
});
addRecipe({ N: 2, H: 8, S: 1, O: 4 }, "(NH4)2SO4", "Sulfato de amônio", "salt");

addRecipe({ C: 1, H: 2, O: 1 }, "CH2O", "Formaldeído", "organic");
addRecipe({ C: 1, H: 4, O: 1 }, "CH3OH", "Metanol", "organic", {
  caption: "A mistura vira metanol, um líquido inflamável.",
});
addRecipe({ C: 2, H: 6, O: 1 }, "C2H5OH", "Etanol", "organic", {
  caption: "A mistura vira etanol, o álcool das bebidas. É combustível, mas no béquer permanece líquido.",
  color: "#d7e8f2",
});
addRecipe({ C: 2, H: 4, O: 2 }, "CH3COOH", "Ácido acético", "organic", {
  caption: "A mistura vira ácido acético, o vinagre.",
});
addRecipe({ C: 3, H: 8, O: 1 }, "C3H8O", "Propanol", "organic");
addRecipe({ C: 6, H: 12, O: 6 }, "C6H12O6", "Glicose", "organic", {
  caption: "A mistura se aproxima da glicose, o açúcar do sangue.",
});
addRecipe({ C: 12, H: 22, O: 11 }, "C12H22O11", "Sacarose", "organic", {
  caption: "A mistura se aproxima do açúcar comum.",
});
addRecipe({ C: 1, H: 1, Cl: 3 }, "CHCl3", "Clorofórmio", "organic");
addRecipe({ C: 1, Cl: 4 }, "CCl4", "Tetracloreto de carbono", "organic");
addRecipe({ C: 2, H: 3, Cl: 1 }, "C2H3Cl", "Cloreto de vinila", "organic");
addRecipe({ C: 1, H: 5, N: 1 }, "CH5N", "Metilamina", "organic");
addRecipe({ C: 6, H: 7, N: 1 }, "C6H7N", "Anilina", "organic");

addRecipe({ Fe: 1, O: 1 }, "FeO", "Óxido de ferro(II)", "oxide", { color: "#5a3a28" });
addRecipe({ Fe: 2, O: 3 }, "Fe2O3", "Ferrugem", "oxide", {
  caption: "A mistura oxida e vira ferrugem.",
  color: "#b85a28",
});
addRecipe({ Fe: 3, O: 4 }, "Fe3O4", "Magnetita", "mineral", {
  caption: "A mistura vira magnetita, um óxido magnético de ferro.",
  color: "#2c2c2c",
});
addRecipe({ Cu: 1, O: 1 }, "CuO", "Óxido de cobre(II)", "oxide", { color: "#2c2c2c" });
addRecipe({ Cu: 2, O: 1 }, "Cu2O", "Óxido de cobre(I)", "oxide", { color: "#c45c26" });
addRecipe({ Al: 2, O: 3 }, "Al2O3", "Alumina", "mineral", {
  caption: "A mistura vira alumina, usada em cerâmicas e abrasivos.",
});
addRecipe({ Ca: 1, O: 1 }, "CaO", "Cal virgem", "oxide", {
  caption: "A mistura vira cal virgem (óxido de cálcio).",
  color: "#efe6d0",
});
addRecipe({ Mg: 1, O: 1 }, "MgO", "Magnésia", "oxide");
addRecipe({ Na: 2, O: 1 }, "Na2O", "Óxido de sódio", "oxide");
addRecipe({ K: 2, O: 1 }, "K2O", "Óxido de potássio", "oxide");
addRecipe({ Ti: 1, O: 2 }, "TiO2", "Dióxido de titânio", "oxide", {
  caption: "A mistura vira dióxido de titânio, o pigmento branco da tinta.",
  color: "#f4f6f8",
});
addRecipe({ Mn: 1, O: 2 }, "MnO2", "Dióxido de manganês", "oxide", { color: "#3b3b3b" });
addRecipe({ Cr: 2, O: 3 }, "Cr2O3", "Óxido de cromo(III)", "oxide", { color: "#3d7a4a" });
addRecipe({ Cr: 1, O: 3 }, "CrO3", "Óxido de cromo(VI)", "oxide", { color: "#c45c26" });
addRecipe({ U: 1, O: 2 }, "UO2", "Dióxido de urânio", "oxide", { color: "#4a5a3a" });
addRecipe({ U: 3, O: 8 }, "U3O8", "Octóxido de triurânio", "oxide");
addRecipe({ Pb: 3, O: 4 }, "Pb3O4", "Zarcão", "oxide", { color: "#b03030" });

addRecipe({ Na: 1, Cl: 1 }, "NaCl", "Sal de cozinha", "salt", {
  caption: "A mistura cristaliza e vira sal de cozinha.",
});
addRecipe({ K: 1, Cl: 1 }, "KCl", "Cloreto de potássio", "salt");
addRecipe({ Ag: 1, Cl: 1 }, "AgCl", "Cloreto de prata", "salt", {
  caption: "Surge um precipitado branco de cloreto de prata.",
});
addRecipe({ Ag: 1, Br: 1 }, "AgBr", "Brometo de prata", "salt", {
  caption: "Surge um precipitado creme, usado em fotografia.",
});
addRecipe({ Ag: 1, I: 1 }, "AgI", "Iodeto de prata", "salt");
addRecipe({ Ca: 1, F: 2 }, "CaF2", "Fluorita", "mineral");
addRecipe({ Na: 1, F: 1 }, "NaF", "Fluoreto de sódio", "salt");
addRecipe({ Hg: 1, S: 1 }, "HgS", "Cinábrio", "mineral", { color: "#9b1c1c" });
addRecipe({ Pb: 1, S: 1 }, "PbS", "Galena", "mineral", { color: "#4a4a4a" });
addRecipe({ Zn: 1, S: 1 }, "ZnS", "Blenda", "mineral");
addRecipe({ Cu: 1, Fe: 1, S: 2 }, "CuFeS2", "Calcopirita", "mineral", { color: "#c4a024" });
addRecipe({ Ca: 1, C: 1, O: 3 }, "CaCO3", "Calcita (calcário)", "mineral", {
  caption: "A mistura vira calcário, o mineral do giz e das conchas.",
});
addRecipe({ Ca: 1, S: 1, O: 4 }, "CaSO4", "Gesso", "mineral", {
  caption: "A mistura vira sulfato de cálcio, base do gesso.",
});
addRecipe({ Mg: 1, C: 1, O: 3 }, "MgCO3", "Magnesita", "mineral");
addRecipe({ Fe: 1, C: 1, O: 3 }, "FeCO3", "Siderita", "mineral");
addRecipe({ Cu: 1, S: 1, O: 4 }, "CuSO4", "Sulfato de cobre", "salt", {
  caption: "A mistura vira vitríolo azul (CuSO₄).",
  color: "#2f6fbf",
});
addRecipe({ Fe: 1, S: 1, O: 4 }, "FeSO4", "Sulfato de ferro(II)", "salt", { color: "#7aa392" });
addRecipe({ Na: 2, S: 1, O: 4 }, "Na2SO4", "Sulfato de sódio", "salt");
addRecipe({ Na: 2, C: 1, O: 3 }, "Na2CO3", "Barrilha", "salt", {
  caption: "A mistura vira carbonato de sódio (barrilha).",
});
addRecipe({ Na: 1, H: 1, C: 1, O: 3 }, "NaHCO3", "Bicarbonato de sódio", "salt", {
  caption: "A mistura vira fermento químico (bicarbonato de sódio).",
});
addRecipe({ K: 1, N: 1, O: 3 }, "KNO3", "Salitre", "salt", {
  caption: "A mistura vira salitre, usado em pólvora e fertilizantes.",
});
addRecipe({ Na: 1, N: 1, O: 3 }, "NaNO3", "Nitrato de sódio", "salt");
addRecipe({ Ca: 3, P: 2, O: 8 }, "Ca3(PO4)2", "Fosfato de cálcio", "mineral", {
  caption: "A mistura vira fosfato de cálcio, presente nos ossos.",
});
addRecipe({ Ca: 5, P: 3, O: 12, F: 1 }, "Ca5(PO4)3F", "Fluorapatita", "mineral");
addRecipe({ Na: 3, Al: 1, F: 6 }, "Na3AlF6", "Criolita", "mineral");
addRecipe({ K: 1, Al: 1, S: 2, O: 8 }, "KAl(SO4)2", "Alúmen", "salt");
addRecipe({ Mg: 3, Si: 2, O: 9, H: 4 }, "Mg3Si2O5(OH)4", "Serpentina", "mineral");
addRecipe({ Al: 2, Si: 2, O: 9, H: 4 }, "Al2Si2O5(OH)4", "Caulim", "mineral");
addRecipe({ Na: 1, Al: 1, Si: 3, O: 8 }, "NaAlSi3O8", "Albita", "mineral");
addRecipe({ K: 1, Al: 1, Si: 3, O: 8 }, "KAlSi3O8", "Ortoclásio", "mineral");
addRecipe({ Ca: 1, Si: 1, O: 3 }, "CaSiO3", "Wollastonita", "mineral");
addRecipe({ Mg: 2, Si: 1, O: 4 }, "Mg2SiO4", "Olivina", "mineral");
addRecipe({ Be: 3, Al: 2, Si: 6, O: 18 }, "Be3Al2Si6O18", "Berilo", "mineral");

addRecipe({ Cu: 1, Zn: 1 }, "CuZn", "Latão", "alloy", {
  caption: "A mistura vira latão, liga de cobre e zinco.",
});
addRecipe({ Cu: 3, Zn: 2 }, "Cu3Zn2", "Latão", "alloy");
addRecipe({ Cu: 1, Sn: 1 }, "CuSn", "Bronze", "alloy", {
  caption: "A mistura vira bronze, liga de cobre e estanho.",
});
addRecipe({ Cu: 9, Sn: 1 }, "Cu9Sn", "Bronze", "alloy");
addRecipe({ Fe: 1, C: 1 }, "FeC", "Aço", "alloy", {
  caption: "A mistura vira uma liga de aço (ferro e carbono).",
});
addRecipe({ Fe: 1, Cr: 1 }, "FeCr", "Aço cromado", "alloy");
addRecipe({ Fe: 1, Ni: 1 }, "FeNi", "Invar / aço-níquel", "alloy");
addRecipe({ Fe: 1, Cr: 1, Ni: 1 }, "FeCrNi", "Aço inoxidável", "alloy", {
  caption: "A mistura vira uma liga do tipo aço inoxidável.",
});
addRecipe({ Cu: 1, Ni: 1 }, "CuNi", "Cupróniquel", "alloy");
addRecipe({ Au: 1, Ag: 1 }, "AuAg", "Eletro", "alloy", {
  caption: "A mistura vira eletro, liga natural de ouro e prata.",
});
addRecipe({ Au: 1, Cu: 1 }, "AuCu", "Ouro 18K (liga)", "alloy");
addRecipe({ Ag: 1, Cu: 1 }, "AgCu", "Prata de lei", "alloy");
addRecipe({ Pb: 1, Sn: 1 }, "PbSn", "Solda", "alloy", {
  caption: "A mistura vira solda de estanho e chumbo.",
});
addRecipe({ Pb: 1, Sb: 1 }, "PbSb", "Chumbo-antimônio", "alloy");
addRecipe({ Al: 1, Cu: 1 }, "AlCu", "Duralumínio", "alloy");
addRecipe({ Al: 1, Mg: 1 }, "AlMg", "Liga de alumínio-magnésio", "alloy");
addRecipe({ Al: 1, Si: 1 }, "AlSi", "Silumínio", "alloy");
addRecipe({ Al: 1, Zn: 1 }, "AlZn", "Liga de alumínio-zinco", "alloy");
addRecipe({ Zn: 1, Al: 1 }, "ZnAl", "Zamak", "alloy");
addRecipe({ Sn: 1, Cu: 1, Sb: 1 }, "SnCuSb", "Metal patente", "alloy");
addRecipe({ Hg: 1, Au: 1 }, "HgAu", "Amálgama de ouro", "alloy", {
  caption: "A mistura vira amálgama de ouro e mercúrio.",
});
addRecipe({ Hg: 1, Ag: 1 }, "HgAg", "Amálgama de prata", "alloy");
addRecipe({ Hg: 1, Sn: 1 }, "HgSn", "Amálgama de estanho", "alloy");
addRecipe({ Ni: 1, Cr: 1 }, "NiCr", "Niclina / nicromo", "alloy");
addRecipe({ Ni: 1, Ti: 1 }, "NiTi", "Nitinol", "alloy");
addRecipe({ Co: 1, Cr: 1 }, "CoCr", "Liga cobalto-cromo", "alloy");
addRecipe({ W: 1, C: 1 }, "WC", "Carboneto de tungstênio", "alloy", {
  caption: "A mistura vira metal duro (widia).",
});
addRecipe({ Ti: 1, Al: 1, V: 1 }, "TiAlV", "Liga de titânio", "alloy");
addRecipe({ Bi: 1, Pb: 1, Sn: 1 }, "BiPbSn", "Metal de Wood", "alloy");
addRecipe({ Cd: 1, Ni: 1 }, "CdNi", "Liga cádmio-níquel", "alloy");
addRecipe({ Zn: 1, Cu: 1, Ni: 1 }, "ZnCuNi", "Alpaca (prata alemã)", "alloy");

addRecipe({ Xe: 1, F: 2 }, "XeF2", "Difluoreto de xenônio", "salt");
addRecipe({ Xe: 1, F: 4 }, "XeF4", "Tetrafluoreto de xenônio", "salt");
addRecipe({ Xe: 1, F: 6 }, "XeF6", "Hexafluoreto de xenônio", "salt");
addRecipe({ Xe: 1, O: 3 }, "XeO3", "Trióxido de xenônio", "oxide", {
  caption: "O XeO₃ é um sólido instável.",
  effect: "explode",
  why: "O trióxido de xenônio é termodinamicamente instável: a formação já libera energia demais e o composto detona. Não é um explosivo “armazenável” como a pólvora.",
});
addRecipe({ Xe: 1, O: 4 }, "XeO4", "Tetróxido de xenônio", "oxide", {
  caption: "O XeO₄ é instável mesmo no frio.",
  effect: "explode",
  why: "O tetróxido de xenônio detona espontaneamente. A mistura está errada porque o produto não consegue existir em paz no béquer.",
});
addRecipe({ Kr: 1, F: 2 }, "KrF2", "Difluoreto de criptônio", "salt");
addRecipe({ Rn: 1, F: 2 }, "RnF2", "Difluoreto de radônio", "salt");
addRecipe({ U: 1, F: 6 }, "UF6", "Hexafluoreto de urânio", "gas", {
  caption: "A mistura vira hexafluoreto de urânio, usado no enriquecimento.",
});
addRecipe({ S: 1, F: 6 }, "SF6", "Hexafluoreto de enxofre", "gas");
addRecipe({ W: 1, F: 6 }, "WF6", "Hexafluoreto de tungstênio", "gas");
addRecipe({ P: 1, Cl: 3 }, "PCl3", "Tricloreto de fósforo", "acid");
addRecipe({ P: 1, Cl: 5 }, "PCl5", "Pentacloreto de fósforo", "acid");
addRecipe({ S: 1, Cl: 2 }, "SCl2", "Dicloreto de enxofre", "acid");
addRecipe({ B: 1, F: 3 }, "BF3", "Trifluoreto de boro", "gas");
addRecipe({ B: 1, Cl: 3 }, "BCl3", "Tricloreto de boro", "gas");
addRecipe({ Si: 1, Cl: 4 }, "SiCl4", "Tetracloreto de silício", "acid");
addRecipe({ C: 1, F: 4 }, "CF4", "Tetrafluoreto de carbono", "gas");
addRecipe({ N: 1, F: 3 }, "NF3", "Trifluoreto de nitrogênio", "gas");
addRecipe({ N: 1, H: 1, O: 1 }, "HNO", "Nitroxila", "gas");

addRecipe({ K: 2, N: 2, O: 6, C: 3, S: 1 }, "KNO3·C·S", "Pólvora negra", "powder", {
  caption: "Salitre, carvão e enxofre formam pólvora negra, um pó cinza-escuro. Ela só explode com ignição, não ao ser misturada.",
  color: "#2a2118",
});
addRecipe({ K: 1, N: 1, O: 3, C: 1, S: 1 }, "KNO3CS", "Pólvora negra", "powder", {
  caption: "A mistura clássica da pólvora é um pó. Sem faísca, calor ou impacto forte, o béquer só contém pólvora negra.",
  color: "#2a2118",
});
addRecipe({ Al: 1, C: 8, H: 18 }, "AlC8H18", "Napalm", "organic", {
  caption: "Gasolina espessada com alumínio: no béquer vira um gel pegajoso. Só queima se for inflamado.",
  color: "#6a4a22",
});
addRecipe({ Al: 1, C: 16, H: 31, O: 2 }, "Al(C16H31O2)", "Napalm (palmitato)", "organic", {
  caption: "O palmitato de alumínio espessa o combustível. O produto é um gel, não uma chama.",
  color: "#6a4a22",
});
addRecipe({ C: 8, H: 18, S: 1 }, "C8H18S", "Fogo grego", "organic", {
  caption: "Óleo e enxofre formam um líquido inflamável aderente. Misturar não é o mesmo que atear fogo.",
  color: "#5a3a18",
});
addRecipe({ Al: 2, Fe: 2, O: 3 }, "Al+Fe2O3", "Termite", "powder", {
  caption: "Alumínio e óxido de ferro formam a mistura da termite, um pó. Ela só queima depois de uma ignição muito quente.",
  color: "#8a5a28",
});
addRecipe({ Al: 2, K: 1, Cl: 1, O: 4 }, "KClO4·Al", "Pólvora-relâmpago", "powder", {
  caption: "Perclorato e alumínio formam um pó relâmpago. Sem iniciação, permanece sólido no béquer.",
  color: "#c8c0a8",
});
addRecipe({ C: 3, H: 5, N: 3, O: 9 }, "C3H5N3O9", "Nitroglicerina", "organic", {
  caption: "A mistura se aproxima da nitroglicerina, um líquido oleoso extremamente sensível.",
  color: "#c8d96a",
  effect: "explode",
  why: "A nitroglicerina é tão instável a choque e calor que obtê-la no béquer já é uma mistura perigosa: a própria formação pode detonar. Por isso ela não é um produto estável nesta bancada.",
});
addRecipe({ C: 7, H: 5, N: 3, O: 6 }, "C7H5N3O6", "TNT", "powder", {
  caption: "O trinitrotolueno é um sólido amarelado relativamente estável. No béquer você vê o composto, não uma explosão.",
  color: "#c4a070",
});
addRecipe({ C: 3, H: 6, N: 6, O: 6 }, "C3H6N6O6", "RDX", "powder", {
  caption: "O RDX é um explosivo sólido. Sem detonador, permanece como pó.",
  color: "#e8e0c8",
});
addRecipe({ C: 5, H: 8, N: 4, O: 12 }, "C5H8N4O12", "PETN", "powder", {
  caption: "O PETN é um sólido cristalino. A explosão exigiria iniciação, não só a mistura.",
  color: "#f0e6c0",
});
addRecipe({ N: 2, H: 4, O: 3, C: 1 }, "NH4NO3·C", "ANFO", "powder", {
  caption: "Nitrato de amônio com combustível forma ANFO, um explosivo de mineração. No béquer é só a mistura sólida.",
  color: "#d9cbb0",
});
addRecipe({ Ba: 1, O: 2, H: 6, N: 1, Cl: 1 }, "Ba(OH)2·NH4Cl", "Mistura endotérmica", "ice", {
  caption: "Hidróxido de bário e cloreto de amônio reagem absorvendo calor.",
  color: "#c8e4f8",
  effect: "freeze",
  why: "Esta reação é fortemente endotérmica: absorve tanta energia do ambiente que a temperatura cai abaixo de 0 °C e o entorno pode congelar. É o contrário de uma explosão — falta calor, não sobra.",
});

const SPECIAL: Record<
  string,
  Partial<Pick<Recipe, "name" | "caption" | "kind" | "liquidColor" | "effect" | "why">>
> = {
  NaOH: {
    name: "Soda cáustica",
    caption: "A mistura vira soda cáustica (NaOH).",
  },
  KOH: { name: "Potassa cáustica", caption: "A mistura vira hidróxido de potássio." },
  CaOH2: { name: "Cal hidratada" },
  "Ca(OH)2": {
    name: "Cal hidratada",
    caption: "A mistura vira cal hidratada, usada em argamassa.",
  },
  MgOH2: { name: "Leite de magnésia" },
  "Mg(OH)2": {
    name: "Leite de magnésia",
    caption: "A mistura vira hidróxido de magnésio (leite de magnésia).",
  },
  AlOH3: { name: "Hidróxido de alumínio" },
  "Al(OH)3": { caption: "A mistura vira hidróxido de alumínio, usado como antiácido." },
  Fe2O3: { name: "Ferrugem", kind: "oxide" },
  SiO2: { name: "Sílica (areia)", kind: "mineral" },
  Al2O3: { name: "Alumina", kind: "mineral" },
  MgO: {
    name: "Óxido de magnésio",
    kind: "oxide",
    caption: "A mistura vira óxido de magnésio, um pó branco.",
    liquidColor: "#f4f0dc",
    effect: "ignite",
    why: "O magnésio metálico queima no oxigênio com chama branca ofuscante e vira MgO. O fogo é a reação de formação, não o óxido já pronto.",
  },
  P4O10: {
    name: "Pentóxido de fósforo",
    kind: "oxide",
    caption: "A mistura vira pentóxido de fósforo, um sólido branco.",
    effect: "ignite",
    why: "O fósforo queima no oxigênio e forma o óxido. A chama ensina a combustão do fósforo; o produto final é o pó de P₄O₁₀.",
  },
  P2O5: {
    name: "Pentóxido de fósforo",
    kind: "oxide",
    caption: "A mistura vira pentóxido de fósforo.",
    effect: "ignite",
    why: "O fósforo inflama no ar/oxigênio e deixa um fumo branco de óxido.",
  },
};

for (const recipe of RECIPES) {
  const extra = SPECIAL[recipe.formula];
  if (!extra) continue;
  if (extra.name) recipe.name = extra.name;
  if (extra.caption) recipe.caption = extra.caption;
  if (extra.kind) recipe.kind = extra.kind;
  if (extra.liquidColor) recipe.liquidColor = extra.liquidColor;
  if (extra.effect) recipe.effect = extra.effect;
  if (extra.why) recipe.why = extra.why;
}

BY_NAME.clear();
for (const recipe of RECIPES) {
  const named = nameIndex(recipe.name);
  if (named && !BY_NAME.has(named)) BY_NAME.set(named, recipe);
}

function aliasName(alias: string, formula: string): void {
  const recipe = BY_FORMULA.get(formulaIndex(formula));
  if (!recipe) return;
  const named = nameIndex(alias);
  if (named) BY_NAME.set(named, recipe);
}

aliasName("polvora", "KNO3CS");
aliasName("polvora negra", "KNO3CS");
aliasName("gunpowder", "KNO3CS");
aliasName("napalm", "AlC8H18");

function compositionDistance(inputs: MixtureInput[], stoich: Record<string, number>): number {
  const symbols = Object.keys(stoich);
  const volumes = Object.fromEntries(inputs.map((item) => [item.symbol, item.volumeMl]));
  const volumeSum = symbols.reduce((sum, symbol) => sum + (volumes[symbol] ?? 0), 0);
  const stoichSum = symbols.reduce((sum, symbol) => sum + stoich[symbol], 0);
  if (volumeSum <= 0 || stoichSum <= 0) return Number.POSITIVE_INFINITY;
  return symbols.reduce((sum, symbol) => {
    const actual = (volumes[symbol] ?? 0) / volumeSum;
    const expected = stoich[symbol] / stoichSum;
    return sum + Math.abs(actual - expected);
  }, 0);
}

function pickRecipe(candidates: Recipe[], inputs: MixtureInput[]): Recipe {
  let best = candidates[0];
  let bestDistance = compositionDistance(inputs, best.stoich);
  for (const recipe of candidates.slice(1)) {
    const distance = compositionDistance(inputs, recipe.stoich);
    if (distance + 0.04 < bestDistance) {
      best = recipe;
      bestDistance = distance;
    } else if (Math.abs(distance - bestDistance) <= 0.04) {
      best = recipe;
    }
  }
  return best;
}

function ratioHint(inputs: MixtureInput[], stoich: Record<string, number>): string {
  const ratioText = Object.entries(stoich)
    .map(([symbol, count]) => `${count} ${symbol}`)
    .join(" : ");
  const distance = compositionDistance(inputs, stoich);
  if (distance <= 0.18) {
    return `Proporção próxima de ${ratioText}, típica deste composto.`;
  }
  return `Este composto forma na proporção ${ratioText}. Os volumes atuais são ilustrativos.`;
}

export type CompoundInfo = {
  formula: string;
  name: string;
  stoich: Record<string, number>;
};

export function lookupCompound(query: string): CompoundInfo | null {
  const formulaKey = formulaIndex(query);
  const byFormula = formulaKey ? BY_FORMULA.get(formulaKey) : undefined;
  if (byFormula) {
    return { formula: byFormula.formula, name: byFormula.name, stoich: { ...byFormula.stoich } };
  }
  const named = nameIndex(query);
  const byName = named ? BY_NAME.get(named) : undefined;
  if (byName) {
    return { formula: byName.formula, name: byName.name, stoich: { ...byName.stoich } };
  }
  return null;
}

export type IdentifyContext = {
  sourceFormulas?: string[];
};

function sourceIsTheProduct(sources: string[] | undefined, recipe: Recipe): boolean {
  if (!sources || sources.length !== 1) return false;
  const idx = formulaIndex(sources[0]);
  return (
    idx === formulaIndex(recipe.formula) ||
    nameIndex(sources[0]) === nameIndex(recipe.name)
  );
}

function hasFreeAlkaliMetal(sources: string[] | undefined, inputs: MixtureInput[]): boolean {
  if (sources?.length) {
    return sources.some((source) => ALKALI_METALS.has(formulaIndex(source)) || ALKALI_METALS.has(source));
  }
  return inputs.some((item) => ALKALI_METALS.has(item.symbol));
}

function isAlkaliHydroxide(recipe: Recipe): boolean {
  return /^(Li|Na|K|Rb|Cs|Fr)OH$/.test(recipe.formula.replace(/[()]/g, ""));
}

function resolveEffect(
  recipe: Recipe,
  inputs: MixtureInput[],
  sources?: string[],
): { effect: MixtureEffect; why?: string } {
  if (sourceIsTheProduct(sources, recipe)) {
    if (recipe.effect === "ignite") return { effect: "none" };
    return { effect: recipe.effect ?? "none", why: recipe.why };
  }

  if (isAlkaliHydroxide(recipe) && hasFreeAlkaliMetal(sources, inputs)) {
    const metal = inputs.find((item) => ALKALI_METALS.has(item.symbol))?.symbol ?? "Na";
    const metalName = ELEMENT_NAME[metal] ?? metal;
    return {
      effect: "explode",
      why: `${metalName} (${metal}) reage com água e libera hidrogênio (H₂) mais muito calor. O gás inflama e explode. O produto químico é ${recipe.name}, mas o perigo está em jogar o metal na água — não no hidróxido já pronto.`,
    };
  }

  if (recipe.effect && recipe.effect !== "none") {
    return { effect: recipe.effect, why: recipe.why };
  }
  return { effect: "none" };
}

export function identifyMixture(
  inputs: MixtureInput[],
  context: IdentifyContext = {},
): MixtureOutcome {
  const symbols = inputs.map((item) => item.symbol);
  const key = mixtureKey(symbols);
  const candidates = BY_KEY.get(key);
  if (!candidates?.length) {
    const list = [...new Set(symbols)].join(" + ");
    return {
      key,
      formula: list || "—",
      name: "Mistura",
      equation: list || "—",
      kind: "blend",
      effect: "none",
      liquidColor: KIND_COLOR.blend,
      caption:
        "Os elementos se misturam, mas não há um composto ou liga clássica cadastrada para esta combinação.",
    };
  }
  const recipe = pickRecipe(candidates, inputs);
  const resolved = resolveEffect(recipe, inputs, context.sourceFormulas);
  return {
    key,
    formula: recipe.formula,
    name: recipe.name,
    equation: recipe.equation,
    kind: recipe.kind,
    effect: resolved.effect,
    liquidColor: recipe.liquidColor,
    caption: recipe.caption,
    ratioHint: ratioHint(inputs, recipe.stoich),
    why: resolved.why,
  };
}

export function knownRecipeCount(): number {
  return RECIPES.length;
}
