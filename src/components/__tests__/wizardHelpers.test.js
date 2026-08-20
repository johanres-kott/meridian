import { describe, it, expect } from "vitest";
import { suggestedAmortizationRate } from "../addassets/wizardHelpers.js";

describe("suggestedAmortizationRate", () => {
  it("follows amorteringskravets grundregel", () => {
    expect(suggestedAmortizationRate(85)).toBe(2);
    expect(suggestedAmortizationRate(70.1)).toBe(2);
    expect(suggestedAmortizationRate(70)).toBe(1);
    expect(suggestedAmortizationRate(55)).toBe(1);
    expect(suggestedAmortizationRate(50)).toBe(0);
    expect(suggestedAmortizationRate(30)).toBe(0);
  });
  it("returns null without a usable LTV", () => {
    expect(suggestedAmortizationRate(null)).toBeNull();
    expect(suggestedAmortizationRate(undefined)).toBeNull();
    expect(suggestedAmortizationRate("abc")).toBeNull();
  });
});
