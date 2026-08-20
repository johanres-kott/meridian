import { describe, it, expect } from "vitest";
import { applyMonthlyAmortization } from "../cron/_amortize.js";

// Bas: 2 % amortering per år på 1 200 000 kr → 2 000 kr per månad
const loan = (over = {}, metaOver = {}) => ({
  is_debt: true,
  value_sek: 1200000,
  metadata: { autoAmortize: true, amortizationRate: 2, ...metaOver },
  ...over,
});

const TODAY = "2026-08-20";

describe("applyMonthlyAmortization", () => {
  it("räknar ner lånet med amorteringen/12 och stämplar lastAmortizedAt", () => {
    const patch = applyMonthlyAmortization(loan(), TODAY);
    expect(patch).toEqual({
      value_sek: 1198000,
      metadata: { autoAmortize: true, amortizationRate: 2, lastAmortizedAt: "2026-08-20" },
    });
  });

  it("accepterar ett Date som today", () => {
    const patch = applyMonthlyAmortization(loan(), new Date("2026-08-20T06:00:00Z"));
    expect(patch.metadata.lastAmortizedAt).toBe("2026-08-20");
  });

  it("kräver opt-in: utan autoAmortize === true görs inget", () => {
    expect(applyMonthlyAmortization(loan({}, { autoAmortize: undefined }), TODAY)).toBeNull();
    expect(applyMonthlyAmortization(loan({}, { autoAmortize: false }), TODAY)).toBeNull();
    expect(applyMonthlyAmortization(loan({}, { autoAmortize: "true" }), TODAY)).toBeNull(); // strikt boolean
  });

  it("kräver amorteringstakt > 0", () => {
    expect(applyMonthlyAmortization(loan({}, { amortizationRate: undefined }), TODAY)).toBeNull();
    expect(applyMonthlyAmortization(loan({}, { amortizationRate: 0 }), TODAY)).toBeNull();
    expect(applyMonthlyAmortization(loan({}, { amortizationRate: -1 }), TODAY)).toBeNull();
    expect(applyMonthlyAmortization(loan({}, { amortizationRate: "abc" }), TODAY)).toBeNull();
  });

  it("rör bara skulder med positivt saldo", () => {
    expect(applyMonthlyAmortization(loan({ is_debt: false }), TODAY)).toBeNull();
    expect(applyMonthlyAmortization(loan({ value_sek: 0 }), TODAY)).toBeNull();
    expect(applyMonthlyAmortization(loan({ value_sek: null }), TODAY)).toBeNull();
    expect(applyMonthlyAmortization(null, TODAY)).toBeNull();
  });

  it("skippar när lastAmortizedAt ligger i samma kalendermånad (idempotent)", () => {
    expect(applyMonthlyAmortization(loan({}, { lastAmortizedAt: "2026-08-01" }), TODAY)).toBeNull();
    expect(applyMonthlyAmortization(loan({}, { lastAmortizedAt: "2026-08-20" }), TODAY)).toBeNull();
  });

  it("kör när lastAmortizedAt är en annan månad", () => {
    const patch = applyMonthlyAmortization(loan({}, { lastAmortizedAt: "2026-07-01" }), TODAY);
    expect(patch.value_sek).toBe(1198000);
    expect(patch.metadata.lastAmortizedAt).toBe("2026-08-20");
    // …även samma månad förra året
    expect(applyMonthlyAmortization(loan({}, { lastAmortizedAt: "2025-08-01" }), TODAY)).not.toBeNull();
  });

  it("golvar på 0 — saldot blir aldrig negativt", () => {
    const patch = applyMonthlyAmortization(loan({ value_sek: 100 }, { amortizationRate: 100 }), TODAY);
    // 100 × 100 %/12 ≈ 8,33 kr avdrag → 92 kr; med rate 10 000 % dras mer än saldot
    expect(patch.value_sek).toBe(92);
    const floored = applyMonthlyAmortization(loan({ value_sek: 100 }, { amortizationRate: 10000 }), TODAY);
    expect(floored.value_sek).toBe(0);
  });

  it("avrundar till heltal kronor", () => {
    // 1 000 000 × 1 %/12 = 833,33… → 1 000 000 − 833,33 = 999 166,67 → 999 167
    const patch = applyMonthlyAmortization(loan({ value_sek: 1000000 }, { amortizationRate: 1 }), TODAY);
    expect(patch.value_sek).toBe(999167);
  });

  it("behåller övrig metadata orörd i patchen", () => {
    const patch = applyMonthlyAmortization(loan({}, { lender: "SBAB", interestRate: 3.5 }), TODAY);
    expect(patch.metadata.lender).toBe("SBAB");
    expect(patch.metadata.interestRate).toBe(3.5);
  });
});
