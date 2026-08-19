import { describe, it, expect, vi, beforeEach } from "vitest";

const rows = [];
vi.mock("../../supabase.js", () => ({
  supabase: {
    from: () => ({ select: () => ({ eq: () => ({ order: async () => ({ data: rows }) }) }) }),
  },
}));

import { getPortfolioValuation } from "../portfolioValue.js";

function mockFetch() {
  global.fetch = vi.fn(async (url) => {
    const u = String(url);
    const json = (body) => ({ json: async () => body });
    if (u.startsWith("/api/commodities")) return json([]);
    if (u.startsWith("/api/fund?")) return json({ nav: 250, currency: "SEK", returnD1: 0.5 });
    if (u.includes("SEK=X")) return json({ price: 10 });
    // aktie: alla ger kurs 100 SEK
    return json({ price: 100, changePercent: 1, currency: "SEK" });
  });
}

describe("portfolioValue", () => {
  beforeEach(() => { rows.length = 0; mockFetch(); });

  it("counts holdings with shares regardless of status and prices funds via NAV", async () => {
    rows.push(
      { id: 1, ticker: "VOLV-B.ST", status: "Bevakar", shares: 10, type: "stock" },   // PDF-import: Bevakar men äger
      { id: 2, ticker: "F0GBR04M4W", status: "Bevakar", shares: 4, type: "fund" },    // fond → NAV 250
      { id: 3, ticker: "ERIC-B.ST", status: "Bevakar", shares: null, type: "stock" }, // ren bevakning
    );
    const v = await getPortfolioValuation("u-" + Math.random());
    expect(v.holdings.map(h => h.ticker)).toEqual(["VOLV-B.ST", "F0GBR04M4W"]);
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
});
