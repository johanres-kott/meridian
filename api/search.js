import { setCors } from "./_cors.js";
import { rateLimit } from "./_rateLimit.js";

const FINNHUB_KEY = process.env.FINNHUB_KEY;

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (rateLimit(req, res)) return;

  const rawQ = req.query.q;
  if (!rawQ || rawQ.length < 2) {
    return res.status(400).json({ error: "Query parameter 'q' required (min 2 chars)" });
  }
  // Strip HTML tags to prevent injection into downstream APIs
  const q = rawQ.replace(/<[^>]*>/g, "").trim();
  if (q.length < 2) {
    return res.status(400).json({ error: "Query parameter 'q' required (min 2 chars)" });
  }

  if (!FINNHUB_KEY) {
    return res.status(500).json({ error: "FINNHUB_KEY not configured" });
  }

  try {
    const url = `https://finnhub.io/api/v1/search?q=${encodeURIComponent(q)}&token=${FINNHUB_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      return res.status(400).json({ error: data.error });
    }

    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=30");
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: "Search failed" });
  }
}
