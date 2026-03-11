const FINNHUB_KEY = "d6nuva9r01qse5qn7jvgd6nuva9r01qse5qn7k00";

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

function makeMatch(r) {
  return { ticker: r.symbol.replace(/ /g, "-"), name: r.description, matched: true };
}

function pickBestMatch(results, { excludePref = false } = {}) {
  let filtered = results;
  // When excludePref is true, skip PREF shares (unless that's all we have)
  if (excludePref) {
    const nonPref = results.filter((r) => !r.symbol.includes("PREF"));
    if (nonPref.length > 0) filtered = nonPref;
  }

  // Prefer Stockholm exchange
  const stMatch = filtered.find((r) => r.symbol.endsWith(".ST"));
  if (stMatch) return makeMatch(stMatch);
  // Prefer Helsinki exchange as second choice (Nordic stocks)
  const heMatch = filtered.find((r) => r.symbol.endsWith(".HE"));
  if (heMatch) return makeMatch(heMatch);
  // Fallback to first result
  if (filtered.length > 0) return makeMatch(filtered[0]);
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

// Swedish/Nordic stocks often end with a share class letter: A, B, C, D, R
const SHARE_CLASSES = new Set(["A", "B", "C", "D", "R"]);

export async function resolveTicker(securityName) {
  try {
    const words = securityName.split(/\s+/);
    const lastWord = words[words.length - 1];
    const hasShareClass = words.length > 1 && SHARE_CLASSES.has(lastWord.toUpperCase());
    const nameUpper = securityName.toUpperCase();
    // Don't exclude PREF results if the name itself mentions PREF
    const excludePref = !nameUpper.includes("PREF");

    // If name ends with a share class (e.g., "K2A KNAUST & ANDERSSON FASTIGHETER B"),
    // try "first word + class" first — this gives the most specific match.
    if (hasShareClass && words.length > 2) {
      let results = await searchFinnhub(`${words[0]} ${lastWord}`);
      let match = pickBestMatch(results, { excludePref });
      if (match) return match;
    }

    // Try full name
    let results = await searchFinnhub(securityName);
    let match = pickBestMatch(results, { excludePref });
    if (match) return match;

    // If no results (possibly name too long), try progressively shorter queries
    if (words.length > 3) {
      results = await searchFinnhub(words.slice(0, 3).join(" "));
      match = pickBestMatch(results, { excludePref });
      if (match) return match;
    }

    if (words.length > 2) {
      results = await searchFinnhub(words.slice(0, 2).join(" "));
      match = pickBestMatch(results, { excludePref });
      if (match) return match;
    }

    // Try first word + last word as final fallback
    if (words.length > 2) {
      results = await searchFinnhub(`${words[0]} ${words[words.length - 1]}`);
      match = pickBestMatch(results, { excludePref });
      if (match) return match;
    }

    // Last resort: if all results were PREF but the name doesn't say PREF,
    // try common Swedish share classes (B is most common, then A)
    if (excludePref && words.length >= 1) {
      for (const cls of ["B", "A"]) {
        results = await searchFinnhub(`${words[0]} ${cls}`);
        match = pickBestMatch(results, { excludePref });
        if (match) return match;
      }
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
