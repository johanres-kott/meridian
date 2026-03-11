const FINNHUB_KEY = "d6nuva9r01qse5qn7jvgd6nuva9r01qse5qn7k00";

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

function pickBestMatch(results) {
  // Prefer Stockholm exchange
  const stMatch = results.find((r) => r.symbol.endsWith(".ST"));
  if (stMatch) {
    return { ticker: stMatch.symbol.replace(/ /g, "-"), name: stMatch.description, matched: true };
  }
  // Prefer Helsinki exchange as second choice (Nordic stocks)
  const heMatch = results.find((r) => r.symbol.endsWith(".HE"));
  if (heMatch) {
    return { ticker: heMatch.symbol.replace(/ /g, "-"), name: heMatch.description, matched: true };
  }
  // Fallback to first result
  if (results.length > 0) {
    return { ticker: results[0].symbol.replace(/ /g, "-"), name: results[0].description, matched: true };
  }
  return null;
}

async function searchFinnhub(query) {
  const res = await fetch(
    `https://finnhub.io/api/v1/search?q=${encodeURIComponent(query)}&token=${FINNHUB_KEY}`
  );
  const data = await res.json();
  if (data.error) return []; // e.g., "q too long"
  return (data.result || []).filter(
    (r) => r.type === "Common Stock" || r.type === "EQS"
  );
}

export async function resolveTicker(securityName) {
  try {
    // Try full name first
    let results = await searchFinnhub(securityName);
    let match = pickBestMatch(results);
    if (match) return match;

    // If no results (possibly name too long), try progressively shorter queries
    const words = securityName.split(/\s+/);
    if (words.length > 3) {
      // Try first 3 words (e.g., "K2A KNAUST ANDERSSON" → finds K2A)
      results = await searchFinnhub(words.slice(0, 3).join(" "));
      match = pickBestMatch(results);
      if (match) return match;
    }

    if (words.length > 2) {
      // Try first 2 words
      results = await searchFinnhub(words.slice(0, 2).join(" "));
      match = pickBestMatch(results);
      if (match) return match;
    }

    // Try first word + last word (often the share class, e.g., "K2A B")
    if (words.length > 2) {
      results = await searchFinnhub(`${words[0]} ${words[words.length - 1]}`);
      match = pickBestMatch(results);
      if (match) return match;
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
