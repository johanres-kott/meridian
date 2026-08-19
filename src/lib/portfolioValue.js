import { supabase } from "../supabase.js";
import { parseFxRates } from "../hooks/useFxRates.js";

// Delad portföljvärdering (utbruten ur PortfolioSummary) så att flera kort på
// Översikten kan använda samma siffror utan att dubbelhämta priser. Cachas per
// användare i 5 min, samma TTL-mönster som useScores.

const TTL_MS = 5 * 60 * 1000;
let cache = { userId: null, at: 0, promise: null };

export function getPortfolioValuation(userId) {
  const now = Date.now();
  if (cache.promise && cache.userId === userId && now - cache.at < TTL_MS) {
    return cache.promise;
  }
  const promise = computeValuation(userId);
  cache = { userId, at: now, promise };
  promise.catch(() => {
    if (cache.promise === promise) cache = { userId: null, at: 0, promise: null };
  });
  return promise;
}

async function computeValuation(userId) {
  const { data: watchlist } = await supabase
    .from("watchlist")
    .select("*")
    .eq("user_id", userId)
    .order("created_at");

  if (!watchlist || watchlist.length === 0) {
    return { empty: true, watchlist: [], priced: [], holdings: [], currencyGroups: [], totalSek: null, dailyChangeSek: null, portfolioSek: null, stocksSek: 0, fundsSek: 0, fxToSek: {} };
  }

  // Prissätt ALLA rader med innehav (shares > 0) + upp till 20 övriga bevakningar.
  // Tidigare bara de 20 första raderna oavsett — innehav längre ner försvann tyst.
  const withShares = watchlist.filter(i => Number(i.shares) > 0);
  const others = watchlist.filter(i => !(Number(i.shares) > 0)).slice(0, 20);
  const toPrice = [...withShares, ...others];

  // Fetch prices + FX rates in parallel. Fonder via NAV (/api/fund), aktier via /api/company.
  const [pricedResults, commoditiesRes] = await Promise.all([
    Promise.all(
      toPrice.map(async (item) => {
        try {
          if (item.type === "fund") {
            const res = await fetch(`/api/fund?secId=${encodeURIComponent(item.ticker)}`);
            const d = await res.json();
            return { ...item, price: d?.nav || 0, changePercent: d?.returnD1 || 0, currency: d?.currency || "SEK" };
          }
          const res = await fetch(`/api/company?ticker=${encodeURIComponent(item.ticker)}`);
          const d = await res.json();
          // London noterar i pence (GBp/GBX) — räkna om till pund så FX-kursen stämmer
          const pence = d.currency === "GBp" || d.currency === "GBX";
          return { ...item, price: pence ? (d.price || 0) / 100 : (d.price || 0), changePercent: d.changePercent || 0, currency: pence ? "GBP" : d.currency };
        } catch (err) {
          console.error(`portfolioValue: failed to fetch ${item.ticker}:`, err);
          return { ...item, price: 0, changePercent: 0 };
        }
      })
    ),
    fetch("/api/commodities").then(r => r.json()).catch(() => []),
  ]);
  const priced = pricedResults;

  // Build FX rates to SEK from commodities API
  const fxToSek = parseFxRates(commoditiesRes);

  // Innehav = rader med antal > 0 och kurs. Status ("Äger"/"Bevakar") styr inte —
  // PDF-import och "lägg till" sparar som Bevakar, och har man aktier äger man dem.
  const holdings = priced.filter(i => Number(i.shares) > 0 && i.price);

  // Fetch missing FX rates from Yahoo Finance
  const holdingCurrencies = [...new Set(holdings.map(h => h.currency || "SEK"))];
  const missingCurrencies = holdingCurrencies.filter(c => !fxToSek[c]);
  if (missingCurrencies.length > 0) {
    await Promise.all(missingCurrencies.map(async (cur) => {
      try {
        const res = await fetch(`/api/company?ticker=${encodeURIComponent(cur + "SEK=X")}`);
        const d = await res.json();
        if (d.price > 0) fxToSek[cur] = d.price;
      } catch (err) { console.error(`portfolioValue: FX rate fetch failed for ${cur}:`, err); }
    }));
  }
  const byCurrency = {};
  for (const h of holdings) {
    const cur = h.currency || "SEK";
    if (!byCurrency[cur]) byCurrency[cur] = { value: 0, dailyChange: 0 };
    byCurrency[cur].value += h.price * h.shares;
    const prevPrice = h.price / (1 + h.changePercent / 100);
    byCurrency[cur].dailyChange += (h.price - prevPrice) * h.shares;
  }
  const currencyGroups = Object.entries(byCurrency).map(([currency, { value, dailyChange }]) => ({
    currency,
    value,
    dailyChange,
    dailyChangePct: value > 0 ? (dailyChange / (value - dailyChange)) * 100 : 0,
  }));

  // Calculate total in SEK if multiple currencies
  let totalSek = null;
  let dailyChangeSek = null;
  const hasMultipleCurrencies = currencyGroups.length > 1;
  const allConvertible = currencyGroups.every(g => fxToSek[g.currency] != null);
  if (hasMultipleCurrencies && allConvertible) {
    totalSek = currencyGroups.reduce((sum, g) => sum + g.value * fxToSek[g.currency], 0);
    dailyChangeSek = currencyGroups.reduce((sum, g) => sum + g.dailyChange * fxToSek[g.currency], 0);
  } else if (currencyGroups.length === 1 && currencyGroups[0].currency !== "SEK" && fxToSek[currencyGroups[0].currency]) {
    totalSek = currencyGroups[0].value * fxToSek[currencyGroups[0].currency];
    dailyChangeSek = currencyGroups[0].dailyChange * fxToSek[currencyGroups[0].currency];
  }

  // Portfolio value in SEK regardless of how many currencies are involved —
  // used by the net-worth card. Null when a rate is missing (never guess FX).
  const portfolioSek = totalSek != null
    ? totalSek
    : currencyGroups.length === 1 && currencyGroups[0].currency === "SEK"
      ? currencyGroups[0].value
      : currencyGroups.length === 0 ? 0 : null;

  // Aktier vs fonder i SEK (för donuten på Portfölj). Null om någon kurs saknas.
  const toSek = (h) => {
    const cur = h.currency || "SEK";
    const rate = cur === "SEK" ? 1 : fxToSek[cur];
    return rate != null ? h.price * h.shares * rate : null;
  };
  let stocksSek = 0, fundsSek = 0, splitOk = true;
  for (const h of holdings) {
    const v = toSek(h);
    if (v == null) { splitOk = false; break; }
    if (h.type === "fund") fundsSek += v; else stocksSek += v;
  }

  return {
    empty: false, watchlist, priced, holdings, currencyGroups, totalSek, dailyChangeSek, portfolioSek,
    stocksSek: splitOk ? stocksSek : null,
    fundsSek: splitOk ? fundsSek : null,
    fxToSek,
  };
}
