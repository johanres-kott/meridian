import { setCors } from "./_cors.js";
import { rateLimit } from "./_rateLimit.js";

const MORNINGSTAR_BASE = "https://lt.morningstar.com/api/rest.svc/klr5zyak8x/security/screener";

// Category prefix matching against Morningstar's Swedish category names
const CATEGORIES = {
  aktie_sverige: { label: "Aktiefonder Sverige", prefixes: ["Sverige"] },
  aktie_global: { label: "Aktiefonder Global", prefixes: ["Global"] },
  aktie_tillvaxt: { label: "Aktiefonder Tillväxtmarknader", prefixes: ["Tillväxtmarknader"] },
  blandfond: { label: "Blandfonder", prefixes: ["Blandfond"] },
  rantefond: { label: "Räntefonder", prefixes: ["Ränte"] },
};

// Cache fetched data in-memory (serverless instance lifetime)
let cache = { data: null, fetchedAt: 0 };
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

async function getAllFunds() {
  if (cache.data && Date.now() - cache.fetchedAt < CACHE_TTL) {
    return cache.data;
  }

  const params = new URLSearchParams({
    page: "1",
    pageSize: "2000",
    sortOrder: "StarRatingM255 desc",
    outputType: "json",
    version: "1",
    languageId: "sv-SE",
    currencyId: "SEK",
    universeIds: "FOSWE$$ALL",
    securityDataPoints: "SecId|Name|PriceCurrency|LegalName|ClosePrice|StarRatingM255|CategoryName|OngoingCharge|ReturnM1|ReturnM12|ReturnM36|ReturnM60|IndexFund",
  });

  const response = await fetch(`${MORNINGSTAR_BASE}?${params}`);
  if (!response.ok) throw new Error(`Morningstar ${response.status}`);

  const data = await response.json();
  cache = { data: data.rows || [], fetchedAt: Date.now() };
  return cache.data;
}

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (rateLimit(req, res, 20)) return;

  const category = req.query.category || "aktie_sverige";
  const cat = CATEGORIES[category];
  if (!cat) {
    return res.status(400).json({ error: "Invalid category", valid: Object.keys(CATEGORIES) });
  }

  try {
    const allFunds = await getAllFunds();

    const filtered = allFunds
      .filter(r => {
        const catName = r.CategoryName || "";
        const prefix = catName.split(",")[0].split(" -")[0];
        return cat.prefixes.includes(prefix);
      })
      .slice(0, 15);

    const results = filtered.map(r => ({
      secId: r.SecId,
      name: r.Name,
      legalName: r.LegalName,
      nav: r.ClosePrice,
      currency: r.PriceCurrency,
      starRating: r.StarRatingM255,
      category: r.CategoryName,
      ongoingCharge: r.OngoingCharge,
      returnM1: r.ReturnM1,
      returnM12: r.ReturnM12,
      returnM36: r.ReturnM36,
      returnM60: r.ReturnM60,
      indexFund: r.IndexFund || false,
    }));

    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=600");
    return res.status(200).json({
      category,
      label: cat.label,
      total: results.length,
      results,
    });
  } catch (err) {
    console.error("Fund-top error:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
}
