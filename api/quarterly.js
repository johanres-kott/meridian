import { setCors } from "./_cors.js";
import { rateLimit } from "./_rateLimit.js";

const FMP_KEY = process.env.FMP_KEY;

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (rateLimit(req, res)) return;
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=1800");

  const { ticker } = req.query;
  if (!ticker) return res.status(400).json({ error: "ticker parameter required" });
  if (!FMP_KEY) return res.status(500).json({ error: "FMP_KEY not configured" });

  try {
    const url = `https://financialmodelingprep.com/api/v3/income-statement/${encodeURIComponent(ticker)}?period=quarter&limit=12&apikey=${FMP_KEY}`;
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) return res.status(502).json({ error: "FMP API error" });

    const data = await response.json();

    const quarters = (data || []).map(q => ({
      date: q.date,
      period: q.period,
      revenue: q.revenue,
      grossProfit: q.grossProfit,
      operatingIncome: q.operatingIncome,
      netIncome: q.netIncome,
      eps: q.eps,
      grossMargin: q.revenue > 0 ? (q.grossProfit / q.revenue * 100) : null,
      operatingMargin: q.revenue > 0 ? (q.operatingIncome / q.revenue * 100) : null,
      netMargin: q.revenue > 0 ? (q.netIncome / q.revenue * 100) : null,
    })).reverse(); // oldest first for charts

    res.status(200).json({ ticker, quarters });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to fetch quarterly data" });
  }
}
