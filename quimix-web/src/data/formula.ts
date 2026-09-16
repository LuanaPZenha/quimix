import { PERIODIC_ELEMENTS } from "./periodicTable";

export type AmountUnit = "ml" | "parts" | "mol";
export type MixMode = "elements" | "formula";

export type ParsedFormula = {
  formula: string;
  composition: Record<string, number>;
};

export class FormulaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FormulaError";
  }
}

export const AMOUNT_UNITS: { id: AmountUnit; label: string; hint: string }[] = [
  { id: "ml", label: "mL", hint: "Volume" },
  { id: "parts", label: "partes", hint: "Proporção da fórmula" },
  { id: "mol", label: "mol", hint: "Quantidade de matéria" },
];

const SUBSCRIPTS: Record<string, string> = {
  "₀": "0",
  "₁": "1",
  "₂": "2",
  "₃": "3",
  "₄": "4",
  "₅": "5",
  "₆": "6",
  "₇": "7",
  "₈": "8",
  "₉": "9",
};

const KNOWN_SYMBOLS = new Set(PERIODIC_ELEMENTS.map((el) => el.symbol));

export function normalizeFormulaText(raw: string): string {
  return raw
    .trim()
    .replace(/[₀-₉]/g, (digit) => SUBSCRIPTS[digit] ?? digit)
    .replace(/[·•∙×*]/g, ".")
    .replace(/\s+/g, "");
}

export function unitLabel(unit: AmountUnit): string {
  if (unit === "ml") return "mL";
  if (unit === "parts") return "partes";
  return "mol";
}

export function defaultAmount(unit: AmountUnit, mode: MixMode): string {
  if (unit === "ml") return mode === "formula" ? "100" : "50";
  return "1";
}

export function amountToVolumeMl(amount: number, unit: AmountUnit): number {
  if (!(amount > 0) || !Number.isFinite(amount)) return 0;
  if (unit === "ml") return amount;
  if (unit === "parts") return amount * 50;
  return amount * 1000;
}

export function expandFormula(
  composition: Record<string, number>,
  amount: number,
  unit: AmountUnit,
): Record<string, number> {
  const result: Record<string, number> = {};
  const sum = Object.values(composition).reduce((total, count) => total + count, 0);
  for (const [symbol, count] of Object.entries(composition)) {
    result[symbol] = unit === "ml" && sum > 0 ? (amount * count) / sum : amount * count;
  }
  return result;
}

export function compositionLine(composition: Record<string, number>): string {
  return Object.entries(composition)
    .map(([symbol, count]) => (count === 1 ? symbol : `${count} ${symbol}`))
    .join(" + ");
}

function parseNumber(source: string, index: number): { value: number; next: number } {
  let cursor = index;
  while (cursor < source.length && /[0-9]/.test(source[cursor])) cursor += 1;
  if (cursor === index) return { value: 1, next: index };
  return { value: Number(source.slice(index, cursor)), next: cursor };
}

function matchSymbol(source: string, index: number): string | null {
  const two = source.slice(index, index + 2);
  if (two.length === 2 && KNOWN_SYMBOLS.has(two)) return two;
  const one = source.slice(index, index + 1);
  if (KNOWN_SYMBOLS.has(one)) return one;
  return null;
}

function addCounts(
  target: Record<string, number>,
  source: Record<string, number>,
  factor: number,
): void {
  for (const [symbol, count] of Object.entries(source)) {
    target[symbol] = (target[symbol] ?? 0) + count * factor;
  }
}

function parseGroup(
  source: string,
  index: number,
  stop: string | null,
): { counts: Record<string, number>; next: number } {
  const counts: Record<string, number> = {};
  let cursor = index;

  while (cursor < source.length) {
    const char = source[cursor];
    if (stop && char === stop) break;
    if (char === ".") break;

    if (char === "(") {
      const inner = parseGroup(source, cursor + 1, ")");
      if (source[inner.next] !== ")") {
        throw new FormulaError("Fórmula incompleta: falta fechar um parêntese.");
      }
      const numbered = parseNumber(source, inner.next + 1);
      addCounts(counts, inner.counts, numbered.value);
      cursor = numbered.next;
      continue;
    }

    if (char === ")") {
      throw new FormulaError("Parêntese fechado sem abertura correspondente.");
    }

    const symbol = matchSymbol(source, cursor);
    if (!symbol) {
      throw new FormulaError(`Não reconheci “${source.slice(cursor)}” como elemento.`);
    }
    const numbered = parseNumber(source, cursor + symbol.length);
    counts[symbol] = (counts[symbol] ?? 0) + numbered.value;
    cursor = numbered.next;
  }

  return { counts, next: cursor };
}

function parseHydrated(source: string): Record<string, number> {
  const head = parseGroup(source, 0, null);
  const counts = { ...head.counts };
  let cursor = head.next;

  while (cursor < source.length && source[cursor] === ".") {
    const numbered = parseNumber(source, cursor + 1);
    const rest = parseGroup(source, numbered.next, null);
    if (Object.keys(rest.counts).length === 0) {
      throw new FormulaError("Hidrato incompleto depois do ponto.");
    }
    addCounts(counts, rest.counts, numbered.value);
    cursor = rest.next;
  }

  if (cursor !== source.length) {
    throw new FormulaError(`Não reconheci “${source.slice(cursor)}”.`);
  }
  return counts;
}

export function parseFormula(raw: string): ParsedFormula {
  const formula = normalizeFormulaText(raw);
  if (!formula) {
    throw new FormulaError("Digite uma fórmula, como H2O ou NaCl.");
  }
  const composition = parseHydrated(formula);
  if (Object.keys(composition).length === 0) {
    throw new FormulaError("A fórmula não contém elementos.");
  }
  return { formula, composition };
}
