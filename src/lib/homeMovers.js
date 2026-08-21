// Ren logik för "Rörelser idag" på Hem (HomeMovers.jsx): dubbletthantering av
// samma bolag på flera marknadsplatser och sortering med ägda innehav först.
// Utbruten som rena funktioner för enhetstest.

// Ticker-bas = allt före första punkten, case-insensitive:
// "KLAR" och "KLAR.ST" → "klar" (samma bolag, olika marknadsplats).
export function tickerBase(ticker) {
  return String(ticker || "").split(".")[0].trim().toLowerCase();
}

function isOwned(p) {
  return Number(p?.shares) > 0;
}

function isStListing(p) {
  return /\.st$/i.test(String(p?.ticker || "").trim());
}

// Vid dubblett: föredra den ägda; om ingen/båda ägda föredra .ST-noteringen
// (hemmamarknaden); annars den första.
function preferListing(a, b) {
  const aOwned = isOwned(a), bOwned = isOwned(b);
  if (aOwned !== bOwned) return aOwned ? a : b;
  const aSt = isStListing(a), bSt = isStListing(b);
  if (aSt !== bSt) return aSt ? a : b;
  return a;
}

// Dagsförändring i SEK för ett innehav — null när den inte kan räknas
// (inte ägt, pris saknas eller FX-kurs till SEK saknas; vi gissar aldrig).
export function dailyChangeSek(p, fxToSek = {}) {
  if (!isOwned(p) || !(p?.price > 0) || p.changePercent == null) return null;
  const currency = p.currency || "SEK";
  const rate = currency === "SEK" ? 1 : fxToSek[currency];
  if (rate == null) return null;
  const prevPrice = p.price / (1 + p.changePercent / 100);
  return (p.price - prevPrice) * Number(p.shares) * rate;
}

// priced (från useNetWorth/portfolioValue) → dagens rörelser, dedupade och
// sorterade: ägda först (störst |dagsförändring i SEK| överst när den kan
// räknas, annars |%|), därefter bevakningar på |%|.
export function dedupeAndSortMovers(priced, fxToSek = {}) {
  const movers = (priced || [])
    .filter(p => p && p.changePercent != null && p.changePercent !== 0 && p.price > 0);

  const byBase = new Map();
  for (const p of movers) {
    const base = tickerBase(p.ticker);
    byBase.set(base, byBase.has(base) ? preferListing(byBase.get(base), p) : p);
  }

  return [...byBase.values()]
    .map(p => ({
      p,
      owned: isOwned(p),
      sek: isOwned(p) ? dailyChangeSek(p, fxToSek) : null,
      pct: Math.abs(p.changePercent),
    }))
    .sort((a, b) => {
      if (a.owned !== b.owned) return a.owned ? -1 : 1;
      if (a.owned) {
        if (a.sek != null && b.sek != null) return Math.abs(b.sek) - Math.abs(a.sek);
        if (a.sek != null) return -1;
        if (b.sek != null) return 1;
      }
      return b.pct - a.pct;
    })
    .map(x => x.p);
}

// Etikett när senaste avslut inte är från idag (svensk kalenderdag):
// "igår", annars "d/M" — null när avslutet är idag eller tidsstämpel saknas.
// USA-börser före öppning visar gårdagens stängning; det ska synas, inte döljas.
export function staleLabel(marketTimeSec, now = new Date()) {
  if (!(marketTimeSec > 0)) return null;
  const day = (d) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Stockholm", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  const traded = new Date(marketTimeSec * 1000);
  const today = day(now);
  const tradedDay = day(traded);
  if (tradedDay === today) return null;
  const yesterday = day(new Date(now.getTime() - 24 * 3600 * 1000));
  if (tradedDay === yesterday) return "igår";
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Stockholm", day: "numeric", month: "numeric" }).format(traded);
}
