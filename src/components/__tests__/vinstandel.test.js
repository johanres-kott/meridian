import { describe, it, expect } from "vitest";
import { summarizeTranches, vinstandelHint } from "../addassets/vinstandel.js";

describe("vinstandelsstiftelse", () => {
  const tranches = [
    { year: 2020, value: 10000 }, // låst till 2025 → tillgänglig 2026
    { year: 2022, value: 12000 }, // → 2027
    { year: 2023, value: 15000 }, // → 2028
  ];

  it("sums tranches and splits available vs locked by lock years", () => {
    const s = summarizeTranches(tranches, 5, 2026);
    expect(s.total).toBe(37000);
    expect(s.available).toBe(10000);
    expect(s.locked).toBe(27000);
    expect(s.next).toEqual({ year: 2027, value: 12000 });
    expect(s.schedule).toEqual([{ year: 2027, value: 12000 }, { year: 2028, value: 15000 }]);
  });

  it("respects a different lock period", () => {
    const s = summarizeTranches(tranches, 3, 2026);
    expect(s.available).toBe(37000); // 2020→2023, 2022→2025, 2023→2026 — alla fria 2026
    expect(s.next).toBeNull();
  });

  it("ignores empty/invalid rows and never invents values", () => {
    const s = summarizeTranches([{ year: "", value: "" }, { year: 2021, value: 0 }], 5, 2026);
    expect(s.total).toBe(0);
    expect(s.next).toBeNull();
  });

  it("writes a short hint for lists", () => {
    const norm = s => s.replace(/\u00a0/g, " "); // sv-SE tusentalsavgränsare är NBSP
    expect(norm(vinstandelHint({ tranches, lockYears: 5 }, 2026))).toBe("10 000 kr tillgängligt · nästa 12 000 kr 2027");
    expect(norm(vinstandelHint({ tranches: [{ year: 2025, value: 5000 }], lockYears: 5 }, 2026))).toBe("nästa 5 000 kr 2030");
    expect(vinstandelHint(null)).toBeNull();
  });
});
