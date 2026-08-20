import { describe, it, expect, vi, beforeEach } from "vitest";

const rows = [];
vi.mock("../../supabase.js", () => ({
  supabase: {
    from: () => ({ select: () => ({ eq: () => ({ order: async () => ({ data: rows }) }) }) }),
  },
}));

import { getPortfolioValuation, invalidateValuation } from "../portfolioValue.js";

// failTickers: ticker → "http" (res.ok false) eller "zero" (pris 0 i svaret)
function mockFetch(failTickers = {}) {
  globalThis.fetch = vi.fn(async (url) => {
    const u = String(url);
    const json = (body, ok = true) => ({ ok, status: ok ? 200 : 502, json: async () => body });
    if (u.startsWith("/api/commodities")) return json([]);
    const fail = Object.entries(failTickers).find(([t]) => u.includes(encodeURIComponent(t)))?.[1];
    if (fail === "http") return json({ error: "upstream" }, false);
    if (u.startsWith("/api/fund?")) return json(fail === "zero" ? { nav: 0 } : { nav: 250, currency: "SEK", returnD1: 0.5 });
    if (u.includes("SEK=X")) return json({ price: 10 });
    // aktie: alla ger kurs 100 SEK
    return json(fail === "zero" ? { price: 0, currency: "SEK" } : { price: 100, changePercent: 1, currency: "SEK" });
  });
}

describe("portfolioValue", () => {
  beforeEach(() => { rows.length = 0; mockFetch(); invalidateValuation(); });

  it("counts holdings with shares regardless of status and prices funds via NAV", async () => {
    rows.push(
      { id: 1, ticker: "VOLV-B.ST", status: "Bevakar", shares: 10, type: "stock" },   // PDF-import: Bevakar men äger
      { id: 2, ticker: "F0GBR04M4W", status: "Bevakar", shares: 4, type: "fund" },    // fond → NAV 250
      { id: 3, ticker: "ERIC-B.ST", status: "Bevakar", shares: null, type: "stock" }, // ren bevakning
    );
    const v = await getPortfolioValuation("u-" + Math.random());
    expect(v.holdings.map(h => h.ticker)).toEqual(["VOLV-B.ST", "F0GBR04M4W"]);
    expect(v.unpricedTickers).toEqual([]);
    expect(v.portfolioSek).toBe(10 * 100 + 4 * 250);
    expect(v.stocksSek).toBe(1000);
    expect(v.fundsSek).toBe(1000);
  });

  it("prices every holding even when the watchlist is longer than 20 rows", async () => {
    for (let i = 0; i < 25; i++) rows.push({ id: i, ticker: `W${i}.ST`, status: "Bevakar", shares: null, type: "stock" });
    rows.push({ id: 99, ticker: "LAST.ST", status: "Äger", shares: 3, type: "stock" });
    const v = await getPortfolioValuation("u-" + Math.random());
    expect(v.holdings.map(h => h.ticker)).toEqual(["LAST.ST"]);
    expect(v.portfolioSek).toBe(300);
    // övriga bevakningar prissätts fortfarande med tak 20
    expect(v.priced.length).toBe(21);
  });

  it("nulls portfolioSek and lists unpricedTickers when a holding's price fetch fails", async () => {
    mockFetch({ "VOLV-B.ST": "http" });
    rows.push(
      { id: 1, ticker: "VOLV-B.ST", status: "Äger", shares: 10, type: "stock" }, // prissättning misslyckas
      { id: 2, ticker: "ERIC-B.ST", status: "Äger", shares: 5, type: "stock" },  // prissätts OK
    );
    const v = await getPortfolioValuation("u-" + Math.random());
    // innehavet försvinner INTE — det finns kvar men markeras oprissatt
    expect(v.holdings.map(h => h.ticker)).toEqual(["VOLV-B.ST", "ERIC-B.ST"]);
    expect(v.unpricedTickers).toEqual(["VOLV-B.ST"]);
    const failed = v.priced.find(p => p.ticker === "VOLV-B.ST");
    expect(failed.price).toBeNull();
    expect(failed.priceError).toBe(true);
    // never guess: hellre inget värde än ett för lågt
    expect(v.portfolioSek).toBeNull();
    expect(v.stocksSek).toBeNull();
    expect(v.fundsSek).toBeNull();
  });

  it("treats a price of 0 as unpriced, not as a zero-value holding", async () => {
    mockFetch({ F0GBR04M4W: "zero" });
    rows.push({ id: 1, ticker: "F0GBR04M4W", status: "Äger", shares: 4, type: "fund" });
    const v = await getPortfolioValuation("u-" + Math.random());
    expect(v.unpricedTickers).toEqual(["F0GBR04M4W"]);
    expect(v.portfolioSek).toBeNull();
    expect(v.priced[0].price).toBeNull();
    expect(v.priced[0].priceError).toBe(true);
  });

  it("invalidateValuation clears the cache so the next call refetches", async () => {
    rows.push({ id: 1, ticker: "VOLV-B.ST", status: "Äger", shares: 10, type: "stock" });
    const userId = "u-cache";
    await getPortfolioValuation(userId);
    const callsAfterFirst = globalThis.fetch.mock.calls.length;
    await getPortfolioValuation(userId); // cachetraff — inga nya anrop
    expect(globalThis.fetch.mock.calls.length).toBe(callsAfterFirst);
    invalidateValuation();
    await getPortfolioValuation(userId);
    expect(globalThis.fetch.mock.calls.length).toBeGreaterThan(callsAfterFirst);
  });
});
