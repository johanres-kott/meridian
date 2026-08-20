import { describe, it, expect, vi } from "vitest";

// manualAssets.js importerar supabase-klienten (för auth-headers) — stubba
// den så den rena helpern kan testas utan miljövariabler.
vi.mock("../../supabase.js", () => ({ supabase: {} }));

import { effectiveValueSek } from "../manualAssets.js";

describe("effectiveValueSek", () => {
  it("returnerar hela värdet när ownershipShare saknas", () => {
    expect(effectiveValueSek({ value_sek: 3000000, metadata: {} })).toBe(3000000);
    expect(effectiveValueSek({ value_sek: 3000000 })).toBe(3000000);
    expect(effectiveValueSek({ value_sek: 3000000, metadata: { ownershipShare: null } })).toBe(3000000);
  });

  it("skalar värdet med ägarandelen", () => {
    expect(effectiveValueSek({ value_sek: 3000000, metadata: { ownershipShare: 50 } })).toBe(1500000);
    expect(effectiveValueSek({ value_sek: 1000000, metadata: { ownershipShare: 75 } })).toBe(750000);
    expect(effectiveValueSek({ value_sek: 200000, metadata: { ownershipShare: 100 } })).toBe(200000);
  });

  it("klampar andelen till 1–100", () => {
    expect(effectiveValueSek({ value_sek: 1000000, metadata: { ownershipShare: 0 } })).toBe(10000);   // → 1 %
    expect(effectiveValueSek({ value_sek: 1000000, metadata: { ownershipShare: -20 } })).toBe(10000); // → 1 %
    expect(effectiveValueSek({ value_sek: 1000000, metadata: { ownershipShare: 150 } })).toBe(1000000); // → 100 %
  });

  it("hanterar strängvärden och trasig input", () => {
    expect(effectiveValueSek({ value_sek: "1000000", metadata: { ownershipShare: "50" } })).toBe(500000);
    expect(effectiveValueSek({ value_sek: 1000000, metadata: { ownershipShare: "hälften" } })).toBe(1000000); // ej tal → 100 %
    expect(effectiveValueSek({ value_sek: null, metadata: { ownershipShare: 50 } })).toBe(0);
    expect(effectiveValueSek(null)).toBe(0);
  });
});
