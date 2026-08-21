import { describe, it, expect } from "vitest";
import { dedupeAndSortMovers, dailyChangeSek, tickerBase } from "../homeMovers.js";

const row = (ticker, { shares = 0, price = 100, changePercent = 1, currency = "SEK", name } = {}) =>
  ({ ticker, shares, price, changePercent, currency, name: name || ticker });

describe("tickerBase", () => {
  it("tar allt före första punkten, case-insensitive", () => {
    expect(tickerBase("KLAR")).toBe("klar");
    expect(tickerBase("KLAR.ST")).toBe("klar");
    expect(tickerBase("klar.st")).toBe("klar");
    expect(tickerBase("BRK.B.X")).toBe("brk");
    expect(tickerBase("")).toBe("");
    expect(tickerBase(null)).toBe("");
  });
});

describe("dailyChangeSek", () => {
  it("räknar dagsförändring i SEK för innehav i SEK", () => {
    // pris 102 efter +2 %: föregående 100 → +2 kr × 10 aktier = +20 kr
    expect(dailyChangeSek(row("VOLV-B.ST", { shares: 10, price: 102, changePercent: 2 }))).toBeCloseTo(20, 8);
  });

  it("räknar om via FX-kurs och ger null när kursen saknas", () => {
    const usd = row("AAPL", { shares: 5, price: 202, changePercent: 1, currency: "USD" });
    expect(dailyChangeSek(usd, { USD: 10 })).toBeCloseTo(100, 8);
    expect(dailyChangeSek(usd, {})).toBeNull();
  });

  it("ger null för bevakningar (inga shares)", () => {
    expect(dailyChangeSek(row("AAPL", { shares: 0 }))).toBeNull();
  });
});

describe("dedupeAndSortMovers", () => {
  it("tom lista ger tom lista", () => {
    expect(dedupeAndSortMovers([])).toEqual([]);
    expect(dedupeAndSortMovers(null)).toEqual([]);
  });

  it("filtrerar bort rader utan rörelse eller pris", () => {
    const out = dedupeAndSortMovers([
      row("A.ST", { changePercent: 0 }),
      row("B.ST", { changePercent: null }),
      row("C.ST", { price: 0 }),
      row("D.ST", { changePercent: -1 }),
    ]);
    expect(out.map(p => p.ticker)).toEqual(["D.ST"]);
  });

  it("ägda före bevakade, oavsett procentstorlek", () => {
    const out = dedupeAndSortMovers([
      row("WATCH.ST", { shares: 0, changePercent: 9 }),
      row("OWNED.ST", { shares: 1, changePercent: 0.5 }),
    ]);
    expect(out.map(p => p.ticker)).toEqual(["OWNED.ST", "WATCH.ST"]);
  });

  it("ägda sorteras på |dagsförändring i SEK|, inte på |%|", () => {
    const out = dedupeAndSortMovers([
      // stor % men litet innehav: 1 aktie à 105 kr efter +5 % → +5 kr
      row("SMALL.ST", { shares: 1, price: 105, changePercent: 5 }),
      // liten % men stort innehav: 1000 aktier à 101 kr efter +1 % → +1000 kr
      row("BIG.ST", { shares: 1000, price: 101, changePercent: 1 }),
    ]);
    expect(out.map(p => p.ticker)).toEqual(["BIG.ST", "SMALL.ST"]);
  });

  it("negativ rörelse räknas med absolutbelopp i SEK-sorteringen", () => {
    const out = dedupeAndSortMovers([
      row("UP.ST", { shares: 10, price: 101, changePercent: 1 }),      // ≈ +10 kr
      row("DOWN.ST", { shares: 100, price: 99, changePercent: -1 }),   // ≈ −100 kr
    ]);
    expect(out.map(p => p.ticker)).toEqual(["DOWN.ST", "UP.ST"]);
  });

  it("ägd utan FX-kurs faller tillbaka på |%| efter dem med SEK-påverkan", () => {
    const out = dedupeAndSortMovers([
      row("NOFX", { shares: 1, price: 100, changePercent: 8, currency: "USD" }),
      row("SEK.ST", { shares: 1, price: 101, changePercent: 1 }),
    ], {}); // ingen USD-kurs
    expect(out.map(p => p.ticker)).toEqual(["SEK.ST", "NOFX"]);
  });

  it("bevakningar sorteras på |%|", () => {
    const out = dedupeAndSortMovers([
      row("A.ST", { changePercent: -1.2 }),
      row("B.ST", { changePercent: 4 }),
      row("C.ST", { changePercent: -2.5 }),
    ]);
    expect(out.map(p => p.ticker)).toEqual(["B.ST", "C.ST", "A.ST"]);
  });

  it("dubblett bevakad+bevakad: .ST-noteringen vinner", () => {
    const out = dedupeAndSortMovers([
      row("KLAR", { shares: 0, changePercent: 3 }),
      row("KLAR.ST", { shares: 0, changePercent: 2 }),
    ]);
    expect(out.map(p => p.ticker)).toEqual(["KLAR.ST"]);
  });

  it("dubblett ägd USA-notering + bevakad .ST: den ägda vinner", () => {
    const out = dedupeAndSortMovers([
      row("KLAR.ST", { shares: 0, changePercent: 2 }),
      row("KLAR", { shares: 10, changePercent: 3, currency: "USD" }),
    ]);
    expect(out.map(p => p.ticker)).toEqual(["KLAR"]);
  });

  it("dubblett utan ägande och utan .ST: första behålls", () => {
    const out = dedupeAndSortMovers([
      row("ABC", { changePercent: 2 }),
      row("ABC.DE", { changePercent: 3 }),
    ]);
    expect(out.map(p => p.ticker)).toEqual(["ABC"]);
  });
});
