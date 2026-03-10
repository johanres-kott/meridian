const FINNHUB_KEY = "d6nuva9r01qse5qn7jvgd6nuva9r01qse5qn7k00";

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

export async function resolveTicker(securityName) {
  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/search?q=${encodeURIComponent(securityName)}&token=${FINNHUB_KEY}`
    );
    const data = await res.json();
    const results = (data.result || []).filter(
      (r) => r.type === "Common Stock" || r.type === "EQS"
    );

    // Prefer Stockholm exchange
    const stMatch = results.find((r) => r.symbol.endsWith(".ST"));
    if (stMatch) {
      return {
        ticker: stMatch.symbol.replace(/ /g, "-"),
        name: stMatch.description,
        matched: true,
      };
    }

    // Prefer Helsinki exchange as second choice (Nordic stocks)
    const heMatch = results.find((r) => r.symbol.endsWith(".HE"));
    if (heMatch) {
      return {
        ticker: heMatch.symbol.replace(/ /g, "-"),
        name: heMatch.description,
        matched: true,
      };
    }

    // Fallback to first result
    if (results.length > 0) {
      return {
        ticker: results[0].symbol.replace(/ /g, "-"),
        name: results[0].description,
        matched: true,
      };
    }

    return { ticker: "", name: securityName, matched: false };
  } catch {
    return { ticker: "", name: securityName, matched: false };
  }
}

export async function resolveAllTickers(holdings, onProgress) {
  const resolved = [];

  for (let i = 0; i < holdings.length; i++) {
    if (onProgress) onProgress(i + 1, holdings.length);
    const result = await resolveTicker(holdings[i].name);
    resolved.push({
      ...holdings[i],
      ticker: result.ticker,
      resolvedName: result.name,
      matched: result.matched,
    });
    if (i < holdings.length - 1) await delay(120);
  }

  return resolved;
}
