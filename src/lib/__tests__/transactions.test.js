import { describe, it, expect, vi } from "vitest";

// transactions.js drar in supabase-klienten — stubba den; computeHolding och
// hjälparna som testas här är rena funktioner.
vi.mock("../../supabase.js", () => ({ supabase: {} }));

import {
  computeHolding,
  holdingToWatchlistUpdates,
  isMissingTableError,
} from "../transactions.js";

const buy = (shares, price, fee = 0, trade_date = "2026-01-01", created_at = "") =>
  ({ side: "buy", shares, price, fee, trade_date, created_at });
const sell = (shares, price, fee = 0, trade_date = "2026-06-01", created_at = "") =>
  ({ side: "sell", shares, price, fee, trade_date, created_at });

describe("computeHolding (genomsnittsmetoden)", () => {
  it("tom lista ger 0 aktier, inget GAV och inget realiserat resultat", () => {
    expect(computeHolding([])).toEqual({ shares: 0, gav: null, realizedPL: 0, warnings: [] });
    expect(computeHolding()).toEqual({ shares: 0, gav: null, realizedPL: 0, warnings: [] });
  });

  it("flera köp ger viktat GAV där courtaget räknas in i omkostnadsbeloppet", () => {
    const h = computeHolding([
      buy(10, 100, 10, "2026-01-01"), // omkostnad 1010
      buy(10, 120, 0, "2026-02-01"),  // + 1200 => 2210 / 20
    ]);
    expect(h.shares).toBe(20);
    expect(h.gav).toBeCloseTo(110.5, 10);
    expect(h.realizedPL).toBe(0);
    expect(h.warnings).toEqual([]);
  });

  it("sälj minskar antalet men lämnar GAV oförändrat", () => {
    const h = computeHolding([
      buy(10, 100, 10, "2026-01-01"),
      buy(10, 120, 0, "2026-02-01"),
      sell(5, 130, 0, "2026-03-01"),
    ]);
    expect(h.shares).toBe(15);
    expect(h.gav).toBeCloseTo(110.5, 10); // oförändrat av säljet
    expect(h.realizedPL).toBeCloseTo(5 * (130 - 110.5), 10);
  });

  it("realiserat resultat räknas med och utan courtage på säljet", () => {
    const utan = computeHolding([buy(10, 100), sell(4, 110, 0)]);
    expect(utan.realizedPL).toBeCloseTo(40, 10);

    const med = computeHolding([buy(10, 100), sell(4, 110, 15)]);
    expect(med.realizedPL).toBeCloseTo(25, 10);
    expect(med.shares).toBe(6);
    expect(med.gav).toBeCloseTo(100, 10);
  });

  it("översälj klampas till innehavet och ger en varning — aldrig negativt antal", () => {
    const h = computeHolding([buy(5, 100), sell(10, 120)]);
    expect(h.shares).toBe(0);
    expect(h.gav).toBeNull();
    expect(h.realizedPL).toBeCloseTo(5 * (120 - 100), 10);
    expect(h.warnings).toHaveLength(1);
    expect(h.warnings[0]).toMatch(/överstiger innehavet/);
  });

  it("sorterar på trade_date med created_at som tiebreak", () => {
    // Säljet ligger först i listan men sist i tiden — GAV ska hinna viktas om
    // av båda köpen innan säljet räknas.
    const h = computeHolding([
      sell(5, 200, 0, "2026-03-01"),
      buy(10, 120, 0, "2026-01-01", "2026-01-01T12:00:00Z"),
      buy(10, 100, 0, "2026-01-01", "2026-01-01T09:00:00Z"),
    ]);
    expect(h.shares).toBe(15);
    expect(h.gav).toBeCloseTo(110, 10);
    expect(h.realizedPL).toBeCloseTo(5 * (200 - 110), 10);
    expect(h.warnings).toEqual([]);
  });

  it("sälj ner till 0 nollställer omkostnadsbeloppet inför nästa köp", () => {
    const h = computeHolding([
      buy(10, 100, 0, "2026-01-01"),
      sell(10, 150, 0, "2026-02-01"),
      buy(4, 80, 0, "2026-03-01"),
    ]);
    expect(h.shares).toBe(4);
    expect(h.gav).toBeCloseTo(80, 10);
    expect(h.realizedPL).toBeCloseTo(500, 10);
  });
});

describe("holdingToWatchlistUpdates", () => {
  it("skriver shares + gav vid innehav och null/null när allt är sålt", () => {
    expect(holdingToWatchlistUpdates({ shares: 15, gav: 110.5 })).toEqual({ shares: 15, gav: 110.5 });
    expect(holdingToWatchlistUpdates({ shares: 0, gav: null })).toEqual({ shares: null, gav: null });
    expect(holdingToWatchlistUpdates(null)).toEqual({ shares: null, gav: null });
  });
});

describe("isMissingTableError", () => {
  it("känner igen saknad tabell via Postgres-kod och felmeddelande", () => {
    expect(isMissingTableError({ code: "42P01" })).toBe(true);
    expect(isMissingTableError({ code: "PGRST205" })).toBe(true);
    expect(isMissingTableError({ message: 'relation "public.transactions" does not exist' })).toBe(true);
    expect(isMissingTableError({ message: "Could not find the table 'public.transactions' in the schema cache" })).toBe(true);
    expect(isMissingTableError({ code: "23505", message: "duplicate key value" })).toBe(false);
    expect(isMissingTableError(null)).toBe(false);
  });
});
