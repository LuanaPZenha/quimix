import { describe, expect, it } from "vitest";
import { formatConcentration } from "../api/client";

describe("formatConcentration", () => {
  it("keeps integers clean", () => {
    expect(formatConcentration(1)).toBe("1");
  });

  it("trims trailing zeros", () => {
    expect(formatConcentration(0.5)).toBe("0.5");
    expect(formatConcentration(0.50001)).toBe("0.5");
  });
});
