import { setCors } from "./_cors.js";
import { rateLimit } from "./_rateLimit.js";

const MORNINGSTAR_BASE = "https://lt.morningstar.com/api/rest.svc/klr5zyak8x/security/screener";

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (rateLimit(req, res, 30)) return;

  const { secId } = req.query;
  if (!secId || secId.length < 5 || !/^[A-Za-z0-9]+$/.test(secId)) {
    return res.status(400).json({ error: "Invalid secId" });
  }

  try {
    const params = new URLSearchParams({
      page: "1",
      pageSize: "1",
      sortOrder: "LegalName asc",
      outputType: "json",
      version: "1",
      languageId: "sv-SE",
      currencyId: "SEK",
      universeIds: "FOALL$$ALL",
      securityDataPoints: "SecId|Name|PriceCurrency|LegalName|ClosePrice|StarRatingM255|CategoryName|OngoingCharge|ReturnD1|ReturnW1|ReturnM1|ReturnM3|ReturnM6|ReturnM12|ReturnM36|ReturnM60|ReturnM120|Yield_M12",
      term: secId,
    });

    const response = await fetch(`${MORNINGSTAR_BASE}?${params}`);
    if (!response.ok) {
      console.error("Morningstar fund error:", response.status);
      return res.status(502).json({ error: "Upstream error" });
    }

    const data = await response.json();
    const rows = data.rows || [];
    const match = rows.find(r => r.SecId === secId);

    if (!match) {
      return res.status(404).json({ error: "Fund not found" });
    }

    res.setHeader("Cache-Control", "public, s-maxage=600, stale-while-revalidate=120");
    return res.status(200).json({
      secId: match.SecId,
      name: match.Name,
      legalName: match.LegalName,
      nav: match.ClosePrice,
      currency: match.PriceCurrency,
      starRating: match.StarRatingM255,
      category: match.CategoryName,
      ongoingCharge: match.OngoingCharge,
      yield: match.Yield_M12,
      returnD1: match.ReturnD1,
      returnW1: match.ReturnW1,
      returnM1: match.ReturnM1,
      returnM3: match.ReturnM3,
      returnM6: match.ReturnM6,
      returnM12: match.ReturnM12,
      returnM36: match.ReturnM36,
      returnM60: match.ReturnM60,
      returnM120: match.ReturnM120,
    });
  } catch (err) {
    console.error("Fund error:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
}
