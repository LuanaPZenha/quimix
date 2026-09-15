export type ElementCategory =
  | "alkali"
  | "alkaline-earth"
  | "transition"
  | "post-transition"
  | "metalloid"
  | "nonmetal"
  | "halogen"
  | "noble"
  | "lanthanide"
  | "actinide";

export type PeriodicElement = {
  z: number;
  symbol: string;
  name: string;
  period: number;
  group: number; // 1-18; lanthanides/actinides use 3
  category: ElementCategory;
};

/** Standard grid positions: period 1-7, group 1-18. La/Ac series rendered below. */
export const PERIODIC_ELEMENTS: PeriodicElement[] = [
  { z: 1, symbol: "H", name: "Hidrogênio", period: 1, group: 1, category: "nonmetal" },
  { z: 2, symbol: "He", name: "Hélio", period: 1, group: 18, category: "noble" },
  { z: 3, symbol: "Li", name: "Lítio", period: 2, group: 1, category: "alkali" },
  { z: 4, symbol: "Be", name: "Berílio", period: 2, group: 2, category: "alkaline-earth" },
  { z: 5, symbol: "B", name: "Boro", period: 2, group: 13, category: "metalloid" },
  { z: 6, symbol: "C", name: "Carbono", period: 2, group: 14, category: "nonmetal" },
  { z: 7, symbol: "N", name: "Nitrogênio", period: 2, group: 15, category: "nonmetal" },
  { z: 8, symbol: "O", name: "Oxigênio", period: 2, group: 16, category: "nonmetal" },
  { z: 9, symbol: "F", name: "Flúor", period: 2, group: 17, category: "halogen" },
  { z: 10, symbol: "Ne", name: "Neônio", period: 2, group: 18, category: "noble" },
  { z: 11, symbol: "Na", name: "Sódio", period: 3, group: 1, category: "alkali" },
  { z: 12, symbol: "Mg", name: "Magnésio", period: 3, group: 2, category: "alkaline-earth" },
  { z: 13, symbol: "Al", name: "Alumínio", period: 3, group: 13, category: "post-transition" },
  { z: 14, symbol: "Si", name: "Silício", period: 3, group: 14, category: "metalloid" },
  { z: 15, symbol: "P", name: "Fósforo", period: 3, group: 15, category: "nonmetal" },
  { z: 16, symbol: "S", name: "Enxofre", period: 3, group: 16, category: "nonmetal" },
  { z: 17, symbol: "Cl", name: "Cloro", period: 3, group: 17, category: "halogen" },
  { z: 18, symbol: "Ar", name: "Argônio", period: 3, group: 18, category: "noble" },
  { z: 19, symbol: "K", name: "Potássio", period: 4, group: 1, category: "alkali" },
  { z: 20, symbol: "Ca", name: "Cálcio", period: 4, group: 2, category: "alkaline-earth" },
  { z: 21, symbol: "Sc", name: "Escândio", period: 4, group: 3, category: "transition" },
  { z: 22, symbol: "Ti", name: "Titânio", period: 4, group: 4, category: "transition" },
  { z: 23, symbol: "V", name: "Vanádio", period: 4, group: 5, category: "transition" },
  { z: 24, symbol: "Cr", name: "Cromo", period: 4, group: 6, category: "transition" },
  { z: 25, symbol: "Mn", name: "Manganês", period: 4, group: 7, category: "transition" },
  { z: 26, symbol: "Fe", name: "Ferro", period: 4, group: 8, category: "transition" },
  { z: 27, symbol: "Co", name: "Cobalto", period: 4, group: 9, category: "transition" },
  { z: 28, symbol: "Ni", name: "Níquel", period: 4, group: 10, category: "transition" },
  { z: 29, symbol: "Cu", name: "Cobre", period: 4, group: 11, category: "transition" },
  { z: 30, symbol: "Zn", name: "Zinco", period: 4, group: 12, category: "transition" },
  { z: 31, symbol: "Ga", name: "Gálio", period: 4, group: 13, category: "post-transition" },
  { z: 32, symbol: "Ge", name: "Germânio", period: 4, group: 14, category: "metalloid" },
  { z: 33, symbol: "As", name: "Arsênio", period: 4, group: 15, category: "metalloid" },
  { z: 34, symbol: "Se", name: "Selênio", period: 4, group: 16, category: "nonmetal" },
  { z: 35, symbol: "Br", name: "Bromo", period: 4, group: 17, category: "halogen" },
  { z: 36, symbol: "Kr", name: "Criptônio", period: 4, group: 18, category: "noble" },
  { z: 37, symbol: "Rb", name: "Rubídio", period: 5, group: 1, category: "alkali" },
  { z: 38, symbol: "Sr", name: "Estrôncio", period: 5, group: 2, category: "alkaline-earth" },
  { z: 39, symbol: "Y", name: "Ítrio", period: 5, group: 3, category: "transition" },
  { z: 40, symbol: "Zr", name: "Zircônio", period: 5, group: 4, category: "transition" },
  { z: 41, symbol: "Nb", name: "Nióbio", period: 5, group: 5, category: "transition" },
  { z: 42, symbol: "Mo", name: "Molibdênio", period: 5, group: 6, category: "transition" },
  { z: 43, symbol: "Tc", name: "Tecnécio", period: 5, group: 7, category: "transition" },
  { z: 44, symbol: "Ru", name: "Rutênio", period: 5, group: 8, category: "transition" },
  { z: 45, symbol: "Rh", name: "Ródio", period: 5, group: 9, category: "transition" },
  { z: 46, symbol: "Pd", name: "Paládio", period: 5, group: 10, category: "transition" },
  { z: 47, symbol: "Ag", name: "Prata", period: 5, group: 11, category: "transition" },
  { z: 48, symbol: "Cd", name: "Cádmio", period: 5, group: 12, category: "transition" },
  { z: 49, symbol: "In", name: "Índio", period: 5, group: 13, category: "post-transition" },
  { z: 50, symbol: "Sn", name: "Estanho", period: 5, group: 14, category: "post-transition" },
  { z: 51, symbol: "Sb", name: "Antimônio", period: 5, group: 15, category: "metalloid" },
  { z: 52, symbol: "Te", name: "Telúrio", period: 5, group: 16, category: "metalloid" },
  { z: 53, symbol: "I", name: "Iodo", period: 5, group: 17, category: "halogen" },
  { z: 54, symbol: "Xe", name: "Xenônio", period: 5, group: 18, category: "noble" },
  { z: 55, symbol: "Cs", name: "Césio", period: 6, group: 1, category: "alkali" },
  { z: 56, symbol: "Ba", name: "Bário", period: 6, group: 2, category: "alkaline-earth" },
  { z: 57, symbol: "La", name: "Lantânio", period: 6, group: 3, category: "lanthanide" },
  { z: 72, symbol: "Hf", name: "Háfnio", period: 6, group: 4, category: "transition" },
  { z: 73, symbol: "Ta", name: "Tântalo", period: 6, group: 5, category: "transition" },
  { z: 74, symbol: "W", name: "Tungstênio", period: 6, group: 6, category: "transition" },
  { z: 75, symbol: "Re", name: "Rênio", period: 6, group: 7, category: "transition" },
  { z: 76, symbol: "Os", name: "Ósmio", period: 6, group: 8, category: "transition" },
  { z: 77, symbol: "Ir", name: "Irídio", period: 6, group: 9, category: "transition" },
  { z: 78, symbol: "Pt", name: "Platina", period: 6, group: 10, category: "transition" },
  { z: 79, symbol: "Au", name: "Ouro", period: 6, group: 11, category: "transition" },
  { z: 80, symbol: "Hg", name: "Mercúrio", period: 6, group: 12, category: "transition" },
  { z: 81, symbol: "Tl", name: "Tálio", period: 6, group: 13, category: "post-transition" },
  { z: 82, symbol: "Pb", name: "Chumbo", period: 6, group: 14, category: "post-transition" },
  { z: 83, symbol: "Bi", name: "Bismuto", period: 6, group: 15, category: "post-transition" },
  { z: 84, symbol: "Po", name: "Polônio", period: 6, group: 16, category: "post-transition" },
  { z: 85, symbol: "At", name: "Astato", period: 6, group: 17, category: "halogen" },
  { z: 86, symbol: "Rn", name: "Radônio", period: 6, group: 18, category: "noble" },
  { z: 87, symbol: "Fr", name: "Frâncio", period: 7, group: 1, category: "alkali" },
  { z: 88, symbol: "Ra", name: "Rádio", period: 7, group: 2, category: "alkaline-earth" },
  { z: 89, symbol: "Ac", name: "Actínio", period: 7, group: 3, category: "actinide" },
  { z: 104, symbol: "Rf", name: "Rutherfórdio", period: 7, group: 4, category: "transition" },
  { z: 105, symbol: "Db", name: "Dúbnio", period: 7, group: 5, category: "transition" },
  { z: 106, symbol: "Sg", name: "Seabórgio", period: 7, group: 6, category: "transition" },
  { z: 107, symbol: "Bh", name: "Bóhrio", period: 7, group: 7, category: "transition" },
  { z: 108, symbol: "Hs", name: "Hássio", period: 7, group: 8, category: "transition" },
  { z: 109, symbol: "Mt", name: "Meitnério", period: 7, group: 9, category: "transition" },
  { z: 110, symbol: "Ds", name: "Darmstádio", period: 7, group: 10, category: "transition" },
  { z: 111, symbol: "Rg", name: "Roentgênio", period: 7, group: 11, category: "transition" },
  { z: 112, symbol: "Cn", name: "Copernício", period: 7, group: 12, category: "transition" },
  { z: 113, symbol: "Nh", name: "Nihônio", period: 7, group: 13, category: "post-transition" },
  { z: 114, symbol: "Fl", name: "Fleróvio", period: 7, group: 14, category: "post-transition" },
  { z: 115, symbol: "Mc", name: "Moscóvio", period: 7, group: 15, category: "post-transition" },
  { z: 116, symbol: "Lv", name: "Livermório", period: 7, group: 16, category: "post-transition" },
  { z: 117, symbol: "Ts", name: "Tenesso", period: 7, group: 17, category: "halogen" },
  { z: 118, symbol: "Og", name: "Oganessônio", period: 7, group: 18, category: "noble" },
  // Lanthanides (display row)
  { z: 58, symbol: "Ce", name: "Cério", period: 8, group: 4, category: "lanthanide" },
  { z: 59, symbol: "Pr", name: "Praseodímio", period: 8, group: 5, category: "lanthanide" },
  { z: 60, symbol: "Nd", name: "Neodímio", period: 8, group: 6, category: "lanthanide" },
  { z: 61, symbol: "Pm", name: "Promécio", period: 8, group: 7, category: "lanthanide" },
  { z: 62, symbol: "Sm", name: "Samário", period: 8, group: 8, category: "lanthanide" },
  { z: 63, symbol: "Eu", name: "Európio", period: 8, group: 9, category: "lanthanide" },
  { z: 64, symbol: "Gd", name: "Gadolínio", period: 8, group: 10, category: "lanthanide" },
  { z: 65, symbol: "Tb", name: "Térbio", period: 8, group: 11, category: "lanthanide" },
  { z: 66, symbol: "Dy", name: "Disprósio", period: 8, group: 12, category: "lanthanide" },
  { z: 67, symbol: "Ho", name: "Hólmio", period: 8, group: 13, category: "lanthanide" },
  { z: 68, symbol: "Er", name: "Érbio", period: 8, group: 14, category: "lanthanide" },
  { z: 69, symbol: "Tm", name: "Túlio", period: 8, group: 15, category: "lanthanide" },
  { z: 70, symbol: "Yb", name: "Itérbio", period: 8, group: 16, category: "lanthanide" },
  { z: 71, symbol: "Lu", name: "Lutécio", period: 8, group: 17, category: "lanthanide" },
  // Actinides
  { z: 90, symbol: "Th", name: "Tório", period: 9, group: 4, category: "actinide" },
  { z: 91, symbol: "Pa", name: "Protactínio", period: 9, group: 5, category: "actinide" },
  { z: 92, symbol: "U", name: "Urânio", period: 9, group: 6, category: "actinide" },
  { z: 93, symbol: "Np", name: "Neptúnio", period: 9, group: 7, category: "actinide" },
  { z: 94, symbol: "Pu", name: "Plutônio", period: 9, group: 8, category: "actinide" },
  { z: 95, symbol: "Am", name: "Amerício", period: 9, group: 9, category: "actinide" },
  { z: 96, symbol: "Cm", name: "Cúrio", period: 9, group: 10, category: "actinide" },
  { z: 97, symbol: "Bk", name: "Berquélio", period: 9, group: 11, category: "actinide" },
  { z: 98, symbol: "Cf", name: "Califórnio", period: 9, group: 12, category: "actinide" },
  { z: 99, symbol: "Es", name: "Einstênio", period: 9, group: 13, category: "actinide" },
  { z: 100, symbol: "Fm", name: "Férmio", period: 9, group: 14, category: "actinide" },
  { z: 101, symbol: "Md", name: "Mendelévio", period: 9, group: 15, category: "actinide" },
  { z: 102, symbol: "No", name: "Nobélio", period: 9, group: 16, category: "actinide" },
  { z: 103, symbol: "Lr", name: "Laurêncio", period: 9, group: 17, category: "actinide" },
];

export const CATEGORY_COLORS: Record<ElementCategory, string> = {
  alkali: "#f2b5a0",
  "alkaline-earth": "#f5d29a",
  transition: "#c9dff0",
  "post-transition": "#b8d4c8",
  metalloid: "#d4c9e8",
  nonmetal: "#a8d5a2",
  halogen: "#f0d48a",
  noble: "#c5b8e0",
  lanthanide: "#f0c4d8",
  actinide: "#e8b8c8",
};

export const CATEGORY_LABELS: Record<ElementCategory, string> = {
  alkali: "Alcalinos",
  "alkaline-earth": "Alcalino-terrosos",
  transition: "Transição",
  "post-transition": "Pós-transição",
  metalloid: "Semimetais",
  nonmetal: "Não metais",
  halogen: "Halogênios",
  noble: "Nobres",
  lanthanide: "Lantanídeos",
  actinide: "Actinídeos",
};

export function elementReagentId(symbol: string): string {
  return `el-${symbol}`;
}
