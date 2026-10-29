export const KIND_OPTIONS = [
  { id: "water", label: "Água" },
  { id: "acid", label: "Ácido" },
  { id: "base", label: "Base" },
  { id: "salt", label: "Sal" },
  { id: "gas", label: "Gás" },
  { id: "oxide", label: "Óxido" },
  { id: "alloy", label: "Liga" },
  { id: "organic", label: "Orgânico" },
  { id: "mineral", label: "Mineral" },
  { id: "powder", label: "Pó" },
  { id: "ice", label: "Gelo" },
  { id: "blend", label: "Mistura" },
] as const;

export const EFFECT_OPTIONS = [
  { id: "none", label: "Nenhum" },
  { id: "explode", label: "Explosão" },
  { id: "melt", label: "Derrete" },
  { id: "freeze", label: "Congela" },
  { id: "ignite", label: "Pega fogo" },
] as const;

const KIND_LABEL = Object.fromEntries(KIND_OPTIONS.map((item) => [item.id, item.label]));
const EFFECT_LABEL = Object.fromEntries(EFFECT_OPTIONS.map((item) => [item.id, item.label]));

export function kindLabel(kind: string): string {
  return KIND_LABEL[kind] ?? kind;
}

export function effectLabel(effect: string): string {
  return EFFECT_LABEL[effect] ?? effect;
}
