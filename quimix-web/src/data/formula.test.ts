import { describe, expect, it } from "vitest";
import {
  amountToVolumeMl,
  compositionLine,
  expandFormula,
  FormulaError,
  normalizeFormulaText,
  parseFormula,
} from "./formula";

describe("normalizeFormulaText", () => {
  it("turns subscripts and hydrate dots into plain text", () => {
    expect(normalizeFormulaText(" H₂O ")).toBe("H2O");
    expect(normalizeFormulaText("CuSO4·5H2O")).toBe("CuSO4.5H2O");
  });
});

describe("parseFormula", () => {
  it("parses water, salt and sulfuric acid", () => {
    expect(parseFormula("H2O").composition).toEqual({ H: 2, O: 1 });
    expect(parseFormula("NaCl").composition).toEqual({ Na: 1, Cl: 1 });
    expect(parseFormula("H2SO4").composition).toEqual({ H: 2, S: 1, O: 4 });
  });

  it("keeps Co and CO distinct", () => {
    expect(parseFormula("Co").composition).toEqual({ Co: 1 });
    expect(parseFormula("CO").composition).toEqual({ C: 1, O: 1 });
    expect(parseFormula("CO2").composition).toEqual({ C: 1, O: 2 });
  });

  it("expands parentheses and hydrates", () => {
    expect(parseFormula("Ca(OH)2").composition).toEqual({ Ca: 1, O: 2, H: 2 });
    expect(parseFormula("Al2(SO4)3").composition).toEqual({ Al: 2, S: 3, O: 12 });
    expect(parseFormula("CuSO4·5H2O").composition).toEqual({
      Cu: 1,
      S: 1,
      O: 9,
      H: 10,
    });
  });

  it("rejects unknown symbols", () => {
    expect(() => parseFormula("XxO")).toThrow(FormulaError);
    expect(() => parseFormula("")).toThrow(/Digite uma fórmula/);
  });
});

describe("expandFormula", () => {
  it("splits milliliters by stoichiometric share", () => {
    expect(expandFormula({ H: 2, O: 1 }, 150, "ml")).toEqual({ H: 100, O: 50 });
  });

  it("multiplies parts and moles by atom counts", () => {
    expect(expandFormula({ H: 2, O: 1 }, 1, "parts")).toEqual({ H: 2, O: 1 });
    expect(expandFormula({ Na: 1, Cl: 1 }, 2, "mol")).toEqual({ Na: 2, Cl: 2 });
  });
});

describe("amountToVolumeMl", () => {
  it("keeps milliliters and converts parts and moles", () => {
    expect(amountToVolumeMl(40, "ml")).toBe(40);
    expect(amountToVolumeMl(2, "parts")).toBe(100);
    expect(amountToVolumeMl(0.5, "mol")).toBe(500);
  });
});

describe("compositionLine", () => {
  it("writes a readable stoich line", () => {
    expect(compositionLine({ H: 2, O: 1 })).toBe("2 H + O");
  });
});
