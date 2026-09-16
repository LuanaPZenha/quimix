import { describe, expect, it } from "vitest";
import {
  identifyMixture,
  knownRecipeCount,
  lookupCompound,
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

  it("treats gunpowder and napalm as substances, not spectacle", () => {
    const powder = identifyMixture([
      { symbol: "K", volumeMl: 40 },
      { symbol: "N", volumeMl: 40 },
      { symbol: "O", volumeMl: 120 },
      { symbol: "C", volumeMl: 60 },
      { symbol: "S", volumeMl: 20 },
    ]);
    expect(powder.kind).toBe("powder");
    expect(powder.effect).toBe("none");
    expect(powder.name).toMatch(/pólvora/i);
    expect(powder.why).toBeUndefined();

    const napalm = identifyMixture([
      { symbol: "Al", volumeMl: 10 },
      { symbol: "C", volumeMl: 80 },
      { symbol: "H", volumeMl: 180 },
    ]);
    expect(napalm.kind).toBe("organic");
    expect(napalm.effect).toBe("none");
    expect(napalm.name).toMatch(/napalm/i);
  });

  it("explodes only when the mixture is actually violent, and explains why", () => {
    const alkaliWater = identifyMixture([
      { symbol: "Na", volumeMl: 50 },
      { symbol: "H", volumeMl: 50 },
      { symbol: "O", volumeMl: 50 },
    ]);
    expect(alkaliWater.formula).toBe("NaOH");
    expect(alkaliWater.effect).toBe("explode");
    expect(alkaliWater.why).toMatch(/sódio/i);
    expect(alkaliWater.why).toMatch(/hidrogênio/i);

    const readyHydroxide = identifyMixture(
      [
        { symbol: "Na", volumeMl: 50 },
        { symbol: "H", volumeMl: 50 },
        { symbol: "O", volumeMl: 50 },
      ],
      { sourceFormulas: ["NaOH"] },
    );
    expect(readyHydroxide.effect).toBe("none");
    expect(readyHydroxide.name).toMatch(/soda/i);

    const nitro = identifyMixture([
      { symbol: "C", volumeMl: 30 },
      { symbol: "H", volumeMl: 50 },
      { symbol: "N", volumeMl: 30 },
      { symbol: "O", volumeMl: 90 },
    ]);
    expect(nitro.name).toMatch(/nitroglicerina/i);
    expect(nitro.kind).toBe("organic");
    expect(nitro.effect).toBe("explode");
    expect(nitro.why).toMatch(/instável/i);

    const tnt = identifyMixture([
      { symbol: "C", volumeMl: 70 },
      { symbol: "H", volumeMl: 50 },
      { symbol: "N", volumeMl: 30 },
      { symbol: "O", volumeMl: 60 },
    ]);
    expect(tnt.name).toBe("TNT");
    expect(tnt.kind).toBe("powder");
    expect(tnt.effect).toBe("none");
  });

  it("melts glass only with hydrofluoric acid, not with other acids", () => {
    const hf = identifyMixture([
      { symbol: "H", volumeMl: 50 },
      { symbol: "F", volumeMl: 50 },
    ]);
    expect(hf.formula).toBe("HF");
    expect(hf.kind).toBe("acid");
    expect(hf.effect).toBe("melt");
    expect(hf.why).toMatch(/vidro/i);

    const sulfuric = identifyMixture([
      { symbol: "H", volumeMl: 40 },
      { symbol: "S", volumeMl: 20 },
      { symbol: "O", volumeMl: 80 },
    ]);
    expect(sulfuric.formula).toBe("H2SO4");
    expect(sulfuric.kind).toBe("acid");
    expect(sulfuric.effect).toBe("none");
  });

  it("catalogues a large set of known transformations", () => {
    expect(knownRecipeCount()).toBeGreaterThan(800);
  });
});

describe("lookupCompound", () => {
  it("finds water by formula, subscripts and name", () => {
    expect(lookupCompound("H2O")?.name).toBe("Água");
    expect(lookupCompound("H₂O")?.formula).toBe("H2O");
    expect(lookupCompound("agua")?.formula).toBe("H2O");
  });

  it("finds table salt and sulfuric acid", () => {
    expect(lookupCompound("NaCl")?.name).toBe("Sal de cozinha");
    expect(lookupCompound("H2SO4")?.name).toBe("Ácido sulfúrico");
  });

  it("finds black powder by formula and by name", () => {
    expect(lookupCompound("KNO3CS")?.name).toMatch(/pólvora/i);
    expect(lookupCompound("pólvora")?.formula).toBe("KNO3CS");
  });
});
