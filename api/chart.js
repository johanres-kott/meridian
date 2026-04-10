import { setCors } from "./_cors.js";
import { rateLimit } from "./_rateLimit.js";

const UA = "Mozilla/5.0";

const RANGE_MAP = {
  "1m": { range: "1mo", interval: "1d" },
  "3m": { range: "3mo", interval: "1d" },
  "1y": { range: "1y", interval: "1wk" },
  "5y": { range: "5y", interval: "1mo" },
};

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (rateLimit(req, res)) return;
  res.setHeader("Cache-Control", "s-maxage=300");

  const { ticker, range = "1m" } = req.query;
  if (!ticker) return res.status(400).json({ error: "ticker required" });
  if (!/^[A-Za-z0-9.\-^%]+$/.test(ticker)) return res.status(400).json({ error: "invalid ticker format" });

  const cfg = RANGE_MAP[range] || RANGE_MAP["1m"];

  try {
    const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=${cfg.interval}&range=${cfg.range}`;
    const r = await fetch(url, {
      headers: { "User-Agent": UA, "Referer": "https://finance.yahoo.com" },
    });
    const data = await r.json();
    const result = data?.chart?.result?.[0];
    if (!result) return res.status(404).json({ error: "No chart data" });

    const timestamps = result.timestamp || [];
    const closes = result.indicators?.quote?.[0]?.close || [];

    const points = timestamps
      .map((t, i) => ({
        date: new Date(t * 1000).toISOString().split("T")[0],
        close: closes[i] != null ? parseFloat(closes[i].toFixed(2)) : null,
      }))
      .filter(p => p.close !== null);

    res.status(200).json({ ticker, range, points });
  } catch (err) {
    console.error("Chart error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
}
