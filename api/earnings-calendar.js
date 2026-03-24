import { setCors } from "./_cors.js";
import { rateLimit } from "./_rateLimit.js";

const FINNHUB_KEY = process.env.FINNHUB_KEY;

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (rateLimit(req, res)) return;
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=1800");

  const { tickers } = req.query;
  if (!tickers) return res.status(400).json({ error: "tickers parameter required" });
  if (!FINNHUB_KEY) return res.status(500).json({ error: "FINNHUB_KEY not configured" });

  try {
    const tickerList = tickers.split(",").map(t => t.trim().toUpperCase());
    // Normalize: ABB.ST → ABB, ERIC-B.ST → ERIC-B
    const tickerBaseMap = {};
    for (const t of tickerList) {
      const base = t.replace(/\.(ST|HE|CO|OL)$/, "");
      tickerBaseMap[base] = t;
    }

    const now = new Date();
    const from = now.toISOString().split("T")[0];
    const to = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const url = `https://finnhub.io/api/v1/calendar/earnings?from=${from}&to=${to}&token=${FINNHUB_KEY}`;
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) return res.status(502).json({ error: "Finnhub API error" });

    const data = await response.json();
    const baseSet = new Set(Object.keys(tickerBaseMap));

    const filtered = (data?.earningsCalendar || [])
      .filter(item => baseSet.has(item.symbol?.toUpperCase()))
      .map(item => ({
        date: item.date,
        ticker: tickerBaseMap[item.symbol.toUpperCase()] || item.symbol,
        epsEstimated: item.epsEstimate,
        revenueEstimated: item.revenueEstimate,
        quarter: item.quarter,
        year: item.year,
        hour: item.hour,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    res.status(200).json(filtered);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to fetch earnings calendar" });
  }
}
