import { describe, it, expect } from "vitest";
import {
  computeReturnPct,
  monthsBetween,
  classifyHolding,
  summarizePortfolio,
  DEFAULT_THRESHOLD_PCT,
  DEFAULT_REVIEW_MONTHS,
} from "../thesisReview.js";

describe("computeReturnPct", () => {
  it("computes positive return", () => {
    expect(computeReturnPct(100, 120)).toBe(20);
  });

  it("computes negative return", () => {
    expect(computeReturnPct(100, 75)).toBe(-25);
  });

  it("returns null for missing gav", () => {
    expect(computeReturnPct(null, 120)).toBeNull();
    expect(computeReturnPct(0, 120)).toBeNull();
  });

  it("returns null for missing price", () => {
    expect(computeReturnPct(100, null)).toBeNull();
  });
});

describe("monthsBetween", () => {
  it("returns positive months when from is in the past", () => {
    const now = new Date("2026-05-07");
    const past = new Date("2026-02-07");
    expect(monthsBetween(past, now)).toBeCloseTo(3, 0);
  });

  it("clamps to zero for future dates", () => {
    const now = new Date("2026-05-07");
    const future = new Date("2026-06-07");
    expect(monthsBetween(future, now)).toBe(0);
  });

  it("accepts ISO strings", () => {
    expect(monthsBetween("2026-02-07", new Date("2026-05-07"))).toBeCloseTo(3, 0);
  });

  it("returns null for missing input", () => {
    expect(monthsBetween(null)).toBeNull();
  });
});

describe("classifyHolding", () => {
  const fresh = { monthsSinceReview: 1 };
  const stale = { monthsSinceReview: 7 };

  it("flags stale winners (disposition trap: selling winners too early)", () => {
    expect(classifyHolding({ returnPct: 30, ...stale, thesisStatus: "active" })).toBe("winner_stale");
  });

  it("treats recently-reviewed winners as fresh", () => {
    expect(classifyHolding({ returnPct: 30, ...fresh, thesisStatus: "active" })).toBe("winner_fresh");
  });

  it("flags losers with active thesis and stale review (disposition trap: hoping)", () => {
    expect(classifyHolding({ returnPct: -25, ...stale, thesisStatus: "active" })).toBe("loser_stale");
  });

  it("treats losers as fresh once thesis is marked weakening", () => {
    // The user has explicitly acknowledged the loser — not anchoring anymore.
    expect(classifyHolding({ returnPct: -25, ...stale, thesisStatus: "weakening" })).toBe("loser_fresh");
  });

  it("treats losers as fresh once thesis is marked broken", () => {
    expect(classifyHolding({ returnPct: -25, ...stale, thesisStatus: "broken" })).toBe("loser_fresh");
  });

  it("returns neutral for small moves", () => {
    expect(classifyHolding({ returnPct: 5, ...stale, thesisStatus: "active" })).toBe("neutral");
    expect(classifyHolding({ returnPct: -10, ...stale, thesisStatus: "active" })).toBe("neutral");
  });

  it("returns neutral when return data is missing", () => {
    expect(classifyHolding({ returnPct: null, ...stale, thesisStatus: "active" })).toBe("neutral");
  });

  it("treats never-reviewed holdings as stale", () => {
    expect(classifyHolding({ returnPct: 30, monthsSinceReview: null, thesisStatus: "active" })).toBe("winner_stale");
  });

  it("respects custom thresholds", () => {
    // 25% gain is "neutral" at a 30% threshold
    expect(
      classifyHolding({ returnPct: 25, ...stale, thesisStatus: "active" }, { thresholdPct: 30 })
    ).toBe("neutral");
    // 7 months is "fresh" at a 12-month review window
    expect(
      classifyHolding({ returnPct: 30, monthsSinceReview: 7, thesisStatus: "active" }, { reviewMonths: 12 })
    ).toBe("winner_fresh");
  });

  it("uses the right defaults", () => {
    expect(DEFAULT_THRESHOLD_PCT).toBe(20);
    expect(DEFAULT_REVIEW_MONTHS).toBe(6);
  });
});

describe("summarizePortfolio", () => {
  it("counts each category", () => {
    const rows = [
      { item: { shares: 10, gav: 100, thesis_status: "active" }, returnPct: 30, monthsSinceReview: 8 },  // winner_stale
      { item: { shares: 10, gav: 100, thesis_status: "active" }, returnPct: 25, monthsSinceReview: 1 },  // winner_fresh
      { item: { shares: 10, gav: 100, thesis_status: "active" }, returnPct: -30, monthsSinceReview: 8 }, // loser_stale
      { item: { shares: 10, gav: 100, thesis_status: "broken" }, returnPct: -30, monthsSinceReview: 8 }, // loser_fresh
      { item: { shares: 10, gav: 100, thesis_status: "active" }, returnPct: 5, monthsSinceReview: 1 },   // neutral
    ];
    const s = summarizePortfolio(rows);
    expect(s.counts).toEqual({
      winner_stale: 1, winner_fresh: 1,
      loser_stale: 1, loser_fresh: 1,
      neutral: 1,
    });
  });

  it("computes position-value weighted return for winners and losers", () => {
    const rows = [
      // Winner #1: 10 shares * 100 gav = 1000 position, +30%
      { item: { shares: 10, gav: 100, thesis_status: "active" }, returnPct: 30, monthsSinceReview: 1 },
      // Winner #2: 1 share * 100 gav = 100 position, +100% — small position, shouldn't drown out #1
      { item: { shares: 1, gav: 100, thesis_status: "active" }, returnPct: 100, monthsSinceReview: 1 },
      // Loser: 5 shares * 100 gav = 500 position, -40%
      { item: { shares: 5, gav: 100, thesis_status: "active" }, returnPct: -40, monthsSinceReview: 1 },
    ];
    const s = summarizePortfolio(rows);
    // (30*1000 + 100*100) / 1100 = 36.36
    expect(s.avgWinnerReturnPct).toBeCloseTo(36.36, 1);
    expect(s.avgLoserReturnPct).toBe(-40);
  });

  it("returns null for averages when no qualifying positions", () => {
    const rows = [
      { item: { shares: 0, gav: 0, thesis_status: "active" }, returnPct: 5, monthsSinceReview: 1 },
    ];
    const s = summarizePortfolio(rows);
    expect(s.avgWinnerReturnPct).toBeNull();
    expect(s.avgLoserReturnPct).toBeNull();
  });

  it("ignores positions with no shares for weighted return", () => {
    const rows = [
      // Watched-only position (no shares) — should be classified but not weighted
      { item: { shares: 0, gav: 100, thesis_status: "active" }, returnPct: 30, monthsSinceReview: 8 },
    ];
    const s = summarizePortfolio(rows);
    expect(s.counts.winner_stale).toBe(1);
    expect(s.avgWinnerReturnPct).toBeNull();
  });
});
