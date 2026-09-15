import { describe, expect, it } from "vitest";
import {
  identifyMixture,
  knownRecipeCount,
  mixtureKey,
  prettyFormula,
} from "./mixtureOutcomes";

describe("mixtureKey", () => {
  it("sorts unique symbols", () => {
    expect(mixtureKey(["O", "H", "H"])).toBe("H+O");
    expect(mixtureKey(["Na", "Cl"])).toBe("Cl+Na");
  });
});

describe("prettyFormula", () => {
  it("turns digits into subscripts", () => {
    expect(prettyFormula("H2O")).toBe("H₂O");
    expect(prettyFormula("Fe2O3")).toBe("Fe₂O₃");
  });
});

describe("identifyMixture", () => {
  it("recognizes water from a 2:1 hydrogen-oxygen mix", () => {
    const outcome = identifyMixture([
      { symbol: "H", volumeMl: 100 },
      { symbol: "O", volumeMl: 50 },
    ]);
    expect(outcome.kind).toBe("water");
    expect(outcome.formula).toBe("H2O");
    expect(outcome.name).toBe("Água");
    expect(outcome.ratioHint).toMatch(/próxima/i);
  });

  it("recognizes hydrogen peroxide when the volumes are 1:1", () => {
    const outcome = identifyMixture([
      { symbol: "H", volumeMl: 50 },
      { symbol: "O", volumeMl: 50 },
    ]);
    expect(outcome.formula).toBe("H2O2");
    expect(outcome.name).toBe("Água oxigenada");
  });

  it("distinguishes carbon monoxide from carbon dioxide", () => {
    const monoxide = identifyMixture([
      { symbol: "C", volumeMl: 50 },
      { symbol: "O", volumeMl: 50 },
    ]);
    const dioxide = identifyMixture([
      { symbol: "C", volumeMl: 50 },
      { symbol: "O", volumeMl: 100 },
    ]);
    expect(monoxide.formula).toBe("CO");
    expect(dioxide.formula).toBe("CO2");
  });

  it("recognizes table salt and generated alkali halides", () => {
    const salt = identifyMixture([
      { symbol: "Na", volumeMl: 50 },
      { symbol: "Cl", volumeMl: 50 },
    ]);
    const fluoride = identifyMixture([
      { symbol: "Cs", volumeMl: 40 },
      { symbol: "F", volumeMl: 40 },
    ]);
    expect(salt.formula).toBe("NaCl");
    expect(salt.name).toBe("Sal de cozinha");
    expect(fluoride.formula).toBe("CsF");
  });

  it("recognizes sulfuric acid, brass and limestone", () => {
    const acid = identifyMixture([
      { symbol: "H", volumeMl: 40 },
      { symbol: "S", volumeMl: 20 },
      { symbol: "O", volumeMl: 80 },
    ]);
    const brass = identifyMixture([
      { symbol: "Cu", volumeMl: 50 },
      { symbol: "Zn", volumeMl: 50 },
    ]);
    const limestone = identifyMixture([
      { symbol: "Ca", volumeMl: 50 },
      { symbol: "C", volumeMl: 50 },
      { symbol: "O", volumeMl: 150 },
    ]);
    expect(acid.formula).toBe("H2SO4");
    expect(brass.name).toBe("Latão");
    expect(limestone.formula).toBe("CaCO3");
  });

  it("falls back to a generic blend", () => {
    const outcome = identifyMixture([
      { symbol: "Au", volumeMl: 20 },
      { symbol: "He", volumeMl: 10 },
    ]);
    expect(outcome.kind).toBe("blend");
    expect(outcome.name).toBe("Mistura");
  });

  it("catalogues a large set of known transformations", () => {
    expect(knownRecipeCount()).toBeGreaterThan(800);
  });
});
