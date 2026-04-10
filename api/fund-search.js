import { setCors } from "./_cors.js";
import { rateLimit } from "./_rateLimit.js";

const MORNINGSTAR_BASE = "https://lt.morningstar.com/api/rest.svc/klr5zyak8x/security/screener";

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (rateLimit(req, res, 30)) return;

  const rawQ = req.query.q;
  if (!rawQ || rawQ.length < 2) {
    return res.status(400).json({ error: "Query parameter 'q' required (min 2 chars)" });
  }
  const q = rawQ.replace(/<[^>]*>/g, "").trim();
  if (q.length < 2) {
    return res.status(400).json({ error: "Query too short" });
  }

  try {
    const params = new URLSearchParams({
      page: "1",
      pageSize: "10",
      sortOrder: "LegalName asc",
      outputType: "json",
      version: "1",
      languageId: "sv-SE",
      currencyId: "SEK",
      universeIds: "FOALL$$ALL",
      securityDataPoints: "SecId|Name|PriceCurrency|LegalName|ClosePrice|StarRatingM255|CategoryName|OngoingCharge|ReturnM1|ReturnM12|ReturnM36|ReturnM60|IndexFund",
      term: q,
    });

    const response = await fetch(`${MORNINGSTAR_BASE}?${params}`);
    if (!response.ok) {
      console.error("Morningstar fund search error:", response.status);
      return res.status(502).json({ error: "Upstream error" });
    }

    const data = await response.json();
    const rows = data.rows || [];

    const results = rows.map(r => ({
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

    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=60");
    return res.status(200).json({ results });
  } catch (err) {
    console.error("Fund search error:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
}
