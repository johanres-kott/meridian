import { setCors } from "./_cors.js";
import { rateLimit } from "./_rateLimit.js";

const FMP_KEY = process.env.FMP_KEY;

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (rateLimit(req, res)) return;
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=1800");

  const { tickers } = req.query;
  if (!tickers) return res.status(400).json({ error: "tickers parameter required" });
  if (!FMP_KEY) return res.status(500).json({ error: "FMP_KEY not configured" });

  try {
    const tickerList = tickers.split(",").map(t => t.trim().toUpperCase());

    // Fetch earnings calendar for next 60 days
    const now = new Date();
    const from = now.toISOString().split("T")[0];
    const to = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const url = `https://financialmodelingprep.com/api/v3/earning_calendar?from=${from}&to=${to}&apikey=${FMP_KEY}`;
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) return res.status(502).json({ error: "FMP API error" });

    const data = await response.json();

    // Filter to only requested tickers
    const tickerSet = new Set(tickerList);
    const filtered = (data || [])
      .filter(item => tickerSet.has(item.symbol?.toUpperCase()))
      .map(item => ({
        date: item.date,
        ticker: item.symbol,
        eps: item.eps,
        epsEstimated: item.epsEstimated,
        revenue: item.revenue,
        revenueEstimated: item.revenueEstimated,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    res.status(200).json(filtered);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to fetch earnings calendar" });
  }
}
