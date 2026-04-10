import { setCors } from "./_cors.js";
import { rateLimit } from "./_rateLimit.js";

const MORNINGSTAR_BASE = "https://lt.morningstar.com/api/rest.svc/klr5zyak8x/security/screener";

const CATEGORIES = {
  aktie_sverige: { label: "Aktiefonder Sverige", filter: "CategoryName:EQ:Sweden Large-Cap Equity" },
  aktie_global: { label: "Aktiefonder Global", filter: "CategoryName:IN:Global Large-Cap Blend Equity|Global Large-Cap Growth Equity|Global Large-Cap Value Equity" },
  aktie_tillvaxt: { label: "Aktiefonder Tillväxtmarknader", filter: "CategoryName:IN:Global Emerging Markets Equity|Asia ex Japan Equity" },
  blandfond: { label: "Blandfonder", filter: "CategoryName:CO:Allocation" },
  rantefond: { label: "Räntefonder", filter: "CategoryName:CO:Bond" },
};

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
    const params = new URLSearchParams({
      page: "1",
      pageSize: "15",
      sortOrder: "StarRatingM255 desc",
      outputType: "json",
      version: "1",
      languageId: "sv-SE",
      currencyId: "SEK",
      universeIds: "FOALL$$ALL",
      securityDataPoints: "SecId|Name|PriceCurrency|LegalName|ClosePrice|StarRatingM255|CategoryName|OngoingCharge|ReturnM1|ReturnM12|ReturnM36|ReturnM60",
      filters: cat.filter,
    });

    const response = await fetch(`${MORNINGSTAR_BASE}?${params}`);
    if (!response.ok) {
      console.error("Morningstar fund-top error:", response.status);
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
    }));

    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=600");
    return res.status(200).json({
      category: category,
      label: cat.label,
      total: data.total || results.length,
      results,
    });
  } catch (err) {
    console.error("Fund-top error:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
}
